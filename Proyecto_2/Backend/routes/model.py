from flask import Blueprint, request, jsonify
import routes.upload as upload
from services.model_service import entrenar_modelo

train_bp = Blueprint("train", __name__)

# Variables globales
modelo_freelancers = None
modelo_resenas = None

labels_freelancers = None
labels_resenas = None


@train_bp.route("/train", methods=["POST"])
def train():

    global modelo_freelancers
    global modelo_resenas

    global labels_freelancers
    global labels_resenas

    data = request.get_json()
    dataset = data["dataset"]
    algoritmo = data["algoritmo"]
    params = data["params"]
    vectorizacion = data.get("vectorizacion", "tfidf")

    if dataset == "freelancers":
        resultado = entrenar_modelo(
            df=upload.freelancers_df,
            dataset=dataset,
            algoritmo=algoritmo,
            params=params,
            df_rv=upload.resenas_df,
            labels_rv=labels_resenas
        )
        modelo_freelancers = resultado["_modelo"]
        labels_freelancers = resultado["_labels"]

    else:
        resultado = entrenar_modelo(
            df=upload.resenas_df,
            dataset=dataset,
            algoritmo=algoritmo,
            params=params,
            vectorizacion=vectorizacion,
            df_fl=upload.freelancers_df,
            labels_fl=labels_freelancers
        )
        modelo_resenas = resultado["_modelo"]
        labels_resenas = resultado["_labels"]

    # Eliminar objetos no serializables
    resultado.pop("_modelo")
    resultado.pop("_labels")
    resultado.pop("_scaler")
    resultado.pop("_vectorizador")
    resultado.pop("_X")

    return jsonify(resultado)