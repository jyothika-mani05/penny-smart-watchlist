import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { getLivePrice } from "../lib/digest.js";
import { pctChange } from "../lib/stats.js";
import { requireAuth } from "../lib/auth.js";
import { SYMBOL_MAP } from "../lib/symbols.js";

interface RemovedRow {
  id: number;
  symbol: string;
  display_name: string | null;
  intent: string | null;
  price_at_removal: number;
  removed_at: string;
}

export function removedRouter(db: DatabaseSync): Router {
  const router = Router();
  router.use(requireAuth(db));

  router.get("/", (req, res) => {
    const rows = db
      .prepare(`SELECT * FROM removed_items WHERE user_id = ? ORDER BY removed_at DESC`)
      .all(req.userId!) as unknown as RemovedRow[];

    const result = rows.map((r) => {
      const live = getLivePrice(db, r.symbol);
      const currentPrice = live?.price ?? null;
      const changePct = currentPrice != null ? pctChange(r.price_at_removal, currentPrice) : null;
      return {
        id: r.id,
        symbol: r.symbol,
        name: r.display_name ?? SYMBOL_MAP.get(r.symbol)?.name ?? r.symbol,
        intent: r.intent,
        removedAt: r.removed_at,
        priceAtRemoval: r.price_at_removal,
        currentPrice,
        changePct,
      };
    });

    res.json(result);
  });

  return router;
}
