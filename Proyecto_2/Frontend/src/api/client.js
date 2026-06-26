// ── Configuración ──────────────────────────────────────────────
const BASE = "http://localhost:5000";
const MOCK_MODE = true; // cambiar a false cuando el backend esté listo

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error desconocido del servidor" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ── Helpers mock ───────────────────────────────────────────────
const rnd = (min, max, dec = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dec));

const pca = (n, cx, cy, spread = 1.5) =>
  Array.from({ length: n }, () => [
    parseFloat((cx + (Math.random() - 0.5) * spread).toFixed(3)),
    parseFloat((cy + (Math.random() - 0.5) * spread).toFixed(3)),
  ]);

// ── Mock responses ─────────────────────────────────────────────
const MOCKS = {

  uploadFreelancers: async (file) => {
    await delay(700);
    return {
      ok: true,
      archivo: file.name,
      registros: 5000,
      columnas: 11,
      muestra: [
        { freelancer_id:"FL0001", proyectos_completados:42, ingresos_totales:73500.53, tarifa_hora_promedio:107.08, anios_experiencia:14.5, tiempo_respuesta_horas:4.9, tasa_finalizacion:90.1, calificacion_promedio:4.26, categoria_principal:"Desarrollo de Software", clientes_recurrentes:8,  horas_trabajadas_mes:69.3  },
        { freelancer_id:"FL0002", proyectos_completados:37, ingresos_totales:4601.49,  tarifa_hora_promedio:20.75, anios_experiencia:3.4,  tiempo_respuesta_horas:7.3, tasa_finalizacion:68.1, calificacion_promedio:4.57, categoria_principal:"Diseño Gráfico",           clientes_recurrentes:10, horas_trabajadas_mes:85.5  },
        { freelancer_id:"FL0003", proyectos_completados:9,  ingresos_totales:2441.74,  tarifa_hora_promedio:16.61, anios_experiencia:1.8,  tiempo_respuesta_horas:43.2,tasa_finalizacion:54.9, calificacion_promedio:"sin dato", categoria_principal:"Diseño Gráfico",    clientes_recurrentes:2,  horas_trabajadas_mes:27.9  },
        { freelancer_id:"FL0004", proyectos_completados:47, ingresos_totales:9472.69,  tarifa_hora_promedio:22.31, anios_experiencia:2.6,  tiempo_respuesta_horas:7.1, tasa_finalizacion:79.9, calificacion_promedio:4.53, categoria_principal:"Diseño Gráfico",           clientes_recurrentes:11, horas_trabajadas_mes:73.0  },
        { freelancer_id:"FL0005", proyectos_completados:19, ingresos_totales:30214.17, tarifa_hora_promedio:61.33, anios_experiencia:5.0,  tiempo_respuesta_horas:6.8, tasa_finalizacion:87.1, calificacion_promedio:4.75, categoria_principal:"Marketing Digital",        clientes_recurrentes:13, horas_trabajadas_mes:56.6  },
      ],
    };
  },

  uploadResenas: async (file) => {
    await delay(700);
    return {
      ok: true,
      archivo: file.name,
      registros: 5000,
      columnas: 6,
      muestra: [
        { "reseña_id":"RV00001", freelancer_id:"FL0001", texto_reseña:"La comunicacion fue lo que mas valoro del trabajo realizado...", fecha_reseña:"2020-06-06", categoria_servicio:"Desarrollo de Software", longitud_reseña:245 },
        { "reseña_id":"RV00002", freelancer_id:"FL0001", texto_reseña:"La calidad final fue buena aunque el proceso fue mas largo...", fecha_reseña:"2021-05-14", categoria_servicio:"Desarrollo de Software", longitud_reseña:118 },
        { "reseña_id":"RV00005", freelancer_id:"FL0001", texto_reseña:"El precio es muy alto comparado con otros freelancers...",      fecha_reseña:"2023-02-12", categoria_servicio:"Desarrollo de Software", longitud_reseña:211 },
        { "reseña_id":"RV00006", freelancer_id:"FL0001", texto_reseña:"El precio cobrado fue excesivo para el resultado obtenido...",  fecha_reseña:"2021-03-06", categoria_servicio:"Desarrollo de Software", longitud_reseña:87  },
        { "reseña_id":"RV00009", freelancer_id:"FL0003", texto_reseña:"La comunicacion asertiva resolvio conflictos antes de...",      fecha_reseña:"2021-03-30", categoria_servicio:"Diseño Gráfico",        longitud_reseña:143 },
      ],
    };
  },

  limpiarDatos: async () => {
    await delay(1100);
    return {
      ok: true,
      registros_total:       10000,
      nulos_imputados:       312,
      duplicados_eliminados: 48,
      registros_corregidos:  95,
      longitud_calculada:    true,
      freelancers_finales:   4987,
      resenas_finales:       4965,
    };
  },

  entrenar: async ({ dataset, algoritmo, params }) => {
    await delay(2200);
    const k = params.k ?? 4;
    const total = dataset === "freelancers" ? 4987 : 4965;
    const segmentos = Array.from({ length: k }, (_, i) => {
      const n = Math.round(total / k + (Math.random() - 0.5) * 200);
      const centers = [[-3, 2], [3, -1], [-1, -3], [2, 3], [0, 0]];
      const [cx, cy] = centers[i % centers.length];
      return {
        id: i,
        n,
        pca_points: pca(Math.min(n, 80), cx, cy, 1.8),
        resumen: dataset === "freelancers"
          ? {
              proyectos_completados:  rnd(5, 120, 1),
              ingresos_totales:       rnd(2000, 80000, 0),
              tarifa_hora_promedio:   rnd(10, 180, 2),
              calificacion_promedio:  rnd(2.5, 5, 2),
              tasa_finalizacion:      rnd(45, 99, 1),
            }
          : { longitud_reseña: rnd(80, 350, 0), categoria_servicio: ["Desarrollo de Software","Diseño Gráfico","Marketing Digital"][i % 3] },
        descripcion: dataset === "freelancers"
          ? [
              "Freelancers de alto desempeño con tarifas elevadas, alta calificación y muchos proyectos completados. Perfil senior consolidado.",
              "Freelancers emergentes con pocos proyectos y tarifas bajas. Alta tasa de respuesta pero baja finalización.",
              "Freelancers de volumen medio, tarifas moderadas y buen historial de finalización. Perfil equilibrado.",
              "Freelancers especializados con ingresos altos concentrados en pocos proyectos de alto valor.",
            ][i % 4]
          : [
              "Reseñas que destacan la comunicación como factor clave, tanto positiva como negativamente.",
              "Reseñas enfocadas en precio y relación costo-beneficio. Mayoría positivas.",
              "Reseñas sobre calidad del trabajo entregado, con menciones a plazos y correcciones.",
              "Reseñas mixtas con menciones a retrasos y problemas de coordinación.",
            ][i % 4],
        palabras_clave: dataset === "resenas"
          ? [
              { word: "comunicacion", freq: 142 },
              { word: "calidad",      freq: 98  },
              { word: "precio",       freq: 87  },
              { word: "profesional",  freq: 76  },
              { word: "plazo",        freq: 65  },
              { word: "recomendable", freq: 54  },
              { word: "entrega",      freq: 48  },
              { word: "excelente",    freq: 43  },
            ].map(p => ({ ...p, freq: Math.round(p.freq * rnd(0.5, 1.5)) }))
          : [],
      };
    });

    const tabla_cruzada = dataset === "freelancers" && k >= 2 ? {
      segFreelancers: segmentos,
      segResenas: Array.from({ length: 4 }),
      datos: segmentos.map(() =>
        Array.from({ length: 4 }, () => ({ n: Math.round(rnd(10, 150)), pct: rnd(5, 40, 1) }))
      ),
    } : null;

    return {
      ok: true,
      dataset,
      algoritmo,
      total,
      segmentos,
      tabla_cruzada,
      columnas_resumen: dataset === "freelancers"
        ? ["proyectos_completados","ingresos_totales","tarifa_hora_promedio","calificacion_promedio","tasa_finalizacion"]
        : ["longitud_reseña","categoria_servicio"],
      metricas: {
        silhouette:         rnd(0.35, 0.72),
        davies_bouldin:     rnd(0.4,  1.2),
        calinski_harabasz:  rnd(120,  650,  1),
      },
      elbow_data: Array.from({ length: 9 }, (_, i) => ({
        k:     i + 2,
        value: algoritmo === "kmeans"
          ? rnd(50000, 200000) / (i + 1)
          : rnd(0.2, 0.75),
      })),
    };
  },

  clasificar: async ({ type, data }) => {
    await delay(700);
    const idx = Math.floor(Math.random() * 4);
    const descripciones = [
      "Freelancer de alto desempeño con tarifas elevadas y muchos proyectos completados. Perfil senior consolidado.",
      "Freelancer emergente con pocos proyectos y tarifas bajas. Alta tasa de respuesta pero baja finalización.",
      "Freelancer de volumen medio, tarifas moderadas y buen historial de finalización. Perfil equilibrado.",
      "Freelancer especializado con ingresos altos concentrados en pocos proyectos de alto valor.",
    ];
    const descripciones_rv = [
      "Reseña que destaca la comunicación como factor clave del proyecto.",
      "Reseña enfocada en precio y relación costo-beneficio. Valoración positiva.",
      "Reseña sobre calidad del trabajo entregado con menciones a plazos.",
      "Reseña con mención a coordinación y tiempos de entrega.",
    ];
    return {
      ok: true,
      segmento_idx: idx,
      descripcion:  type === "freelancer" ? descripciones[idx] : descripciones_rv[idx],
      confianza:    rnd(0.62, 0.97),
    };
  },

  exportar: async ({ elementos }) => {
    await delay(1500);
    const nombres = {
      freelancers_segmentado: "freelancers_segmentado.csv",
      resenas_segmentado:     "resenas_segmentado.csv",
      resumen_estadistico:    "resumen_estadistico.csv",
      metricas_evaluacion:    "metricas_evaluacion.csv",
      reporte_visual:         "reporte_visual.pdf",
    };
    return {
      ok: true,
      archivos: elementos.map(e => nombres[e]).filter(Boolean),
    };
  },
};

