from flask import Blueprint, jsonify

import routes.upload as upload

from services.cleaner import (
    limpiar_freelancers,
    limpiar_resenas,
    combinar_stats
)

clean_bp = Blueprint("clean", __name__)


@clean_bp.route("/clean", methods=["POST"])
def clean():

    if upload.freelancers_df is None or upload.resenas_df is None:

        return jsonify({
            "ok": False,
            "message": "Primero cargue ambos archivos."
        }), 400

    freelancers_limpio, stats_fl = limpiar_freelancers(
        upload.freelancers_df
    )

    resenas_limpio, stats_rv = limpiar_resenas(
        upload.resenas_df
    )

    upload.freelancers_df = freelancers_limpio
    upload.resenas_df = resenas_limpio

    respuesta = combinar_stats(
        stats_fl,
        stats_rv
    )

    return jsonify(respuesta)