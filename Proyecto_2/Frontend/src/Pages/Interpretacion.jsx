import { useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { SegBadge, SEG_COLORS, segColor } from "../components/SegmentColors";

const SEG_HEX = SEG_COLORS.map(c => c.text);

function ScatterPlot({ segmentos }) {
  if (!segmentos?.length) return null;
  const allPoints = segmentos.flatMap((s, i) =>
    s.pca_points.map(p => ({ x: p[0], y: p[1], seg: i }))
  );
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey="x" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "PC1", position: "insideBottom", fill: "var(--text-muted)", fontSize: 10, offset: -2 }} />
        <YAxis dataKey="y" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "PC2", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 10 }} />
        <Tooltip
          cursor={false}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "7px 10px", fontSize: "11px" }}>
                <span style={{ color: SEG_HEX[d.seg], fontWeight: 700 }}>Segmento {d.seg + 1}</span>
                <br />PC1: {d.x.toFixed(3)} · PC2: {d.y.toFixed(3)}
              </div>
            );
          }}
        />
        <Scatter data={allPoints} isAnimationActive={false}>
          {allPoints.map((p, i) => (
            <Cell key={i} fill={SEG_HEX[p.seg]} fillOpacity={0.7} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function WordCloud({ palabras }) {
  if (!palabras?.length) return null;
  const max = Math.max(...palabras.map(p => p.freq));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px 0" }}>
      {palabras.map(({ word, freq }, i) => {
        const size = 11 + (freq / max) * 18;
        const opacity = 0.5 + (freq / max) * 0.5;
        return (
          <span key={i} style={{ fontSize: `${size}px`, color: `var(--accent)`, opacity, fontWeight: freq > max * 0.7 ? 700 : 400 }}>
            {word}
          </span>
        );
      })}
    </div>
  );
}

function TablaCruzada({ cruzada }) {
  if (!cruzada) return null;
  const { segFreelancers, segResenas, datos } = cruzada;
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Seg. Freelancers ↓ / Reseñas →</th>
            {segResenas.map((_, i) => <th key={i} style={{ color: SEG_HEX[i] }}>Seg. {i + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {segFreelancers.map((_, fi) => (
            <tr key={fi}>
              <td style={{ color: SEG_HEX[fi], fontWeight: 700 }}>Segmento {fi + 1}</td>
              {segResenas.map((_, ri) => {
                const d = datos[fi]?.[ri] ?? { n: 0, pct: 0 };
                return (
                  <td key={ri} style={{ textAlign: "center", color: d.pct > 30 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {d.n} <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>({d.pct}%)</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Interpretacion({ modeloFreelancers, modeloResenas, view, setView }) {
  const modelo = view === "freelancers" ? modeloFreelancers : modeloResenas;
  const esResenas = view === "resenas";
  const [activeSeg, setActiveSeg] = useState(0);

  if (!modeloFreelancers && !modeloResenas) {
    return (
      <div>
        <h1 className="page-title">Interpretación de Segmentos</h1>
        <div className="alert alert-warning">Entrena al menos un modelo primero.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Interpretación y Perfilado de Segmentos</h1>
      <p className="page-subtitle">Visualiza y comprende los grupos descubiertos por el modelo.</p>

      {/* Selector de vista */}
      <div className="toggle-tabs">
        {modeloFreelancers && (
          <button className={`toggle-tab ${view === "freelancers" ? "active" : ""}`} onClick={() => { setView("freelancers"); setActiveSeg(0); }}>
            ◎ Freelancers
          </button>
        )}
        {modeloResenas && (
          <button className={`toggle-tab ${view === "resenas" ? "active" : ""}`} onClick={() => { setView("resenas"); setActiveSeg(0); }}>
            ✦ Reseñas
          </button>
        )}
      </div>

      {!modelo && (
        <div className="alert alert-info">No hay modelo entrenado para {view === "freelancers" ? "Freelancers" : "Reseñas"}.</div>
      )}

      {modelo && (
        <>
          {/* ── Gráfica de dispersión PCA ── */}
          <div className="card">
            <div className="card-title">Distribución de Segmentos (PCA 2D)</div>
            <ScatterPlot segmentos={modelo.segmentos} />
            <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
              {modelo.segmentos.map((_, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEG_HEX[i], display: "inline-block" }} />
                  Segmento {i + 1} ({modelo.segmentos[i].n})
                </span>
              ))}
            </div>
          </div>

          {/* ── Tabla resumen por segmento ── */}
          <div className="card">
            <div className="card-title">Resumen por Segmento</div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Segmento</th>
                    <th>Registros</th>
                    {modelo.columnas_resumen.map(c => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {modelo.segmentos.map((seg, i) => (
                    <tr key={i}>
                      <td><SegBadge index={i} /></td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{seg.n}</td>
                      {modelo.columnas_resumen.map(c => (
                        <td key={c}>{seg.resumen[c] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Descripción textual por segmento ── */}
          <div className="card">
            <div className="card-title">Descripción de Segmentos</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {modelo.segmentos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSeg(i)}
                  className="btn"
                  style={{
                    background: activeSeg === i ? segColor(i).bg : "transparent",
                    borderColor: activeSeg === i ? segColor(i).border : "var(--border-color)",
                    color: activeSeg === i ? segColor(i).text : "var(--text-secondary)",
                    fontWeight: activeSeg === i ? 700 : 400,
                  }}
                >
                  Segmento {i + 1}
                </button>
              ))}
            </div>
            <div style={{
              padding: "14px", borderRadius: "8px",
              background: segColor(activeSeg).bg,
              border: `1px solid ${segColor(activeSeg).border}`,
              fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.7",
            }}>
              <strong style={{ color: segColor(activeSeg).text }}>Segmento {activeSeg + 1}</strong>
              {" — "}{modelo.segmentos[activeSeg].descripcion}
            </div>
          </div>

          {/* ── Palabras frecuentes (solo reseñas) ── */}
          {esResenas && (
            <div className="card">
              <div className="card-title">Términos Frecuentes</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Selecciona un segmento para ver sus palabras más relevantes.
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                {modelo.segmentos.map((_, i) => (
                  <button key={i} onClick={() => setActiveSeg(i)} className="btn"
                    style={{ background: activeSeg === i ? segColor(i).bg : "transparent", borderColor: activeSeg === i ? segColor(i).border : "var(--border-color)", color: activeSeg === i ? segColor(i).text : "var(--text-secondary)" }}>
                    Seg. {i + 1}
                  </button>
                ))}
              </div>
              <WordCloud palabras={modelo.segmentos[activeSeg].palabras_clave} />
            </div>
          )}

          {/* ── Tabla cruzada (solo si ambos modelos existen) ── */}
          {modeloFreelancers && modeloResenas && modelo.tabla_cruzada && (
            <div className="card">
              <div className="card-title">Tabla Cruzada — Segmentos Freelancers × Reseñas</div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Para cada segmento de freelancers, distribución de sus reseñas entre segmentos de reseñas.
              </p>
              <TablaCruzada cruzada={modelo.tabla_cruzada} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
