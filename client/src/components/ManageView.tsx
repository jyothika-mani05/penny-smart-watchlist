import { INTENT_LABELS, type WatchlistItem } from "../types";

export function ManageView({
  items,
  onIntentChange,
  onRemove,
  onOpen,
}: {
  items: WatchlistItem[];
  onIntentChange: (itemId: number, intent: string) => void;
  onRemove: (symbol: string) => void;
  onOpen: (symbol: string) => void;
}) {
  return (
    <div>
      <p className="compare-note">
        Manage what's in this watchlist and why you're tracking each stock — the digest
        uses this to tailor its wording.
      </p>

      {items.length === 0 ? (
        <p className="empty-state">Nothing in this watchlist yet — add a stock to get started.</p>
      ) : (
        <table className="compare-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th>Tracking reason</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="clickable-row" onClick={() => onOpen(item.symbol)}>
                  <div className="compare-name">{item.display_name ?? item.symbol}</div>
                  <div className="compare-symbol">{item.symbol.replace(".NS", "")}</div>
                </td>
                <td>
                  <select
                    className="intent-select"
                    value={item.intent}
                    onChange={(e) => onIntentChange(item.id, e.target.value)}
                  >
                    {Object.entries(INTENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(item.added_at).toLocaleDateString()}</td>
                <td>
                  <button className="link-btn danger" onClick={() => onRemove(item.symbol)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
