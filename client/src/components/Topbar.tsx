import { useState } from "react";
import type { User } from "../types";
import { RobotIcon } from "./RobotIcon";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar({
  collapsed,
  onToggleCollapse,
  onHome,
  user,
  onSwitchUser,
  onSelectSymbol,
  onQuickAdd,
  canAdd,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onHome: () => void;
  user: User;
  onSwitchUser: () => void;
  onSelectSymbol: (symbol: string) => void;
  onQuickAdd: (symbol: string) => void;
  canAdd: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          ☰
        </button>
        <button className="topbar-brand" onClick={onHome}>
          <RobotIcon state="awake" size={22} badge />
          <span className="brand-name">Penny</span>
        </button>
      </div>

      <GlobalSearch onSelectSymbol={onSelectSymbol} onQuickAdd={onQuickAdd} canAdd={canAdd} />

      <div className="topbar-right">
        <button className="topbar-user" onClick={() => setMenuOpen((o) => !o)}>
          <div className="sidebar-user-avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <span className="topbar-user-name">{user.name}</span>
          <span className="topbar-caret">▾</span>
        </button>
        {menuOpen && (
          <div className="topbar-menu" onMouseLeave={() => setMenuOpen(false)}>
            <button
              onClick={() => {
                setMenuOpen(false);
                onSwitchUser();
              }}
            >
              Switch user
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
