import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { askChatbot, buildChatContext, isChatbotConfigured, type ChatTurn } from "../lib/chatbot.js";
import { buildItemInsight, buildPortfolioNarrative } from "../lib/digest.js";
import { optionalAuth } from "../lib/auth.js";

interface ItemRow {
  id: number;
  watchlist_id: number;
  symbol: string;
  display_name: string | null;
  intent: string;
  added_at: string;
}

export function chatRouter(db: DatabaseSync): Router {
  const router = Router();
  router.use(optionalAuth(db));

  router.get("/status", (_req, res) => {
    res.json({ configured: isChatbotConfigured() });
  });

  router.post("/message", async (req, res) => {
    if (!isChatbotConfigured()) {
      return res.status(503).json({
        error: "Chat isn't configured yet — set GEMINI_API_KEY in server/.env and restart the server.",
      });
    }

    const history = req.body?.history as ChatTurn[] | undefined;
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: "history is required" });
    }

    // Grounding is best-effort and optional: a logged-in user viewing a
    // watchlist they actually own gets their real digest folded into Penny's
    // context; anyone else (or an unowned/invalid id) just gets no context,
    // never an error — chat should never break because grounding didn't apply.
    let context: string | undefined;
    const watchlistId = Number(req.body?.watchlistId);
    if (req.userId && Number.isInteger(watchlistId) && watchlistId > 0) {
      const owns = db
        .prepare(`SELECT 1 FROM watchlists WHERE id = ? AND user_id = ?`)
        .get(watchlistId, req.userId);
      if (owns) {
        const items = db
          .prepare(`SELECT * FROM watchlist_items WHERE watchlist_id = ?`)
          .all(watchlistId) as unknown as ItemRow[];
        const insights = items
          .map((item) => buildItemInsight(db, item, req.userId!))
          .filter((x): x is NonNullable<typeof x> => x !== null);
        const narrative = buildPortfolioNarrative(insights);
        context = buildChatContext(insights, narrative.summary);
      }
    }

    try {
      const reply = await askChatbot(history, context);
      res.json({ reply });
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
    }
  });

  return router;
}
