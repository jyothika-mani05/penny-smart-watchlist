import type { DatabaseSync } from "node:sqlite";
import { getSigma } from "./stats.js";

/**
 * Nudges every symbol's live price with a small random walk each tick, sized off
 * that symbol's own real historical volatility (sigma) so the simulated ticking
 * still "feels like" that stock. Occasionally injects a bigger jump so the
 * materiality/alert engine has something real to catch during a demo.
 */
export function startSimulator(db: DatabaseSync, tickMs = 4000) {
  const symbols = (
    db.prepare(`SELECT symbol FROM live_prices`).all() as { symbol: string }[]
  ).map((r) => r.symbol);

  const sigmaCache = new Map(symbols.map((s) => [s, getSigma(db, s)]));

  const update = db.prepare(`
    UPDATE live_prices
    SET price = @price,
        day_high = MAX(day_high, @price),
        day_low = MIN(day_low, @price),
        volume = volume + @volumeDelta,
        updated_at = datetime('now')
    WHERE symbol = @symbol
  `);

  const getRow = db.prepare(
    `SELECT price, avg_volume FROM live_prices WHERE symbol = ?`
  );

  const tick = () => {
    for (const symbol of symbols) {
      const row = getRow.get(symbol) as
        | { price: number; avg_volume: number }
        | undefined;
      if (!row) continue;

      const sigma = sigmaCache.get(symbol) ?? 1;
      // Per-tick step is a fraction of the daily sigma; a rare "surprise" tick
      // multiplies it up so alerts have something to fire on during a demo.
      const surprise = Math.random() < 0.015 ? 4 + Math.random() * 3 : 1;
      const stepPct = randomNormal() * (sigma / 12) * surprise;
      const newPrice = Math.max(0.5, row.price * (1 + stepPct / 100));
      const volumeDelta = Math.round(
        (row.avg_volume / 300) * (0.5 + Math.random() * (surprise > 1 ? 6 : 1.5))
      );

      update.run({ symbol, price: newPrice, volumeDelta });
    }
  };

  const timer = setInterval(tick, tickMs);
  return () => clearInterval(timer);
}

/** Box-Muller transform for an approximately normal random step instead of uniform noise. */
function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
