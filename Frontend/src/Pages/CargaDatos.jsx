import { useState, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { uploadCSV, cleanData, trainModel } from "../api/client";
import AlertMessage from "../components/AlertMessage";
import StatusPipeline from "../components/StatusPipeline";

// ── Colores dona ───────────────────────────────────────────────
const PIE_COLORS = { riesgo: "#e74c3c", no_riesgo: "#1D9E75" };

// ── Tooltip dona ──────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "7px", padding: "8px 12px", fontSize: "12px" }}>
      <span style={{ color: payload[0].payload.color, fontWeight: 700 }}>{name}: </span>
      <span style={{ color: "#f0f0f0" }}>{value.toLocaleString()} registros</span>
    </div>
  );
};

// ── Etiqueta estado de limpieza por columna ───────────────────
const CleanBadge = ({ nulos, outliers }) => {
  const total = nulos + outliers;
  if (total === 0) return <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "#e6f4ee", color: "#0F6E56", fontWeight: 600 }}>Sin cambios</span>;
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {nulos > 0   && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "#eaf3fb", color: "#1a5276", fontWeight: 600 }}>{nulos} nulos</span>}
      {outliers > 0 && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "#fdecea", color: "#922b21", fontWeight: 600 }}>{outliers} outliers</span>}
    </div>
  );
};

// ── Columnas visibles en la tabla de muestra ──────────────────
const COLS = [
  { key: "ingresos_mensuales",      label: "Ingresos (Q)"   },
  { key: "deuda_activa",            label: "Deuda (Q)"      },
  { key: "historial_pagos",         label: "Historial"      },
  { key: "antiguedad_laboral",      label: "Antigüedad"     },
  { key: "creditos_activos",        label: "Créditos"       },
  { key: "monto_solicitado",        label: "Monto sol. (Q)" },
  { key: "atrasos_previos",         label: "Atrasos"        },
  { key: "dependientes_economicos", label: "Dependientes"   },
  { key: "utilizacion_credito",     label: "Utilización %"  },
  { key: "riesgo",                  label: "Riesgo"         },
];

