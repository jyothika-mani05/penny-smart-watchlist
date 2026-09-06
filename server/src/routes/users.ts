import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { getUserSensitivity, isValidSensitivity } from "../lib/stats.js";

interface UserRow {
  id: string;
  name: string;
  created_at: string;
}

export function usersRouter(db: DatabaseSync): Router {
  const router = Router();

  // Find-or-create by name (case-insensitive): typing the same name again
  // logs back into the same account with its existing watchlists and
  // baselines intact; a new name gets a fresh, isolated account. No
  // password — this is identity for personalization, not a security boundary.
  router.post("/", (req, res) => {
    const name = (req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    if (name.length > 40) return res.status(400).json({ error: "name is too long" });

    const existing = db
      .prepare(`SELECT * FROM users WHERE name = ? COLLATE NOCASE`)
      .get(name) as unknown as UserRow | undefined;
    if (existing) return res.json(existing);

    const id = randomUUID();
    db.prepare(`INSERT INTO users (id, name) VALUES (?, ?)`).run(id, name);

    // New accounts start with one empty watchlist so onboarding isn't a blank wall.
    db.prepare(`INSERT INTO watchlists (user_id, name) VALUES (?, 'My Watchlist')`).run(id);

    const created = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as unknown as UserRow;
    res.status(201).json(created);
  });

  router.get("/:id", (req, res) => {
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id) as unknown as
      | UserRow
      | undefined;
    if (!user) return res.status(404).json({ error: "not found" });
    res.json(user);
  });

  // Settings are self-only — same non-security identity model as everything
  // else here (no password), just checked against the header instead of a
  // shared requireAuth so an unrelated visitor can't read or change your
  // digest sensitivity by guessing your user id.
  router.get("/:id/settings", (req, res) => {
    if (req.header("x-user-id") !== req.params.id) {
      return res.status(403).json({ error: "forbidden" });
    }
    res.json({ sensitivity: getUserSensitivity(db, req.params.id) });
  });

  router.patch("/:id/settings", (req, res) => {
    if (req.header("x-user-id") !== req.params.id) {
      return res.status(403).json({ error: "forbidden" });
    }
    const sensitivity = req.body?.sensitivity;
    if (!isValidSensitivity(sensitivity)) {
      return res.status(400).json({ error: "sensitivity must be one of sensitive, balanced, relaxed" });
    }
    db.prepare(
      `INSERT INTO user_settings (user_id, sensitivity) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET sensitivity = excluded.sensitivity`
    ).run(req.params.id, sensitivity);
    res.json({ sensitivity });
  });

  return router;
}
