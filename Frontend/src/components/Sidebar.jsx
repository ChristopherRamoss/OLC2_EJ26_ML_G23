const NAV = [
  { id: "carga",       label: "Carga de datos",     icon: "⬆" },
  { id: "metricas",    label: "Métricas",            icon: "▦" },
  { id: "hiper",       label: "Hiperparámetros",     icon: "⚙" },
  { id: "prediccion",  label: "Predicción",          icon: "◎" },
];

export default function Sidebar({ current, onChange, trained }) {
  return (
    <aside style={{
      width: "210px", flexShrink: 0,
      background: "var(--bg-card)", borderRight: "1px solid var(--border-color)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 18px 18px",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.03em" }}>
          CreditGuard
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.12em", marginTop: "3px", textTransform: "uppercase" }}>
          OLC2 · Predicción crediticia
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {NAV.map(({ id, label, icon }) => {
          const active = current === id;
          const locked = (id === "hiper" || id === "prediccion") && !trained;
          return (
            <button
              key={id}
              onClick={() => !locked && onChange(id)}
              title={locked ? "Entrena el modelo primero" : label}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "10px 18px",
                background: active ? "rgba(29,158,117,0.1)" : "transparent",
                border: "none", borderLeft: `3px solid ${active ? "#1D9E75" : "transparent"}`,
                color: locked ? "var(--text-muted)" : active ? "#1D9E75" : "var(--text-secondary)",
                fontSize: "13px", fontWeight: active ? 600 : 400,
                cursor: locked ? "not-allowed" : "pointer",
                textAlign: "left", transition: "all 0.15s",
                opacity: locked ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span>{label}</span>
              {locked && <span style={{ marginLeft: "auto", fontSize: "10px" }}>🔒</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "14px 18px", borderTop: "1px solid var(--border-color)",
        fontSize: "11px", color: "var(--text-muted)",
      }}>
        USAC · Ing. Sistemas<br />Vacaciones Junio 2026
      </div>
    </aside>
  );
}
