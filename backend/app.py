from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from cleaner import limpiar_datos

app = Flask(__name__)
CORS(app)

df_original = None
df_limpio = None

@app.route("/")
def home():
    return jsonify({"message": "Backend funcionando"})

@app.route("/upload", methods=["POST"])
def upload_file():
    global df_original
    try:
        if "file" not in request.files:
            return jsonify({"message": "No se recibió ningún archivo"}), 400
        
        file = request.files["file"]
        df_original = pd.read_csv(file)

        muestra = (
            df_original
            .head(5)
            .fillna("")
            .to_dict(orient="records")
        )

        return jsonify({
            "ok": True,
            "archivo": file.filename,
            "registros": len(df_original),
            "columnas": len(df_original.columns),
            "distribucion":{
                "riesgo": int(df_original["riesgo"].sum()),
                "no_riesgo": int((df_original["riesgo"] == 0).sum())
            },
            "muestra": muestra
        })
    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 400
    
@app.route("/clean", methods=["POST"])
def clean():

    global df_original
    global df_limpio

    try:

        if df_original is None:
            return jsonify({
                "message": "Primero debe cargar un archivo CSV"
            }), 400

        resultado = limpiar_datos(df_original)

        df_limpio = resultado["df"]

        print("========== LIMPIEZA ==========")
        print("Antes:", len(df_original))

        resultado = limpiar_datos(df_original)

        print("Después:", len(resultado["df"]))
        print(resultado)
        print("==============================")

        return jsonify({
            "ok": True,
            "registros_originales": resultado["registros_originales"],
            "registros_finales": resultado["registros_finales"],
            "nulos_total": resultado["nulos_total"],
            "outliers_total": resultado["negativos"],
            "eliminados": resultado["eliminados"],
            "columnas": [
                {
                    "nombre": "ingresos_mensuales",
                    "nulos": resultado["nulos_total"],
                    "outliers": resultado["negativos"],
                    "accion": "Nulos reemplazados con mediana. Valores negativos corregidos a 0."
                }
            ]
        })

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 400
    
if __name__ == "__main__":
    app.run(port=5000, debug=True)