import type { User, Watchlist } from "../types";

export type ViewKey = "digest" | "compare" | "manage" | "removed";

const NAV_ITEMS: { key: ViewKey; label: string; icon: string }[] = [
  { key: "digest", label: "Digest", icon: "📥" },
  { key: "compare", label: "Compare", icon: "📊" },
  { key: "manage", label: "Manage", icon: "⚙️" },
  { key: "removed", label: "Removed", icon: "🗂️" },
];

export function Sidebar({
  watchlists,
  activeId,
  onSelectWatchlist,
  view,
  onSelectView,
  onNewList,
  onDeleteList,
  user,
  onSwitchUser,
}: {
  watchlists: Watchlist[];
  activeId: number | null;
  onSelectWatchlist: (id: number) => void;
  view: ViewKey;
  onSelectView: (v: ViewKey) => void;
  onNewList: () => void;
  onDeleteList: (id: number) => void;
  user: User;
  onSwitchUser: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">◆</span>
        <span className="brand-name">Penny</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${view === item.key ? "active" : ""}`}
            onClick={() => onSelectView(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-section-header">
        <span>Watchlists</span>
        <button className="sidebar-add-btn" onClick={onNewList} title="New watchlist">
          +
        </button>
      </div>

      <div className="sidebar-lists">
        {watchlists.map((w) => (
          <div
            key={w.id}
            className={`sidebar-list-item ${w.id === activeId ? "active" : ""}`}
          >
            <button onClick={() => onSelectWatchlist(w.id)}>{w.name}</button>
            <button
              className="sidebar-list-remove"
              onClick={() => onDeleteList(w.id)}
              title="Delete watchlist"
            >
              ×
            </button>
          </div>
        ))}
        {watchlists.length === 0 && <p className="sidebar-empty">No watchlists yet</p>}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user.name}</span>
          <button className="sidebar-switch-btn" onClick={onSwitchUser}>
            Switch user
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <p>Live prices are simulated on top of real NSE historical closes.</p>
      </div>
    </aside>
  );
}
