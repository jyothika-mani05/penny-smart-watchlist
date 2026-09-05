import { useEffect, useState } from "react";
import { api } from "../api";
import type { HistoryResponse, RemovedItem } from "../types";
import { INTENT_LABELS } from "../types";
import { PriceChart } from "./PriceChart";

function daysSince(dateStr: string): number {
  const then = new Date(dateStr.replace(" ", "T") + "Z").getTime();
  const days = Math.ceil((Date.now() - then) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

function RemovedRow({ item }: { item: RemovedItem }) {
  const [expanded, setExpanded] = useState(false);
  const [chart, setChart] = useState<HistoryResponse | null>(null);

  useEffect(() => {
    if (!expanded || chart) return;
    api.getHistory(item.symbol, daysSince(item.removedAt)).then(setChart);
  }, [expanded, chart, item.symbol, item.removedAt]);

  const up = (item.changePct ?? 0) >= 0;

  return (
    <div className="removed-row">
      <div className="removed-row-main" onClick={() => setExpanded((e) => !e)}>
        <div>
          <span className="item-name">{item.name}</span>
          <span className="item-symbol">{item.symbol.replace(".NS", "")}</span>
        </div>
        <div className="removed-row-mid">
          {item.intent && <span className="intent-tag">{INTENT_LABELS[item.intent] ?? item.intent}</span>}
          <span className="removed-date">Removed {new Date(item.removedAt).toLocaleDateString()}</span>
        </div>
        <div className="removed-row-price">
          <span className="removed-then-now">
            ₹{item.priceAtRemoval.toFixed(2)} → ₹{item.currentPrice?.toFixed(2) ?? "—"}
          </span>
          {item.changePct != null && (
            <span className={`delta ${up ? "delta-up" : "delta-down"}`}>
              {up ? "▲" : "▼"} {Math.abs(item.changePct).toFixed(2)}%
            </span>
          )}
        </div>
        <button className="link-btn removed-toggle">{expanded ? "Hide chart" : "Show chart"}</button>
      </div>

      {expanded && (
        <div className="removed-chart-wrap">
          {chart ? (
            <PriceChart log={chart.log} />
          ) : (
            <p className="empty-state-inline">Loading chart...</p>
          )}
        </div>
      )}
    </div>
  );
}

export function RemovedView() {
  const [items, setItems] = useState<RemovedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRemovedItems().then(setItems).catch((err) => setError((err as Error).message));
  }, []);

  return (
    <div>
      <p className="compare-note">
        What happened to prices after you stopped tracking these — for your own reflection,
        not a suggestion to add them back.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {!items ? (
        <p className="empty-state">Loading...</p>
      ) : items.length === 0 ? (
        <p className="empty-state">Nothing removed yet — stocks you take off a watchlist show up here.</p>
      ) : (
        <div className="removed-list">
          {items.map((item) => (
            <RemovedRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
