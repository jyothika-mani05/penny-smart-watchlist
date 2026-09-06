import { useState } from "react";
import { INTENT_LABELS, type ItemInsight, type WatchlistItem } from "../types";
import { formatExactTime, formatRelativeTime } from "../utils/time";

function materialityBadge(m: ItemInsight["materiality"] | undefined) {
  if (!m) return null;
  const label = m === "significant" ? "Unusual" : m === "notable" ? "Notable" : "Quiet";
  return <span className={`materiality-badge materiality-badge-${m}`}>{label}</span>;
}

export function ManageView({
  items,
  insights,
  onIntentChange,
  onRemove,
  onOpen,
}: {
  items: WatchlistItem[];
  insights: ItemInsight[];
  onIntentChange: (itemId: number, intent: string) => void;
  onRemove: (symbol: string) => void;
  onOpen: (symbol: string) => void;
}) {
  const [query, setQuery] = useState("");
  const insightBySymbol = new Map(insights.map((i) => [i.symbol, i]));

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (item.display_name ?? "").toLowerCase().includes(q) || item.symbol.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {items.length > 0 && (
        <input
          className="manage-filter"
          placeholder="Filter your watchlist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {items.length === 0 ? (
        <div className="empty-state-card">
          <p className="empty-state-title">Your watchlist is empty</p>
          <p className="empty-state-body">Add a few stocks and Penny will remember when you last checked them.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No stocks match "{query}"</p>
      ) : (
        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Status</th>
                <th>Since checked</th>
                <th>Tracking reason</th>
                <th>Last checked</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const insight = insightBySymbol.get(item.symbol);
                return (
                  <tr key={item.id}>
                    <td className="clickable-row" onClick={() => onOpen(item.symbol)}>
                      <div className="compare-name">{item.display_name ?? item.symbol}</div>
                      <div className="compare-symbol">{item.symbol.replace(".NS", "")}</div>
                    </td>
                    <td>{materialityBadge(insight?.materiality) ?? <span className="compare-symbol">—</span>}</td>
                    <td>
                      {insight ? (
                        <span className={insight.sinceCheckedChangePct >= 0 ? "delta-up" : "delta-down"}>
                          {insight.sinceCheckedChangePct >= 0 ? "▲" : "▼"}{" "}
                          {Math.abs(insight.sinceCheckedChangePct).toFixed(2)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <select
                        className="intent-select"
                        value={item.intent}
                        onChange={(e) => onIntentChange(item.id, e.target.value)}
                      >
                        {Object.entries(INTENT_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {insight ? (
                        <span title={formatExactTime(insight.seenAt)}>{formatRelativeTime(insight.seenAt)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <button className="link-btn danger" onClick={() => onRemove(item.symbol)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
