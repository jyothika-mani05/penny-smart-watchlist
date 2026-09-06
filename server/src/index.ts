try {
  process.loadEnvFile();
} catch {
  // No .env file present — fine, e.g. GEMINI_API_KEY may be set another way.
}

import express from "express";
import cors from "cors";
import { openDb } from "./db/schema.js";
import { watchlistsRouter } from "./routes/watchlists.js";
import { marketRouter } from "./routes/market.js";
import { chatRouter } from "./routes/chat.js";
import { usersRouter } from "./routes/users.js";
import { removedRouter } from "./routes/removed.js";
import { startSimulator } from "./lib/simulator.js";
import { refreshMarketData } from "./lib/refresh.js";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // catches up across weekends/holidays without needing exact market-close timing

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const db = openDb();

const hasData = db.prepare(`SELECT 1 FROM live_prices LIMIT 1`).get();
if (!hasData) {
  console.warn(
    "No price data found. Run `npm run seed` first to fetch historical prices and seed the demo watchlist."
  );
}

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter(db));
app.use("/api/watchlists", watchlistsRouter(db));
app.use("/api/market", marketRouter(db));
app.use("/api/chat", chatRouter(db));
app.use("/api/removed", removedRouter(db));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

if (hasData) {
  startSimulator(db);
  refreshMarketData(db).catch((err) => console.error("Initial market data refresh failed:", err));
  setInterval(() => {
    refreshMarketData(db).catch((err) => console.error("Scheduled market data refresh failed:", err));
  }, REFRESH_INTERVAL_MS);
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
