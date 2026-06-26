import { useState } from "react";
import { exportar } from "../api/client";
import AlertMessage from "../components/AlertMessage";

const ELEMENTOS = [
  {
    id: "freelancers_segmentado",
    label: "Dataset de freelancers segmentado",
    desc: "CSV con columna de segmento asignado por registro.",
    formato: "CSV",
    needsFL: true,
    needsRV: false,
    icon: "◎",
  },
  {
    id: "resenas_segmentado",
    label: "Dataset de reseñas segmentado",
    desc: "CSV con columna de segmento asignado por reseña.",
    formato: "CSV",
    needsFL: false,
    needsRV: true,
    icon: "✦",
  },
  {
    id: "resumen_estadistico",
    label: "Resumen estadístico por segmento",
    desc: "CSV con promedios y modas de cada característica por segmento.",
    formato: "CSV",
    needsFL: true,
    needsRV: false,
    icon: "▦",
  },
  {
    id: "metricas_evaluacion",
    label: "Métricas de evaluación del modelo",
    desc: "CSV con Silhouette, Davies-Bouldin y Calinski-Harabasz.",
    formato: "CSV",
    needsFL: false,
    needsRV: false,
    icon: "≡",
  },
  {
    id: "reporte_visual",
    label: "Reporte gráfico",
    desc: "PDF con gráficas de dispersión, nube de palabras y descripción de segmentos.",
    formato: "PDF",
    needsFL: false,
    needsRV: false,
    icon: "⬡",
  },
];

const FORMATO_COLORS = {
  CSV: { bg: "rgba(88,166,255,0.1)", color: "var(--blue)",   border: "rgba(88,166,255,0.3)" },
  PDF: { bg: "rgba(248,81,73,0.1)",  color: "var(--red)",    border: "rgba(248,81,73,0.3)"  },
};

export default function Exportacion({
  anyTrained, trainedFreelancers, trainedResenas,
  modeloFreelancers, modeloResenas,
}) {
  const [seleccion,   setSeleccion]   = useState({});
  const [loading,     setLoading]     = useState(false);
  const [alert,       setAlert]       = useState(null);
  const [generados,   setGenerados]   = useState([]);

  const toggle = (id) => setSeleccion(s => ({ ...s, [id]: !s[id] }));

  const algunoSeleccionado = Object.values(seleccion).some(Boolean);

  const isDisponible = (el) => {
    if (el.needsFL && !trainedFreelancers) return false;
    if (el.needsRV && !trainedResenas)     return false;
    if (!anyTrained) return false;
    return true;
  };

  const handleExportar = async () => {
    if (!algunoSeleccionado) {
      setAlert({ type: "error", msg: "Selecciona al menos un elemento para exportar." });
      return;
    }
    setLoading(true);
    setGenerados([]);
    try {
      const elementos = Object.entries(seleccion)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      const res = await exportar({ elementos });
      setGenerados(res.archivos);
      setAlert({ type: "success", msg: `Exportación completada — ${res.archivos.length} archivo(s) generado(s).` });
    } catch (err) {
      setAlert({ type: "error", msg: `Error al exportar: ${err.message}` });
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="page-title">Exportación de Reportes</h1>
      <p className="page-subtitle">Selecciona los elementos que deseas incluir en la exportación.</p>

      {!anyTrained && (
        <AlertMessage type="warning" msg="Entrena al menos un modelo antes de exportar." />
      )}
      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}

      {/* ── Elementos a exportar ── */}
      <div className="card">
        <div className="card-title">Elementos a Exportar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {ELEMENTOS.map((el) => {
            const disponible = isDisponible(el);
            const checked    = !!seleccion[el.id];
            const fmtStyle   = FORMATO_COLORS[el.formato];

            return (
              <label
                key={el.id}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 14px", borderRadius: "8px",
                  border: `1px solid ${checked ? "var(--accent)" : "var(--border-color)"}`,
                  background: checked ? "var(--accent-dim)" : "var(--bg-secondary)",
                  cursor: disponible ? "pointer" : "not-allowed",
                  opacity: disponible ? 1 : 0.4,
                  transition: "all 0.15s",
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!disponible}
                  onChange={() => disponible && toggle(el.id)}
                  style={{ accentColor: "var(--accent)", width: "16px", height: "16px", flexShrink: 0, cursor: disponible ? "pointer" : "not-allowed" }}
                />

                {/* Icono */}
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{el.icon}</span>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: checked ? "var(--accent)" : disponible ? "var(--text-primary)" : "var(--text-muted)", marginBottom: "2px" }}>
                    {el.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {el.desc}
                    {!disponible && (
                      <span style={{ color: "var(--red)", marginLeft: "6px" }}>
                        (requiere {el.needsFL ? "modelo Freelancers" : el.needsRV ? "modelo Reseñas" : "modelo entrenado"})
                      </span>
                    )}
                  </div>
                </div>

                {/* Formato badge */}
                <span style={{
                  padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 700,
                  background: fmtStyle.bg, color: fmtStyle.color, border: `1px solid ${fmtStyle.border}`,
                  flexShrink: 0,
                }}>
                  {el.formato}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Formato y acción ── */}
      <div className="card">
        <div className="card-title">Formato</div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Los elementos 1–4 se descargan como <strong style={{ color: "var(--blue)" }}>archivos CSV independientes</strong>.
          El elemento 5 (reporte gráfico) se genera siempre como <strong style={{ color: "var(--red)" }}>PDF único</strong>.
        </div>

        <button
          className="btn btn-primary"
          onClick={handleExportar}
          disabled={!algunoSeleccionado || loading || !anyTrained}
          style={{
            width: "100%", justifyContent: "center", padding: "10px",
            opacity: !algunoSeleccionado || !anyTrained ? 0.4 : 1,
          }}
        >
          {loading ? "Exportando..." : "⬇ Exportar Selección"}
        </button>

        {!algunoSeleccionado && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "8px" }}>
            El botón se habilita cuando hay al menos un elemento seleccionado.
          </div>
        )}
      </div>

      {/* ── Confirmación ── */}
      {generados.length > 0 && (
        <div className="card">
          <div className="card-title">Confirmación</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
            Archivos generados:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {generados.map((archivo, i) => {
              const esPDF = archivo.endsWith(".pdf");
              const fmtStyle = esPDF ? FORMATO_COLORS.PDF : FORMATO_COLORS.CSV;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "8px 12px", borderRadius: "6px",
                  background: "var(--bg-secondary)",
                  border: `1px solid ${fmtStyle.border}`,
                }}>
                  <span style={{ color: "var(--green)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "12px", color: "var(--text-primary)", flex: 1, fontFamily: "monospace" }}>
                    {archivo}
                  </span>
                  <span style={{
                    padding: "1px 7px", borderRadius: "99px", fontSize: "10px", fontWeight: 700,
                    background: fmtStyle.bg, color: fmtStyle.color, border: `1px solid ${fmtStyle.border}`,
                  }}>
                    {esPDF ? "PDF" : "CSV"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
