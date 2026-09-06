import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import type { CompareResponse, DigestResponse, User, Watchlist, WatchlistItem } from "../types";
import { DigestView } from "./DigestView";
import { CompareView } from "./CompareView";
import { ManageView } from "./ManageView";
import { AddStockDialog } from "./AddStockDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { UndoToast } from "./UndoToast";
import { Sidebar, type ViewKey } from "./Sidebar";
import { Topbar } from "./Topbar";
import { WatchlistSwitcher } from "./WatchlistSwitcher";
import { StatTiles } from "./StatTiles";
import { DigestSkeleton } from "./DigestSkeleton";
import { StockPage } from "./StockPage";
import { ChatWidget } from "./ChatWidget";
import { RemovedView } from "./RemovedView";

const VIEW_META: Record<ViewKey, { title: string; subtitle: string }> = {
  digest: {
    title: "Digest",
    subtitle: "What changed since you last checked — not just today's number.",
  },
  compare: {
    title: "Compare",
    subtitle: "Facts ranked by how much attention each stock deserves right now.",
  },
  manage: {
    title: "Watchlist",
    subtitle: "Add, remove, and tag why you're tracking each stock.",
  },
  removed: {
    title: "Removed",
    subtitle: "Stocks you stopped tracking, and what happened to them since.",
  },
};

interface PendingRemoval {
  symbol: string;
  name: string;
}

const COLLAPSE_KEY = "smart-watchlist-sidebar-collapsed";

