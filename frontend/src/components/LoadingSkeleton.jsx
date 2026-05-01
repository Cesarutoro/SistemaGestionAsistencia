const SkeletonBar = ({ width = "60%", height = 14 }) => (
  <div
    className="skeleton-pulse"
    style={{ height, width, background: "var(--border)", borderRadius: 4, marginBottom: 8 }}
  />
);

const CardSkeleton = () => (
  <div className="card skeleton-pulse" style={{ padding: "1.5rem" }}>
    <SkeletonBar width="50%" height={12} />
    <SkeletonBar width="30%" height={24} />
  </div>
);

const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="card skeleton-pulse" style={{ padding: 0 }}>
    <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
      <SkeletonBar width="30%" height={16} />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          padding: "1rem",
          borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "1rem",
        }}
      >
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} style={{ height: 14, background: "var(--border)", borderRadius: 4 }} />
        ))}
      </div>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="card skeleton-pulse" style={{ padding: 0 }}>
    <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
      <SkeletonBar width="40%" height={16} />
    </div>
    <div
      style={{
        padding: "1.5rem",
        display: "flex",
        alignItems: "flex-end",
        gap: "0.5rem",
        height: 200,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${30 + Math.random() * 70}%`,
            background: "var(--border)",
            borderRadius: "4px 4px 0 0",
          }}
        />
      ))}
    </div>
  </div>
);

const FilterSkeleton = () => (
  <div
    className="card skeleton-pulse"
    style={{ marginBottom: "1.5rem", padding: "1rem" }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 200px",
        gap: "1rem",
      }}
    >
      <div style={{ height: 40, background: "var(--border)", borderRadius: 8 }} />
      <div style={{ height: 40, background: "var(--border)", borderRadius: 8 }} />
    </div>
  </div>
);

export { CardSkeleton, TableSkeleton, ChartSkeleton, FilterSkeleton, SkeletonBar };
