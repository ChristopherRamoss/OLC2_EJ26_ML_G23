"""

Estos son los endpoints que vamos a usar que pide el front 
POST /upload/freelancers  → carga CSV de freelancers
POST /upload/resenas      → carga CSV de reseñas
POST /clean               → limpia ambos datasets
POST /train               → entrena modelo de clustering
POST /classify            → clasifica nuevo registro
POST /export              → genera lista de archivos exportables
GET  /export/download/<nombre> → descarga un archivo exportado

el get aun tiene clavos

"""

import io
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from services.cleaner   import limpiar_freelancers, limpiar_resenas, combinar_stats
from services.model_service    import entrenar_modelo, clasificar_freelancer, clasificar_resena
from services.exporter    import (
    exportar_freelancers_segmentado, exportar_resenas_segmentado,
    exportar_resumen_estadistico, exportar_metricas, exportar_pdf,
)
from services.persistence import guardar_modelo, cargar_modelo

# ── Inicialización ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Estado global en memoria ───────────────────────────────────
estado = {
    "df_fl_raw":    None,   # DataFrame crudo freelancers (post-upload)
    "df_rv_raw":    None,   # DataFrame crudo reseñas (post-upload)
    "df_fl":        None,   # DataFrame limpio freelancers
    "df_rv":        None,   # DataFrame limpio reseñas
    "resultado_fl": None,   # Resultado completo de entrenar_modelo (freelancers)
    "resultado_rv": None,   # Resultado completo de entrenar_modelo (reseñas)
    "_exportacion": None,   # Última exportación solicitada
}

# Intentar recuperar modelos guardados en disco al arrancar
print("Buscando modelos guardados en disco...")
estado["resultado_fl"] = cargar_modelo("freelancers")
estado["resultado_rv"] = cargar_modelo("resenas")


def err(msg, code=400):
    return jsonify({"message": msg}), code


 
# POST /upload/freelancers
 
@app.route("/upload/freelancers", methods=["POST"])
def upload_freelancers():
    if "file" not in request.files:
        return err("No se recibió ningún archivo.")
    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return err("El archivo debe ser un CSV.")
    try:
        df = pd.read_csv(file)
        estado["df_fl_raw"] = df
        estado["df_fl"]      = None
        estado["resultado_fl"] = None

        muestra = df.head(5).fillna("").to_dict(orient="records")
        return jsonify({
            "ok":        True,
            "archivo":   file.filename,
            "registros": len(df),
            "columnas":  len(df.columns),
            "muestra":   muestra,
        })
    except Exception as e:
        return err(f"Error al leer el CSV: {str(e)}")


 
# POST /upload/resenas
 
@app.route("/upload/resenas", methods=["POST"])
def upload_resenas():
    if "file" not in request.files:
        return err("No se recibió ningún archivo.")
    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return err("El archivo debe ser un CSV.")
    try:
        df = pd.read_csv(file)
        estado["df_rv_raw"] = df
        estado["df_rv"]      = None
        estado["resultado_rv"] = None

        muestra = df.head(5).fillna("").to_dict(orient="records")
        return jsonify({
            "ok":        True,
            "archivo":   file.filename,
            "registros": len(df),
            "columnas":  len(df.columns),
            "muestra":   muestra,
        })
    except Exception as e:
        return err(f"Error al leer el CSV: {str(e)}")


 
# POST /clean
 
@app.route("/clean", methods=["POST"])
def clean():
    if estado["df_fl_raw"] is None:
        return err("Carga primero el CSV de freelancers.")
    if estado["df_rv_raw"] is None:
        return err("Carga primero el CSV de reseñas.")
    try:
        df_fl_l, stats_fl = limpiar_freelancers(estado["df_fl_raw"])
        df_rv_l, stats_rv = limpiar_resenas(estado["df_rv_raw"])

        estado["df_fl"]      = df_fl_l
        estado["df_rv"]      = df_rv_l
        estado["resultado_fl"] = None
        estado["resultado_rv"] = None

        return jsonify(combinar_stats(stats_fl, stats_rv))
    except ValueError as e:
        return err(str(e))
    except Exception as e:
        return err(f"Error en limpieza: {str(e)}", 500)


 
