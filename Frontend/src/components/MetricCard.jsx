export default function MetricCard({ label, value, color = "#1D9E75" }) {
  return (
    <div style={{
      background: "var(--bg-secondary)", borderRadius: "8px",
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px",
    }}>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: "26px", fontWeight: 600, color: value ? color : "var(--text-muted)" }}>
        {value ? `${(value * 100).toFixed(1)}%` : "—"}
      </span>
    </div>
  );
}
