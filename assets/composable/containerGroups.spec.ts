/**
 * @vitest-environment jsdom
 *
 * jsdom is needed only transitively: settings pulls in stores/config, which reads
 * its bootstrap JSON out of the document at import time.
 */
import { beforeEach, describe, expect, test } from "vitest";
import { Container } from "@/models/Container";
import { groupContainersForHost } from "./containerGroups";
import { groupContainers } from "@/stores/settings";

const container = (name: string, host = "localhost", namespace?: string) =>
  new Container(
    name,
    new Date("2026-07-01T00:00:00Z"),
    new Date("2026-07-01T00:00:00Z"),
    new Date("2026-07-01T00:00:00Z"),
    "image",
    name,
    "command",
    host,
    namespace ? { "com.docker.compose.project": namespace } : {},
    "running",
    0,
    0,
    [],
  );

const names = (groups: ReturnType<typeof groupContainersForHost>) =>
  groups.flatMap((g) => g.containers.map((c) => c.name));

describe("groupContainersForHost", () => {
  beforeEach(() => {
    groupContainers.value = "at-least-2";
  });

  test("keeps only the requested host's containers", () => {
    const containers = [container("a"), container("b"), container("elsewhere", "other-host")];
    expect(names(groupContainersForHost(containers, "localhost"))).toEqual(["a", "b"]);
  });

  /**
   * Pinning must not remove a container from the hierarchy it belongs to. It used
   * to: a pinned container was excluded here and shown only in the Pinned section,
   * so pinning made the row vanish from its host. It is now listed in both places
   * on purpose, and the in-place row carries a pin marker.
   */
  test("keeps pinned containers in their host branch", () => {
    const containers = [container("a"), container("b"), container("c")];

    // The signature no longer takes a pinned set at all, which is the point:
    // grouping cannot depend on something it should not know about.
    expect(names(groupContainersForHost(containers, "localhost"))).toEqual(["a", "b", "c"]);
  });

  test('a namespace of one lands in the catch-all under "at-least-2"', () => {
    const containers = [container("solo", "localhost", "proj"), container("loose")];

    const groups = groupContainersForHost(containers, "localhost");
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("label.running-containers");
    expect(names(groups).sort()).toEqual(["loose", "solo"]);
  });

  test('"always" groups a namespace of one into its own section', () => {
    groupContainers.value = "always";
    const containers = [container("solo", "localhost", "proj")];

    const groups = groupContainersForHost(containers, "localhost");
    expect(groups.map((g) => g.label)).toEqual(["proj"]);
  });
});
