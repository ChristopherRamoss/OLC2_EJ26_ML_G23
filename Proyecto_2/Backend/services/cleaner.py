
import pandas as pd
import numpy as np

# Columnas esperada
COLS_FL = [
    "freelancer_id", "proyectos_completados", "ingresos_totales",
    "tarifa_hora_promedio", "anios_experiencia", "tiempo_respuesta_horas",
    "tasa_finalizacion", "calificacion_promedio", "categoria_principal",
    "clientes_recurrentes", "horas_trabajadas_mes",
]

COLS_RV = [
    "reseña_id", "freelancer_id", "texto_reseña",
    "fecha_reseña", "categoria_servicio",
]

NUMERICAS_FL = [
    "proyectos_completados", "ingresos_totales", "tarifa_hora_promedio",
    "anios_experiencia", "tiempo_respuesta_horas", "tasa_finalizacion",
    "calificacion_promedio", "clientes_recurrentes", "horas_trabajadas_mes",
]


def validar_columnas(df, cols_requeridas, nombre):

    faltantes = [c for c in cols_requeridas if c not in df.columns]
    if faltantes:
        raise ValueError(f"{nombre}: columnas faltantes — {', '.join(faltantes)}")


def limpiar_freelancers(df: pd.DataFrame):

    df = df.copy()
    validar_columnas(df, COLS_FL, "freelancers.csv")

    stats = {
        "registros_originales": len(df),
        "duplicados":  0,
        "nulos":       0,
        "corregidos":  0,
    }

    # 1. Duplicados
    dup = df.duplicated().sum()
    df  = df.drop_duplicates()
    stats["duplicados"] = int(dup)

    # 2. Columnas numéricas — convertir valores no numéricos a NaN
    #    (ej: "sin dato" en calificacion_promedio)
    for col in NUMERICAS_FL:
        antes = df[col].isna().sum()
        df[col] = pd.to_numeric(df[col], errors="coerce")
        nuevos_nan = df[col].isna().sum() - antes
        if nuevos_nan > 0:
            stats["corregidos"] += int(nuevos_nan)

    # 3. Imputar nulos numéricos con mediana
    nulos_antes = int(df[NUMERICAS_FL].isna().sum().sum())
    for col in NUMERICAS_FL:
        if df[col].isna().any():
            mediana = df[col].median()
            df[col] = df[col].fillna(mediana)
    stats["nulos"] += nulos_antes

    # 4. categoria_principal — imputar nulos con moda
    nulos_cat = int(df["categoria_principal"].isna().sum())
    if nulos_cat > 0:
        moda = df["categoria_principal"].mode()[0]
        df["categoria_principal"] = df["categoria_principal"].fillna(moda)
        stats["nulos"] += nulos_cat

    # 5. Reglas de rango
    # tasa_finalizacion debe estar en [0, 100]
    mask = (df["tasa_finalizacion"] < 0) | (df["tasa_finalizacion"] > 100)
    if mask.any():
        df.loc[mask, "tasa_finalizacion"] = df["tasa_finalizacion"].median()
        stats["corregidos"] += int(mask.sum())

    # calificacion_promedio debe estar en [0, 5]
    mask = (df["calificacion_promedio"] < 0) | (df["calificacion_promedio"] > 5)
    if mask.any():
        df.loc[mask, "calificacion_promedio"] = df["calificacion_promedio"].median()
        stats["corregidos"] += int(mask.sum())

    # valores negativos en columnas que no pueden serlo
    for col in ["proyectos_completados", "ingresos_totales", "tarifa_hora_promedio",
                "anios_experiencia", "tiempo_respuesta_horas",
                "clientes_recurrentes", "horas_trabajadas_mes"]:
        mask = df[col] < 0
        if mask.any():
            df.loc[mask, col] = df[col].median()
            stats["corregidos"] += int(mask.sum())

    stats["registros_finales"] = len(df)
    return df, stats


def limpiar_resenas(df: pd.DataFrame):

    df = df.copy()
    validar_columnas(df, COLS_RV, "reseñas_clientes.csv")

    stats = {
        "registros_originales": len(df),
        "duplicados":  0,
        "nulos":       0,
        "corregidos":  0,
        "longitud_calculada": False,
    }

    # 1. Duplicados
    dup = df.duplicated().sum()
    df  = df.drop_duplicates()
    stats["duplicados"] = int(dup)

    # 2. Eliminar filas sin texto de reseña (no se pueden imputar)
    sin_texto = df["texto_reseña"].isna() | (df["texto_reseña"].str.strip() == "")
    df = df[~sin_texto]

    # 3. Nulos en categoria_servicio → imputar con moda
    nulos_cat = int(df["categoria_servicio"].isna().sum())
    if nulos_cat > 0:
        moda = df["categoria_servicio"].mode()
        moda_val = moda[0] if len(moda) > 0 else "Desconocido"
        df["categoria_servicio"] = df["categoria_servicio"].fillna(moda_val)
        stats["nulos"] += nulos_cat

    # 4. Calcular longitud_reseña si no existe o tiene nulos
    if "longitud_reseña" not in df.columns or df["longitud_reseña"].isna().any():
        df["longitud_reseña"] = df["texto_reseña"].apply(
            lambda t: len(str(t).split()) if pd.notna(t) else 0
        )
        stats["longitud_calculada"] = True

    # 5. Limpiar fecha_reseña
    df["fecha_reseña"] = pd.to_datetime(df["fecha_reseña"], errors="coerce")
    nulos_fecha = int(df["fecha_reseña"].isna().sum())
    if nulos_fecha > 0:
        df = df.dropna(subset=["fecha_reseña"])
        stats["corregidos"] += nulos_fecha

    stats["registros_finales"] = len(df)
    return df, stats


def combinar_stats(stats_fl, stats_rv):

    return {
        "ok":                    True,
        "registros_total":       stats_fl["registros_originales"] + stats_rv["registros_originales"],
        "nulos_imputados":       stats_fl["nulos"]      + stats_rv["nulos"],
        "duplicados_eliminados": stats_fl["duplicados"] + stats_rv["duplicados"],
        "registros_corregidos":  stats_fl["corregidos"] + stats_rv["corregidos"],
        "longitud_calculada":    stats_rv["longitud_calculada"],
        "freelancers_finales":   stats_fl["registros_finales"],
        "resenas_finales":       stats_rv["registros_finales"],
    }