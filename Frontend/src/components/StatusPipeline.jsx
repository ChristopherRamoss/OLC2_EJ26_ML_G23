const steps = [
  { key: "loaded",  label: "Datos cargados"    },
  { key: "cleaned", label: "Limpieza aplicada" },
  { key: "trained", label: "Modelo entrenado"  },
];

export default function StatusPipeline({ status }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {steps.map(({ key, label }) => {
        const done = status[key];
        return (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 12px", borderRadius: "8px",
            background: "var(--bg-secondary)", fontSize: "13px",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: done ? "#1D9E75" : "var(--border-color)",
              boxShadow: done ? "0 0 6px #1D9E7588" : "none",
              transition: "all 0.3s",
            }} />
            <span style={{ flex: 1, color: "var(--text-primary)" }}>{label}</span>
            <span style={{
              fontSize: "10px", fontWeight: 600, padding: "2px 10px",
              borderRadius: "99px", letterSpacing: "0.05em",
              background: done ? "#e1f5ee" : "var(--bg-card)",
              color: done ? "#0F6E56" : "var(--text-muted)",
              border: done ? "1px solid #1D9E7544" : "1px solid var(--border-color)",
            }}>
              {done ? "Listo" : "Pendiente"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
