import { ComplexLogEntry, type LogMessage, type LogEntry } from "@/models/LogEntry";

const MARK = "<mark>";

/**
 * Whether a decoded JSON value carries a server-inserted search highlight.
 *
 * The previous form of this test was `JSON.stringify(v).includes("<mark>")`,
 * which serialized every field of every visible entry on every recompute — with
 * a long log and a live stream that is several megabytes of throwaway strings a
 * second. Walking the value costs nothing by comparison and short-circuits on
 * the first hit.
 */
function containsMark(value: unknown): boolean {
  if (typeof value === "string") return value.includes(MARK);
  if (Array.isArray(value)) return value.some(containsMark);
  if (value !== null && typeof value === "object") return Object.values(value).some(containsMark);
  return false;
}

export function useVisibleFilter(visibleKeys: Ref<Map<string[], boolean>>) {
  const { isSearching, inverseFilter } = useSearchFilter();
  function filteredPayload(messages: Ref<LogEntry<LogMessage>[]>) {
    return computed(() => {
      return messages.value
        .map((d) => {
          if (d instanceof ComplexLogEntry) {
            return ComplexLogEntry.fromLogEvent(d, visibleKeys);
          } else {
            return d;
          }
        })
        .filter((d) => {
          if (isSearching.value && d instanceof ComplexLogEntry) {
            const hasMark = Object.values(d.message).some(containsMark);
            return inverseFilter.value ? !hasMark : hasMark;
          } else {
            return true;
          }
        });
    });
  }

  return { filteredPayload };
}
