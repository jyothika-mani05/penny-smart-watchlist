import YahooFinance from "yahoo-finance2";
import { openDb } from "./schema.js";
import { UNIVERSE, MARKET_INDEX } from "../lib/symbols.js";

const yahooFinance = new YahooFinance();

const ALL_SYMBOLS = [...UNIVERSE.map((s) => s.symbol), MARKET_INDEX.symbol];

const DEMO_USER_ID = "demo";
const DEMO_USER_NAME = "demo";

async function fetchHistory(symbol: string) {
  const period2 = new Date();
  const period1 = new Date();
  period1.setDate(period1.getDate() - 90); // ~60 trading days, comfortably enough for a 30d sigma window

  const rows = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval: "1d",
  });

  return rows.quotes
    .filter((q) => q.close != null)
    .map((q) => ({ date: q.date.toISOString().slice(0, 10), close: q.close as number }));
}

async function main() {
  const db = openDb();

  const insertHistory = db.prepare(
    `INSERT OR REPLACE INTO price_history (symbol, date, close) VALUES (?, ?, ?)`
  );
  const insertLive = db.prepare(`
    INSERT OR REPLACE INTO live_prices
      (symbol, price, prev_close, day_open, day_high, day_low, volume, avg_volume, updated_at)
    VALUES (@symbol, @price, @prev_close, @day_open, @day_high, @day_low, @volume, @avg_volume, datetime('now'))
  `);
  const insertBaseline = db.prepare(`
    INSERT OR REPLACE INTO baselines (user_id, symbol, baseline_price, seen_at)
    VALUES (?, ?, ?, datetime('now', '-6 days'))
  `);

  const seededPrices: Record<string, number> = {};

  for (const symbol of ALL_SYMBOLS) {
    console.log(`Fetching ${symbol}...`);
    let history: { date: string; close: number }[] = [];
    try {
      history = await fetchHistory(symbol);
    } catch (err) {
      console.error(`  failed to fetch ${symbol}:`, (err as Error).message);
      continue;
    }
    if (history.length === 0) {
      console.warn(`  no history for ${symbol}, skipping`);
      continue;
    }

    for (const row of history) insertHistory.run(symbol, row.date, row.close);

    const closes = history.map((h) => h.close);
    const lastClose = closes[closes.length - 1];
    const prevClose = closes.length > 1 ? closes[closes.length - 2] : lastClose;
    const volumes = 1_000_000 + Math.round(Math.random() * 4_000_000);

    insertLive.run({
      symbol,
      price: lastClose,
      prev_close: prevClose,
      day_open: prevClose,
      day_high: Math.max(lastClose, prevClose),
      day_low: Math.min(lastClose, prevClose),
      volume: volumes,
      avg_volume: volumes,
    });

    seededPrices[symbol] = prevClose;
    console.log(`  ok: ${history.length} days, last close ${lastClose}`);
  }

  // A demo login ("demo") with a pre-populated watchlist and baselines backdated
  // a few days, so there's an immediately rich example to show — a brand-new
  // login, by contrast, starts empty. That contrast is the whole point.
  db.prepare(`INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)`).run(
    DEMO_USER_ID,
    DEMO_USER_NAME
  );

  const existing = db
    .prepare(`SELECT id FROM watchlists WHERE user_id = ? AND name = 'My Watchlist'`)
    .get(DEMO_USER_ID);

  if (!existing) {
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO watchlists (user_id, name) VALUES (?, 'My Watchlist')`)
      .run(DEMO_USER_ID);
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO watchlist_items (watchlist_id, symbol, display_name, intent)
      VALUES (?, ?, ?, ?)
    `);
    const starter: [string, string, string][] = [
      ["RELIANCE.NS", "Reliance Industries", "own"],
      ["TCS.NS", "Tata Consultancy Services", "own"],
      ["HDFCBANK.NS", "HDFC Bank", "watching_for_dip"],
      ["INFY.NS", "Infosys", "watching"],
      ["ITC.NS", "ITC", "competitor_watch"],
    ];
    for (const [symbol, name, intent] of starter) {
      insertItem.run(lastInsertRowid, symbol, name, intent);
      if (seededPrices[symbol] != null) {
        insertBaseline.run(DEMO_USER_ID, symbol, seededPrices[symbol]);
      }
    }
    console.log(`Seeded demo user with watchlist #${lastInsertRowid}, ${starter.length} items`);
  }

  console.log("Seed complete. Log in with the name \"demo\" to see the pre-populated example.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
