import { useState } from "react";
import { predict } from "../api/client";
import AlertMessage from "../components/AlertMessage";

const FIELDS = [
  { key: "ingresos_mensuales",      label: "Ingresos mensuales",         unit: "Q",  min: 0,   max: null, placeholder: "5000",  hint: "Ingresos mensuales en quetzales" },
  { key: "deuda_activa",            label: "Deuda activa",               unit: "Q",  min: 0,   max: null, placeholder: "2000",  hint: "Monto total de deuda activa en quetzales" },
  { key: "historial_pagos",         label: "Historial de pagos",         unit: "/100", min: 0, max: 100,  placeholder: "85",    hint: "Puntaje del historial de pagos (0–100)" },
  { key: "antiguedad_laboral",      label: "Antigüedad laboral",         unit: "años", min: 0, max: null, placeholder: "3",     hint: "Años trabajando en el empleo actual" },
  { key: "creditos_activos",        label: "Créditos activos",           unit: "#",  min: 0,   max: null, placeholder: "2",     hint: "Número de créditos activos simultáneos" },
  { key: "monto_solicitado",        label: "Monto solicitado",           unit: "Q",  min: 0,   max: null, placeholder: "10000", hint: "Monto del crédito que solicita" },
  { key: "atrasos_previos",         label: "Atrasos previos (12m)",      unit: "#",  min: 0,   max: null, placeholder: "0",     hint: "Número de atrasos en los últimos 12 meses" },
  { key: "dependientes_economicos", label: "Dependientes económicos",    unit: "#",  min: 0,   max: null, placeholder: "1",     hint: "Número de personas que dependen económicamente" },
  { key: "utilizacion_credito",     label: "Utilización de crédito",     unit: "%",  min: 0,   max: 100,  placeholder: "40",    hint: "Porcentaje del límite de crédito utilizado (0–100)" },
];

//  Componente principal -----------------------------------------------------------
export default function Prediccion({
  trained,
  form, setForm,
  result, setResult,
  errors, setErrors,
}) {
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    FIELDS.forEach(({ key, min, max }) => {
      const val = form[key];
      if (val === undefined || val === "") { errs[key] = "Campo requerido"; return; }
      const num = parseFloat(val);
      if (isNaN(num))      { errs[key] = "Debe ser un número"; return; }
      if (num < min)       { errs[key] = `Mínimo ${min}`; return; }
      if (max !== null && num > max) { errs[key] = `Máximo ${max}`; }
    });
    return errs;
  };

  const handleSubmit = async () => {
    if (!trained) { setAlert({ type: "error", msg: "El modelo no está entrenado. Ve a Carga de datos primero." }); return; }
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { setAlert({ type: "error", msg: "Corrige los campos marcados antes de continuar." }); return; }

    setLoading(true);
    setResult(null);
    try {
      const payload = Object.fromEntries(FIELDS.map(({ key }) => [key, parseFloat(form[key])]));
      const res = await predict(payload);
      setResult(res.prediccion); // 0 o 1
      setAlert(null);
    } catch (err) {
      setAlert({ type: "error", msg: `Error al predecir: ${err.message}` });
    }
    setLoading(false);
  };

  const handleReset = () => { setForm({}); setResult(null); setErrors({}); setAlert(null); };

  return (
    <div>
      <h1 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
        Predicción individual
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
        Ingresa los datos del solicitante para evaluar su riesgo de incumplimiento.
      </p>

      {alert && <AlertMessage {...alert} onClose={() => setAlert(null)} />}

      {!trained && (
        <AlertMessage type="info" msg="Entrena el modelo primero desde la sección de Carga de datos para habilitar predicciones." />
      )}

      {/* Form */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>
          Datos del solicitante
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
          {FIELDS.map(({ key, label, unit, min, max, placeholder, hint }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                {label} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({unit})</span>
              </label>
              <input
                type="number"
                placeholder={placeholder}
                min={min}
                max={max ?? undefined}
                value={form[key] ?? ""}
                disabled={!trained}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: null })); }}
                style={{
                  padding: "8px 10px", fontSize: "13px", borderRadius: "6px", fontFamily: "inherit",
                  border: `1px solid ${errors[key] ? "#c0392b" : "var(--border-color)"}`,
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)", outline: "none",
                  cursor: trained ? "text" : "not-allowed", opacity: trained ? 1 : 0.6,
                }}
              />
              {errors[key]
                ? <span style={{ fontSize: "10px", color: "#c0392b" }}>{errors[key]}</span>
                : <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{hint}</span>
              }
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!trained || loading}
            style={{ opacity: trained ? 1 : 0.5, cursor: trained ? "pointer" : "not-allowed" }}
          >
            {loading ? "Evaluando..." : "◎ Evaluar riesgo"}
          </button>
          <button className="btn" onClick={handleReset}>✕ Limpiar campos</button>
        </div>
      </div>

      {/* Result */}
      {result !== null && (
        <div style={{
          display: "flex", alignItems: "center", gap: "14px",
          padding: "18px 20px", borderRadius: "10px", fontSize: "15px", fontWeight: 600,
          ...(result === 1
            ? { background: "#fdecea", border: "1px solid #e74c3c", color: "#922b21" }
            : { background: "#e6f4ee", border: "1px solid #1D9E75", color: "#0F6E56" }),
        }}>
          <span style={{ fontSize: "28px" }}>{result === 1 ? "⚠" : "✓"}</span>
          <div>
            <div>{result === 1 ? "Riesgo de incumplimiento detectado" : "No presenta riesgo de incumplimiento"}</div>
            <div style={{ fontSize: "12px", fontWeight: 400, marginTop: "3px", opacity: 0.8 }}>
              {result === 1
                ? "Se recomienda revisar el perfil del solicitante antes de aprobar."
                : "El perfil del solicitante es favorable para otorgar el crédito."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}