// ── API pública ────────────────────────────────────────────────

/** POST /upload/freelancers — sube el CSV de freelancers */
export const uploadFreelancers = (file) => {
  if (MOCK_MODE) return MOCKS.uploadFreelancers(file);
  const form = new FormData();
  form.append("file", file);
  return fetch(`${BASE}/upload/freelancers`, { method: "POST", body: form }).then(handleResponse);
};

/** POST /upload/resenas — sube el CSV de reseñas */
export const uploadResenas = (file) => {
  if (MOCK_MODE) return MOCKS.uploadResenas(file);
  const form = new FormData();
  form.append("file", file);
  return fetch(`${BASE}/upload/resenas`, { method: "POST", body: form }).then(handleResponse);
};

/** POST /clean — limpia ambos datasets cargados */
export const limpiarDatos = () => {
  if (MOCK_MODE) return MOCKS.limpiarDatos();
  return fetch(`${BASE}/clean`, { method: "POST" }).then(handleResponse);
};

/**
 * POST /train
 * Body: { dataset, algoritmo, params, vectorizacion? }
 * dataset: "freelancers" | "resenas"
 * algoritmo: "kmeans" | "dbscan" | "jerarquico"
 * params: { k, metrica } | { epsilon, min_puntos } | { k, enlace }
 * vectorizacion (solo reseñas): "tfidf" | "bow"
 */
export const entrenar = (payload) => {
  if (MOCK_MODE) return MOCKS.entrenar(payload);
  return fetch(`${BASE}/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
};

/**
 * POST /classify
 * Body: { type: "freelancer"|"resena", data: { ...campos } | { texto } }
 */
export const clasificar = (payload) => {
  if (MOCK_MODE) return MOCKS.clasificar(payload);
  return fetch(`${BASE}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
};

/**
 * POST /export
 * Body: { elementos: string[] }
 */
export const exportar = (payload) => {
  if (MOCK_MODE) return MOCKS.exportar(payload);
  return fetch(`${BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);
};
