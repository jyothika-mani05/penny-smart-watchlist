import { useEffect, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { api } from "../api";
import type { Sensitivity, User } from "../types";

const SENSITIVITY_OPTIONS: { key: Sensitivity; label: string; body: string }[] = [
  {
    key: "sensitive",
    label: "Sensitive",
    body: "Flags smaller moves sooner — more items in your Digest, earlier.",
  },
  {
    key: "balanced",
    label: "Balanced",
    body: "The default — flags moves that are genuinely unusual for that stock.",
  },
  {
    key: "relaxed",
    label: "Relaxed",
    body: "Only flags bigger, rarer moves — a quieter Digest with fewer, bigger-deal alerts.",
  },
];

function memberSince(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function SettingsView({ user, onSwitchUser }: { user: User; onSwitchUser: () => void }) {
  const [sensitivity, setSensitivity] = useState<Sensitivity | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings(user.id)
      .then((s) => setSensitivity(s.sensitivity))
      .catch((err) => setError((err as Error).message));
  }, [user.id]);

  async function choose(next: Sensitivity) {
    if (next === sensitivity) return;
    setSensitivity(next);
    setSaved(false);
    try {
      await api.updateSettings(user.id, next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="settings-view">
      <section className="page-section">
        <h3>Account</h3>
        <div className="settings-account-row">
          <div className="sidebar-user-avatar settings-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <p className="settings-account-name">{user.name}</p>
            <p className="settings-account-meta">Member since {memberSince(user.created_at)}</p>
          </div>
          <button className="btn-secondary btn-small settings-switch-btn" onClick={onSwitchUser}>
            Switch user
          </button>
        </div>
        <p className="compare-note">
          Lightweight identity only — no password, no email. Typing this same name back in on any
          device picks up exactly where you left off.
        </p>
      </section>

      <section className="page-section">
        <h3>Digest sensitivity</h3>
        <p className="compare-note">
          Controls how big a move has to be — relative to that stock's own normal volatility,
          never a flat percentage — before Penny flags it in your Digest and Compare views.
        </p>
        <div className="sensitivity-options">
          {SENSITIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`sensitivity-card ${sensitivity === opt.key ? "active" : ""}`}
              onClick={() => choose(opt.key)}
              aria-pressed={sensitivity === opt.key}
            >
              <span className="sensitivity-card-head">
                {opt.label}
                {sensitivity === opt.key && <Check size={15} weight="bold" aria-hidden="true" />}
              </span>
              <span className="sensitivity-card-body">{opt.body}</span>
            </button>
          ))}
        </div>
        {saved && <p className="settings-saved">Saved — takes effect on your next refresh.</p>}
        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="page-section">
        <h3>About the data</h3>
        <p className="compare-note">
          Historical prices come from real NSE-listed closes and refresh automatically in the
          background. Live prices tick on a simulator layered on top of each stock's own real
          volatility — there's no legally accessible free real-time NSE feed, so nothing here is a
          live market data product.
        </p>
        <p className="compare-note">
          Penny surfaces facts — price behavior, volatility, ownership, official filings — and
          never recommends buying, selling, or holding any specific stock. Personalized investment
          advice requires a SEBI-registered adviser.
        </p>
      </section>
    </div>
  );
}
