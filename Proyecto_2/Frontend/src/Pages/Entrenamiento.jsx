import { useState } from "react";
import { entrenar } from "../api/client";
import AlertMessage from "../components/AlertMessage";

// Parámetros por algoritmo
const ALGORITMOS = {
  kmeans: {
    label: "K-Means",
    params: [
      { key: "k",       label: "Número de clusters (k)", type: "number", min: 2, max: 15, default: 4 },
      { key: "metrica", label: "Métrica de distancia",   type: "select", options: ["euclidiana", "manhattan"], default: "euclidiana" },
    ],
  },
  dbscan: {
    label: "DBSCAN",
    params: [
      { key: "epsilon",    label: "Epsilon (ε)",        type: "number", min: 0.01, max: 10, step: 0.01, default: 0.5 },
      { key: "min_puntos", label: "Mínimo de puntos",   type: "number", min: 1,    max: 50, default: 5 },
    ],
  },
  jerarquico: {
    label: "Clustering Jerárquico",
    params: [
      { key: "k",       label: "Número de clusters (k)", type: "number", min: 2, max: 15, default: 4 },
      { key: "enlace",  label: "Tipo de enlace",         type: "select", options: ["ward", "complete", "average", "single"], default: "ward" },
    ],
  },
};

const VECTORIZACION = [
  { value: "tfidf", label: "TF-IDF" },
  { value: "bow",   label: "Bag of Words" },
];

