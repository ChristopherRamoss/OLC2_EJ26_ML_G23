import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { SegBadge } from "../components/SegmentColors";
import AlertMessage from "../components/AlertMessage";

function MetricaCard({ label, value, hint, color = "var(--text-primary)" }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color, fontSize: "28px" }}>
        {value !== null && value !== undefined ? value : "—"}
      </div>
      {hint && <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>{hint}</div>}
    </div>
  );
}

function ElbowChart({ data, label = "Inercia (WCSS)" }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey="k" tick={{ fill: "var(--text-muted)", fontSize: 10 }}
          label={{ value: "k (clusters)", position: "insideBottom", fill: "var(--text-muted)", fontSize: 10, offset: -10 }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "11px" }}
          labelFormatter={v => `k = ${v}`}
          formatter={v => [v.toFixed(3), label]}
        />
        <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2}
          dot={{ fill: "var(--accent)", r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        {data && data.length > 0 && (() => {
          // marcar el k óptimo (mayor caída)
          let maxDrop = 0; let kOpt = data[0]?.k;
          for (let i = 1; i < data.length; i++) {
            const drop = data[i-1].value - data[i].value;
            if (drop > maxDrop) { maxDrop = drop; kOpt = data[i].k; }
          }
          return <ReferenceLine x={kOpt} stroke="var(--green)" strokeDasharray="4 4"
            label={{ value: `k=${kOpt}`, fill: "var(--green)", fontSize: 10, position: "top" }} />;
        })()}
      </LineChart>
    </ResponsiveContainer>
  );
}

function interpretacion(silhouette, davies, calinski) {
  const partes = [];
  if (silhouette !== null) {
    if (silhouette > 0.7)      partes.push("Los clusters están muy bien separados (Silhouette > 0.7).");
    else if (silhouette > 0.5) partes.push("Los clusters presentan una separación moderada (Silhouette 0.5–0.7).");
    else if (silhouette > 0.25) partes.push("Los clusters se traslapan parcialmente (Silhouette 0.25–0.5); considera ajustar k.");
    else                        partes.push("Los clusters se traslapan significativamente (Silhouette < 0.25); se recomienda reentrenar.");
  }
  if (davies !== null) {
    if (davies < 0.5)      partes.push("El índice Davies-Bouldin es bajo, indicando clusters compactos y bien separados.");
    else if (davies < 1.0) partes.push("El índice Davies-Bouldin es moderado; los clusters son aceptables.");
    else                   partes.push("El índice Davies-Bouldin es alto; los clusters podrían solaparse. Prueba otro k.");
  }
  if (calinski !== null) {
    if (calinski > 500) partes.push("El índice Calinski-Harabasz es alto, confirmando clusters bien definidos.");
    else if (calinski > 100) partes.push("El índice Calinski-Harabasz es moderado.");
    else partes.push("El índice Calinski-Harabasz es bajo; los clusters no están bien definidos.");
  }
  return partes.length ? partes.join(" ") : "Entrena el modelo para ver la interpretación.";
}

export default function Evaluacion({ modeloFreelancers, modeloResenas, view, setView }) {
  const modelo = view === "freelancers" ? modeloFreelancers : modeloResenas;

  const hasFL = !!modeloFreelancers;
  const hasRV = !!modeloResenas;

  if (!hasFL && !hasRV) {
    return (
      <div>
        <h1 className="page-title">Evaluación y Validación del Modelo</h1>
        <AlertMessage type="warning" msg="Entrena al menos un modelo primero." />
      </div>
    );
  }

  const metricas = modelo?.metricas ?? {};
  const { silhouette = null, davies_bouldin = null, calinski_harabasz = null } = metricas;

  return (
    <div>
      <h1 className="page-title">Evaluación y Validación del Modelo</h1>
      <p className="page-subtitle">Métricas internas del último modelo entrenado.</p>

      {/* Selector */}
      <div className="toggle-tabs">
        {hasFL && (
          <button className={`toggle-tab ${view === "freelancers" ? "active" : ""}`} onClick={() => setView("freelancers")}>
            ◎ Freelancers
          </button>
        )}
        {hasRV && (
          <button className={`toggle-tab ${view === "resenas" ? "active" : ""}`} onClick={() => setView("resenas")}>
            ✦ Reseñas
          </button>
        )}
      </div>

      {!modelo ? (
        <AlertMessage type="info" msg={`No hay modelo entrenado para ${view === "freelancers" ? "Freelancers" : "Reseñas"}.`} />
      ) : (
        <>
          {/* ── 3 métricas ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <MetricaCard
              label="Coeficiente de Silueta"
              value={silhouette !== null ? silhouette.toFixed(3) : "—"}
              color={silhouette > 0.5 ? "var(--green)" : silhouette > 0.25 ? "var(--accent)" : "var(--red)"}
              hint="Rango: -1 a 1. Mayor es mejor. > 0.5 indica buena separación."
            />
            <MetricaCard
              label="Índice de Davies-Bouldin"
              value={davies_bouldin !== null ? davies_bouldin.toFixed(3) : "—"}
              color={davies_bouldin < 0.5 ? "var(--green)" : davies_bouldin < 1 ? "var(--accent)" : "var(--red)"}
              hint="Rango: ≥ 0. Menor es mejor. Mide solapamiento entre clusters."
            />
            <MetricaCard
              label="Índice Calinski-Harabasz"
              value={calinski_harabasz !== null ? Math.round(calinski_harabasz) : "—"}
              color={calinski_harabasz > 200 ? "var(--green)" : "var(--accent)"}
              hint="Rango: ≥ 0. Mayor es mejor. Mide separación vs compacidad."
            />
          </div>

          {/* ── Gráfica del codo ── */}
          <div className="card">
            <div className="card-title">Selección del Número de Clusters</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
              {modelo.algoritmo === "kmeans"
                ? "Método del codo — inercia (WCSS) para distintos valores de k. El punto de mayor caída indica el k óptimo."
                : "Coeficiente de Silueta para distintos valores de k."}
            </div>
            <ElbowChart
              data={modelo.elbow_data}
              label={modelo.algoritmo === "kmeans" ? "Inercia (WCSS)" : "Silhouette"}
            />
          </div>

          {/* ── Interpretación textual ── */}
          <div className="card">
            <div className="card-title">Interpretación</div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
              {interpretacion(silhouette, davies_bouldin, calinski_harabasz)}
            </p>
          </div>

          {/* ── Resumen de segmentos ── */}
          <div className="card">
            <div className="card-title">Distribución de Registros por Segmento</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {modelo.segmentos.map((seg, i) => {
                const pct = ((seg.n / modelo.total) * 100).toFixed(1);
                return (
                  <div key={i} style={{
                    flex: "1 1 140px", padding: "12px 14px",
                    background: "var(--bg-secondary)", borderRadius: "8px",
                    textAlign: "center",
                  }}>
                    <SegBadge index={i} />
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "6px 0 2px" }}>
                      {seg.n}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{pct}% del total</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
