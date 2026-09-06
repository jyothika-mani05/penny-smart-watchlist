import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = path.join(__dirname, "..", "..", "data.sqlite");

const LEGACY_USER_ID = "legacy";

export function openDb(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      display_name TEXT,
      intent TEXT NOT NULL DEFAULT 'watching',
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(watchlist_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      symbol TEXT NOT NULL,
      date TEXT NOT NULL,
      close REAL NOT NULL,
      PRIMARY KEY (symbol, date)
    );

    CREATE TABLE IF NOT EXISTS live_prices (
      symbol TEXT PRIMARY KEY,
      price REAL NOT NULL,
      prev_close REAL NOT NULL,
      day_open REAL NOT NULL,
      day_high REAL NOT NULL,
      day_low REAL NOT NULL,
      volume INTEGER NOT NULL,
      avg_volume INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS baselines (
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      baseline_price REAL NOT NULL,
      seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS removed_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      display_name TEXT,
      intent TEXT,
      price_at_removal REAL NOT NULL,
      removed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      sensitivity TEXT NOT NULL DEFAULT 'balanced'
    );

    CREATE TABLE IF NOT EXISTS company_profiles (
      symbol TEXT PRIMARY KEY,
      website TEXT,
      industry TEXT,
      business_summary TEXT,
      city TEXT,
      country TEXT,
      full_time_employees INTEGER,
      insiders_pct REAL,
      institutions_pct REAL,
      institutions_count INTEGER,
      shares_outstanding REAL,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrateColumn(db, "company_profiles", "insiders_pct", "REAL");
  migrateColumn(db, "company_profiles", "institutions_pct", "REAL");
  migrateColumn(db, "company_profiles", "institutions_count", "INTEGER");
  migrateColumn(db, "company_profiles", "shares_outstanding", "REAL");
  migrateColumn(db, "watchlists", "user_id", "TEXT");

  migrateLegacyOwnership(db);
  migrateBaselinesToPerUser(db);

  return db;
}

/** Adds a column to an existing table if it isn't already there — SQLite has no
 *  `ADD COLUMN IF NOT EXISTS`, so this keeps `openDb` safe to run against a
 *  database created by an earlier version of the schema. */
function migrateColumn(db: DatabaseSync, table: string, column: string, type: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

/** Watchlists created before per-user identity existed have no owner — assign
 *  them to a fixed "legacy" account rather than leaving them ownerless/orphaned. */
function migrateLegacyOwnership(db: DatabaseSync) {
  const orphaned = db.prepare(`SELECT 1 FROM watchlists WHERE user_id IS NULL LIMIT 1`).get();
  if (!orphaned) return;

  db.prepare(
    `INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)`
  ).run(LEGACY_USER_ID, "Legacy Demo");
  db.exec(`UPDATE watchlists SET user_id = '${LEGACY_USER_ID}' WHERE user_id IS NULL`);
}

/** Pre-identity `baselines` had a single-column PRIMARY KEY (symbol), global
 *  across all users. Rebuild it with a (user_id, symbol) composite key,
 *  attributing old rows to the legacy account, so "since you checked" becomes
 *  genuinely per-user instead of shared by everyone. */
function migrateBaselinesToPerUser(db: DatabaseSync) {
  const cols = db.prepare(`PRAGMA table_info(baselines)`).all() as { name: string }[];
  if (cols.some((c) => c.name === "user_id")) return; // already migrated / fresh install

  db.prepare(
    `INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)`
  ).run(LEGACY_USER_ID, "Legacy Demo");

  db.exec(`
    CREATE TABLE baselines_new (
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      baseline_price REAL NOT NULL,
      seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, symbol)
    );
    INSERT INTO baselines_new (user_id, symbol, baseline_price, seen_at)
      SELECT '${LEGACY_USER_ID}', symbol, baseline_price, seen_at FROM baselines;
    DROP TABLE baselines;
    ALTER TABLE baselines_new RENAME TO baselines;
  `);
}
