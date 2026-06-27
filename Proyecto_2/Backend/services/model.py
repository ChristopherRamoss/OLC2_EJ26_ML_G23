

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.metrics.pairwise import euclidean_distances

# ── Features para clustering de freelancers ────────────────────
FEATURES_FL = [
    "proyectos_completados", "ingresos_totales", "tarifa_hora_promedio",
    "anios_experiencia",     "tiempo_respuesta_horas", "tasa_finalizacion",
    "calificacion_promedio", "clientes_recurrentes",   "horas_trabajadas_mes",
]

# Columnas numéricas para el resumen por segmento
RESUMEN_FL = [
    "proyectos_completados", "ingresos_totales", "tarifa_hora_promedio",
    "calificacion_promedio", "tasa_finalizacion",
]

RESUMEN_RV = ["longitud_reseña", "categoria_servicio"]

# Stopwords básicas en español
STOPWORDS_ES = [
    "de", "la", "el", "en", "y", "a", "los", "del", "se", "las", "por",
    "un", "una", "con", "no", "lo", "le", "su", "al", "fue", "es", "que",
    "para", "este", "como", "más", "pero", "muy", "este", "esta", "esto",
    "me", "mi", "te", "tu", "nos", "vos", "si", "ya", "todo", "cada",
    "otro", "era", "han", "hay", "he", "has", "ha", "o", "e", "u",
]



# PREPROCESAMIENTO

def preparar_features_freelancers(df: pd.DataFrame):
    """
    Normaliza las variables numéricas de freelancers con StandardScaler.
    Retorna (X_scaled, scaler).
    """
    X = df[FEATURES_FL].values.astype(float)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, scaler


def preparar_texto_resenas(df: pd.DataFrame, tecnica: str = "tfidf"):

    textos = df["texto_reseña"].fillna("").astype(str).tolist()

    if tecnica == "tfidf":
        vec = TfidfVectorizer(
            stop_words=STOPWORDS_ES,
            ngram_range=(1, 2),
            max_features=2000,
            min_df=2,
            max_df=0.95,
        )
    else:  # bow
        vec = CountVectorizer(
            stop_words=STOPWORDS_ES,
            ngram_range=(1, 2),
            max_features=2000,
            min_df=2,
            max_df=0.95,
        )

    X_vec = vec.fit_transform(textos)
    return X_vec, vec


def reducir_pca(X, n_components: int = 2):

    if hasattr(X, "toarray"):
        X = X.toarray()
    pca = PCA(n_components=n_components, random_state=42)
    return pca.fit_transform(X)



# CLUSTERING

def entrenar_kmeans(X, k: int = 4, metrica: str = "euclidiana"):
    """
    Entrena K-Means.
    K-Means soporta .predict nativo → clasificación directa de nuevos registros.
    """
    modelo = KMeans(
        n_clusters=k,
        init="k-means++",   # inicialización inteligente
        n_init=10,
        max_iter=300,
        random_state=42,
    )
    labels = modelo.fit_predict(X if not hasattr(X, "toarray") else X.toarray())
    return modelo, labels


def entrenar_dbscan(X, epsilon: float = 0.5, min_puntos: int = 5):

    X_arr = X.toarray() if hasattr(X, "toarray") else X
    modelo = DBSCAN(eps=epsilon, min_samples=min_puntos, metric="euclidean")
    labels = modelo.fit_predict(X_arr)
    return modelo, labels


def entrenar_jerarquico(X, k: int = 4, enlace: str = "ward"):

    X_arr = X.toarray() if hasattr(X, "toarray") else X
    modelo = AgglomerativeClustering(n_clusters=k, linkage=enlace)
    labels = modelo.fit_predict(X_arr)
    return modelo, labels



# MÉTRICAS

