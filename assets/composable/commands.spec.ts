/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, vi } from "vitest";

vi.mock("@/stores/config", () => ({
  __esModule: true,
  default: { base: "", hosts: [], authProvider: "simple" },
}));

import { settingCommands, SETTINGS_WITHOUT_COMMANDS } from "./commands";
import { DEFAULT_SETTINGS, settings, type Settings } from "@/stores/settings";

// The palette is translated at render time; the identity function keeps the
// assertions about coverage rather than copy.
const identity = (key: string) => key;

describe("command palette parity", () => {
  // The point of the whole exercise: a preference you can change in Settings
  // should also be reachable by typing. Anything deliberately left out has to
  // be named — and justified — in SETTINGS_WITHOUT_COMMANDS, so adding a
  // setting without deciding either way fails here instead of shipping
  // unreachable.
  test("every setting is either commanded or explicitly excluded", () => {
    const commanded = new Set(settingCommands(identity).map((c) => c.setting));
    const excluded = new Set<string>(SETTINGS_WITHOUT_COMMANDS);

    const uncovered = (Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]).filter(
      (key) => !commanded.has(key) && !excluded.has(key),
    );
    expect(uncovered).toEqual([]);
  });

  test("exclusions name real settings, and none is also commanded", () => {
    const commanded = new Set(settingCommands(identity).map((c) => c.setting));
    for (const key of SETTINGS_WITHOUT_COMMANDS) {
      expect(DEFAULT_SETTINGS).toHaveProperty(key);
      expect(commanded.has(key)).toBe(false);
    }
  });

  test("every settings command declares the setting it drives", () => {
    for (const command of settingCommands(identity)) {
      expect(command.setting, `${command.slash} has no setting`).toBeDefined();
    }
  });

  test("slash commands and ids are unique", () => {
    const commands = settingCommands(identity);
    expect(new Set(commands.map((c) => c.slash)).size).toBe(commands.length);
    expect(new Set(commands.map((c) => c.id)).size).toBe(commands.length);
  });
});

describe("command idempotency", () => {
  // Running a command twice must leave the app where it was. That rules out
  // bare toggles and "cycle" commands, which is why each value gets its own
  // entry — you should be able to say where you want to land without knowing
  // where you are.
  test("each command lands on the same state however many times it runs", () => {
    for (const command of settingCommands(identity)) {
      const key = command.setting!;
      command.perform();
      const first = settings.value[key];
      command.perform();
      expect(settings.value[key], `${command.slash} is not idempotent`).toEqual(first);
    }
    Object.assign(settings.value, DEFAULT_SETTINGS);
  });

  test("every value of a multi-value setting is reachable", () => {
    const commands = settingCommands(identity);
    const reached = (key: keyof Settings) => {
      const values = new Set<unknown>();
      for (const command of commands.filter((c) => c.setting === key)) {
        command.perform();
        values.add(settings.value[key]);
      }
      return values;
    };

    // Tri-state settings are the ones a bare toggle would strand — "auto" is
    // only reachable if it has its own command.
    expect(reached("lightTheme")).toEqual(new Set(["auto", "light", "dark"]));
    expect(reached("ioStatMode")).toEqual(new Set(["summary", "current", "chart"]));
    expect(reached("size")).toEqual(new Set(["small", "medium", "large"]));
    expect(reached("automaticRedirect")).toEqual(new Set(["instant", "delayed", "none"]));
    Object.assign(settings.value, DEFAULT_SETTINGS);
  });
});
