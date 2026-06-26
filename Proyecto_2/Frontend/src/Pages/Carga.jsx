import { useRef, useState } from "react";
import { uploadFreelancers, uploadResenas, limpiarDatos } from "../api/client";
import AlertMessage from "../components/AlertMessage";

const COLS_FL = ["freelancer_id","proyectos_completados","ingresos_totales",
  "tarifa_hora_promedio","anios_experiencia","tiempo_respuesta_horas",
  "tasa_finalizacion","calificacion_promedio","categoria_principal",
  "clientes_recurrentes","horas_trabajadas_mes"];

const COLS_RV = ["reseña_id","freelancer_id","texto_reseña",
  "fecha_reseña","categoria_servicio","longitud_reseña"];

function UploadZone({ label, fileName, onFile, accept = ".csv" }) {
  const ref = useRef();
  return (
    <div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
        {label}
      </div>
      <div
        onClick={() => ref.current.click()}
        style={{
          border: "1.5px dashed var(--border-color)", borderRadius: "8px",
          padding: "18px", textAlign: "center", cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ fontSize: "22px", marginBottom: "5px" }}>📄</div>
        <div style={{ fontSize: "12px", color: fileName ? "var(--accent)" : "var(--text-muted)", fontWeight: fileName ? 600 : 400 }}>
          {fileName ? `✓ ${fileName}` : "Seleccionar archivo CSV"}
        </div>
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  );
}

