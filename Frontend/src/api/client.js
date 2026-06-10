// ── Configuración ──────────────────────────────────────────────
const BASE = "http://localhost:5000";

// Cambia a false cuando el backend de tu compañero esté listo
const MOCK_MODE = true;

// ── Helpers ────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error desconocido del servidor" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ── Mock responses ─────────────────────────────────────────────
const MOCKS = {
  upload: async (file) => {
    await delay(900);
    return {
      ok: true,
      archivo: file.name,
      registros: 1243,
      columnas: 10,
      distribucion: { riesgo: 387, no_riesgo: 856 },
      muestra: [
        { ingresos_mensuales: 3000,  deuda_activa: 25000, historial_pagos: 30, antiguedad_laboral: 1,  creditos_activos: 6, monto_solicitado: 40000, atrasos_previos: 5, dependientes_economicos: 4, utilizacion_credito: 95, riesgo: 1 },
        { ingresos_mensuales: 3200,  deuda_activa: 28000, historial_pagos: 31, antiguedad_laboral: 1,  creditos_activos: 5, monto_solicitado: 40000, atrasos_previos: 4, dependientes_economicos: 3, utilizacion_credito: 91, riesgo: 1 },
        { ingresos_mensuales: 12000, deuda_activa: 5000,  historial_pagos: 88, antiguedad_laboral: 9,  creditos_activos: 1, monto_solicitado: 20000, atrasos_previos: 0, dependientes_economicos: 2, utilizacion_credito: 22, riesgo: 0 },
        { ingresos_mensuales: 4700,  deuda_activa: 18500, historial_pagos: 55, antiguedad_laboral: 2,  creditos_activos: 3, monto_solicitado: 25000, atrasos_previos: 2, dependientes_economicos: 4, utilizacion_credito: 67, riesgo: 1 },
        { ingresos_mensuales: 9800,  deuda_activa: 3200,  historial_pagos: 94, antiguedad_laboral: 12, creditos_activos: 1, monto_solicitado: 10000, atrasos_previos: 0, dependientes_economicos: 0, utilizacion_credito: 15, riesgo: 0 },
      ],
    };
  },

  clean: async () => {
    await delay(1100);
    return {
      ok: true,
      registros_originales: 1243,
      registros_finales: 1229,
      nulos_total: 7,
      outliers_total: 14,
      eliminados: 14,
      columnas: [
        { nombre: "ingresos_mensuales",      nulos: 3, outliers: 2, accion: "Nulos reemplazados con mediana. 2 valores negativos corregidos a 0." },
        { nombre: "deuda_activa",            nulos: 1, outliers: 0, accion: "1 nulo reemplazado con mediana." },
        { nombre: "historial_pagos",         nulos: 0, outliers: 4, accion: "4 valores fuera de rango [0,100] ajustados al límite más cercano." },
        { nombre: "antiguedad_laboral",      nulos: 2, outliers: 0, accion: "2 nulos reemplazados con mediana." },
        { nombre: "creditos_activos",        nulos: 0, outliers: 0, accion: "Sin cambios." },
        { nombre: "monto_solicitado",        nulos: 1, outliers: 3, accion: "1 nulo eliminado. 3 montos iguales a 0 revisados y eliminados." },
        { nombre: "atrasos_previos",         nulos: 0, outliers: 0, accion: "Sin cambios." },
        { nombre: "dependientes_economicos", nulos: 0, outliers: 0, accion: "Sin cambios." },
        { nombre: "utilizacion_credito",     nulos: 0, outliers: 5, accion: "5 valores fuera de rango [0,100] ajustados al límite más cercano." },
      ],
    };
  },

  train: async () => {
    await delay(1500);
    return {
      ok: true,
      accuracy:  0.914,
      precision: 0.882,
      recall:    0.791,
      f1:        0.834,
      confusion_matrix: { vp: 273, vn: 820, fp: 42, fn: 65 },
    };
  },

  metrics: async () => {
    await delay(400);
    return {
      accuracy:  0.914,
      precision: 0.882,
      recall:    0.791,
      f1:        0.834,
      confusion_matrix: { vp: 273, vn: 820, fp: 42, fn: 65 },
    };
  },

  retrain: async (params) => {
    await delay(1200);
    const noise = () => (Math.random() - 0.5) * 0.06;
    const vp = Math.round(273 + (Math.random() - 0.5) * 40);
    const fp = Math.round(42  + (Math.random() - 0.5) * 20);
    const fn = Math.round(65  + (Math.random() - 0.5) * 20);
    const vn = Math.round(820 + (Math.random() - 0.5) * 40);
    return {
      ok: true,
      accuracy:  Math.min(0.99, 0.914 + noise()),
      precision: Math.min(0.99, 0.882 + noise()),
      recall:    Math.min(0.99, 0.791 + noise()),
      f1:        Math.min(0.99, 0.834 + noise()),
      confusion_matrix: { vp, vn, fp, fn },
      params,
    };
  },

  predict: async (data) => {
    await delay(600);
    const score =
      (data.atrasos_previos         > 2  ? 2 : 0) +
      (data.utilizacion_credito     > 80 ? 2 : 0) +
      (data.historial_pagos         < 50 ? 2 : 0) +
      (data.deuda_activa            > data.ingresos_mensuales * 3 ? 1 : 0) +
      (data.creditos_activos        > 4  ? 1 : 0) +
      (data.dependientes_economicos > 3  ? 1 : 0);
    return { prediccion: score >= 3 ? 1 : 0, score };
  },
};

