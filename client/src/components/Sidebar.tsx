import type { Icon } from "@phosphor-icons/react";
import { Archive, ChartBar, Gear, Star, Tray } from "@phosphor-icons/react";

export type ViewKey = "digest" | "compare" | "manage" | "removed" | "settings";

const NAV_ITEMS: { key: ViewKey; label: string; icon: Icon }[] = [
  { key: "digest", label: "Digest", icon: Tray },
  { key: "compare", label: "Compare", icon: ChartBar },
  { key: "manage", label: "Watchlist", icon: Star },
  { key: "removed", label: "Removed", icon: Archive },
];

const FOOTER_ITEMS: { key: ViewKey; label: string; icon: Icon }[] = [
  { key: "settings", label: "Settings", icon: Gear },
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
      <nav className="sidebar-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${view === item.key ? "active" : ""}`}
            onClick={() => onSelectView(item.key)}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            aria-current={view === item.key ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              <item.icon size={18} weight="regular" />
            </span>
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      <nav className="sidebar-nav sidebar-nav-footer" aria-label="Secondary">
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${view === item.key ? "active" : ""}`}
            onClick={() => onSelectView(item.key)}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            aria-current={view === item.key ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              <item.icon size={18} weight="regular" />
            </span>
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