function ParamField({ param, value, onChange }) {
  if (param.type === "select") {
    return (
      <div className="form-group">
        <label className="form-label">{param.label}</label>
        <select value={value} onChange={e => onChange(param.key, e.target.value)}>
          {param.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="form-group">
      <label className="form-label">{param.label}</label>
      <input
        type="number"
        min={param.min} max={param.max} step={param.step ?? 1}
        value={value}
        onChange={e => onChange(param.key, parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function Entrenamiento({
  cleaned,
  modeloFreelancers, setModeloFreelancers,
  modeloResenas,     setModeloResenas,
}) {
  const [dataset,       setDataset]       = useState("freelancers");
  const [algoritmo,     setAlgoritmo]     = useState("kmeans");
  const [params,        setParams]        = useState({ k: 4, metrica: "euclidiana" });
  const [vectorizacion, setVectorizacion] = useState("tfidf");
  const [alert,         setAlert]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [progress,      setProgress]      = useState(0);

  const algoInfo = ALGORITMOS[algoritmo];

  const handleAlgoritmo = (val) => {
    setAlgoritmo(val);
    // resetear params a defaults del nuevo algoritmo
    const defaults = {};
    ALGORITMOS[val].params.forEach(p => { defaults[p.key] = p.default; });
    setParams(defaults);
  };

  const handleParam = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const handleEntrenar = async () => {
    setLoading(true);
    setProgress(5);
    const interval = setInterval(() => {
      setProgress(p => p < 88 ? p + Math.random() * 7 : p);
    }, 400);

    try {
      const payload = {
        dataset,
        algoritmo,
        params,
        ...(dataset === "resenas" ? { vectorizacion } : {}),
      };
      const res = await entrenar(payload);
      clearInterval(interval);
      setProgress(100);

      if (dataset === "freelancers") setModeloFreelancers(res);
      else setModeloResenas(res);

      const segInfo = res.segmentos.map(s => `Segmento ${s.id + 1}: ${s.n} registros`).join(" · ");
      setAlert({ type: "success", msg: `Modelo entrenado — ${res.segmentos.length} segmentos generados. ${segInfo}` });
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setAlert({ type: "error", msg: `Error al entrenar: ${err.message}` });
    }
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <div>
      <h1 className="page-title">Configuración y Entrenamiento del Modelo</h1>
      <p className="page-subtitle">Selecciona el conjunto de datos, el algoritmo y sus parámetros.</p>

      {!cleaned && (
        <AlertMessage type="warning" msg="Limpia los datos primero en la vista de Carga y Preprocesamiento." />
      )}
      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}

      {/* ── Conjunto de datos ── */}
      <div className="card">
        <div className="card-title">Conjunto de Datos</div>
        <div style={{ display: "flex", gap: "10px" }}>
          {["freelancers", "resenas"].map(d => (
            <button
              key={d}
              onClick={() => setDataset(d)}
              className="btn"
              style={{
                background: dataset === d ? "var(--accent-dim)" : "transparent",
                borderColor: dataset === d ? "var(--accent)" : "var(--border-color)",
                color: dataset === d ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: dataset === d ? 700 : 400,
              }}
            >
              {d === "freelancers" ? "◎ Freelancers" : "✦ Reseñas"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Algoritmo ── */}
      <div className="card">
        <div className="card-title">Algoritmo de Clustering</div>
        <div className="form-group" style={{ marginBottom: "14px", maxWidth: "280px" }}>
          <label className="form-label">Algoritmo</label>
          <select value={algoritmo} onChange={e => handleAlgoritmo(e.target.value)}>
            {Object.entries(ALGORITMOS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-grid-2" style={{ maxWidth: "560px" }}>
          {algoInfo.params.map(p => (
            <ParamField
              key={p.key}
              param={p}
              value={params[p.key] ?? p.default}
              onChange={handleParam}
            />
          ))}
        </div>

        {/* Nota sobre DBSCAN/Jerárquico */}
        {(algoritmo === "dbscan" || algoritmo === "jerarquico") && (
          <div className="alert alert-info" style={{ marginTop: "12px", fontSize: "11px" }}>
            ℹ {algoritmo === "dbscan" ? "DBSCAN" : "Clustering Jerárquico"} no soporta predicción nativa para nuevos registros. Se usará la estrategia de vecino más cercano (nearest-centroid) para la Clasificación de Nuevo Registro.
          </div>
        )}
      </div>

      {/* ── Vectorización (solo reseñas) ── */}
      {dataset === "resenas" && (
        <div className="card">
          <div className="card-title">Vectorización de Texto</div>
          <div className="form-group" style={{ maxWidth: "280px" }}>
            <label className="form-label">Técnica de vectorización</label>
            <select value={vectorizacion} onChange={e => setVectorizacion(e.target.value)}>
              {VECTORIZACION.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            TF-IDF pondera términos por frecuencia inversa en el corpus. Bag of Words usa frecuencias absolutas.
          </div>
        </div>
      )}

      {/* ── Entrenamiento ── */}
      <div className="card">
        <div className="card-title">Entrenamiento</div>
        <button
          className="btn btn-primary"
          onClick={handleEntrenar}
          disabled={!cleaned || loading}
          style={{ width: "100%", justifyContent: "center", padding: "10px" }}
        >
          {loading ? "Entrenando..." : "▶ Entrenar Modelo"}
        </button>

        {/* Barra de progreso */}
        {loading && (
          <div style={{ marginTop: "14px" }}>
            <div style={{ height: "7px", borderRadius: "99px", background: "var(--bg-secondary)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "99px", background: "var(--accent)",
                width: `${progress}%`, transition: "width 0.35s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                ⏳ Entrenando {dataset === "freelancers" ? "Freelancers" : "Reseñas"} con {ALGORITMOS[algoritmo].label}...
              </span>
              <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>
                {Math.min(100, Math.round(progress))}%
              </span>
            </div>
          </div>
        )}

        {/* Estado actual de modelos */}
        <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
          {[
            { label: "Freelancers", trained: !!modeloFreelancers, modelo: modeloFreelancers },
            { label: "Reseñas",     trained: !!modeloResenas,     modelo: modeloResenas     },
          ].map(({ label, trained, modelo }) => (
            <div key={label} style={{
              flex: 1, padding: "10px 12px", borderRadius: "8px",
              background: "var(--bg-secondary)", fontSize: "12px",
              border: `1px solid ${trained ? "rgba(63,185,80,0.3)" : "var(--border-color)"}`,
            }}>
              <span style={{ color: trained ? "var(--green)" : "var(--text-muted)", fontWeight: 700 }}>
                {trained ? "✓" : "○"}
              </span>
              {" "}<span style={{ color: trained ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</span>
              {trained && modelo && (
                <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                  — {modelo.segmentos.length} segmentos · {modelo.algoritmo}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
