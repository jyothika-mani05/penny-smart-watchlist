# Penny — A Smart Watchlist

A stock watchlist that behaves like an **inbox, not a spreadsheet** — instead of just
showing raw prices, it tells you what changed since *you personally* last looked, how
unusual that change is for that specific stock, and why — without ever recommending
what to buy or sell.

## Core idea

Most watchlists show today vs. yesterday for every stock, flat, regardless of how
volatile that stock normally is. Penny instead:

- Tracks a **personal baseline** per stock — every number is a delta from when *you*
  last checked, not from yesterday's close.
- Flags a move only if it's **unusual for that specific stock** (a z-score against its
  own trailing volatility), not against a flat percentage rule applied to everything.
- Explains *why* a flagged move matters in one plain-English sentence, and gives a
  single portfolio-level summary instead of a wall of numbers.

## Features

1. **Digest** — an inbox of only what's actually flagged since you last checked;
   marking something seen makes it disappear, not just relabel.
2. **Personal baseline & "is this normal?" (z-score)** — materiality (`quiet` /
   `notable` / `significant`) computed from each stock's own trailing 30-day
   volatility.
3. **Stated intent per stock** — tag *why* you're tracking a stock ("own it",
   "watching for a dip", "competitor watch", "just watching"); Penny's explanations
   are framed against that.
4. **Compare view (facts, not advice)** — a real multi-select comparison table ranked
   by how much attention each stock deserves right now — never a buy/sell/better/worse
   call.
5. **Stock detail page** — 1W/1M/3M charts over real historical closes, a "why Penny
   flagged this" breakdown, real company profile/ownership data, and links to official
   NSE filings.
6. **Removed view** — then-vs-now price comparison for stocks you've stopped tracking,
   framed as reflection, never as a suggestion to re-add them.
7. **Penny, the market chatbot** — a Gemini-backed assistant scoped strictly to
   market/investing concepts, grounded in your real watchlist digest when one is open,
   and refuses buy/sell/hold verdicts the same way the rest of the app does.
8. **Settings** — a real, functional Digest sensitivity control (Sensitive / Balanced /
   Relaxed) that changes the actual z-score thresholds used across Digest and Compare.
9. **Lightweight per-user identity** — name-only "login" (no password): the same name
   logs back into the same account and watchlists; a different name is a fully
   isolated account.
10. Fully responsive (mobile drawer navigation) and accessible (keyboard nav, ARIA
    labels, focus-visible states).

## Explicitly out of scope

Any buy/sell/target-price/"better investment" recommendation. Personalized investment
advice is regulated (SEBI RIA/RA) in India — Penny only surfaces facts and lets you
draw your own conclusions.

## Data approach

- Real historical daily closes (NSE-listed stocks, via `yahoo-finance2`) power the
  volatility/z-score math honestly, and refresh automatically in the background so the
  chart doesn't go stale.
- A live price simulator sits on top of the last real close, sized off each stock's own
  real volatility — there's no legally accessible free real-time NSE feed, so nothing
  here is presented as a live market data product.

## Stack

- **Backend**: Node.js + Express + TypeScript, SQLite (`node:sqlite`, built into Node
  24) for persistence.
- **Market data**: `yahoo-finance2` (unofficial, free) for historical daily closes.
- **Chatbot**: Google Gemini (`@google/genai`, free tier) via a server-side proxy — the
  API key never reaches the client.
- **Frontend**: React + Vite + TypeScript, Phosphor Icons.

## Identity model (deliberate simplification)

Users "log in" with just a name — no password, no email. Typing an existing name logs
back into that same account (watchlists, baselines, everything intact); a new name
creates a fresh, isolated account. This makes personalization real (the whole point of
the app) without building actual authentication, which the project doesn't need —
nothing behind it is sensitive enough to require a security boundary, just an identity
boundary.

## Running it locally

Requires Node.js 24+ (for built-in `node:sqlite`).

```bash
# 1. Server
cd server
npm install
cp .env.example .env        # then add a free Gemini key from https://aistudio.google.com/apikey
npm run seed                 # fetches real historical prices, seeds a demo account
npm run dev                  # http://localhost:4000

# 2. Client (in a separate terminal)
cd client
npm install
npm run dev                  # http://localhost:5173
```

Log in with any name to start a fresh account, or **`demo`** for a pre-populated
example watchlist.
