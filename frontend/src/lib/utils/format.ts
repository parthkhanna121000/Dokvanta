/** Human-readable file size, e.g. 2516582 -> "2.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

// Fixed locale and time zone, so the output never differs between server and browser.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Formats an ISO date string, e.g. "2026-11-08T09:30:00Z" -> "Nov 8, 2026". */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}
