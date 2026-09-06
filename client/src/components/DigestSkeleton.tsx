export function DigestSkeleton() {
  return (
    <div className="skeleton-wrap" aria-hidden="true">
      <div className="skeleton-block skeleton-title" />
      <div className="skeleton-block skeleton-subtitle" />
      <div className="skeleton-stat-row">
        <div className="skeleton-block skeleton-stat" />
        <div className="skeleton-block skeleton-stat" />
        <div className="skeleton-block skeleton-stat" />
      </div>
      {[0, 1, 2].map((i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-block skeleton-card-title" />
          <div className="skeleton-block skeleton-card-price" />
          <div className="skeleton-block skeleton-card-line" />
          <div className="skeleton-block skeleton-card-line-short" />
        </div>
      ))}
    </div>
  );
}
