from flask import Blueprint, request, jsonify

from services.persistence import cargar_modelo

persis_bp = Blueprint("persis", __name__)

@persis_bp.route("/classify", methods=["POST"])
def classify():

    data = request.get_json()

    dataset = data["dataset"]

    modelo = cargar_modelo(dataset)

    if modelo is None:

        return jsonify({

            "ok": False,

            "message": "Debe entrenar primero."

        }), 400

    ...