// ── API pública ────────────────────────────────────────────────

/**
 * POST /upload
 * Respuesta esperada:
 * { ok, archivo, registros, columnas,
 *   distribucion: { riesgo, no_riesgo },
 *   muestra: [ { ...9 variables..., riesgo } ]  ← primeras 5 filas }
 */
export const uploadCSV = (file) => {
  if (MOCK_MODE) return MOCKS.upload(file);
  const form = new FormData();
  form.append("file", file);
  return fetch(`${BASE}/upload`, { method: "POST", body: form }).then(handleResponse);
};

/**
 * POST /clean
 * Respuesta esperada:
 * { ok, registros_originales, registros_finales, nulos_total, outliers_total, eliminados,
 *   columnas: [ { nombre, nulos, outliers, accion } ] }
 */
export const cleanData = () => {
  if (MOCK_MODE) return MOCKS.clean();
  return fetch(`${BASE}/clean`, { method: "POST" }).then(handleResponse);
};

/**
 * POST /train
 * Respuesta esperada:
 * { ok, accuracy, precision, recall, f1,
 *   confusion_matrix: { vp, vn, fp, fn } }
 */
export const trainModel = () => {
  if (MOCK_MODE) return MOCKS.train();
  return fetch(`${BASE}/train`, { method: "POST" }).then(handleResponse);
};

/**
 * GET /metrics
 * Respuesta esperada:
 * { accuracy, precision, recall, f1,
 *   confusion_matrix: { vp, vn, fp, fn } }
 */
export const getMetrics = () => {
  if (MOCK_MODE) return MOCKS.metrics();
  return fetch(`${BASE}/metrics`).then(handleResponse);
};

/**
 * POST /retrain
 * Body: { n_estimators, max_depth, max_leaf_nodes }
 * Respuesta esperada: igual que /train
 */
export const retrain = (params) => {
  if (MOCK_MODE) return MOCKS.retrain(params);
  return fetch(`${BASE}/retrain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then(handleResponse);
};

/**
 * POST /predict
 * Body: { ingresos_mensuales, deuda_activa, historial_pagos, antiguedad_laboral,
 *         creditos_activos, monto_solicitado, atrasos_previos,
 *         dependientes_economicos, utilizacion_credito }
 * Respuesta esperada: { prediccion: 0 | 1 }
 */
export const predict = (data) => {
  if (MOCK_MODE) return MOCKS.predict(data);
  return fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(handleResponse);
};