# POST /train
 
@app.route("/train", methods=["POST"])
def train():
    if estado["df_fl"] is None or estado["df_rv"] is None:
        return err("Limpia los datos primero con /clean.")

    body = request.get_json()
    if not body:
        return err("No se recibieron parámetros.")

    dataset       = body.get("dataset",       "freelancers")
    algoritmo     = body.get("algoritmo",     "kmeans")
    params        = body.get("params",        {})
    vectorizacion = body.get("vectorizacion", "tfidf")

    if dataset not in ("freelancers", "resenas"):
        return err("dataset debe ser 'freelancers' o 'resenas'.")
    if algoritmo not in ("kmeans", "dbscan", "jerarquico"):
        return err("algoritmo debe ser 'kmeans', 'dbscan' o 'jerarquico'.")

    try:
        res_fl_prev = estado["resultado_fl"]
        res_rv_prev = estado["resultado_rv"]

        resultado = entrenar_modelo(
            df            = estado["df_fl"] if dataset == "freelancers" else estado["df_rv"],
            dataset       = dataset,
            algoritmo     = algoritmo,
            params        = params,
            vectorizacion = vectorizacion,
            df_fl         = estado["df_fl"],
            labels_fl     = np.array(res_fl_prev["_labels"]) if res_fl_prev else None,
            df_rv         = estado["df_rv"],
            labels_rv     = np.array(res_rv_prev["_labels"]) if res_rv_prev else None,
        )

        if dataset == "freelancers":
            estado["resultado_fl"] = resultado
        else:
            estado["resultado_rv"] = resultado

        # Serializar en disco para persistencia entre reinicios
        guardar_modelo(dataset, resultado)

        # Respuesta sin artefactos internos (no son serializables a JSON)
        respuesta = {k: v for k, v in resultado.items() if not k.startswith("_")}
        return jsonify(respuesta)

    except Exception as e:
        return err(f"Error al entrenar: {str(e)}", 500)


 
# POST /classify
 
@app.route("/classify", methods=["POST"])
def classify():
    body = request.get_json()
    if not body:
        return err("No se recibieron datos.")

    tipo = body.get("type", "freelancer")
    data = body.get("data", {})

    if tipo == "freelancer":
        res = estado["resultado_fl"]
        if res is None:
            return err("No hay modelo de Freelancers entrenado.")
        try:
            seg_idx, confianza = clasificar_freelancer(
                datos                = data,
                modelo               = res["_modelo"],
                scaler               = res["_scaler"],
                algoritmo            = res["algoritmo"],
                X_entrenamiento      = res["_X"],
                labels_entrenamiento = np.array(res["_labels"]),
            )
            seg_info    = next((s for s in res["segmentos"] if s["id"] == seg_idx), None)
            descripcion = seg_info["descripcion"] if seg_info else "Sin descripción disponible."
            return jsonify({
                "ok":           True,
                "segmento_idx": seg_idx,
                "descripcion":  descripcion,
                "confianza":    confianza,
            })
        except Exception as e:
            return err(f"Error al clasificar freelancer: {str(e)}", 500)

    elif tipo == "resena":
        res = estado["resultado_rv"]
        if res is None:
            return err("No hay modelo de Reseñas entrenado.")
        texto = data.get("texto", "").strip()
        if not texto:
            return err("El texto de la reseña no puede estar vacío.")
        try:
            seg_idx, confianza = clasificar_resena(
                texto                = texto,
                modelo               = res["_modelo"],
                vectorizador         = res["_vectorizador"],
                algoritmo            = res["algoritmo"],
                X_entrenamiento      = res["_X"],
                labels_entrenamiento = np.array(res["_labels"]),
            )
            seg_info    = next((s for s in res["segmentos"] if s["id"] == seg_idx), None)
            descripcion = seg_info["descripcion"] if seg_info else "Sin descripción disponible."
            return jsonify({
                "ok":           True,
                "segmento_idx": seg_idx,
                "descripcion":  descripcion,
                "confianza":    confianza,
            })
        except Exception as e:
            return err(f"Error al clasificar reseña: {str(e)}", 500)

    return err("type debe ser 'freelancer' o 'resena'.")


 
