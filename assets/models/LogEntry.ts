import { Component, ComputedRef, Ref } from "vue";
import { flattenJSON } from "@/utils";
import ComplexLogItem from "@/components/LogViewer/ComplexLogItem.vue";
import SimpleLogItem from "@/components/LogViewer/SimpleLogItem.vue";
import GroupedLogItem from "@/components/LogViewer/GroupedLogItem.vue";
import ContainerEventLogItem from "@/components/LogViewer/ContainerEventLogItem.vue";
import SkippedEntriesLogItem from "@/components/LogViewer/SkippedEntriesLogItem.vue";
import LoadMoreLogItem from "@/components/LogViewer/LoadMoreLogItem.vue";

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;
export type JSONObject = { [x: string]: JSONValue };
export type Std = "stdout" | "stderr";
export type LogType = "single" | "group" | "complex";
export type Position = "start" | "end" | "middle" | undefined;
export type LogMessage = string | string[] | JSONObject;
export type Level =
  "error" | "warn" | "warning" | "info" | "debug" | "trace" | "severe" | "critical" | "fatal" | "unknown";

export interface LogFragment {
  readonly m: string;
}

export interface LogEvent {
  readonly t: LogType;
  readonly m: string | LogFragment[] | JSONObject;
  readonly ts: number;
  readonly id: number;
  readonly l: Level;
  readonly s: "stdout" | "stderr" | "unknown";
  readonly c: string;
  readonly rm: string;
}

export abstract class LogEntry<T extends LogMessage> {
  protected readonly _message: T;
  constructor(
    message: T,
    public readonly containerID: string,
    public readonly id: number,
    public readonly date: Date,
    public readonly std: Std,
    public readonly rawMessage: string,
    public readonly level?: Level,
  ) {
    this._message = message;
  }

  public get message(): T {
    return this._message;
  }

  abstract getComponent(): Component;
}

export class SimpleLogEntry extends LogEntry<string> {
  constructor(
    message: string,
    containerID: string,
    id: number,
    date: Date,
    public readonly level: Level,
    public readonly std: Std,
    public readonly rawMessage: string,
  ) {
    super(message, containerID, id, date, std, rawMessage, level);
  }
  getComponent(): Component {
    return SimpleLogItem;
  }
}

export class GroupedLogEntry extends LogEntry<string[]> {
  constructor(
    messages: string[],
    containerID: string,
    id: number,
    date: Date,
    public readonly level: Level,
    public readonly std: Std,
  ) {
    super(messages as any, containerID, id, date, std, "", level);
  }

  public get message(): string[] {
    return this._message as unknown as string[];
  }

  getComponent(): Component {
    return GroupedLogItem;
  }
}

export class ComplexLogEntry extends LogEntry<JSONObject> {
  private readonly filteredMessage: ComputedRef<Record<string, any>>;

  constructor(
    message: JSONObject,
    containerID: string,
    id: number,
    date: Date,
    public readonly level: Level,
    public readonly std: Std,
    public readonly rawMessage: string,
    visibleKeys?: Ref<Map<string[], boolean>>,
  ) {
    super(message, containerID, id, date, std, rawMessage, level);
    if (visibleKeys) {
      this.filteredMessage = computed(() => {
        if (visibleKeys.value.size === 0) {
          return flattenJSON(message);
        } else {
          const flatJSON = flattenJSON(message);
          const filteredJSON: Record<string, any> = {};
          for (const [keys, enabled] of visibleKeys.value.entries()) {
            const key = keys.join(".");
            if (!enabled) {
              delete flatJSON[key];
              continue;
            }
            filteredJSON[key] = flatJSON[key];
            delete flatJSON[key];
          }
          return { ...filteredJSON, ...flatJSON };
        }
      });
    } else {
      this.filteredMessage = computed(() => flattenJSON(message));
    }
  }
  getComponent(): Component {
    return ComplexLogItem;
  }

  public get message(): Record<string, any> {
    return unref(this.filteredMessage);
  }

  public get unfilteredMessage(): JSONObject {
    return this._message;
  }

