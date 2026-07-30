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
   * The invariant the sidebar's pin animation exists to make legible: pinning
   * does not copy a row into the Pinned section, it moves it. If a pinned
   * container were still listed under its host, the row would appear twice and
   * the two lists would be animating against each other.
   */
  test("excludes pinned containers, so the row leaves the host tree", () => {
    const containers = [container("a"), container("b"), container("c")];
    const pinned = new Set(["b"]);

    expect(names(groupContainersForHost(containers, "localhost", pinned))).toEqual(["a", "c"]);
  });

  test("unpinning returns the container to the host tree", () => {
    const containers = [container("a"), container("b")];

    expect(names(groupContainersForHost(containers, "localhost", new Set(["b"])))).toEqual(["a"]);
    expect(names(groupContainersForHost(containers, "localhost", new Set()))).toEqual(["a", "b"]);
  });

  test("a null or absent pinned set excludes nothing", () => {
    const containers = [container("a"), container("b")];

    expect(names(groupContainersForHost(containers, "localhost", null))).toEqual(["a", "b"]);
    expect(names(groupContainersForHost(containers, "localhost"))).toEqual(["a", "b"]);
  });

  test("pinning the last member drops its group entirely", () => {
    // "at-least-2" only groups a namespace with more than one member, so a
    // namespace of one lands in the catch-all; pinning it should leave no group
    // for the sidebar to render a header for.
    const containers = [container("solo", "localhost", "proj")];

    expect(groupContainersForHost(containers, "localhost", new Set(["solo"]))).toEqual([]);
  });
});
