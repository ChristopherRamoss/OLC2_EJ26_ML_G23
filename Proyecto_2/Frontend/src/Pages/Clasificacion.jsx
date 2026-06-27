import { useState } from "react";
import { clasificar } from "../api/client";
import AlertMessage from "../components/AlertMessage";
import { SegBadge, segColor } from "../components/SegmentColors";

const CAMPOS_FREELANCER = [
  { key: "proyectos_completados",  label: "Proyectos completados",       type: "number", placeholder: "42",    hint: "Total de proyectos finalizados" },
  { key: "ingresos_totales",       label: "Ingresos totales (USD)",      type: "number", placeholder: "73500", hint: "Ingresos acumulados desde el registro" },
  { key: "tarifa_hora_promedio",   label: "Tarifa por hora (USD)",       type: "number", placeholder: "107",   hint: "Promedio cobrado por hora" },
  { key: "anios_experiencia",      label: "Años de experiencia",         type: "number", placeholder: "5",     hint: "Años declarados por el freelancer" },
  { key: "tiempo_respuesta_horas", label: "Tiempo de respuesta (horas)", type: "number", placeholder: "4.9",   hint: "Promedio de respuesta a clientes" },
  { key: "tasa_finalizacion",      label: "Tasa de finalización (%)",    type: "number", placeholder: "90",    hint: "% de proyectos completados (0–100)" },
  { key: "calificacion_promedio",  label: "Calificación promedio (0–5)", type: "number", placeholder: "4.5",   hint: "Promedio de calificaciones recibidas" },
  { key: "categoria_principal",    label: "Categoría principal",         type: "select",
    options: ["Desarrollo de Software","Diseño Gráfico","Marketing Digital","Redacción y Traducción","Soporte Administrativo Virtual"] },
  { key: "clientes_recurrentes",   label: "Clientes recurrentes",        type: "number", placeholder: "8",     hint: "Clientes que contrataron más de una vez" },
  { key: "horas_trabajadas_mes",   label: "Horas trabajadas al mes",     type: "number", placeholder: "69",    hint: "Promedio de horas mensuales" },
];

