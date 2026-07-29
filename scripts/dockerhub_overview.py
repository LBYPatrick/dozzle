#!/usr/bin/env python3
"""Compose and publish the Docker Hub overview for the experimental fork.

The page is `.github/dockerhub-overview.md` followed by `EXP_FEATURES.md`, so
the Hub listing is generated from the repo and cannot drift from it.

Publishing runs locally rather than in CI because Docker Hub's repository API
refuses personal access tokens outright ("a personal access token or
organization access token cannot be used as a bearer"), and a JWT minted from a
PAT via /v2/users/login comes back scoped too low to PATCH a description. The
one credential that does carry account scope is the Docker Desktop web-login
session, which lives in the local credential helper. So: `make dockerhub-overview`
after changing EXP_FEATURES.md.

Usage:
    python3 scripts/dockerhub_overview.py [--repo NS/NAME]   # compose and publish
    python3 scripts/dockerhub_overview.py --out PAGE.md      # compose only
"""

import argparse
import json
import pathlib
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PREAMBLE = ROOT / ".github/dockerhub-overview.md"
CHANGELOG = ROOT / "EXP_FEATURES.md"

DEFAULT_REPO = "lbypatrick/dozzle"
SHORT_DESCRIPTION = (
    "Experimental fork of amir20/dozzle. Not official; for testing and feedback."
)
# Docker Hub caps full_description at 25,000 characters.
LIMIT = 24_950
TRUNCATION_NOTE = (
    "\n---\n\nTruncated. Full changelog: "
    "<https://github.com/LBYPatrick/dozzle/blob/exp/EXP_FEATURES.md>\n"
)
CREDENTIAL_URL = "https://index.docker.io/v1/access-token"


def compose() -> str:
    """Return the overview page, trimmed to fit Docker Hub's cap.

    The changelog is comfortably larger than the cap allows room for, so an
    oversized page is cut back to the last whole `##` section rather than
    stopping mid-list, and points at GitHub for the remainder.
    """
    changelog = CHANGELOG.read_text().split("\n", 1)[1]
    page = f"{PREAMBLE.read_text()}\n# Feature changelog\n{changelog}"
    if len(page) <= LIMIT:
        return page
    keep = page[: LIMIT - len(TRUNCATION_NOTE)]
    # Drop back to the start of whatever block the cut landed inside — a bullet,
    # a heading, or a paragraph — whichever begins latest. Rewinding to the last
    # heading instead would throw away every complete bullet in that section too.
    cut = max(keep.rfind("\n- "), keep.rfind("\n## "), keep.rfind("\n\n"))
    return keep[: cut if cut != -1 else keep.rfind("\n")] + TRUNCATION_NOTE


def session_token() -> str:
    """Return the Docker Desktop session JWT from the local credential helper."""
    try:
        result = subprocess.run(
            ["docker-credential-desktop", "get"],
            input=CREDENTIAL_URL,
            capture_output=True,
            text=True,
            timeout=20,
            check=True,
        )
    except (OSError, subprocess.SubprocessError) as err:
        sys.exit(f"could not read the Docker Desktop credential: {err}")
    token = json.loads(result.stdout).get("Secret", "")
    if token.count(".") != 2:
        sys.exit(
            "the stored credential is not a session token. Sign in through the "
            "Docker Desktop UI (not `docker login` with an access token) and retry."
        )
    return token


def publish(repo: str, page: str, token: str) -> None:
    """PATCH the repository description, exiting non-zero on failure."""
    request = urllib.request.Request(
        f"https://hub.docker.com/v2/repositories/{repo}/",
        data=json.dumps(
            {"full_description": page, "description": SHORT_DESCRIPTION}
        ).encode(),
        method="PATCH",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            print(f"published to {repo} (HTTP {response.status})")
    except urllib.error.HTTPError as err:
        if err.code == 401:
            sys.exit(
                "HTTP 401: the Docker Desktop session has expired. Open Docker "
                "Desktop and sign in again (the session refreshes on launch), "
                "then re-run. The page already on Docker Hub is left as-is."
            )
        sys.exit(f"HTTP {err.code}: {err.read(300).decode(errors='replace')}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=DEFAULT_REPO, help="Docker Hub namespace/name")
    parser.add_argument(
        "--out",
        type=pathlib.Path,
        help="write the composed page here instead of publishing it",
    )
    args = parser.parse_args()

    page = compose()
    print(f"overview: {len(page)} chars (cap {LIMIT})")
    if args.out:
        args.out.write_text(page)
        print(f"wrote {args.out}")
        return
    publish(args.repo, page, session_token())


if __name__ == "__main__":
    main()