function PreviewTable({ data, cols }) {
  if (!data?.muestra?.length) return null;
  return (
    <div style={{ overflowX: "auto", marginTop: "14px" }}>
      <table className="data-table" style={{ whiteSpace: "nowrap" }}>
        <thead>
          <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.muestra.map((row, i) => (
            <tr key={i}>
              {cols.map(c => (
                <td key={c} style={{
                  maxWidth: "200px", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {row[c] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Carga({
  freelancersFile, setFreelancersFile,
  resenasFile,     setResenasFile,
  freelancersData, setFreelancersData,
  resenasData,     setResenasData,
  cleanReport,     setCleanReport,
  cleaned,         setCleaned,
}) {
  const [alert,   setAlert]   = useState(null);
  const [loading, setLoading] = useState("");

  const handleFreelancers = async (file) => {
    setFreelancersFile(file.name);
    setLoading("fl");
    try {
      const res = await uploadFreelancers(file);
      setFreelancersData(res);
      setCleaned(false);
      setCleanReport(null);
      setAlert({ type: "success", msg: `freelancers.csv cargado — ${res.registros.toLocaleString()} registros.` });
    } catch (err) {
      setAlert({ type: "error", msg: `Error al cargar freelancers: ${err.message}` });
    }
    setLoading("");
  };

  const handleResenas = async (file) => {
    setResenasFile(file.name);
    setLoading("rv");
    try {
      const res = await uploadResenas(file);
      setResenasData(res);
      setCleaned(false);
      setCleanReport(null);
      setAlert({ type: "success", msg: `reseñas.csv cargado — ${res.registros.toLocaleString()} registros.` });
    } catch (err) {
      setAlert({ type: "error", msg: `Error al cargar reseñas: ${err.message}` });
    }
    setLoading("");
  };

  const handleLimpiar = async () => {
    if (!freelancersData || !resenasData) {
      setAlert({ type: "error", msg: "Carga ambos archivos CSV antes de limpiar." });
      return;
    }
    setLoading("clean");
    try {
      const res = await limpiarDatos();
      setCleanReport(res);
      setCleaned(true);
      setAlert({ type: "success", msg: `Limpieza completada — ${res.nulos_imputados} nulos imputados, ${res.duplicados_eliminados} duplicados eliminados, ${res.registros_corregidos} registros corregidos.` });
    } catch (err) {
      setAlert({ type: "error", msg: `Error en limpieza: ${err.message}` });
    }
    setLoading("");
  };

  return (
    <div>
      <h1 className="page-title">Carga y Preprocesamiento de Datos</h1>
      <p className="page-subtitle">Sube los archivos de freelancers y reseñas para iniciar el análisis.</p>

      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}

      {/* ── Carga de archivos ── */}
      <div className="card">
        <div className="card-title">Carga de Archivos</div>
        <div className="form-grid-2" style={{ gap: "20px" }}>
          <UploadZone
            label="freelancers.csv"
            fileName={freelancersFile}
            onFile={handleFreelancers}
          />
          <UploadZone
            label="reseñas_clientes.csv"
            fileName={resenasFile}
            onFile={handleResenas}
          />
        </div>

        {/* Columnas esperadas */}
        <div className="form-grid-2" style={{ gap: "20px", marginTop: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Columnas: {COLS_FL.join(", ")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Columnas: {COLS_RV.slice(0, -1).join(", ")} (longitud_reseña se calcula automáticamente)
          </div>
        </div>
      </div>

      {/* ── Vista previa ── */}
      {(freelancersData || resenasData) && (
        <div className="card">
          <div className="card-title">Vista Previa</div>
          <div className="form-grid-2" style={{ gap: "24px", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                freelancers.csv
                {freelancersData && <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: "8px" }}>({freelancersData.registros.toLocaleString()} registros)</span>}
              </div>
              {freelancersData
                ? <PreviewTable data={freelancersData} cols={COLS_FL} />
                : <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Sin archivo cargado.</div>}
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                reseñas_clientes.csv
                {resenasData && <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: "8px" }}>({resenasData.registros.toLocaleString()} registros)</span>}
              </div>
              {resenasData
                ? <PreviewTable data={resenasData} cols={COLS_RV} />
                : <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Sin archivo cargado.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Preprocesamiento ── */}
      <div className="card">
        <div className="card-title">Preprocesamiento</div>
        <button
          className="btn btn-primary"
          onClick={handleLimpiar}
          disabled={!!loading || (!freelancersData || !resenasData)}
          style={{ marginBottom: cleanReport ? "14px" : 0 }}
        >
          {loading === "clean" ? "Limpiando..." : "✦ Limpiar Datos"}
        </button>

        {/* Reporte de limpieza */}
        {cleanReport && (
          <div style={{
            padding: "10px 14px", borderRadius: "8px",
            background: "var(--bg-secondary)", fontSize: "12px", color: "var(--text-secondary)",
          }}>
            <span style={{ color: "var(--green)", fontWeight: 700 }}>✓ </span>
            Registros cargados: <strong style={{ color: "var(--text-primary)" }}>{cleanReport.registros_total.toLocaleString()}</strong>
            {" · "}Valores nulos imputados: <strong style={{ color: "var(--text-primary)" }}>{cleanReport.nulos_imputados}</strong>
            {" · "}Duplicados eliminados: <strong style={{ color: "var(--text-primary)" }}>{cleanReport.duplicados_eliminados}</strong>
            {" · "}Registros corregidos: <strong style={{ color: "var(--text-primary)" }}>{cleanReport.registros_corregidos}</strong>
            {cleanReport.longitud_calculada && (
              <> · <span style={{ color: "var(--accent)" }}>longitud_reseña calculada automáticamente</span></>
            )}
          </div>
        )}

        {!freelancersData || !resenasData ? (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}>
            Debes cargar ambos archivos CSV para habilitar la limpieza.
          </div>
        ) : null}
      </div>

      {/* ── Stats rápidas post-limpieza ── */}
      {cleaned && cleanReport && (
        <div className="card">
          <div className="card-title">Resumen de Datos Limpios</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[
              { label: "Freelancers",      value: cleanReport.freelancers_finales.toLocaleString(), color: "var(--blue)"   },
              { label: "Reseñas",          value: cleanReport.resenas_finales.toLocaleString(),     color: "var(--purple)" },
              { label: "Nulos imputados",  value: cleanReport.nulos_imputados,                      color: "var(--accent)" },
              { label: "Duplicados elim.", value: cleanReport.duplicados_eliminados,                 color: "var(--green)"  },
            ].map(({ label, value, color }) => (
              <div className="stat-card" key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ color, fontSize: "20px" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
