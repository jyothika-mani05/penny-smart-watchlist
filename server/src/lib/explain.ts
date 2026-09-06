import type { Materiality } from "./stats.js";

/** The core "why is this move notable" sentence, shared by the digest (which
 *  adds a per-watchlist intent note on top) and the stock detail page (which
 *  doesn't have a watchlist context to tailor against). */
export function buildMoveExplanation(opts: {
  sinceCheckedZ: number;
  sinceCheckedChangePct: number;
  idiosyncraticPct: number;
  volumeRatio: number;
  materiality: Materiality;
}): string {
  const { sinceCheckedZ, sinceCheckedChangePct, idiosyncraticPct, volumeRatio, materiality } = opts;
  const direction = sinceCheckedChangePct >= 0 ? "up" : "down";
  const absPct = Math.abs(sinceCheckedChangePct).toFixed(1);
  const absZ = Math.abs(sinceCheckedZ).toFixed(1);

  if (materiality === "quiet") {
    return `Little changed since you last checked (${direction} ${absPct}%, within its normal range).`;
  }

  const marketWide = Math.abs(idiosyncraticPct) < Math.abs(sinceCheckedChangePct) * 0.4;
  const volumeNote = volumeRatio >= 1.8 ? ` on ${volumeRatio.toFixed(1)}x normal volume` : "";
  const marketNote = marketWide
    ? " — broadly in line with the market, not stock-specific."
    : " — more than the market move alone explains.";

  return `${direction === "up" ? "Up" : "Down"} ${absPct}% (${absZ}σ, unusual for this stock)${volumeNote}${marketNote}`;
}