// ── Componente principal ───────────────────────────────────────
export default function CargaDatos({ onTrained }) {
  const [status,    setStatus]    = useState({ loaded: false, cleaned: false, trained: false });
  const [fileName,  setFileName]  = useState(null);
  const [uploadData, setUploadData] = useState(null);   // respuesta de /upload
  const [cleanReport, setCleanReport] = useState(null); // respuesta de /clean
  const [alert,     setAlert]     = useState(null);
  const [loading,   setLoading]   = useState("");
  const [dataView,  setDataView]  = useState("distribucion"); // "distribucion" | "muestra"
  const inputRef = useRef();

  const showAlert = (type, msg) => setAlert({ type, msg });

  // ── Carga CSV ─────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { showAlert("error", "El archivo debe ser un CSV válido."); return; }
    setLoading("upload");
    setCleanReport(null);
    try {
      const res = await uploadCSV(file);
      setFileName(file.name);
      setUploadData(res);
      setStatus((s) => ({ ...s, loaded: true, cleaned: false, trained: false }));
      showAlert("success", `"${file.name}" cargado — ${res.registros.toLocaleString()} registros detectados.`);
    } catch (err) {
      showAlert("error", `Error al cargar: ${err.message}`);
    }
    setLoading("");
  };

  // ── Limpieza ──────────────────────────────────────────────
  const handleClean = async () => {
    if (!status.loaded)  { showAlert("error", "Primero carga un archivo CSV."); return; }
    setLoading("clean");
    try {
      const res = await cleanData();
      setCleanReport(res);
      setStatus((s) => ({ ...s, cleaned: true }));
      showAlert("success", `Limpieza completada — ${res.eliminados} registros ajustados, ${res.registros_finales.toLocaleString()} registros finales.`);
    } catch (err) {
      showAlert("error", `Error en limpieza: ${err.message}`);
    }
    setLoading("");
  };

  // ── Entrenamiento ─────────────────────────────────────────
  const handleTrain = async () => {
    if (!status.cleaned) { showAlert("error", "Debes limpiar los datos antes de entrenar."); return; }
    setLoading("train");
    try {
      await trainModel();
      setStatus((s) => ({ ...s, trained: true }));
      onTrained();
      showAlert("success", "Modelo entrenado exitosamente. Revisa las métricas en el panel correspondiente.");
    } catch (err) {
      showAlert("error", `Error al entrenar: ${err.message}`);
    }
    setLoading("");
  };

  // ── Datos para la dona ────────────────────────────────────
  const pieData = uploadData?.distribucion
    ? [
        { name: "Sin riesgo", value: uploadData.distribucion.no_riesgo, color: PIE_COLORS.no_riesgo },
        { name: "Riesgo",     value: uploadData.distribucion.riesgo,    color: PIE_COLORS.riesgo    },
      ]
    : [];

  const totalRegistros = uploadData?.distribucion
    ? uploadData.distribucion.riesgo + uploadData.distribucion.no_riesgo
    : 0;

  const card = (children, extra = {}) => ({
    background: "var(--bg-card)", border: "1px solid var(--border-color)",
    borderRadius: "10px", padding: "20px", marginBottom: "16px", ...extra,
  });

  const sectionLabel = {
    fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px",
  };

  const toggleBtn = (val, current, label) => (
    <button
      key={val}
      onClick={() => setDataView(val)}
      style={{
        padding: "4px 12px", fontSize: "11px", fontWeight: 600,
        borderRadius: "5px", border: "none", cursor: "pointer",
        background: current === val ? "var(--bg-card)" : "transparent",
        color: current === val ? "var(--text-primary)" : "var(--text-muted)",
        transition: "all 0.15s",
      }}
    >{label}</button>
  );

  return (
    <div>
      <h1 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}>
        Carga masiva de datos
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
        Sube el CSV con registros históricos, aplica limpieza y entrena el modelo.
      </p>

      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}

      {/* ── Upload area ── */}
      <div style={card()}>
        <div style={sectionLabel}>Archivo CSV</div>
        <div
          onClick={() => inputRef.current.click()}
          style={{ border: "1.5px dashed var(--border-color)", borderRadius: "8px", padding: "24px", textAlign: "center", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>📄</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {fileName
              ? <span style={{ color: "#1D9E75", fontWeight: 600 }}>✓ {fileName}</span>
              : "Arrastra tu CSV aquí o haz clic para seleccionar"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Formato: 9 columnas de variables + columna objetivo (riesgo)
          </div>
        </div>
        <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />

        <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
          <button className="btn" onClick={handleClean} disabled={!!loading}>
            {loading === "clean" ? "Limpiando..." : "✦ Limpiar datos"}
          </button>
          <button className="btn btn-primary" onClick={handleTrain} disabled={!!loading}>
            {loading === "train" ? "Entrenando..." : "▶ Entrenar modelo"}
          </button>
        </div>
      </div>

      {/* ── Visualización de datos post-carga ── */}
      {uploadData && (
        <div style={card()}>
          {/* Header con toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={sectionLabel}>Resumen del dataset</div>
            <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "7px", padding: "3px" }}>
              {toggleBtn("distribucion", dataView, "▦ Distribución")}
              {toggleBtn("muestra",      dataView, "≡ Muestra")}
            </div>
          </div>

          {/* Tarjetas de resumen rápido */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "Total registros",  value: uploadData.registros.toLocaleString(), color: "var(--text-primary)" },
              { label: "Columnas",         value: uploadData.columnas,                   color: "var(--text-primary)" },
              { label: "Con riesgo",       value: uploadData.distribucion.riesgo.toLocaleString(),    color: "#e74c3c" },
              { label: "Sin riesgo",       value: uploadData.distribucion.no_riesgo.toLocaleString(), color: "#1D9E75" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ── Vista: Distribución (dona) ── */}
          {dataView === "distribucion" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {pieData.map(({ name, value, color }) => {
                  const pct = ((value / totalRegistros) * 100).toFixed(1);
                  return (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 10, height: 10, borderRadius: "2px", background: color, display: "inline-block" }} />
                          <span style={{ color: "var(--text-secondary)" }}>{name}</span>
                        </span>
                        <span style={{ color, fontWeight: 700 }}>{value.toLocaleString()} ({pct}%)</span>
                      </div>
                      {/* Barra de progreso */}
                      <div style={{ height: "5px", borderRadius: "99px", background: "var(--bg-secondary)" }}>
                        <div style={{ height: "100%", borderRadius: "99px", background: color, width: `${pct}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.5" }}>
                  El dataset presenta desbalance de clases. Considera esto al interpretar el Recall del modelo.
                </p>
              </div>
            </div>
          )}

          {/* ── Vista: Tabla de muestra ── */}
          {dataView === "muestra" && (
            <div style={{ overflowX: "auto" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                Mostrando las primeras 5 filas del dataset cargado.
              </p>
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                <thead>
                  <tr>
                    {COLS.map(({ label }) => (
                      <th key={label} style={{ padding: "6px 10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600, textAlign: "left" }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadData.muestra.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      {COLS.map(({ key }) => (
                        <td key={key} style={{
                          padding: "7px 10px",
                          color: key === "riesgo"
                            ? row[key] === 1 ? "#e74c3c" : "#1D9E75"
                            : "var(--text-secondary)",
                          fontWeight: key === "riesgo" ? 700 : 400,
                        }}>
                          {key === "riesgo" ? (row[key] === 1 ? "⚠ Riesgo" : "✓ Sin riesgo") : row[key]?.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Reporte de limpieza ── */}
      {cleanReport && (
        <div style={card()}>
          <div style={sectionLabel}>Reporte de limpieza</div>

          {/* Resumen global */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Registros originales", value: cleanReport.registros_originales.toLocaleString(), color: "var(--text-primary)" },
              { label: "Registros finales",    value: cleanReport.registros_finales.toLocaleString(),    color: "#1D9E75"             },
              { label: "Filas ajustadas",      value: cleanReport.eliminados,                            color: "#BA7517"             },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Detalle por columna */}
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Columna", "Estado", "Acción aplicada"].map((h) => (
                  <th key={h} style={{ padding: "7px 10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cleanReport.columnas.map((col, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: "11px", color: "#2980b9", fontWeight: 600 }}>
                    {col.nombre}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <CleanBadge nulos={col.nulos} outliers={col.outliers} />
                  </td>
                  <td style={{ padding: "8px 10px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    {col.accion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Estado del pipeline ── */}
      <div style={card()}>
        <div style={sectionLabel}>Estado del pipeline</div>
        <StatusPipeline status={status} />
      </div>
    </div>
  );
}
