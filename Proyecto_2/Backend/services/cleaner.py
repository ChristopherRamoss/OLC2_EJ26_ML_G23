import pandas as pd
import numpy as np

# Columnas esperadas
COLS_FL = [
    "freelancer_id",
    "proyectos_completados",
    "ingresos_totales",
    "tarifa_hora_promedio",
    "anios_experiencia",
    "tiempo_respuesta_horas",
    "tasa_finalizacion",
    "calificacion_promedio",
    "categoria_principal",
    "clientes_recurrentes",
    "horas_trabajadas_mes",
]

COLS_RV = [
    "reseña_id",
    "freelancer_id",
    "texto_reseña",
    "fecha_reseña",
    "categoria_servicio",
]

NUMERICAS_FL = [
    "proyectos_completados",
    "ingresos_totales",
    "tarifa_hora_promedio",
    "anios_experiencia",
    "tiempo_respuesta_horas",
    "tasa_finalizacion",
    "calificacion_promedio",
    "clientes_recurrentes",
    "horas_trabajadas_mes",
]


def validar_columnas(df, cols_requeridas, nombre):

    faltantes = [c for c in cols_requeridas if c not in df.columns]
    if faltantes:
        raise ValueError(
            f"{nombre}: columnas faltantes — {', '.join(faltantes)}"
        )


def limpiar_freelancers(df: pd.DataFrame):

    df = df.copy()
    validar_columnas(df, COLS_FL, "freelancers.csv")
    stats = {
        "registros_originales": len(df),
        "duplicados": 0,
        "nulos": 0,
        "corregidos": 0,
    }

    # Eliminar duplicados

    duplicados = df.duplicated().sum()

    df = df.drop_duplicates()

    stats["duplicados"] = int(duplicados)

    # Eliminar registros sin ID

    antes = len(df)
    df = df.dropna(subset=["freelancer_id"])
    stats["corregidos"] += antes - len(df)

    # Convertir columnas numéricas

    for col in NUMERICAS_FL:
        antes = df[col].isna().sum()
        df[col] = pd.to_numeric(df[col], errors="coerce")
        nuevos_nan = df[col].isna().sum() - antes
        if nuevos_nan > 0:
            stats["nulos"] += int(nuevos_nan)

    # Imputar nulos numéricos con mediana

    nulos = int(df[NUMERICAS_FL].isna().sum().sum())
    for col in NUMERICAS_FL:
        if df[col].isna().any():
            mediana = df[col].median()
            df[col] = df[col].fillna(mediana)

    stats["nulos"] += nulos

    # Limpiar categoría principal

    df["categoria_principal"] = (
        df["categoria_principal"]
        .astype(str)
        .str.strip()
        .replace("", np.nan)
    )

    nulos_categoria = int(df["categoria_principal"].isna().sum())

    if nulos_categoria > 0:
        moda = df["categoria_principal"].mode()
        moda_val = moda[0] if len(moda) > 0 else "Desconocido"
        df["categoria_principal"] = (
            df["categoria_principal"]
            .fillna(moda_val)
        )

        stats["nulos"] += nulos_categoria

    # Corregir porcentajes fuera de rango

    fuera = (
        (df["tasa_finalizacion"] < 0)
        | (df["tasa_finalizacion"] > 100)
    ).sum()

    if fuera > 0:
        df["tasa_finalizacion"] = (
            df["tasa_finalizacion"]
            .clip(0, 100)
        )
        stats["corregidos"] += int(fuera)

    # Corregir calificación

    fuera = (
        (df["calificacion_promedio"] < 0)
        | (df["calificacion_promedio"] > 5)
    ).sum()

    if fuera > 0:
        df["calificacion_promedio"] = (
            df["calificacion_promedio"]
            .clip(0, 5)
        )
        stats["corregidos"] += int(fuera)

    # Corregir negativos

    columnas_no_negativas = [
        "proyectos_completados",
        "ingresos_totales",
        "tarifa_hora_promedio",
        "anios_experiencia",
        "tiempo_respuesta_horas",
        "clientes_recurrentes",
        "horas_trabajadas_mes",
    ]

    for col in columnas_no_negativas:
        negativos = (df[col] < 0).sum()
        if negativos > 0:
            df[col] = df[col].clip(lower=0)
            stats["corregidos"] += int(negativos)

    # Restaurar tipos enteros

    columnas_enteras = [
        "proyectos_completados",
        "clientes_recurrentes",
    ]

    for col in columnas_enteras:
        df[col] = (
            df[col]
            .round()
            .astype(int)
        )
    stats["registros_finales"] = len(df)

    return df, stats


def limpiar_resenas(df: pd.DataFrame):

    df = df.copy()
    validar_columnas(df, COLS_RV, "reseñas_clientes.csv")
    stats = {
        "registros_originales": len(df),
        "duplicados": 0,
        "nulos": 0,
        "corregidos": 0,
        "longitud_calculada": False,
    }

    # Eliminar duplicados

    duplicados = df.duplicated().sum()
    df = df.drop_duplicates()
    stats["duplicados"] = int(duplicados)

    # Eliminar registros sin identificador

    antes = len(df)
    df = df.dropna(subset=["reseña_id", "freelancer_id"])
    stats["corregidos"] += antes - len(df)

    # Eliminar reseñas sin texto

    sin_texto = (
        df["texto_reseña"].isna()
        | (df["texto_reseña"].astype(str).str.strip() == "")
    )

    eliminadas = int(sin_texto.sum())
    if eliminadas > 0:
        df = df[~sin_texto]
        stats["corregidos"] += eliminadas

    # Limpiar categoría de servicio

    df["categoria_servicio"] = (
        df["categoria_servicio"]
        .astype(str)
        .str.strip()
        .replace("", np.nan)
    )

    nulos_categoria = int(df["categoria_servicio"].isna().sum())

    if nulos_categoria > 0:
        moda = df["categoria_servicio"].mode()
        moda_val = (
            moda[0]
            if len(moda) > 0
            else "Desconocido"
        )
        df["categoria_servicio"] = (
            df["categoria_servicio"]
            .fillna(moda_val)
        )
        stats["nulos"] += nulos_categoria

    # Calcular longitud de reseña

    if (
        "longitud_reseña" not in df.columns
        or df["longitud_reseña"].isna().any()
    ):

        df["longitud_reseña"] = df["texto_reseña"].apply(
            lambda texto: (
                len(str(texto).split())
                if pd.notna(texto)
                else 0
            )
        )

        stats["longitud_calculada"] = True

    # Limpiar fecha

    df["fecha_reseña"] = pd.to_datetime(
        df["fecha_reseña"],
        errors="coerce"
    )

    fechas_invalidas = int(
        df["fecha_reseña"].isna().sum()
    )

    if fechas_invalidas > 0:
        df = df.dropna(subset=["fecha_reseña"])
        stats["corregidos"] += fechas_invalidas

    # Resultado final
    stats["registros_finales"] = len(df)
    return df, stats


def combinar_stats(stats_fl, stats_rv):

    return {
        "ok": True,

        "registros_total":
            stats_fl["registros_originales"] +
            stats_rv["registros_originales"],

        "nulos_imputados":
            stats_fl["nulos"] +
            stats_rv["nulos"],

        "duplicados_eliminados":
            stats_fl["duplicados"] +
            stats_rv["duplicados"],

        "registros_corregidos":
            stats_fl["corregidos"] +
            stats_rv["corregidos"],

        "longitud_calculada":
            stats_rv["longitud_calculada"],

        "freelancers_finales":
            stats_fl["registros_finales"],

        "resenas_finales":
            stats_rv["registros_finales"],
    }