export function Dashboard({ user, onSwitchUser }: { user: User; onSwitchUser: () => void }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [view, setView] = useState<ViewKey>("digest");
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PendingRemoval | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  useEffect(() => {
    api
      .getWatchlists()
      .then((lists) => {
        setWatchlists(lists);
        if (lists.length > 0) setActiveId(lists[0].id);
      })
      .catch((err) => setError((err as Error).message));
  }, [user.id]);

  const refresh = useCallback(() => {
    if (activeId == null) return;
    api.getDigest(activeId).then(setDigest).catch((err) => setError((err as Error).message));
    api.getCompare(activeId).then(setCompare).catch((err) => setError((err as Error).message));
    api.getItems(activeId).then(setItems).catch((err) => setError((err as Error).message));
  }, [activeId]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function handleCreateList() {
    const name = newListName.trim();
    if (!name) return;
    const created = await api.createWatchlist(name);
    setWatchlists((prev) => [...prev, created]);
    setActiveId(created.id);
    setNewListName("");
    setShowNewList(false);
  }

  async function handleDeleteList(id: number) {
    if (!confirm("Delete this watchlist?")) return;
    await api.deleteWatchlist(id);
    const remaining = watchlists.filter((w) => w.id !== id);
    setWatchlists(remaining);
    setActiveId(remaining[0]?.id ?? null);
  }

  async function handleAdd(symbol: string, intent: string) {
    if (activeId == null) return;
    await api.addItem(activeId, symbol, intent);
    refresh();
  }

  async function handleMarkSeen(symbol: string) {
    if (activeId == null) return;
    await api.checkpoint(activeId, symbol);
    refresh();
  }

  async function handleMarkAllSeen() {
    if (activeId == null) return;
    await api.checkpoint(activeId);
    refresh();
  }

  // Removing a stock is a two-step, reversible action: confirm first, then a
  // 10s undo window before anything actually hits the server. The item is
  // hidden from view immediately (filtered at render, below) but the DELETE
  // call itself is deferred until the undo window expires.
  function requestRemove(symbol: string) {
    const name = items.find((i) => i.symbol === symbol)?.display_name ?? symbol;
    setConfirmRemove({ symbol, name });
  }

  function confirmRemoveNow() {
    if (!confirmRemove) return;
    setPendingRemoval(confirmRemove);
    setConfirmRemove(null);
  }

  function handleUndoRemove() {
    setPendingRemoval(null);
  }

  async function handleExpireRemoval() {
    if (activeId == null || !pendingRemoval) return;
    const { symbol } = pendingRemoval;
    setPendingRemoval(null);
    await api.removeItemBySymbol(activeId, symbol);
    refresh();
  }

  async function handleIntentChange(itemId: number, intent: string) {
    if (activeId == null) return;
    await api.updateItemIntent(activeId, itemId, intent);
    refresh();
  }

  function handleHome() {
    setSelectedSymbol(null);
    setView("digest");
  }

  const meta = VIEW_META[view];
  const hiddenSymbol = pendingRemoval?.symbol;

  const visibleDigest =
    digest && hiddenSymbol
      ? { ...digest, items: digest.items.filter((i) => i.symbol !== hiddenSymbol) }
      : digest;
  const visibleCompare =
    compare && hiddenSymbol
      ? { ...compare, items: compare.items.filter((i) => i.symbol !== hiddenSymbol) }
      : compare;
  const visibleItems = hiddenSymbol ? items.filter((i) => i.symbol !== hiddenSymbol) : items;

  return (
    <div className="app-frame">
      <Topbar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        onHome={handleHome}
        user={user}
        onSwitchUser={onSwitchUser}
        onSelectSymbol={setSelectedSymbol}
        onQuickAdd={(symbol) => handleAdd(symbol, "watching")}
        canAdd={activeId != null}
      />

      <div className="shell">
        <Sidebar collapsed={collapsed} view={view} onSelectView={setView} />

        <main className="main">
        {selectedSymbol ? (
          <StockPage symbol={selectedSymbol} onBack={() => setSelectedSymbol(null)} />
        ) : (
          <>
            <header className="main-header">
              {view !== "digest" && (
                <div>
                  <h1>{meta.title}</h1>
                  <p className="tagline">{meta.subtitle}</p>
                </div>
              )}
              {view === "digest" && <div />}
              {view !== "removed" && (
                <div className="main-header-actions">
                  <WatchlistSwitcher
                    watchlists={watchlists}
                    activeId={activeId}
                    onSelect={setActiveId}
                    onNewList={() => setShowNewList(true)}
                    onDeleteList={handleDeleteList}
                  />
                  {activeId != null && (
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>
                      + Add stock
                    </button>
                  )}
                </div>
              )}
            </header>

            {error && <div className="error-banner">{error}</div>}

            {showNewList && (
              <div className="inline-new-list">
                <input
                  autoFocus
                  value={newListName}
                  placeholder="New watchlist name"
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                />
                <button className="btn-primary btn-small" onClick={handleCreateList}>
                  Create
                </button>
                <button className="btn-secondary btn-small" onClick={() => setShowNewList(false)}>
                  Cancel
                </button>
              </div>
            )}

            {activeId != null && !visibleDigest && view === "digest" && <DigestSkeleton />}

            {activeId != null && visibleDigest && view === "digest" && (
              <>
                <StatTiles narrative={visibleDigest.narrative} />
                <DigestView
                  digest={visibleDigest}
                  onMarkSeen={handleMarkSeen}
                  onMarkAllSeen={handleMarkAllSeen}
                  onRemove={requestRemove}
                  onOpen={setSelectedSymbol}
                />
              </>
            )}

            {activeId != null && visibleCompare && view === "compare" && (
              <CompareView compare={visibleCompare} onOpen={setSelectedSymbol} />
            )}

            {activeId != null && view === "manage" && (
              <ManageView
                items={visibleItems}
                onIntentChange={handleIntentChange}
                onRemove={requestRemove}
                onOpen={setSelectedSymbol}
              />
            )}

            {view === "removed" && <RemovedView />}

            {activeId == null && !showNewList && view !== "removed" && (
              <p className="empty-state">Create a watchlist to get started.</p>
            )}
          </>
        )}
        </main>
      </div>

      {showAdd && <AddStockDialog onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {confirmRemove && (
        <ConfirmDialog
          title="Remove this stock?"
          message={`"${confirmRemove.name}" will be removed from this watchlist. You can undo this for a few seconds after.`}
          confirmLabel="Remove"
          danger
          onConfirm={confirmRemoveNow}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      {pendingRemoval && (
        <UndoToast
          message={`Removed "${pendingRemoval.name}" from watchlist`}
          onUndo={handleUndoRemove}
          onExpire={handleExpireRemoval}
        />
      )}

      <ChatWidget
        hasAlert={Boolean(
          visibleDigest &&
            visibleDigest.narrative.significantCount + visibleDigest.narrative.notableCount > 0
        )}
      />
    </div>
  );
}
