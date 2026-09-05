import { useEffect, useState } from "react";
import { api } from "../api";
import type { HistoryResponse, SymbolInfo } from "../types";
import { INTENT_LABELS } from "../types";
import { PriceChart } from "./PriceChart";

function VerifyCard({ data }: { data: HistoryResponse }) {
  return (
    <div className="verify-card">
      <div className="verify-top">
        <div>
          <span className="price">₹{data.price.toFixed(2)}</span>
          <span className={`delta ${data.todayChangePct >= 0 ? "delta-up" : "delta-down"}`}>
            {data.todayChangePct >= 0 ? "▲" : "▼"} {Math.abs(data.todayChangePct).toFixed(2)}% today
          </span>
        </div>
        <span className="intent-tag">{data.sector}</span>
      </div>

      <div className="verify-stat-grid">
        <div>
          <span className="stat-label">30d range</span>
          <span className="stat-value-sm">
            ₹{data.periodLow.toFixed(2)} – ₹{data.periodHigh.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="stat-label">30d change</span>
          <span className={`stat-value-sm ${data.periodChangePct >= 0 ? "delta-up" : "delta-down"}`}>
            {data.periodChangePct >= 0 ? "+" : ""}
            {data.periodChangePct.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="stat-label">Daily volatility (σ)</span>
          <span className="stat-value-sm">{data.sigma.toFixed(2)}%</span>
        </div>
      </div>

      <PriceChart log={data.log} />

      <p className="verify-disclaimer">
        Real historical closing prices — this is context to help you decide, not a
        recommendation to buy or sell.
      </p>
    </div>
  );
}

export function AddStockDialog({
  onAdd,
  onClose,
}: {
  onAdd: (symbol: string, intent: string) => Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolInfo[]>([]);
  const [selected, setSelected] = useState<SymbolInfo | null>(null);
  const [preview, setPreview] = useState<HistoryResponse | null>(null);
  const [intent, setIntent] = useState("watching");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.searchSymbols(query).then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    if (!selected) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    api.getHistory(selected.symbol, 30).then((r) => {
      if (!cancelled) setPreview(r);
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function submit() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(selected.symbol, intent);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${selected ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h3>Add a stock</h3>
        {!selected && <p className="modal-subtitle">Search real NSE-listed companies</p>}

        {!selected ? (
          <>
            <div className="search-field">
              <svg className="search-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
                <line x1="14" y1="14" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                placeholder="Search by name or symbol..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <ul className="symbol-results">
              {results.map((s) => (
                <li key={s.symbol} onClick={() => setSelected(s)}>
                  <div className="symbol-main">
                    <span className="symbol-name">{s.name}</span>
                    <span className="symbol-sector">{s.sector}</span>
                  </div>
                  <span className="symbol-code">{s.symbol.replace(".NS", "")}</span>
                </li>
              ))}
              {results.length === 0 && <li className="empty">No matches</li>}
            </ul>
          </>
        ) : (
          <>
            <div className="selected-symbol">
              <strong>{selected.name}</strong> ({selected.symbol.replace(".NS", "")})
              <button className="link-btn" onClick={() => setSelected(null)}>
                change
              </button>
            </div>

            {preview ? <VerifyCard data={preview} /> : <p className="empty-state">Loading...</p>}

            <label>Why are you tracking this?</label>
            <div className="intent-options">
              {Object.entries(INTENT_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${intent === value ? "chip-active" : ""}`}
                  onClick={() => setIntent(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="modal-actions">
              <button onClick={onClose} className="btn-secondary" disabled={busy}>
                Cancel
              </button>
              <button onClick={submit} className="btn-primary" disabled={busy}>
                {busy ? "Adding..." : "Add to watchlist"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
