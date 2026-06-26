from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from cleaner import limpiar_datos
from model import entrenar, FEATURES

app = Flask(__name__)
CORS(app)

# Estado global en memoria  ----------------------------------------------------------------------------------------
df_original = None
df_limpio   = None
modelo      = None
metricas    = None


# Ruta de prueba
@app.route("/")
def home():
    return jsonify({"message": "CreditGuard Backend funcionando"})


# POST /upload (esto carga el CSV) ----------------------------------------------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    global df_original
    try:
        if "file" not in request.files:
            return jsonify({"message": "No se recibió ningún archivo"}), 400

        file        = request.files["file"]
        df_original = pd.read_csv(file)

        muestra = (
            df_original
            .head(5)
            .fillna("")
            .to_dict(orient="records")
        )

        return jsonify({
            "ok":        True,
            "archivo":   file.filename,
            "registros": len(df_original),
            "columnas":  len(df_original.columns),
            "distribucion":{
                "riesgo":    int(df_original["en_riesgo"].sum()),
                "no_riesgo": int((df_original["en_riesgo"] == 0).sum())
            },
            "muestra": muestra
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 400


# POST /clean  ( esto limpia los datos) ----------------------------------------------------------------------------------------
@app.route("/clean", methods=["POST"])
def clean():
    global df_original, df_limpio, modelo, metricas

    try:
        if df_original is None:
            return jsonify({"message": "Primero debe cargar un archivo CSV"}), 400

        resultado = limpiar_datos(df_original)
        df_limpio = resultado["df"]

        # Resetear modelo al limpiar nuevamente
        modelo   = None
        metricas = None

        return jsonify({
            "ok":                   True,
            "registros_originales": resultado["registros_originales"],
            "registros_finales":    resultado["registros_finales"],
            "nulos_total":          resultado["nulos_total"],
            "outliers_total":       resultado["outliers_total"],
            "eliminados":           resultado["eliminados"],
            "columnas":             resultado["columnas"]
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 400


# POST /train (esto entrena el modelo) ----------------------------------------------------------------------------------------

@app.route("/train", methods=["POST"])
def train():
    global df_limpio, modelo, metricas

    try:
        if df_limpio is None:
            return jsonify({"message": "Primero debe limpiar los datos con /clean"}), 400

        modelo, metricas = entrenar(
            df_limpio,
            n_estimators   = 100,
            max_depth      = 5,
            max_leaf_nodes = 20,
        )

        return jsonify({"ok": True, **metricas})

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# GET /metrics (esto devuelve las métricas del último entrenamiento) ----------------------------------------------------------------------------------------
@app.route("/metrics", methods=["GET"])
def get_metrics():
    try:
        if metricas is None:
            return jsonify({"message": "El modelo no está entrenado todavía"}), 400

        return jsonify(metricas)

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# POST /retrain (esto reentrena el modelo con nuevos hiperparámetros) ----------------------------------------------------------------------------------------
@app.route("/retrain", methods=["POST"])
def retrain():
    global modelo, metricas

    try:
        if df_limpio is None:
            return jsonify({"message": "Primero debe limpiar los datos con /clean"}), 400

        params = request.get_json()
        if not params:
            return jsonify({"message": "No se recibieron hiperparámetros"}), 400

        n_estimators   = int(params.get("n_estimators",   100))
        max_depth      = int(params.get("max_depth",        5))
        max_leaf_nodes = int(params.get("max_leaf_nodes",  20))

        modelo, metricas = entrenar(
            df_limpio,
            n_estimators   = n_estimators,
            max_depth      = max_depth,
            max_leaf_nodes = max_leaf_nodes,
        )

        return jsonify({"ok": True, **metricas})

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# POST /predict (esto realiza predicciones con el modelo entrenado) --------------------------------------------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if modelo is None:
            return jsonify({"message": "El modelo no está entrenado todavía"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"message": "No se recibieron datos del solicitante"}), 400

        # Verificar que estén todos los campos
        faltantes = [f for f in FEATURES if f not in data]
        if faltantes:
            return jsonify({"message": f"Campos faltantes: {', '.join(faltantes)}"}), 400

        # Construir vector en el orden exacto que usó el entrenamiento
        features = [[
            float(data["ingresos_mensuales"]),
            float(data["deuda_activa"]),
            float(data["historial_pagos"]),
            float(data["antiguedad_laboral"]),
            float(data["creditos_activos"]),
            float(data["monto_solicitado"]),
            float(data["atrasos_previos"]),
            float(data["dependientes_economicos"]),
            float(data["utilizacion_credito"]),
        ]]

        prediccion = modelo.predict(features)[0]

        return jsonify({"prediccion": int(prediccion)})

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ══════════════════════════════════════════════════════════════ main xd
if __name__ == "__main__":
    print("=" * 45)
    print("  CreditGuard Backend")
    print("  http://localhost:5000")
    print("=" * 45)
    app.run(port=5000, debug=True)