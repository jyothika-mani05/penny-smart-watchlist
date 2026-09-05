import type { CompareResponse } from "../types";

export function CompareView({
  compare,
  onOpen,
}: {
  compare: CompareResponse;
  onOpen: (symbol: string) => void;
}) {
  const maxScore = Math.max(1, ...compare.items.map((i) => i.attentionScore));

  return (
    <div>
      <p className="compare-note">
        Ranked by how much each stock has deviated from its own normal behaviour since
        you last checked — a comparison of facts, not a recommendation.
      </p>

      {compare.items.length === 0 ? (
        <p className="empty-state">Nothing to compare yet — add a stock to get started.</p>
      ) : (
        <table className="compare-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th>Price</th>
              <th>Since checked</th>
              <th>Stock-specific move</th>
              <th>Volume vs normal</th>
              <th>Attention</th>
            </tr>
          </thead>
          <tbody>
            {compare.items.map((item) => (
              <tr key={item.symbol} className="clickable-row" onClick={() => onOpen(item.symbol)}>
                <td>
                  <div className="compare-name">{item.name}</div>
                  <div className="compare-symbol">{item.symbol.replace(".NS", "")}</div>
                </td>
                <td>₹{item.price.toFixed(2)}</td>
                <td className={item.sinceCheckedChangePct >= 0 ? "delta-up" : "delta-down"}>
                  {item.sinceCheckedChangePct >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(item.sinceCheckedChangePct).toFixed(2)}%
                </td>
                <td className={item.idiosyncraticPct >= 0 ? "delta-up" : "delta-down"}>
                  {item.idiosyncraticPct >= 0 ? "+" : ""}
                  {item.idiosyncraticPct.toFixed(2)}%
                </td>
                <td>{item.volumeRatio.toFixed(1)}x</td>
                <td>
                  <div className="attention-bar-track">
                    <div
                      className="attention-bar-fill"
                      style={{ width: `${(item.attentionScore / maxScore) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
