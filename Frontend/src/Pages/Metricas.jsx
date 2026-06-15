import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import MetricCard from "../components/MetricCard";

//  Colores por métrica -----------------------------------------------------------
const COLORS = {
  Exactitud: "#1D9E75",
  Precisión: "#2980b9",
  Recall:    "#BA7517",
  "F1 Score":"#8e44ad",
};

//  Tooltip gráfica -----------------------------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
      <p style={{ color: "#9aa0b4", marginBottom: "6px", fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: p.color, marginBottom: "2px" }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 700 }}>{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

//  Leyenda gráfica -----------------------------------------------------------
const CustomLegend = () => (
  <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "8px" }}>
    {Object.entries(COLORS).map(([name, color]) => (
      <div key={name} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#9aa0b4" }}>
        <span style={{ width: 10, height: 10, borderRadius: "2px", background: color, display: "inline-block" }} />
        {name}
      </div>
    ))}
  </div>
);

// Celda de la matriz -----------------------------------------------------------
const MatrixCell = ({ value, label, sublabel, bg, color, total }) => (
  <div style={{
    background: bg, borderRadius: "8px", padding: "16px 10px",
    textAlign: "center", display: "flex", flexDirection: "column", gap: "5px",
  }}>
    <span style={{ fontSize: "28px", fontWeight: 700, color: value !== null ? color : "var(--text-muted)" }}>
      {value !== null ? value.toLocaleString() : "—"}
    </span>
    <span style={{ fontSize: "11px", fontWeight: 600, color: value !== null ? color : "var(--text-muted)" }}>
      {label}
    </span>
    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{sublabel}</span>
    {value !== null && total > 0 && (
      <span style={{ fontSize: "10px", color, opacity: 0.75 }}>
        {((value / total) * 100).toFixed(1)}%
      </span>
    )}
  </div>
);

//  Matriz de Confusión -----------------------------------------------------------
const ConfusionMatrix = ({ matrix }) => {
  const hasData = matrix && matrix.vp !== undefined;
  const vp   = hasData ? matrix.vp : null;
  const vn   = hasData ? matrix.vn : null;
  const fp   = hasData ? matrix.fp : null;
  const fn   = hasData ? matrix.fn : null;
  const total = hasData ? vp + vn + fp + fn : 0;

  const headerStyle = {
    textAlign: "center", fontSize: "11px", fontWeight: 600,
    color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: "0.06em", padding: "6px 0",
  };
  const rowLabelStyle = {
    fontSize: "11px", fontWeight: 600, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.06em",
    textAlign: "right", paddingRight: "14px", lineHeight: "1.5",
  };

  return (
    <div>
      {!hasData && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "14px" }}>
          Entrena el modelo para ver la matriz de confusión.
        </p>
      )}

      {/* Encabezados de columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr", gap: "10px", marginBottom: "6px" }}>
        <div />
        <div style={headerStyle}>Predicho: Sin riesgo</div>
        <div style={headerStyle}>Predicho: En riesgo</div>
      </div>

      {/* Fila 1: Real Sin riesgo */}
      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
        <div style={rowLabelStyle}>Real:<br />Sin riesgo</div>
        <MatrixCell value={vn} label="Verdadero Negativo" sublabel="Correcto ✓"   bg="rgba(29,158,117,0.12)"  color="#1D9E75" total={total} />
        <MatrixCell value={fp} label="Falso Positivo"     sublabel="Error tipo I"  bg="rgba(186,117,23,0.12)"  color="#BA7517" total={total} />
      </div>

      {/* Fila 2: Real En riesgo */}
      <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr", gap: "10px", alignItems: "center" }}>
        <div style={rowLabelStyle}>Real:<br />En riesgo</div>
        <MatrixCell value={fn} label="Falso Negativo"     sublabel="Error tipo II" bg="rgba(231,76,60,0.12)"   color="#e74c3c" total={total} />
        <MatrixCell value={vp} label="Verdadero Positivo" sublabel="Correcto ✓"    bg="rgba(29,158,117,0.12)"  color="#1D9E75" total={total} />
      </div>

      {/* Leyenda */}
      <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.6" }}>
        <div><strong style={{ color: "#1D9E75" }}>VN — Verdadero Negativo:</strong> Sin riesgo real, predicho sin riesgo.</div>
        <div><strong style={{ color: "#1D9E75" }}>VP — Verdadero Positivo:</strong> Riesgo real, predicho como riesgo.</div>
        <div><strong style={{ color: "#BA7517" }}>FP — Falso Positivo:</strong> Sin riesgo real, predicho como riesgo. (Error tipo I)</div>
        <div><strong style={{ color: "#e74c3c" }}>FN — Falso Negativo:</strong> Riesgo real, no detectado. Más costoso. (Error tipo II)</div>
      </div>
    </div>
  );
};

