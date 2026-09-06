import { useState } from "react";
import type { Watchlist } from "../types";

export function WatchlistSwitcher({
  watchlists,
  activeId,
  onSelect,
  onNewList,
  onDeleteList,
}: {
  watchlists: Watchlist[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewList: () => void;
  onDeleteList: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = watchlists.find((w) => w.id === activeId) ?? null;

  return (
    <div className="watchlist-switcher">
      <button className="watchlist-switcher-btn" onClick={() => setOpen((o) => !o)}>
        <span className="watchlist-switcher-label">{active?.name ?? "No watchlist"}</span>
        <span className="topbar-caret">▾</span>
      </button>

      {open && (
        <div className="watchlist-switcher-menu" onMouseLeave={() => setOpen(false)}>
          {watchlists.map((w) => (
            <div key={w.id} className={`watchlist-switcher-item ${w.id === activeId ? "active" : ""}`}>
              <button
                onClick={() => {
                  onSelect(w.id);
                  setOpen(false);
                }}
              >
                {w.name}
              </button>
              <button
                className="watchlist-switcher-remove"
                onClick={() => onDeleteList(w.id)}
                title="Delete watchlist"
              >
                ×
              </button>
            </div>
          ))}
          {watchlists.length === 0 && <p className="sidebar-empty">No watchlists yet</p>}

          <button
            className="watchlist-switcher-new"
            onClick={() => {
              onNewList();
              setOpen(false);
            }}
          >
            + New watchlist
          </button>
        </div>
      )}
    </div>
  );
}
