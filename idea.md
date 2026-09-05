# Penny — A Smart Watchlist

## Core idea
A watchlist that behaves like an **inbox, not a spreadsheet** — instead of showing raw
prices, it tells the user what changed since *they personally* last looked, how unusual
that change is for that specific stock, and why — without ever recommending what to
buy or sell.

## Must-haves (brief baseline)
1. Manage a watchlist — create/rename/delete lists, search and add/remove stocks.
2. View live market info — price, % change, volume, day range per stock.
3. Return later and see what changed — anchored to the user's own last visit, not
   just "today vs yesterday".

## Differentiator features
1. **Personal baseline** — every number is a delta from the user's last-seen timestamp
   per stock, not from yesterday's close.
2. **"Is this normal for this stock?" (z-score)** — a move is flagged only if it's
   unusual relative to that stock's own trailing volatility (σ), not a flat % rule
   applied to every stock alike.
3. **One-line explanation** — each flagged move gets a plain-English reason (results,
   sector-wide move, volume spike, 52w break).
4. **Read/unread + priority sort** — alerts can be marked seen; the most noteworthy
   stock surfaces first, not an alphabetical list.
5. **Portfolio-level story** — one sentence summarizing the whole list, e.g. "6 of 8
   stocks down, but only 1 more than usual for it — looks market-wide, not
   stock-specific."
6. **Stated intent per stock** — when adding a stock the user tags *why* ("own it",
   "watching for dip", "competitor watch"); the digest is framed against that intent.
7. **Comparison view (facts, not advice)** — ranks stocks in a list by how much
   attention they deserve right now (volatility deviation, peer deviation), explicitly
   without any buy/sell/better/worse-as-investment language.
8. **Company info + verification, before you add a stock** — real company profile
   (industry, business summary, ownership breakdown) and links to official NSE filing
   pages, so users can check a stock before tracking it rather than relying on us.
9. **Penny, the stock-market chatbot** — a Gemini-backed assistant scoped strictly to
   market/investing concepts, refusing off-topic questions and personalized
   recommendations the same way the rest of the app does.
10. **Lightweight per-user identity** — name-only "login" (no password): the same name
    logs back into the same account and watchlists; a different name is a fully
    isolated account. This is what makes "since you last checked" genuinely personal
    instead of shared across every visitor.

## Explicitly out of scope
- Any buy/sell/target-price/"better investment" recommendation. This is regulated
  investment advice (SEBI RIA/RA) in India — the app only surfaces facts and lets the
  user draw conclusions.

## Data approach
- Real historical daily prices (for NSE-listed stocks) power the volatility/σ maths
  honestly.
- A live price simulator sits on top of the last real close, so demos are reliable and
  a "big move" can be triggered on cue, without depending on a live licensed feed
  (which the team has no legal access to).

## Stack
- Backend: Node.js + Express + TypeScript, SQLite (`node:sqlite`, built into Node 24)
  for persistence.
- Market data: `yahoo-finance2` npm package for historical daily closes (unofficial,
  free, standard for this kind of project).
- Chatbot: Google Gemini (`@google/genai`, free tier) via a server-side proxy — the
  API key never reaches the client.
- Frontend: React + Vite + TypeScript.

## Identity model (deliberate simplification)
Users "log in" with just a name — no password, no email. Typing an existing name logs
back into that same account (watchlists, baselines, everything intact); a new name
creates a fresh, fully isolated account. This is enough to make personalization real
(the whole point of the app) without building actual authentication, which the project
doesn't need — nothing behind it is sensitive enough to require a security boundary,
just enough to require an identity boundary.