from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

df_original = None

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

        return jsonify({
            "ok": True,
            "archivo": file.filename,
            "registros": len(df_original),
            "columnas": len(df_original.columns),
            "distribucion":{
                "riesgo": int(df_original["riesgo"].sum()),
                "no_riesgo": int((df_original["riesgo"] == 0).sum())
            },
            "muestra": df_original.head(5).to_dict(orient="records")
        })
    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 400
    
if __name__ == "__main__":
    app.run(port=5000, debug=True)