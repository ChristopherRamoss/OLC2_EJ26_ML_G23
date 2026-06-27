
import os
import json
import numpy as np
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def _asegurar_carpeta():
    os.makedirs(MODELS_DIR, exist_ok=True)


def _ruta(nombre: str) -> str:
    return os.path.join(MODELS_DIR, nombre)


# GUARDAR
def guardar_modelo(dataset: str, resultado: dict):

    _asegurar_carpeta()

    prefijo = f"{dataset}"

    # 1. Modelo sklearn
    joblib.dump(resultado["_modelo"], _ruta(f"{prefijo}_modelo.joblib"))

    # 2. Scaler (solo freelancers)
    if resultado["_scaler"] is not None:
        joblib.dump(resultado["_scaler"], _ruta(f"{prefijo}_scaler.joblib"))

    # 3. Vectorizador (solo reseñas)
    if resultado["_vectorizador"] is not None:
        joblib.dump(resultado["_vectorizador"], _ruta(f"{prefijo}_vectorizador.joblib"))

    # 4. Labels como numpy array
    np.save(_ruta(f"{prefijo}_labels.npy"), np.array(resultado["_labels"]))

    # 5. Matriz X de entrenamiento (para vecino más cercano en DBSCAN/Jerárquico)
    #    Las matrices sparse se guardan con joblib también
    joblib.dump(resultado["_X"], _ruta(f"{prefijo}_X.joblib"))

    # 6. Metadatos serializables (segmentos, métricas, descripciones)
    meta = {k: v for k, v in resultado.items() if not k.startswith("_")}
    with open(_ruta(f"{prefijo}_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"[persistence] Modelo '{dataset}' guardado en {MODELS_DIR}/")


# CARGAR

def cargar_modelo(dataset: str) -> dict | None:

    prefijo    = f"{dataset}"
    ruta_meta  = _ruta(f"{prefijo}_meta.json")
    ruta_modelo = _ruta(f"{prefijo}_modelo.joblib")

    if not os.path.exists(ruta_meta) or not os.path.exists(ruta_modelo):
        return None

    try:
        # Metadatos
        with open(ruta_meta, "r", encoding="utf-8") as f:
            resultado = json.load(f)

        # Artefactos binarios
        resultado["_modelo"]  = joblib.load(ruta_modelo)
        resultado["_labels"]  = np.load(_ruta(f"{prefijo}_labels.npy")).tolist()
        resultado["_X"]       = joblib.load(_ruta(f"{prefijo}_X.joblib"))

        scaler_path = _ruta(f"{prefijo}_scaler.joblib")
        resultado["_scaler"]  = joblib.load(scaler_path) if os.path.exists(scaler_path) else None

        vec_path = _ruta(f"{prefijo}_vectorizador.joblib")
        resultado["_vectorizador"] = joblib.load(vec_path) if os.path.exists(vec_path) else None

        print(f"[persistence] Modelo '{dataset}' cargado desde {MODELS_DIR}/")
        return resultado

    except Exception as e:
        print(f"[persistence] Error al cargar modelo '{dataset}': {e}")
        return None


def modelo_existe(dataset: str) -> bool:
    """Verifica si hay un modelo guardado en disco para ese dataset."""
    return (
        os.path.exists(_ruta(f"{dataset}_meta.json")) and
        os.path.exists(_ruta(f"{dataset}_modelo.joblib"))
    )