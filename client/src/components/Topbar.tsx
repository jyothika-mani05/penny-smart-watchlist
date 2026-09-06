import { useState } from "react";
import { CaretDown, List } from "@phosphor-icons/react";
import type { User } from "../types";
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <List size={20} weight="regular" aria-hidden="true" />
        </button>
        <button className="topbar-brand" onClick={onHome} aria-label="Penny — go to Digest">
          <img src="/logo.png" alt="" className="brand-logo" />
          <span className="brand-name">Penny</span>
        </button>
      </div>

      <GlobalSearch onSelectSymbol={onSelectSymbol} onQuickAdd={onQuickAdd} canAdd={canAdd} />

      <div className="topbar-right">
        <button
          className="topbar-user"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="sidebar-user-avatar" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <span className="topbar-user-name">{user.name}</span>
          <span className="topbar-caret" aria-hidden="true">
            <CaretDown size={14} weight="bold" />
          </span>
        </button>
        {menuOpen && (
          <div className="topbar-menu" role="menu" onMouseLeave={() => setMenuOpen(false)}>
            <button
              role="menuitem"
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
