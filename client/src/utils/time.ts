/** Parses the server's "YYYY-MM-DD HH:MM:SS" (UTC, no offset marker) into a Date. */
function parseServerDate(dateStr: string): Date {
  const iso = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
  return new Date(iso);
}

/** "18 min ago" / "2 hr ago" / "3 days ago" / falls back to a short date past a week. */
export function formatRelativeTime(dateStr: string): string {
  const then = parseServerDate(dateStr).getTime();
  if (Number.isNaN(then)) return dateStr;

  const diffMs = Date.now() - then;
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 45) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return parseServerDate(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Exact timestamp for a tooltip/title attribute. */
export function formatExactTime(dateStr: string): string {
  return parseServerDate(dateStr).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
