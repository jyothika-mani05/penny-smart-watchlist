import type { DatabaseSync } from "node:sqlite";
import { classify, getSigma, pctChange, zScore, type Materiality } from "./stats.js";
import { MARKET_INDEX, peersOf, SYMBOL_MAP } from "./symbols.js";
import { buildMoveExplanation } from "./explain.js";

export interface LivePriceRow {
  symbol: string;
  price: number;
  prev_close: number;
  day_open: number;
  day_high: number;
  day_low: number;
  volume: number;
  avg_volume: number;
}

export interface SparkPoint {
  date: string;
  close: number;
}

export interface ItemInsight {
  symbol: string;
  name: string;
  intent: string;
  price: number;
  todayChangePct: number;
  sinceCheckedChangePct: number;
  sinceCheckedZ: number;
  materiality: Materiality;
  idiosyncraticPct: number;
  volumeRatio: number;
  reason: string;
  seenAt: string;
  sparkline: SparkPoint[];
}

const SPARKLINE_DAYS = 14;

/** A short recent-closes tail for card sparklines — deliberately not the full
 *  30-day history used on the stock detail page, just enough to show shape. */
function getSparkline(db: DatabaseSync, symbol: string, live: LivePriceRow): SparkPoint[] {
  const rows = db
    .prepare(
      `SELECT date, close FROM price_history WHERE symbol = ? ORDER BY date DESC LIMIT ?`
    )
    .all(symbol, SPARKLINE_DAYS) as unknown as SparkPoint[];
  const chrono = rows.reverse();
  chrono.push({ date: "live", close: live.price });
  return chrono;
}

export function getLivePrice(db: DatabaseSync, symbol: string): LivePriceRow | undefined {
  return db
    .prepare(`SELECT * FROM live_prices WHERE symbol = ?`)
    .get(symbol) as LivePriceRow | undefined;
}

/** Market's own move since a given baseline timestamp isn't tracked per-baseline for
 *  the index, so we approximate "today's market move" via prev_close -> live price,
 *  which is good enough to separate market-wide moves from stock-specific ones. */
export function getMarketTodayPct(db: DatabaseSync): number {
  const idx = getLivePrice(db, MARKET_INDEX.symbol);
  if (!idx) return 0;
  return pctChange(idx.prev_close, idx.price);
}

function buildReason(opts: {
  name: string;
  intent: string;
  sinceCheckedZ: number;
  sinceCheckedChangePct: number;
  idiosyncraticPct: number;
  volumeRatio: number;
  materiality: Materiality;
}): string {
  const { intent, sinceCheckedChangePct, materiality } = opts;
  const core = buildMoveExplanation(opts);

  const intentNote =
    intent === "watching_for_dip" && sinceCheckedChangePct < 0
      ? " You're watching this one for a dip."
      : intent === "own" && materiality === "significant"
      ? " Worth a look since you hold this."
      : "";

  return `${core}${intentNote}`;
}

export function buildItemInsight(
  db: DatabaseSync,
  item: { symbol: string; display_name: string | null; intent: string },
  userId: string
): ItemInsight | null {
  const live = getLivePrice(db, item.symbol);
  const baseline = db
    .prepare(`SELECT baseline_price, seen_at FROM baselines WHERE user_id = ? AND symbol = ?`)
    .get(userId, item.symbol) as { baseline_price: number; seen_at: string } | undefined;
  if (!live || !baseline) return null;

  const sigma = getSigma(db, item.symbol);
  const todayChangePct = pctChange(live.prev_close, live.price);
  const sinceCheckedChangePct = pctChange(baseline.baseline_price, live.price);
  const sinceCheckedZ = zScore(sinceCheckedChangePct, sigma);
  const materiality = classify(Math.abs(sinceCheckedZ));

  const marketTodayPct = getMarketTodayPct(db);
  const idiosyncraticPct = sinceCheckedChangePct - marketTodayPct;
  const volumeRatio = live.avg_volume > 0 ? live.volume / live.avg_volume : 1;

  const name = item.display_name ?? SYMBOL_MAP.get(item.symbol)?.name ?? item.symbol;

  const reason = buildReason({
    name,
    intent: item.intent,
    sinceCheckedZ,
    sinceCheckedChangePct,
    idiosyncraticPct,
    volumeRatio,
    materiality,
  });

  return {
    symbol: item.symbol,
    name,
    intent: item.intent,
    price: live.price,
    todayChangePct,
    sinceCheckedChangePct,
    sinceCheckedZ,
    materiality,
    idiosyncraticPct,
    volumeRatio,
    reason,
    seenAt: baseline.seen_at,
    sparkline: getSparkline(db, item.symbol, live),
  };
}

export interface PortfolioNarrative {
  summary: string;
  totalCount: number;
  significantCount: number;
  notableCount: number;
  downCount: number;
  upCount: number;
}

export function buildPortfolioNarrative(insights: ItemInsight[]): PortfolioNarrative {
  const totalCount = insights.length;
  const significantCount = insights.filter((i) => i.materiality === "significant").length;
  const notableCount = insights.filter((i) => i.materiality === "notable").length;
  const downCount = insights.filter((i) => i.sinceCheckedChangePct < 0).length;
  const upCount = insights.filter((i) => i.sinceCheckedChangePct >= 0).length;

  if (totalCount === 0) {
    return { summary: "Your watchlist is empty — add a stock to get started.", totalCount, significantCount, notableCount, downCount, upCount };
  }

  if (significantCount === 0 && notableCount === 0) {
    return {
      summary: `Nothing unusual across your ${totalCount} stocks since you last checked — all within normal daily movement.`,
      totalCount,
      significantCount,
      notableCount,
      downCount,
      upCount,
    };
  }

  const avgIdiosyncratic =
    insights.reduce((sum, i) => sum + Math.abs(i.idiosyncraticPct), 0) / totalCount;
  const marketWide = avgIdiosyncratic < 0.6 && downCount >= totalCount * 0.6;

  const flagged = significantCount + notableCount;
  const direction = downCount > upCount ? "down" : "up";

  let summary: string;
  if (marketWide) {
    summary = `${downCount} of ${totalCount} stocks are ${direction}, but only ${significantCount} more than usual for them — this looks market-wide, not stock-specific.`;
  } else {
    summary = `${flagged} of ${totalCount} stocks moved more than usual since you last checked — worth a look, this looks stock-specific rather than a market-wide move.`;
  }

  return { summary, totalCount, significantCount, notableCount, downCount, upCount };
}
