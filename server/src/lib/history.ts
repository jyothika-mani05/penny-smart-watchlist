import type { DatabaseSync } from "node:sqlite";
import { classify, getSigma, pctChange, zScore } from "./stats.js";
import { getLivePrice } from "./digest.js";
import { SYMBOL_MAP } from "./symbols.js";

export interface DayLogEntry {
  date: string;
  close: number;
  changePct: number;
  z: number;
  materiality: "quiet" | "notable" | "significant";
}

export interface HistoryResponse {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  todayChangePct: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  sigma: number;
  periodHigh: number;
  periodLow: number;
  periodChangePct: number;
  sinceCheckedChangePct: number;
  sinceCheckedZ: number;
  seenAt: string | null;
  log: DayLogEntry[];
}

const MIN_DAYS = 30;

export function buildHistory(
  db: DatabaseSync,
  symbol: string,
  requestedDays: number,
  userId: string | null
): HistoryResponse | null {
  const info = SYMBOL_MAP.get(symbol);
  const live = getLivePrice(db, symbol);
  if (!info || !live) return null;

  const rows = db
    .prepare(`SELECT date, close FROM price_history WHERE symbol = ? ORDER BY date ASC`)
    .all(symbol) as unknown as { date: string; close: number }[];

  const sigma = getSigma(db, symbol);
  const days = Math.max(MIN_DAYS, requestedDays);

  // Day-over-day log: each entry compares against the prior day's close, so the
  // first row in the full history has no change and is dropped from the window.
  const fullLog: DayLogEntry[] = [];
  for (let i = 1; i < rows.length; i++) {
    const changePct = pctChange(rows[i - 1].close, rows[i].close);
    const z = zScore(changePct, sigma);
    fullLog.push({
      date: rows[i].date,
      close: rows[i].close,
      changePct,
      z,
      materiality: classify(Math.abs(z)),
    });
  }

  // Append today's live tick as the most recent, unfinished "day" in the log.
  if (rows.length > 0) {
    const lastHistDate = rows[rows.length - 1].date;
    const todayChangePct = pctChange(live.prev_close, live.price);
    const todayZ = zScore(todayChangePct, sigma);
    fullLog.push({
      date: `${lastHistDate} (live)`,
      close: live.price,
      changePct: todayChangePct,
      z: todayZ,
      materiality: classify(Math.abs(todayZ)),
    });
  }

  const windowLog = fullLog.slice(-days).reverse(); // most recent first

  const closesInWindow = rows.slice(-days).map((r) => r.close).concat(live.price);
  const periodHigh = Math.max(...closesInWindow);
  const periodLow = Math.min(...closesInWindow);
  const periodStart = rows[Math.max(0, rows.length - days)]?.close ?? live.price;
  const periodChangePct = pctChange(periodStart, live.price);

  const baseline = userId
    ? (db
        .prepare(`SELECT baseline_price, seen_at FROM baselines WHERE user_id = ? AND symbol = ?`)
        .get(userId, symbol) as { baseline_price: number; seen_at: string } | undefined)
    : undefined;
  const sinceCheckedChangePct = baseline ? pctChange(baseline.baseline_price, live.price) : 0;
  const sinceCheckedZ = zScore(sinceCheckedChangePct, sigma);

  return {
    symbol,
    name: info.name,
    sector: info.sector,
    price: live.price,
    todayChangePct: pctChange(live.prev_close, live.price),
    dayOpen: live.day_open,
    dayHigh: live.day_high,
    dayLow: live.day_low,
    volume: live.volume,
    avgVolume: live.avg_volume,
    volumeRatio: live.avg_volume > 0 ? live.volume / live.avg_volume : 1,
    sigma,
    periodHigh,
    periodLow,
    periodChangePct,
    sinceCheckedChangePct,
    sinceCheckedZ,
    seenAt: baseline?.seen_at ?? null,
    log: windowLog,
  };
}
