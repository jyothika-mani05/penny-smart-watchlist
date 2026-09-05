import type { DigestResponse, ItemInsight } from "../types";
import { INTENT_LABELS } from "../types";

function materialityLabel(m: ItemInsight["materiality"]) {
  if (m === "significant") return "Significant";
  if (m === "notable") return "Notable";
  return "Quiet";
}

function ItemCard({
  item,
  onMarkSeen,
  onRemove,
  onOpen,
}: {
  item: ItemInsight;
  onMarkSeen: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onOpen: (symbol: string) => void;
}) {
  const up = item.sinceCheckedChangePct >= 0;
  return (
    <div className={`item-card materiality-${item.materiality}`}>
      <div className="item-card-main item-card-clickable" onClick={() => onOpen(item.symbol)}>
        <div className="item-card-top">
          <div>
            <span className="item-name">{item.name}</span>
            <span className="item-symbol">{item.symbol.replace(".NS", "")}</span>
          </div>
          <span className={`materiality-badge materiality-badge-${item.materiality}`}>
            {materialityLabel(item.materiality)}
          </span>
        </div>

        <div className="item-card-price">
          <span className="price">₹{item.price.toFixed(2)}</span>
          <span className={`delta ${up ? "delta-up" : "delta-down"}`}>
            {up ? "▲" : "▼"} {Math.abs(item.sinceCheckedChangePct).toFixed(2)}%
          </span>
          <span className="zscore">{Math.abs(item.sinceCheckedZ).toFixed(1)}σ</span>
        </div>

        <p className="reason">{item.reason}</p>

        <div className="item-card-footer">
          <span className="intent-tag">{INTENT_LABELS[item.intent] ?? item.intent}</span>
          <span className="seen-at">since {new Date(item.seenAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="item-card-actions">
        {item.materiality !== "quiet" && (
          <button className="btn-secondary btn-small" onClick={() => onMarkSeen(item.symbol)}>
            Got it
          </button>
        )}
        <button className="link-btn danger" onClick={() => onRemove(item.symbol)}>
          Remove
        </button>
      </div>
    </div>
  );
}

export function DigestView({
  digest,
  onMarkSeen,
  onMarkAllSeen,
  onRemove,
  onOpen,
}: {
  digest: DigestResponse;
  onMarkSeen: (symbol: string) => void;
  onMarkAllSeen: () => void;
  onRemove: (symbol: string) => void;
  onOpen: (symbol: string) => void;
}) {
  const hasFlags = digest.narrative.significantCount + digest.narrative.notableCount > 0;

  return (
    <div>
      <div className={`narrative-banner ${hasFlags ? "narrative-flagged" : "narrative-quiet"}`}>
        <p>{digest.narrative.summary}</p>
        {digest.items.length > 0 && (
          <button className="btn-secondary btn-small" onClick={onMarkAllSeen}>
            Mark all as seen
          </button>
        )}
      </div>

      {digest.items.length === 0 ? (
        <p className="empty-state">Nothing in this watchlist yet — add a stock to get started.</p>
      ) : (
        <div className="item-list">
          {digest.items.map((item) => (
            <ItemCard
              key={item.symbol}
              item={item}
              onMarkSeen={onMarkSeen}
              onRemove={onRemove}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
