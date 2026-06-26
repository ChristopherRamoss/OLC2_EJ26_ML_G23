const NAV = [
  { id: "carga",         label: "Carga y Preprocesamiento",    num: "1", needsCleaned: false, needsTrained: false },
  { id: "entrenamiento", label: "Configuración y Entrenamiento", num: "2", needsCleaned: true,  needsTrained: false },
  { id: "interpretacion",label: "Interpretación de Segmentos",  num: "3", needsCleaned: true,  needsTrained: true  },
  { id: "evaluacion",    label: "Evaluación y Validación",      num: "4", needsCleaned: true,  needsTrained: true  },
  { id: "clasificacion", label: "Clasificación de Nuevo Registro", num: "5", needsCleaned: true, needsTrained: true },
  { id: "exportacion",   label: "Exportación de Reportes",      num: "6", needsCleaned: true,  needsTrained: true  },
];

export default function Sidebar({ current, onChange, cleaned, anyTrained }) {
  return (
    <aside style={{
      width: "230px", flexShrink: 0,
      background: "var(--bg-card)",
      borderRight: "1px solid var(--border-color)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 18px 18px",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{
          fontSize: "18px", fontWeight: 800,
          color: "var(--text-primary)", letterSpacing: "-0.01em",
        }}>
          Talent<span style={{ color: "var(--accent)" }}>Mosaic</span>
        </div>
        <div style={{
          fontSize: "10px", color: "var(--text-muted)",
          letterSpacing: "0.12em", marginTop: "3px", textTransform: "uppercase",
        }}>
          OLC2 · Clustering
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
        {NAV.map(({ id, label, num, needsCleaned, needsTrained }) => {
          const active = current === id;
          const locked = (needsCleaned && !cleaned) || (needsTrained && !anyTrained);

          return (
            <button
              key={id}
              onClick={() => !locked && onChange(id)}
              title={locked ? (needsCleaned && !cleaned ? "Limpia los datos primero" : "Entrena el modelo primero") : label}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "10px 18px",
                background: active ? "var(--accent-dim)" : "transparent",
                border: "none",
                borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
                color: locked ? "var(--text-muted)" : active ? "var(--accent)" : "var(--text-secondary)",
                fontSize: "12px", fontWeight: active ? 700 : 400,
                cursor: locked ? "not-allowed" : "pointer",
                textAlign: "left", transition: "all 0.15s",
                opacity: locked ? 0.5 : 1,
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: "4px",
                background: active ? "var(--accent)" : "var(--bg-secondary)",
                color: active ? "#000" : "var(--text-muted)",
                fontSize: "10px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{num}</span>
              <span style={{ flex: 1, lineHeight: 1.3 }}>{label}</span>
              {locked && <span style={{ fontSize: "10px" }}>🔒</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "14px 18px",
        borderTop: "1px solid var(--border-color)",
        fontSize: "10px", color: "var(--text-muted)",
      }}>
        USAC · Ing. Sistemas<br />Vacaciones Junio 2026
      </div>
    </aside>
  );
}
