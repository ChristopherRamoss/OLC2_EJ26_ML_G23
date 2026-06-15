import { useState } from "react";
import { retrain, getMetrics } from "../api/client";
import AlertMessage from "../components/AlertMessage";

const PARAMS = [
  { key: "n_estimators",   label: "Árboles de decisión",  min: 10, max: 500, step: 10, default: 100,
    hint: "Más árboles = mayor precisión pero más lento. Empieza con 100." },
  { key: "max_depth",      label: "Profundidad máxima",    min: 1,  max: 30,  step: 1,  default: 5,
    hint: "Controla qué tan complejo puede ser cada árbol. Valores altos = overfitting." },
  { key: "max_leaf_nodes", label: "Máx. hojas por árbol", min: 2,  max: 100, step: 2,  default: 20,
    hint: "Limita el tamaño de cada árbol. Ayuda a generalizar mejor." },
];

const METRICAS = [
  { key: "accuracy",  label: "Exactitud"  },
  { key: "precision", label: "Precisión"  },
  { key: "recall",    label: "Recall"     },
  { key: "f1",        label: "F1 Score"   },
];

// Componente principal -----------------------------------------------------------
export default function Hiperparametros({
  trained,
  vals, setVals,
  prevMetrics, setPrevMetrics,
  newMetrics, setNewMetrics,
  onRetrainSuccess,
}) {
  const [alert,   setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRetrain = async () => {
    setLoading(true);
    try {
      // 1. Guardamos las métricas actuales como "Antes"
      let before = prevMetrics;
      try {
        before = await getMetrics();
        setPrevMetrics(before);
      } catch {
        // Si aún no hay métricas previas, "Antes" queda vacío
      }

      // 2. Reentrenamos
      const after = await retrain(vals);

      // 3. Guardamos las nuevas métricas como "Después"
      setNewMetrics(after);

      // 4. Notificar a App.jsx: actualiza métricas globales + historial
      onRetrainSuccess(after);

      setAlert({ type: "success", msg: "Reentrenamiento completado. Revisa la comparativa abajo." });
    } catch (err) {
      setAlert({ type: "error", msg: `Error al reentrenar: ${err.message}` });
    }
    setLoading(false);
  };

  const card = { background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", marginBottom: "16px" };
  const label = { fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" };

  return (
    <div>
      <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
        Ajuste de hiperparámetros
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
        Modifica los parámetros del modelo y reentrena para comparar rendimiento.
      </p>

      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}
      {!trained && <AlertMessage type="info" msg="Entrena el modelo primero desde la sección de Carga de datos." />}

      {/* ── Sliders ── */}
      <div style={card}>
        <div style={label}>Configuración del modelo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px" }}>
          {PARAMS.map(({ key, label: lbl, min, max, step, hint }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{lbl}</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#1D9E75" }}>{vals[key]}</span>
              </div>
              <input
                type="range" min={min} max={max} step={step} value={vals[key]}
                disabled={!trained}
                onChange={e => setVals(v => ({ ...v, [key]: parseInt(e.target.value) }))}
                style={{ accentColor: "#1D9E75", width: "100%", cursor: trained ? "pointer" : "not-allowed" }}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>{hint}</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRetrain}
          disabled={!trained || loading}
          style={{ opacity: trained ? 1 : 0.5, cursor: trained ? "pointer" : "not-allowed", width: "100%", justifyContent: "center", padding: "10px" }}
        >
          {loading ? "Reentrenando..." : "↺ Reentrenar con nuevos parámetros"}
        </button>
      </div>

      {/* ── Tabla comparativa Antes vs Después ── */}
      {newMetrics && (
        <div style={card}>
          <div style={label}>Comparativa de rendimiento</div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Métrica", "Antes", "Después", "Cambio"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: h === "Métrica" ? "left" : "center",
                    borderBottom: "1px solid var(--border-color)",
                    fontSize: "11px", fontWeight: 600, color: "var(--text-muted)",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICAS.map(({ key, label: lbl }, i) => {
                const antes   = prevMetrics?.[key] ?? null;
                const despues = newMetrics?.[key]  ?? null;
                const diff    = antes !== null && despues !== null ? despues - antes : null;
                const improved = diff !== null && diff >= 0;

                return (
                  <tr key={key} style={{ background: i % 2 === 0 ? "var(--bg-secondary)" : "transparent" }}>
                    {/* Métrica */}
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {lbl}
                    </td>
                    {/* Antes */}
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "var(--text-secondary)" }}>
                      {antes !== null ? `${(antes * 100).toFixed(1)}%` : "—"}
                    </td>
                    {/* Después */}
                    <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#1D9E75" }}>
                      {despues !== null ? `${(despues * 100).toFixed(1)}%` : "—"}
                    </td>
                    {/* Cambio */}
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      {diff !== null ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "12px", fontWeight: 700,
                          color: improved ? "#1D9E75" : "#e74c3c",
                          background: improved ? "rgba(29,158,117,0.1)" : "rgba(231,76,60,0.1)",
                          padding: "3px 10px", borderRadius: "99px",
                        }}>
                          {improved ? "▲" : "▼"} {Math.abs(diff * 100).toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mensaje de mejora global */}
          <div style={{ marginTop: "14px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            {(() => {
              if (!prevMetrics || !newMetrics) return null;
              const mejoro = newMetrics.f1 >= prevMetrics.f1;
              return (
                <span style={{ color: mejoro ? "#1D9E75" : "#BA7517" }}>
                  {mejoro
                    ? "✓ El nuevo modelo supera al anterior en F1 Score. Modelo guardado."
                    : "⚠ El modelo anterior tenía mejor F1 Score. Considera ajustar los parámetros."}
                </span>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}