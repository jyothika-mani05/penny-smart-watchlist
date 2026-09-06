import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { buildItemInsight, buildPortfolioNarrative } from "../lib/digest.js";
import { SYMBOL_MAP } from "../lib/symbols.js";
import { requireAuth } from "../lib/auth.js";
import { getUserSensitivity } from "../lib/stats.js";

interface WatchlistRow {
  id: number;
  user_id: string;
  name: string;
  created_at: string;
}

interface ItemRow {
  id: number;
  watchlist_id: number;
  symbol: string;
  display_name: string | null;
  intent: string;
  added_at: string;
}

export function watchlistsRouter(db: DatabaseSync): Router {
  const router = Router();
  router.use(requireAuth(db));

  function ownsWatchlist(watchlistId: number, userId: string): boolean {
    return Boolean(
      db.prepare(`SELECT 1 FROM watchlists WHERE id = ? AND user_id = ?`).get(watchlistId, userId)
    );
  }

  // Records what a stock was worth at the moment it was actually removed, so
  // the "Removed" view can later show a factual then-vs-now comparison —
  // never framed as advice to re-add it.
  function recordRemoval(
    userId: string,
    item: { symbol: string; display_name: string | null; intent: string }
  ) {
    const live = db.prepare(`SELECT price FROM live_prices WHERE symbol = ?`).get(item.symbol) as
      | { price: number }
      | undefined;
    db.prepare(
      `INSERT INTO removed_items (user_id, symbol, display_name, intent, price_at_removal)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, item.symbol, item.display_name, item.intent, live?.price ?? 0);
  }

  // -- Watchlist CRUD -------------------------------------------------------

  router.get("/", (req, res) => {
    const lists = db
      .prepare(`SELECT * FROM watchlists WHERE user_id = ? ORDER BY created_at ASC`)
      .all(req.userId!) as unknown as WatchlistRow[];
    res.json(lists);
  });

  router.post("/", (req, res) => {
    const name = (req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO watchlists (user_id, name) VALUES (?, ?)`)
      .run(req.userId!, name);
    const created = db.prepare(`SELECT * FROM watchlists WHERE id = ?`).get(lastInsertRowid);
    res.status(201).json(created);
  });

  router.patch("/:id", (req, res) => {
    const name = (req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = db
      .prepare(`UPDATE watchlists SET name = ? WHERE id = ? AND user_id = ?`)
      .run(name, req.params.id, req.userId!);
    if (result.changes === 0) return res.status(404).json({ error: "not found" });
    const updated = db.prepare(`SELECT * FROM watchlists WHERE id = ?`).get(req.params.id);
    res.json(updated);
  });

  router.delete("/:id", (req, res) => {
    const result = db
      .prepare(`DELETE FROM watchlists WHERE id = ? AND user_id = ?`)
      .run(req.params.id, req.userId!);
    if (result.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  // -- Items ------------------------------------------------------------------

  router.get("/:id/items", (req, res) => {
    if (!ownsWatchlist(Number(req.params.id), req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const items = db
      .prepare(`SELECT * FROM watchlist_items WHERE watchlist_id = ?`)
      .all(req.params.id) as unknown as ItemRow[];
    res.json(items);
  });

  router.post("/:id/items", (req, res) => {
    const watchlistId = Number(req.params.id);
    if (!ownsWatchlist(watchlistId, req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }

    const symbol = (req.body?.symbol ?? "").trim();
    const intent = (req.body?.intent ?? "watching").trim();
    if (!symbol) return res.status(400).json({ error: "symbol is required" });

    const info = SYMBOL_MAP.get(symbol);
    if (!info) {
      return res.status(400).json({ error: `unknown symbol ${symbol}` });
    }

    const live = db.prepare(`SELECT price FROM live_prices WHERE symbol = ?`).get(symbol) as
      | { price: number }
      | undefined;
    if (!live) {
      return res.status(409).json({ error: "price data not seeded for this symbol yet" });
    }

    try {
      db.prepare(
        `INSERT INTO watchlist_items (watchlist_id, symbol, display_name, intent) VALUES (?, ?, ?, ?)`
      ).run(watchlistId, symbol, info.name, intent);
    } catch (err) {
      return res.status(409).json({ error: "symbol already in this watchlist" });
    }

    // First time this user tracks this symbol, checkpoint a baseline immediately —
    // otherwise it would have no personal baseline row and get silently dropped
    // from their digest until they explicitly check it once.
    db.prepare(
      `INSERT OR IGNORE INTO baselines (user_id, symbol, baseline_price, seen_at)
       VALUES (?, ?, ?, datetime('now'))`
    ).run(req.userId!, symbol, live.price);

    const created = db
      .prepare(`SELECT * FROM watchlist_items WHERE watchlist_id = ? AND symbol = ?`)
      .get(watchlistId, symbol);
    res.status(201).json(created);
  });

  router.patch("/:id/items/:itemId", (req, res) => {
    if (!ownsWatchlist(Number(req.params.id), req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const intent = req.body?.intent;
    if (!intent) return res.status(400).json({ error: "intent is required" });
    const result = db
      .prepare(`UPDATE watchlist_items SET intent = ? WHERE id = ? AND watchlist_id = ?`)
      .run(intent, req.params.itemId, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "not found" });
    const updated = db.prepare(`SELECT * FROM watchlist_items WHERE id = ?`).get(req.params.itemId);
    res.json(updated);
  });

  router.delete("/:id/items/:itemId", (req, res) => {
    if (!ownsWatchlist(Number(req.params.id), req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const item = db
      .prepare(`SELECT symbol, display_name, intent FROM watchlist_items WHERE id = ? AND watchlist_id = ?`)
      .get(req.params.itemId, req.params.id) as
      | { symbol: string; display_name: string | null; intent: string }
      | undefined;
    if (!item) return res.status(404).json({ error: "not found" });

    const result = db
      .prepare(`DELETE FROM watchlist_items WHERE id = ? AND watchlist_id = ?`)
      .run(req.params.itemId, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "not found" });

    recordRemoval(req.userId!, item);
    res.status(204).end();
  });

  router.delete("/:id/items/by-symbol/:symbol", (req, res) => {
    if (!ownsWatchlist(Number(req.params.id), req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const item = db
      .prepare(`SELECT symbol, display_name, intent FROM watchlist_items WHERE symbol = ? AND watchlist_id = ?`)
      .get(req.params.symbol, req.params.id) as
      | { symbol: string; display_name: string | null; intent: string }
      | undefined;
    if (!item) return res.status(404).json({ error: "not found" });

    const result = db
      .prepare(`DELETE FROM watchlist_items WHERE symbol = ? AND watchlist_id = ?`)
      .run(req.params.symbol, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "not found" });

    recordRemoval(req.userId!, item);
    res.status(204).end();
  });

  // -- Digest: the actual "what changed" view ---------------------------------

  router.get("/:id/digest", (req, res) => {
    const watchlistId = Number(req.params.id);
    if (!ownsWatchlist(watchlistId, req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const items = db
      .prepare(`SELECT * FROM watchlist_items WHERE watchlist_id = ?`)
      .all(watchlistId) as unknown as ItemRow[];

    const sensitivity = getUserSensitivity(db, req.userId!);
    const insights = items
      .map((item) => buildItemInsight(db, item, req.userId!, sensitivity))
      .filter((x): x is NonNullable<typeof x> => x !== null)
      // Most noteworthy first — the whole point of the feature.
      .sort((a, b) => Math.abs(b.sinceCheckedZ) - Math.abs(a.sinceCheckedZ));

    const narrative = buildPortfolioNarrative(insights);

    res.json({ watchlistId, narrative, items: insights });
  });

  // -- Comparison view: facts-only ranking, no advice --------------------------

  router.get("/:id/compare", (req, res) => {
    const watchlistId = Number(req.params.id);
    if (!ownsWatchlist(watchlistId, req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const items = db
      .prepare(`SELECT * FROM watchlist_items WHERE watchlist_id = ?`)
      .all(watchlistId) as unknown as ItemRow[];

    const sensitivity = getUserSensitivity(db, req.userId!);
    const insights = items
      .map((item) => buildItemInsight(db, item, req.userId!, sensitivity))
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .map((i) => ({
        symbol: i.symbol,
        name: i.name,
        price: i.price,
        sinceCheckedChangePct: i.sinceCheckedChangePct,
        sinceCheckedZ: i.sinceCheckedZ,
        idiosyncraticPct: i.idiosyncraticPct,
        volumeRatio: i.volumeRatio,
        materiality: i.materiality,
        attentionScore: Math.abs(i.sinceCheckedZ) * 0.6 + Math.min(i.volumeRatio, 5) * 0.2 + Math.abs(i.idiosyncraticPct) * 0.2,
      }))
      .sort((a, b) => b.attentionScore - a.attentionScore);

    res.json({ watchlistId, items: insights });
  });

  // -- Checkpoint: "mark as seen" — updates the personal baseline ---------------

  router.post("/:id/checkpoint", (req, res) => {
    const watchlistId = Number(req.params.id);
    if (!ownsWatchlist(watchlistId, req.userId!)) {
      return res.status(404).json({ error: "not found" });
    }
    const onlySymbol = req.body?.symbol as string | undefined;

    const items = db
      .prepare(`SELECT symbol FROM watchlist_items WHERE watchlist_id = ? ${onlySymbol ? "AND symbol = ?" : ""}`)
      .all(...(onlySymbol ? [watchlistId, onlySymbol] : [watchlistId])) as { symbol: string }[];

    const update = db.prepare(`
      INSERT INTO baselines (user_id, symbol, baseline_price, seen_at)
      SELECT ?, symbol, price, datetime('now') FROM live_prices WHERE symbol = ?
      ON CONFLICT(user_id, symbol) DO UPDATE SET
        baseline_price = excluded.baseline_price,
        seen_at = excluded.seen_at
    `);

    for (const item of items) update.run(req.userId!, item.symbol);

    res.json({ checkpointed: items.map((i) => i.symbol) });
  });

  return router;
}
