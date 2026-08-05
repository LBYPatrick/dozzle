import { type Ref } from "vue";
import { type LogEvent, type LogMessage, LogEntry, asLogEntry } from "@/models/LogEntry";
import { Container } from "@/models/Container";

export function parseMessage(data: string): LogEntry<LogMessage> {
  const e = JSON.parse(data) as LogEvent;
  return asLogEntry(e);
}

// Flatten and time-order the logs from parallel loadBetween calls, dropping any
// whose request was aborted (params changed mid-flight).
export function mergeLoadedLogs(
  results: { logs: LogEntry<LogMessage>[]; signal: AbortSignal }[],
): LogEntry<LogMessage>[] {
  return results
    .filter(({ signal }) => !signal.aborted)
    .flatMap(({ logs }) => logs)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function loadBetween(
  container: Container | Ref<Container>,
  params: Ref<URLSearchParams>,
  from: Date,
  to: Date,
  {
    lastSeenId,
    startId,
    min,
    maxStart,
  }: { lastSeenId?: number; startId?: number; min?: number; maxStart?: number } = {},
) {
  const c = toValue(container);
  const url = `/api/hosts/${c.host}/containers/${c.id}/logs`;
  const abortController = new AbortController();
  const signal = abortController.signal;

  function buildUrl() {
    const loadMoreParams = new URLSearchParams(params.value);
    loadMoreParams.append("from", from.toISOString());
    loadMoreParams.append("to", to.toISOString());
    if (min) {
      loadMoreParams.append("min", String(min));
    }
    if (maxStart) {
      loadMoreParams.append("maxStart", String(maxStart));
    }
    // The server parses this as a uint32 and 400s on anything wider, so a bad
    // id must never reach the wire — a rejected request here costs the whole
    // "load more", and the error comes back as plain text that then fails to
    // parse as JSON.
    if (lastSeenId && Number.isInteger(lastSeenId) && lastSeenId > 0 && lastSeenId <= 0xffffffff) {
      loadMoreParams.append("lastSeenId", String(lastSeenId));
    }
    if (startId) {
      loadMoreParams.append("startId", String(startId));
    }
    return withBase(`${url}?${loadMoreParams.toString()}`);
  }

  const fullUrl = buildUrl();
  const stopWatcher = watchOnce(params, () => abortController.abort("stream changed"));
  const logs = await (await fetch(fullUrl, { signal })).text();
  stopWatcher();

  if (!logs) return { logs: [] as LogEntry<LogMessage>[], signal };

  return {
    logs: logs
      .trim()
      .split("\n")
      .map((line) => parseMessage(line)),
    signal,
  };
}