//  Componente principal -----------------------------------------------------------
export default function Metricas({ metrics, history }) {
  const [view, setView] = useState("grafica");

  const chartData = history.map((h) => ({
    nombre:    h.nombre,
    Exactitud: h.Exactitud,
    Precisión: h.Precisión,
    Recall:    h.Recall,
    "F1 Score":h["F1 Score"],
  }));

  const card = { background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", marginBottom: "16px" };
  const sectionLabel = { fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
          Evaluación de rendimiento
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Métricas del modelo entrenado sobre el conjunto de prueba.
        </p>
      </div>

      {!metrics && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "16px" }}>
          Entrena el modelo desde Carga de Datos para ver resultados aquí.
        </p>
      )}

      {/* 4 tarjetas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <MetricCard label="Exactitud"  value={metrics?.accuracy}  color="#1D9E75" />
        <MetricCard label="Precisión"  value={metrics?.precision} color="#2980b9" />
        <MetricCard label="Recall"     value={metrics?.recall}    color="#BA7517" />
        <MetricCard label="F1 Score"   value={metrics?.f1}        color="#8e44ad" />
      </div>

      {/* Matriz de confusión — siempre visible */}
      <div style={card}>
        <div style={sectionLabel}>Matriz de confusión</div>
        <ConfusionMatrix matrix={metrics?.confusion_matrix} />
      </div>

      {/* Historial */}
      {history.length > 0 && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div style={sectionLabel}>Historial de entrenamientos</div>
            <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "7px", padding: "3px" }}>
              {["grafica", "tabla"].map((v) => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "4px 12px", fontSize: "11px", fontWeight: 600,
                  borderRadius: "5px", border: "none", cursor: "pointer",
                  background: view === v ? "var(--bg-card)" : "transparent",
                  color: view === v ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 0.15s",
                }}>
                  {v === "grafica" ? "▦ Gráfica" : "≡ Tabla"}
                </button>
              ))}
            </div>
          </div>

          {view === "grafica" && (
            <>
              {history.length === 1 && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", fontStyle: "italic" }}>
                  Reentrena con diferentes hiperparámetros para comparar entrenamientos.
                </p>
              )}
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barCategoryGap="28%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fill: "#5c6278", fontSize: 11 }} axisLine={{ stroke: "#2a2d3e" }} tickLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#5c6278", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <ReferenceLine y={80} stroke="#2a2d3e" strokeDasharray="4 4" label={{ value: "80%", fill: "#5c6278", fontSize: 10, position: "right" }} />
                  {Object.entries(COLORS).map(([name, color]) => (
                    <Bar key={name} dataKey={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <CustomLegend />
            </>
          )}

          {view === "tabla" && (
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Entrenamiento", "Hora", "Exactitud", "Precisión", "Recall", "F1 Score"].map((h) => (
                    <th key={h} style={{ padding: "6px 10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text-primary)" }}>{r.nombre}</td>
                    <td style={{ padding: "8px 10px", color: "var(--text-secondary)" }}>{r.timestamp}</td>
                    <td style={{ padding: "8px 10px", color: COLORS["Exactitud"],  fontWeight: 600 }}>{(r.accuracy  * 100).toFixed(1)}%</td>
                    <td style={{ padding: "8px 10px", color: COLORS["Precisión"],  fontWeight: 600 }}>{(r.precision * 100).toFixed(1)}%</td>
                    <td style={{ padding: "8px 10px", color: COLORS["Recall"],     fontWeight: 600 }}>{(r.recall    * 100).toFixed(1)}%</td>
                    <td style={{ padding: "8px 10px", color: COLORS["F1 Score"],   fontWeight: 600 }}>{(r.f1        * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Interpretación */}
      <div style={card}>
        <div style={sectionLabel}>Interpretación de métricas</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          {[
            { key: "Exactitud",  text: "Proporción total de predicciones correctas sobre todos los casos." },
            { key: "Precisión",  text: "De los casos predichos como riesgo, cuántos realmente lo son." },
            { key: "Recall",     text: "De los casos que realmente son riesgo, cuántos detectó el modelo." },
            { key: "F1 Score",   text: "Media armónica entre precisión y recall. Ideal con desbalance de clases." },
          ].map(({ key, text }) => (
            <div key={key} style={{ display: "flex", gap: "8px" }}>
              <span style={{ width: 10, height: 10, borderRadius: "2px", background: COLORS[key], flexShrink: 0, marginTop: 3 }} />
              <div><strong style={{ color: "var(--text-primary)" }}>{key}:</strong> {text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}