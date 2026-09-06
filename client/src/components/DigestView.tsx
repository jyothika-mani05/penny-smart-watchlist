import { useState } from "react";
import { Eye, HandWaving, Lightning } from "@phosphor-icons/react";
import type { DigestResponse, ItemInsight } from "../types";
import { INTENT_LABELS } from "../types";
import { Sparkline } from "./Sparkline";
import { InfoTooltip } from "./InfoTooltip";
import { formatExactTime, formatRelativeTime } from "../utils/time";

function materialityLabel(m: ItemInsight["materiality"]) {
  if (m === "significant") return "Unusual";
  if (m === "notable") return "Notable";
  return "Quiet";
}

function ItemCard({
  item,
  justSeen,
  onMarkSeen,
  onRemove,
  onOpen,
}: {
  item: ItemInsight;
  justSeen: boolean;
  onMarkSeen: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  onOpen: (symbol: string) => void;
}) {
  const up = item.sinceCheckedChangePct >= 0;
  return (
    <div className={`item-card materiality-${item.materiality} ${justSeen ? "item-card-seen" : ""}`}>
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

        <div className="item-card-price-row">
          <div className="item-card-price">
            <span className="price">₹{item.price.toFixed(2)}</span>
            <span className={`delta ${up ? "delta-up" : "delta-down"}`}>
              {up ? "▲" : "▼"} {Math.abs(item.sinceCheckedChangePct).toFixed(2)}%
            </span>
            <span className="zscore" onClick={(e) => e.stopPropagation()}>
              {Math.abs(item.sinceCheckedZ).toFixed(1)}σ unusual
              <InfoTooltip text="This stock moved this many standard deviations more than its typical daily move — a statistical measure of how unusual the size of the move is for this specific stock." />
            </span>
          </div>
          <Sparkline points={item.sparkline} up={up} />
        </div>

        {item.materiality !== "quiet" && (
          <div className="item-card-flag">
            <span className="item-card-flag-icon" aria-hidden="true">
              <Lightning size={14} weight="fill" />
            </span>
            <p className="reason">{item.reason}</p>
          </div>
        )}
        {item.materiality === "quiet" && <p className="reason reason-quiet">{item.reason}</p>}

        <div className="item-card-footer">
          <span className="intent-tag">{INTENT_LABELS[item.intent] ?? item.intent}</span>
          <span className="seen-at" title={formatExactTime(item.seenAt)}>
            Last checked {formatRelativeTime(item.seenAt)}
          </span>
        </div>
      </div>

      <div className="item-card-actions">
        {item.materiality !== "quiet" && (
          <button
            className={`btn-secondary btn-small ${justSeen ? "btn-seen" : ""}`}
            onClick={() => onMarkSeen(item.symbol)}
            disabled={justSeen}
          >
            {justSeen ? "✓ Seen" : "Got it"}
          </button>
        )}
        <button className="link-btn danger" onClick={() => onRemove(item.symbol)}>
          Remove
        </button>
      </div>
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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
  const [justSeen, setJustSeen] = useState<Set<string>>(new Set());

  function handleMarkSeen(symbol: string) {
    setJustSeen((prev) => new Set(prev).add(symbol));
    onMarkSeen(symbol);
  }

  function handleMarkAllSeen() {
    setJustSeen(new Set(flagged.map((i) => i.symbol)));
    onMarkAllSeen();
  }

  const flagged = digest.items.filter((i) => i.materiality !== "quiet");
  const hasFlags = flagged.length > 0;

  return (
    <div>
      <div className="digest-greeting">
        <h1>
          {greeting()}{" "}
          <span className="digest-wave">
            <HandWaving size={24} weight="regular" />
          </span>
        </h1>
        <p className="tagline">Here's what changed since you last checked.</p>
      </div>

      <div className="digest-noticed">
        {hasFlags ? (
          <>
            <span className="digest-noticed-eyes">
              Penny noticed something <Eye size={15} weight="regular" />
            </span>
            <span className="digest-noticed-count">
              {flagged.length} unusual move{flagged.length === 1 ? "" : "s"}
            </span>
          </>
        ) : digest.items.length > 0 ? (
          <span className="digest-noticed-calm">
            All quiet — nothing unusual across your {digest.items.length} stock
            {digest.items.length === 1 ? "" : "s"}.
          </span>
        ) : null}
        {hasFlags && (
          <button className="btn-secondary btn-small digest-mark-all" onClick={handleMarkAllSeen}>
            Mark all as seen
          </button>
        )}
      </div>

      <h2 className="digest-section-heading">What changed since you last checked</h2>

      {digest.items.length === 0 ? (
        <div className="empty-state-card">
          <p className="empty-state-title">Your watchlist is empty</p>
          <p className="empty-state-body">Add a few stocks and Penny will remember when you last checked them.</p>
        </div>
      ) : !hasFlags ? (
        <div className="empty-state-card">
          <p className="empty-state-title">Nothing needs your attention right now</p>
          <p className="empty-state-body">
            You're all caught up. Tracking {digest.items.length} stock{digest.items.length === 1 ? "" : "s"} in
            the background.
          </p>
        </div>
      ) : (
        <div className="item-list">
          {flagged.map((item) => (
            <ItemCard
              key={item.symbol}
              item={item}
              justSeen={justSeen.has(item.symbol)}
              onMarkSeen={handleMarkSeen}
              onRemove={onRemove}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
