export default function AlertMessage({ type, msg, onClose }) {
  const styles = {
    success: { bg: "#e6f4ee", border: "#1D9E75", color: "#0F6E56", icon: "✓" },
    error:   { bg: "#fdecea", border: "#c0392b", color: "#922b21", icon: "✕" },
    info:    { bg: "#eaf3fb", border: "#2980b9", color: "#1a5276", icon: "ℹ" },
  };
  const s = styles[type] || styles.info;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: "10px", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px",
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: "13px", lineHeight: "1.5",
    }}>
      <span style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <span style={{ fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
        <span>{msg}</span>
      </span>
      {onClose && (
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          color: s.color, fontSize: "16px", lineHeight: 1, padding: 0, flexShrink: 0,
        }}>×</button>
      )}
    </div>
  );
}
