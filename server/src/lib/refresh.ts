import YahooFinance from "yahoo-finance2";
import type { DatabaseSync } from "node:sqlite";
import { UNIVERSE, MARKET_INDEX } from "./symbols.js";

const yahooFinance = new YahooFinance();
const ALL_SYMBOLS = [...UNIVERSE.map((s) => s.symbol), MARKET_INDEX.symbol];

/**
 * Pulls the last ~10 days of real closes for every tracked symbol and merges
 * them into price_history (INSERT OR REPLACE, so this is safe to re-run any
 * time — it just fills in whatever's missing since the last run). Whenever a
 * genuinely new trading day's close shows up, rolls live_prices' prev_close
 * forward and resets the day's open/high/low so "today" is measured against
 * the new close instead of a stale one. This is what keeps the chart from
 * going stale after a weekend/holiday or a long-running server — without it,
 * price_history only ever reflected the moment `npm run seed` was last run.
 */
export async function refreshMarketData(db: DatabaseSync) {
  const insertHistory = db.prepare(
    `INSERT OR REPLACE INTO price_history (symbol, date, close) VALUES (?, ?, ?)`
  );
  const getLatestHistDate = db.prepare(
    `SELECT date FROM price_history WHERE symbol = ? ORDER BY date DESC LIMIT 1`
  );
  const getLive = db.prepare(`SELECT price FROM live_prices WHERE symbol = ?`);
  const rollLive = db.prepare(`
    UPDATE live_prices
    SET prev_close = @prevClose, day_open = @dayOpen, day_high = @dayHigh, day_low = @dayLow, volume = 0
    WHERE symbol = @symbol
  `);

  let updated = 0;
  for (const symbol of ALL_SYMBOLS) {
    try {
      const period2 = new Date();
      const period1 = new Date();
      period1.setDate(period1.getDate() - 10);

      const rows = await yahooFinance.chart(symbol, { period1, period2, interval: "1d" });
      const closes = rows.quotes
        .filter((q) => q.close != null)
        .map((q) => ({ date: q.date.toISOString().slice(0, 10), close: q.close as number }));
      if (closes.length === 0) continue;

      const priorLatest = (getLatestHistDate.get(symbol) as { date: string } | undefined)?.date ?? null;
      for (const row of closes) insertHistory.run(symbol, row.date, row.close);

      const newest = closes[closes.length - 1];
      if (newest.date !== priorLatest) {
        const live = getLive.get(symbol) as { price: number } | undefined;
        if (live) {
          rollLive.run({
            symbol,
            prevClose: newest.close,
            dayOpen: live.price,
            dayHigh: live.price,
            dayLow: live.price,
          });
          updated++;
        }
      }
    } catch (err) {
      console.error(`refreshMarketData: failed for ${symbol}:`, (err as Error).message);
    }
  }

  if (updated > 0) {
    console.log(`refreshMarketData: rolled ${updated} symbol(s) onto a new trading day's close`);
  }
}
