export type ViewKey = "digest" | "compare" | "manage" | "removed";

const NAV_ITEMS: { key: ViewKey; label: string; icon: string }[] = [
  { key: "digest", label: "Digest", icon: "📥" },
  { key: "compare", label: "Compare", icon: "📊" },
  { key: "manage", label: "Watchlist", icon: "⭐" },
  { key: "removed", label: "Removed", icon: "🗂️" },
];

export function Sidebar({
  collapsed,
  view,
  onSelectView,
}: {
  collapsed: boolean;
  view: ViewKey;
  onSelectView: (v: ViewKey) => void;
}) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${view === item.key ? "active" : ""}`}
            onClick={() => onSelectView(item.key)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <p>Live prices are simulated on top of real NSE historical closes.</p>
        </div>
      )}
    </aside>
  );
}