def calcular_metricas(X, labels):

    X_arr = X.toarray() if hasattr(X, "toarray") else X
    labels = np.array(labels)

    # Excluir ruido de DBSCAN (label = -1)
    mask   = labels >= 0
    X_val  = X_arr[mask]
    l_val  = labels[mask]

    n_clusters = len(set(l_val))

    if n_clusters < 2 or len(X_val) < n_clusters + 1:
        return {
            "silhouette":        None,
            "davies_bouldin":    None,
            "calinski_harabasz": None,
        }

    return {
        "silhouette":        round(float(silhouette_score(X_val, l_val)),        4),
        "davies_bouldin":    round(float(davies_bouldin_score(X_val, l_val)),    4),
        "calinski_harabasz": round(float(calinski_harabasz_score(X_val, l_val)), 2),
    }


def calcular_elbow(X, k_range=range(2, 11), algoritmo="kmeans"):

    X_arr = X.toarray() if hasattr(X, "toarray") else X
    datos = []
    for k in k_range:
        if k >= len(X_arr):
            break
        if algoritmo == "kmeans":
            km = KMeans(n_clusters=k, init="k-means++", n_init=5,
                        max_iter=100, random_state=42)
            km.fit(X_arr)
            datos.append({"k": k, "value": round(float(km.inertia_), 2)})
        else:
            if algoritmo == "jerarquico":
                m = AgglomerativeClustering(n_clusters=k)
            else:
                m = KMeans(n_clusters=k, n_init=5, random_state=42)
            lbl = m.fit_predict(X_arr)
            if len(set(lbl)) >= 2:
                sil = silhouette_score(X_arr, lbl)
                datos.append({"k": k, "value": round(float(sil), 4)})
    return datos


# PERFILADO DE SEGMENTOS


def _descripcion_freelancer(seg_df: pd.DataFrame, idx: int) -> str:
    """Genera descripción textual automática de un segmento de freelancers."""
    proy  = seg_df["proyectos_completados"].mean()
    ing   = seg_df["ingresos_totales"].mean()
    tarif = seg_df["tarifa_hora_promedio"].mean()
    cal   = seg_df["calificacion_promedio"].mean()
    tasa  = seg_df["tasa_finalizacion"].mean()
    resp  = seg_df["tiempo_respuesta_horas"].mean()

    nivel = "alto" if cal >= 4.5 else "moderado" if cal >= 3.5 else "bajo"
    exp   = "senior" if proy > 50 else "intermedio" if proy > 20 else "junior"
    tarif_lvl = "alta" if tarif > 80 else "media" if tarif > 30 else "baja"

    return (
        f"Freelancers de perfil {exp} con {proy:.0f} proyectos completados en promedio "
        f"e ingresos de ${ing:,.0f} USD. Tarifa {tarif_lvl} (${tarif:.0f}/hr), "
        f"calificación {nivel} ({cal:.2f}/5) y tasa de finalización del {tasa:.1f}%. "
        f"Tiempo de respuesta promedio: {resp:.1f} horas."
    )


def _descripcion_resena(palabras: list, idx: int) -> str:
    top = [p["word"] for p in sorted(palabras, key=lambda x: x["freq"], reverse=True)[:5]]
    return (
        f"Segmento de reseñas cuyo tema predominante gira en torno a: "
        f"{', '.join(top)}. "
        f"Estas reseñas comparten patrones lingüísticos y temáticos que las distinguen "
        f"de los demás grupos identificados por el modelo."
    )


def _palabras_clave(df: pd.DataFrame, labels: np.ndarray, seg_idx: int,
                    vectorizador=None, top_n: int = 20) -> list:
    
    textos = df.loc[labels == seg_idx, "texto_reseña"].fillna("").tolist()
    if not textos:
        return []

    # Usar el vectorizador ya ajustado si existe
    if vectorizador is not None:
        X = vectorizador.transform(textos)
        freqs = np.asarray(X.sum(axis=0)).flatten()
        nombres = vectorizador.get_feature_names_out()
        idx_top = freqs.argsort()[::-1][:top_n]
        return [{"word": nombres[i], "freq": int(freqs[i])} for i in idx_top if freqs[i] > 0]

    # Fallback: frecuencia simple de palabras
    from collections import Counter
    palabras = " ".join(textos).lower().split()
    palabras = [p for p in palabras if p not in STOPWORDS_ES and len(p) > 3]
    conteo   = Counter(palabras).most_common(top_n)
    return [{"word": w, "freq": f} for w, f in conteo]


