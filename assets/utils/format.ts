export function formatBytes(
  bytes: number,
  { decimals = 2, short = false }: { decimals?: number; short?: boolean } = { decimals: 2, short: false },
) {
  if (!Number.isFinite(bytes) || bytes === 0) return short ? "0B" : "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  // The short form keeps the real abbreviation. Taking just the first letter
  // rendered a megabyte as "1.6M", which reads as a count rather than a size.
  const shortSizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  // Averaged rates are fractional, so the exponent can go negative (0.5 bytes)
  // and, for absurd inputs, past the last unit. Clamp instead of indexing off
  // the end of the table.
  const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))));

  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  if (short) {
    return value + shortSizes[i];
  } else {
    return value + " " + sizes[i];
  }
}

export function stripVersion(label: string) {
  const [name, _] = label.split(":");
  return name;
}

export function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