function Campo({ campo, value, onChange }) {
  if (campo.type === "select") {
    return (
      <div className="form-group">
        <label className="form-label">{campo.label}</label>
        <select value={value ?? ""} onChange={e => onChange(campo.key, e.target.value)}>
          <option value="">Seleccionar...</option>
          {campo.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="form-group">
      <label className="form-label">{campo.label}</label>
      <input
        type="number" step="any"
        placeholder={campo.placeholder}
        value={value ?? ""}
        onChange={e => onChange(campo.key, e.target.value)}
      />
      {campo.hint && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{campo.hint}</span>}
    </div>
  );
}

export default function Clasificacion({
  trainedFreelancers, trainedResenas,
  modeloFreelancers,  modeloResenas,
  type, setType,
  result, setResult,
}) {
  const [form,    setForm]    = useState({});
  const [resena,  setResena]  = useState("");
  const [alert,   setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const handleChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (type === "freelancer") {
      CAMPOS_FREELANCER.forEach(({ key, label }) => {
        if (!form[key] && form[key] !== 0) errs[key] = "Campo requerido";
      });
    } else {
      if (!resena.trim()) errs.resena = "Ingresa el texto de la reseña.";
    }
    return errs;
  };

  const handleClasificar = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setAlert({ type: "error", msg: "Completa todos los campos antes de clasificar." });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const payload = type === "freelancer"
        ? { type: "freelancer", data: form }
        : { type: "resena",     data: { texto: resena } };

      const res = await clasificar(payload);
      setResult(res);
      setAlert(null);
    } catch (err) {
      setAlert({ type: "error", msg: `Error al clasificar: ${err.message}` });
    }
    setLoading(false);
  };

  const handleReset = () => {
    setForm({});
    setResena("");
    setResult(null);
    setErrors({});
    setAlert(null);
  };

  const canClassify = type === "freelancer" ? trainedFreelancers : trainedResenas;

  return (
    <div>
      <h1 className="page-title">Clasificación de Nuevo Registro</h1>
      <p className="page-subtitle">Asigna un freelancer o reseña nueva al segmento que mejor le corresponde.</p>

      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}

      {/* ── Selector de tipo ── */}
      <div className="card">
        <div className="card-title">Tipo de Registro</div>
        <div style={{ display: "flex", gap: "10px" }}>
          {[
            { val: "freelancer", label: "◎ Freelancer", trained: trainedFreelancers },
            { val: "resena",     label: "✦ Reseña",     trained: trainedResenas     },
          ].map(({ val, label, trained }) => (
            <button
              key={val}
              onClick={() => { setType(val); setResult(null); setErrors({}); }}
              disabled={!trained}
              title={!trained ? `Entrena el modelo de ${val === "freelancer" ? "Freelancers" : "Reseñas"} primero` : ""}
              className="btn"
              style={{
                background: type === val ? "var(--accent-dim)" : "transparent",
                borderColor: type === val ? "var(--accent)" : "var(--border-color)",
                color: type === val ? "var(--accent)" : trained ? "var(--text-secondary)" : "var(--text-muted)",
                fontWeight: type === val ? 700 : 400,
                opacity: trained ? 1 : 0.4,
              }}
            >
              {label} {!trained && "🔒"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Formulario freelancer ── */}
      {type === "freelancer" && (
        <div className="card">
          <div className="card-title">Datos del Freelancer</div>
          <div className="form-grid-2" style={{ marginBottom: "16px" }}>
            {CAMPOS_FREELANCER.map(campo => (
              <div key={campo.key}>
                <Campo campo={campo} value={form[campo.key]} onChange={handleChange} />
                {errors[campo.key] && (
                  <span style={{ fontSize: "10px", color: "var(--red)" }}>{errors[campo.key]}</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" onClick={handleClasificar} disabled={loading || !canClassify}>
              {loading ? "Clasificando..." : "◎ Asignar Segmento"}
            </button>
            <button className="btn" onClick={handleReset}>✕ Limpiar</button>
          </div>
        </div>
      )}

      {/* ── Formulario reseña ── */}
      {type === "resena" && (
        <div className="card">
          <div className="card-title">Texto de la Reseña</div>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">Contenido de la reseña</label>
            <textarea
              rows={5}
              placeholder="Escribe o pega el texto de la reseña aquí..."
              value={resena}
              onChange={e => { setResena(e.target.value); setErrors(er => ({ ...er, resena: null })); }}
              style={{ resize: "vertical" }}
            />
            {errors.resena && (
              <span style={{ fontSize: "10px", color: "var(--red)" }}>{errors.resena}</span>
            )}
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              {resena.trim().split(/\s+/).filter(Boolean).length} palabras
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" onClick={handleClasificar} disabled={loading || !canClassify}>
              {loading ? "Clasificando..." : "✦ Asignar Segmento"}
            </button>
            <button className="btn" onClick={handleReset}>✕ Limpiar</button>
          </div>
        </div>
      )}

      {/* ── Resultado ── */}
      {result && (
        <div style={{
          padding: "20px", borderRadius: "10px",
          background: segColor(result.segmento_idx).bg,
          border: `1px solid ${segColor(result.segmento_idx).border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "28px" }}></span>
            <div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Segmento asignado
              </div>
              <SegBadge index={result.segmento_idx} label={`Segmento ${result.segmento_idx + 1}`} />
            </div>
          </div>
          <div style={{
            fontSize: "13px", color: "var(--text-primary)",
            lineHeight: "1.7", borderTop: `1px solid ${segColor(result.segmento_idx).border}`,
            paddingTop: "12px",
          }}>
            <strong style={{ color: segColor(result.segmento_idx).text }}>Descripción del segmento:</strong>
            {" "}{result.descripcion}
          </div>
          {result.confianza !== undefined && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              Confianza: <strong style={{ color: "var(--text-primary)" }}>{(result.confianza * 100).toFixed(1)}%</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