def construir_segmentos(df_original, labels, X_scaled, dataset,
                        columnas_resumen, vectorizador=None):

    labels = np.array(labels)
    ids_validos = sorted([l for l in set(labels) if l >= 0])  # excluye ruido DBSCAN (-1)
    X_pca = reducir_pca(X_scaled)

    segmentos = []
    for i, seg_id in enumerate(ids_validos):
        mask    = labels == seg_id
        seg_df  = df_original[mask].copy()
        n       = int(mask.sum())

        # PCA points para scatter plot (máx 100 puntos para no saturar)
        pts_idx = np.where(mask)[0]
        if len(pts_idx) > 100:
            pts_idx = np.random.choice(pts_idx, 100, replace=False)
        pca_points = [[round(float(X_pca[j, 0]), 3), round(float(X_pca[j, 1]), 3)]
                      for j in pts_idx]

        # Resumen por columna
        resumen = {}
        for col in columnas_resumen:
            if col in seg_df.columns:
                if seg_df[col].dtype in [np.float64, np.int64, float, int]:
                    resumen[col] = round(float(seg_df[col].mean()), 2)
                else:
                    moda = seg_df[col].mode()
                    resumen[col] = moda[0] if len(moda) > 0 else "—"

        # Palabras clave y descripción
        if dataset == "resenas":
            palabras   = _palabras_clave(df_original, labels, seg_id, vectorizador)
            descripcion = _descripcion_resena(palabras, i)
        else:
            palabras    = []
            descripcion = _descripcion_freelancer(seg_df, i)

        segmentos.append({
            "id":           i,
            "n":            n,
            "pca_points":   pca_points,
            "resumen":      resumen,
            "descripcion":  descripcion,
            "palabras_clave": palabras,
        })

    return segmentos


# TABLA CRUZADA


def construir_tabla_cruzada(df_fl, labels_fl, df_rv, labels_rv):
    
    if df_fl is None or df_rv is None:
        return None

    df_fl = df_fl.copy()
    df_rv = df_rv.copy()
    df_fl["_seg_fl"] = labels_fl
    df_rv["_seg_rv"] = labels_rv

    # Join por freelancer_id
    merged = df_rv.merge(
        df_fl[["freelancer_id", "_seg_fl"]],
        on="freelancer_id", how="inner"
    )
    if merged.empty:
        return None

    segs_fl = sorted([s for s in set(labels_fl) if s >= 0])
    segs_rv = sorted([s for s in set(labels_rv) if s >= 0])

    datos = []
    for fi in segs_fl:
        fila = []
        sub  = merged[merged["_seg_fl"] == fi]
        total_fi = len(sub)
        for ri in segs_rv:
            n   = int((sub["_seg_rv"] == ri).sum())
            pct = round((n / total_fi * 100), 1) if total_fi > 0 else 0.0
            fila.append({"n": n, "pct": pct})
        datos.append(fila)

    return {
        "segFreelancers": [{"id": i} for i in segs_fl],
        "segResenas":     [{"id": i} for i in segs_rv],
        "datos":          datos,
    }


# CLASIFICACIÓN DE NUEVO REGISTRO

def _centros_clusters(X, labels):
    """Calcula el centroide de cada cluster para la estrategia de vecino más cercano."""
    X_arr  = X.toarray() if hasattr(X, "toarray") else np.array(X)
    labels = np.array(labels)
    ids    = sorted([l for l in set(labels) if l >= 0])
    return np.array([X_arr[labels == l].mean(axis=0) for l in ids]), ids


def clasificar_freelancer(datos: dict, modelo, scaler, algoritmo: str,
                          X_entrenamiento, labels_entrenamiento):

    from cleaner import NUMERICAS_FL
    vector = np.array([[float(datos.get(c, 0)) for c in FEATURES_FL]])
    vector_scaled = scaler.transform(vector)

    if algoritmo == "kmeans":
        seg_idx = int(modelo.predict(vector_scaled)[0])
        confianza = _confianza_kmeans(modelo, vector_scaled, seg_idx)
    else:
        centros, ids = _centros_clusters(X_entrenamiento, labels_entrenamiento)
        dists    = euclidean_distances(vector_scaled, centros)[0]
        best     = int(np.argmin(dists))
        seg_idx  = ids[best]
        confianza = round(float(1 / (1 + dists[best])), 4)

    return seg_idx, confianza


