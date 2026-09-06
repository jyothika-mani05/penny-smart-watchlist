import { useState } from "react";
import { api } from "../api";
import type { User } from "../types";

export function LoginGate({ onLogin }: { onLogin: (user: User) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const user = await api.login(trimmed);
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-gate">
      <div className="login-card">
        <img src="/logo.png" alt="Penny" className="login-logo" />
        <h1>Penny</h1>
        <p className="login-subtitle">A smart watchlist</p>
        <p className="tagline">
          Who's checking in? Type any name — use the same one next time to pick up right where
          you left off, or a different one to start a completely separate, isolated account.
        </p>

        <input
          autoFocus
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={busy}
        />

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" onClick={submit} disabled={busy || !name.trim()}>
          {busy ? "Signing in..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
