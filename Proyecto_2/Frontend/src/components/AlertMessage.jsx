export default function AlertMessage({ type = "info", msg, onClose }) {
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  return (
    <div className={`alert alert-${type}`} style={{ justifyContent: "space-between" }}>
      <span style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <span style={{ fontWeight: 700, flexShrink: 0 }}>{icons[type]}</span>
        <span>{msg}</span>
      </span>
      {onClose && (
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "inherit", fontSize: "16px", lineHeight: 1, padding: 0, flexShrink: 0,
        }}>×</button>
      )}
    </div>
  );
}
