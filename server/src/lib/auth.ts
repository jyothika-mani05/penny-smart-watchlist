import type { DatabaseSync } from "node:sqlite";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string | null;
    }
  }
}

function resolveUserId(db: DatabaseSync, req: Request): string | null {
  const header = req.header("x-user-id");
  if (!header) return null;
  const row = db.prepare(`SELECT id FROM users WHERE id = ?`).get(header) as
    | { id: string }
    | undefined;
  return row ? row.id : null;
}

/** Rejects the request unless a valid X-User-Id header is present. Use on
 *  routes where the response is meaningless without an identity (a user's own
 *  watchlists) — this is the one thing in the app we don't degrade gracefully
 *  on, since serving one visitor's watchlist to another would be a real bug,
 *  not a cosmetic one. */
export function requireAuth(db: DatabaseSync) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = resolveUserId(db, req);
    if (!userId) {
      return res.status(401).json({ error: "Not logged in — send a valid X-User-Id header." });
    }
    req.userId = userId;
    next();
  };
}

/** Attaches req.userId when a valid header is present, but never rejects —
 *  for routes that serve shared market data and only optionally personalize
 *  it (e.g. "since you checked" on a stock page opened without a watchlist). */
export function optionalAuth(db: DatabaseSync) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.userId = resolveUserId(db, req);
    next();
  };
}