  /**
   * Derived entries are cached per visible-keys ref.
   *
   * This runs for every entry in the visible window on every buffer flush (four
   * times a second while a container is chatty). Building a fresh entry each
   * time meant allocating a fresh Vue computed each time — hundreds of reactive
   * effects created and collected per second — and handing every row a new prop
   * identity, so the whole list re-rendered even when nothing about it changed.
   *
   * The cache is keyed by the ref rather than a single slot because the same
   * entry can be rendered by two views at once (a pinned side-by-side column
   * has its own visible-keys ref), and a one-slot cache would thrash between
   * them. The derived entry stays correct as keys are toggled: its computed
   * tracks `visibleKeys.value`.
   */
  private readonly derived = new WeakMap<Ref<Map<string[], boolean>>, ComplexLogEntry>();

  static fromLogEvent(event: ComplexLogEntry, visibleKeys: Ref<Map<string[], boolean>>): ComplexLogEntry {
    const cached = event.derived.get(visibleKeys);
    if (cached) return cached;

    const entry = new ComplexLogEntry(
      event._message,
      event.containerID,
      event.id,
      event.date,
      event.level,
      event.std,
      event.rawMessage,
      visibleKeys,
    );
    event.derived.set(visibleKeys, entry);
    return entry;
  }
}

export class ContainerEventLogEntry extends LogEntry<string> {
  constructor(
    message: string,
    containerID: string,
    date: Date,
    public readonly event: "container-stopped" | "container-started",
  ) {
    super(message, containerID, date.getTime(), date, "stderr", "unknown");
  }
  getComponent(): Component {
    return ContainerEventLogItem;
  }
}

export class SkippedLogsEntry extends LogEntry<string> {
  private _totalSkipped = ref(0);
  private lastSkipped: LogEntry<string | JSONObject>;

  constructor(
    date: Date,
    totalSkipped: number,
    public readonly firstSkipped: LogEntry<string | JSONObject>,
    lastSkipped: LogEntry<string | JSONObject>,
    private readonly loader: (i: SkippedLogsEntry) => Promise<void>,
  ) {
    super("", "", date.getTime(), date, "stderr", "info");
    this._totalSkipped.value = totalSkipped;
    this.lastSkipped = lastSkipped;
  }
  getComponent(): Component {
    return SkippedEntriesLogItem;
  }

  public get message(): string {
    return `Skipped ${this._totalSkipped.value} entries`;
  }

  public addSkippedEntries(totalSkipped: number, lastItem: LogEntry<string | JSONObject>) {
    this._totalSkipped.value += totalSkipped;
    this.lastSkipped = lastItem;
  }

  public get lastSkippedLog(): LogEntry<string | JSONObject> {
    return this.lastSkipped;
  }

  public async loadSkippedEntries(): Promise<void> {
    await this.loader(this);
  }

  public get totalSkipped(): number {
    return unref(this._totalSkipped);
  }
}

export class LoadMoreLogEntry extends LogEntry<string> {
  constructor(
    date: Date,
    private readonly loader: (i: LoadMoreLogEntry) => Promise<void>,
    public readonly rememberScrollPosition: boolean = true,
  ) {
    super("", "", date.getTime(), date, "stderr", "info");
  }

  getComponent(): Component {
    return LoadMoreLogItem;
  }

  async loadMore(): Promise<void> {
    await this.loader(this);
  }
}

export function asLogEntry(event: LogEvent): LogEntry<LogMessage> {
  const std = event.s === "unknown" ? "stderr" : (event.s ?? "stderr");

  switch (event.t) {
    case "complex":
      return new ComplexLogEntry(event.m as JSONObject, event.c, event.id, new Date(event.ts), event.l, std, event.rm);
    case "group":
      return new GroupedLogEntry(
        (event.m as LogFragment[]).map((f) => f.m),
        event.c,
        event.id,
        new Date(event.ts),
        event.l,
        std,
      );
    case "single":
    default:
      return new SimpleLogEntry(event.m as string, event.c, event.id, new Date(event.ts), event.l, std, event.rm);
  }
}
