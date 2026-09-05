import { Router } from "express";
import { askChatbot, isChatbotConfigured, type ChatTurn } from "../lib/chatbot.js";

export function chatRouter(): Router {
  const router = Router();

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

    try {
      const reply = await askChatbot(history);
      res.json({ reply });
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
    }
  });

  return router;
}
