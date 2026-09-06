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

export type Sensitivity = "sensitive" | "balanced" | "relaxed";

// Same z-score math for everyone — sensitivity only moves where the "notable"
// / "significant" cutoffs sit, so a user who wants fewer, bigger-deal alerts
// (relaxed) or more, earlier ones (sensitive) gets that without changing what
// a z-score actually means.
const THRESHOLDS: Record<Sensitivity, { notable: number; significant: number }> = {
  sensitive: { notable: 0.9, significant: 1.8 },
  balanced: { notable: 1.25, significant: 2.5 },
  relaxed: { notable: 1.75, significant: 3.2 },
};

export function classify(absZ: number, sensitivity: Sensitivity = "balanced"): Materiality {
  const t = THRESHOLDS[sensitivity] ?? THRESHOLDS.balanced;
  if (absZ >= t.significant) return "significant";
  if (absZ >= t.notable) return "notable";
  return "quiet";
}

const VALID_SENSITIVITIES: Sensitivity[] = ["sensitive", "balanced", "relaxed"];

export function isValidSensitivity(value: unknown): value is Sensitivity {
  return typeof value === "string" && (VALID_SENSITIVITIES as string[]).includes(value);
}

/** A user with no row yet just hasn't changed the default — "balanced", not an error. */
export function getUserSensitivity(db: DatabaseSync, userId: string): Sensitivity {
  const row = db
    .prepare(`SELECT sensitivity FROM user_settings WHERE user_id = ?`)
    .get(userId) as { sensitivity: string } | undefined;
  const value = row?.sensitivity;
  return isValidSensitivity(value) ? value : "balanced";
}
