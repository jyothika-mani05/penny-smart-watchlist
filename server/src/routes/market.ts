import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { UNIVERSE } from "../lib/symbols.js";
import { buildHistory } from "../lib/history.js";
import { getCompanyProfile } from "../lib/profile.js";
import { optionalAuth } from "../lib/auth.js";

interface LiveRow {
  symbol: string;
  price: number;
  prev_close: number;
  day_open: number;
  day_high: number;
  day_low: number;
  volume: number;
}

export function marketRouter(db: DatabaseSync): Router {
  const router = Router();
  router.use(optionalAuth(db));

  // Searchable universe, for the "add a stock" flow.
  router.get("/symbols", (req, res) => {
    const q = ((req.query.q as string) ?? "").toLowerCase().trim();
    const results = UNIVERSE.filter(
      (s) => !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
    res.json(results);
  });

  router.get("/history/:symbol", (req, res) => {
    const days = Math.max(1, Number(req.query.days) || 30);
    const result = buildHistory(db, req.params.symbol, days, req.userId ?? null);
    if (!result) return res.status(404).json({ error: "not found" });
    res.json(result);
  });

  router.get("/profile/:symbol", async (req, res) => {
    const profile = await getCompanyProfile(db, req.params.symbol);
    if (!profile) return res.status(404).json({ error: "not found" });
    res.json(profile);
  });

  router.get("/quote/:symbol", (req, res) => {
    const row = db
      .prepare(`SELECT * FROM live_prices WHERE symbol = ?`)
      .get(req.params.symbol) as LiveRow | undefined;
    if (!row) return res.status(404).json({ error: "not found" });
    res.json({
      ...row,
      changePct: ((row.price - row.prev_close) / row.prev_close) * 100,
    });
  });

  return router;
}
