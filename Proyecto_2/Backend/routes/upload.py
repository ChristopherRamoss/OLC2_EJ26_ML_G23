from flask import Blueprint, request, jsonify
import pandas as pd

upload_bp = Blueprint("upload", __name__)

# DataFrames en memoria
freelancers_df = None
resenas_df = None


@upload_bp.route("/upload/freelancers", methods=["POST"])
def upload_freelancers():

    global freelancers_df

    if "file" not in request.files:
        return jsonify({
            "ok": False,
            "message": "No se recibió ningún archivo."
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "ok": False,
            "message": "Debe seleccionar un archivo."
        }), 400

    try:

        freelancers_df = pd.read_csv(file)

        return jsonify({
            "ok": True,
            "archivo": file.filename,
            "registros": len(freelancers_df),
            "columnas": len(freelancers_df.columns),
            "muestra": freelancers_df.head(5).fillna("").to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "message": str(e)
        }), 500


@upload_bp.route("/upload/resenas", methods=["POST"])
def upload_resenas():

    global resenas_df

    if "file" not in request.files:
        return jsonify({
            "ok": False,
            "message": "No se recibió ningún archivo."
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "ok": False,
            "message": "Debe seleccionar un archivo."
        }), 400

    try:

        resenas_df = pd.read_csv(file)

        return jsonify({
            "ok": True,
            "archivo": file.filename,
            "registros": len(resenas_df),
            "columnas": len(resenas_df.columns),
            "muestra": resenas_df.head(5).fillna("").to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({
            "ok": False,
            "message": str(e)
        }), 500