# POST /export
 
@app.route("/export", methods=["POST"])
def export():
    body = request.get_json()
    if not body:
        return err("No se recibieron parámetros.")

    elementos = body.get("elementos", [])
    if not elementos:
        return err("Selecciona al menos un elemento para exportar.")

    res_fl = estado["resultado_fl"]
    res_rv = estado["resultado_rv"]
    df_fl  = estado["df_fl"]
    df_rv  = estado["df_rv"]

    # Validar disponibilidad de cada elemento
    VALIDACIONES = {
        "freelancers_segmentado": (res_fl is None or df_fl is None, "Entrena el modelo de Freelancers primero."),
        "resenas_segmentado":     (res_rv is None or df_rv is None, "Entrena el modelo de Reseñas primero."),
        "resumen_estadistico":    (res_fl is None,                  "Entrena el modelo de Freelancers primero."),
        "metricas_evaluacion":    (res_fl is None and res_rv is None, "Entrena al menos un modelo primero."),
        "reporte_visual":         (res_fl is None and res_rv is None, "Entrena al menos un modelo primero."),
    }
    NOMBRES = {
        "freelancers_segmentado": "freelancers_segmentado.csv",
        "resenas_segmentado":     "resenas_segmentado.csv",
        "resumen_estadistico":    "resumen_estadistico.csv",
        "metricas_evaluacion":    "metricas_evaluacion.csv",
        "reporte_visual":         "reporte_visual.pdf",
    }

    for elem in elementos:
        falla, mensaje = VALIDACIONES.get(elem, (False, ""))
        if falla:
            return err(mensaje)

    # Guardar contexto para los endpoints de descarga
    estado["_exportacion"] = {
        "elementos": elementos,
        "res_fl": res_fl, "res_rv": res_rv,
        "df_fl":  df_fl,  "df_rv":  df_rv,
    }

    return jsonify({
        "ok":      True,
        "archivos": [NOMBRES[e] for e in elementos if e in NOMBRES],
    })


 
# GET /export/download/<nombre>
 
@app.route("/export/download/<nombre>", methods=["GET"])
def download(nombre):
    exp = estado.get("_exportacion")
    if not exp:
        return err("No hay exportación disponible. Llama a /export primero.")

    res_fl = exp["res_fl"]
    res_rv = exp["res_rv"]
    df_fl  = exp["df_fl"]
    df_rv  = exp["df_rv"]

    try:
        if nombre == "freelancers_segmentado.csv":
            data     = exportar_freelancers_segmentado(df_fl, res_fl["_labels"])
            mimetype = "text/csv"
        elif nombre == "resenas_segmentado.csv":
            data     = exportar_resenas_segmentado(df_rv, res_rv["_labels"])
            mimetype = "text/csv"
        elif nombre == "resumen_estadistico.csv":
            data     = exportar_resumen_estadistico(df_fl, res_fl["_labels"], res_fl["segmentos"])
            mimetype = "text/csv"
        elif nombre == "metricas_evaluacion.csv":
            data     = exportar_metricas(res_fl, res_rv)
            mimetype = "text/csv"
        elif nombre == "reporte_visual.pdf":
            data     = exportar_pdf(res_fl, res_rv)
            mimetype = "application/pdf"
        else:
            return err(f"Archivo '{nombre}' no reconocido.")

        return send_file(
            io.BytesIO(data),
            mimetype=mimetype,
            as_attachment=True,
            download_name=nombre,
        )
    except Exception as e:
        return err(f"Error al generar {nombre}: {str(e)}", 500)


 
@app.route("/")
def home():
    return jsonify({
        "message": "TalentMosaic Backend funcionando",
        "version": "1.0.0",
        "modelos_en_memoria": {
            "freelancers": estado["resultado_fl"] is not None,
            "resenas":     estado["resultado_rv"] is not None,
        }
    })


if __name__ == "__main__":
    print("=" * 50)
    print("  TalentMosaic Backend")
    print("  http://localhost:5000")
    print("=" * 50)
    app.run(port=5000, debug=True)