def clasificar_resena(texto: str, modelo, vectorizador, algoritmo: str,
                      X_entrenamiento, labels_entrenamiento):
    X_new = vectorizador.transform([texto])

    if algoritmo == "kmeans":
        X_arr   = X_new.toarray()
        seg_idx = int(modelo.predict(X_arr)[0])
        confianza = _confianza_kmeans(modelo, X_arr, seg_idx)
    else:
        centros, ids = _centros_clusters(X_entrenamiento, labels_entrenamiento)
        X_arr  = X_new.toarray()
        dists  = euclidean_distances(X_arr, centros)[0]
        best   = int(np.argmin(dists))
        seg_idx = ids[best]
        confianza = round(float(1 / (1 + dists[best])), 4)

    return seg_idx, confianza


def _confianza_kmeans(modelo, X_scaled, seg_idx):
    """Calcula confianza como la inversa de la distancia al centroide asignado."""
    X_arr = X_scaled.toarray() if hasattr(X_scaled, "toarray") else X_scaled
    centro = modelo.cluster_centers_[seg_idx]
    dist   = float(np.linalg.norm(X_arr[0] - centro))
    return round(1 / (1 + dist), 4)


# FUNCIÓN PRINCIPAL DE ENTRENAMIENTO

def entrenar_modelo(df, dataset: str, algoritmo: str, params: dict,
                    vectorizacion: str = "tfidf",
                    df_fl=None, labels_fl=None,
                    df_rv=None, labels_rv=None):

    # Preparar datos 
    if dataset == "freelancers":
        X, scaler = preparar_features_freelancers(df)
        vectorizador = None
        columnas_resumen = RESUMEN_FL
    else:
        X, vectorizador = preparar_texto_resenas(df, vectorizacion)
        scaler = None
        columnas_resumen = RESUMEN_RV

    # Entrenar algoritmo 
    if algoritmo == "kmeans":
        k      = int(params.get("k", 4))
        metrica = params.get("metrica", "euclidiana")
        modelo, labels = entrenar_kmeans(X, k=k, metrica=metrica)
    elif algoritmo == "dbscan":
        eps    = float(params.get("epsilon", 0.5))
        minpts = int(params.get("min_puntos", 5))
        modelo, labels = entrenar_dbscan(X, epsilon=eps, min_puntos=minpts)
    else:  # jerarquico
        k      = int(params.get("k", 4))
        enlace = params.get("enlace", "ward")
        modelo, labels = entrenar_jerarquico(X, k=k, enlace=enlace)

    labels = np.array(labels)

    #Métricas
    metricas   = calcular_metricas(X, labels)
    elbow_data = calcular_elbow(X, algoritmo=algoritmo)

    # Segmentos 
    segmentos = construir_segmentos(
        df, labels, X, dataset, columnas_resumen, vectorizador
    )

    # Tabla cruzada (solo si ambos modelos están disponibles) 
    tabla_cruzada = None
    if dataset == "freelancers" and df_rv is not None and labels_rv is not None:
        tabla_cruzada = construir_tabla_cruzada(df, labels, df_rv, labels_rv)
    elif dataset == "resenas" and df_fl is not None and labels_fl is not None:
        tabla_cruzada = construir_tabla_cruzada(df_fl, labels_fl, df, labels)

    return {
        "ok":               True,
        "dataset":          dataset,
        "algoritmo":        algoritmo,
        "total":            len(df),
        "segmentos":        segmentos,
        "columnas_resumen": columnas_resumen,
        "metricas":         metricas,
        "elbow_data":       elbow_data,
        "tabla_cruzada":    tabla_cruzada,
        #  para serialización los que usa app.py
        "_modelo":          modelo,
        "_labels":          labels.tolist(),
        "_scaler":          scaler,
        "_vectorizador":    vectorizador,
        "_X":               X,
    }