import type { DatabaseSync } from "node:sqlite";

/** Daily % returns from a chronological list of closes. */
export function dailyReturns(closes: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev === 0) continue;
    returns.push(((closes[i] - prev) / prev) * 100);
  }
  return returns;
}

export function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Trailing daily volatility (sigma, in %) for a symbol over its last ~30 sessions. */
export function getSigma(db: DatabaseSync, symbol: string): number {
  const rows = db
    .prepare(
      `SELECT close FROM price_history WHERE symbol = ? ORDER BY date ASC`
    )
    .all(symbol) as { close: number }[];
  const closes = rows.map((r) => r.close);
  const returns = dailyReturns(closes).slice(-30);
  const sigma = stdev(returns);
  // Floor so near-zero-volatility symbols (or thin seed data) don't produce
  // absurdly inflated z-scores from a tiny denominator.
  return Math.max(sigma, 0.15);
}

export function pctChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / from) * 100;
}

export function zScore(pctMove: number, sigma: number): number {
  return pctMove / sigma;
}

export type Materiality = "quiet" | "notable" | "significant";

export function classify(absZ: number): Materiality {
  if (absZ >= 2.5) return "significant";
  if (absZ >= 1.25) return "notable";
  return "quiet";
}
