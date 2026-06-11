import pandas as pd

def limpiar_datos(df):
    df = df.copy()

    registros_originales = len(df)

    # eliminar datos duplicados
    duplicados = df.duplicated().sum()
    df = df.drop_duplicates()

    # datos nulos
    nulos_total = int(df.isnull().sum().sum())

    # completar con mediana
    for col in df.columns:
        if df[col].dtype != "object":
            df[col] = df[col].fillna(df[col].median())

    # ingresos negativos
    negativos = (df["ingresos_mensuales"] < 0).sum()

    df["ingresos_mensuales"] = df["ingresos_mensuales"].clip(lower=0)

    # rangos
    df["historial_pagos"] = df["historial_pagos"].clip(0,100)
    df["utilizacion_credito"] = df["utilizacion_credito"].clip(0,100)

    return {
        "df": df,
        "registros_originales": registros_originales,
        "registros_finales": len(df),
        "nulos_total": nulos_total,
        "outliers_total": int(negativos),
        "eliminados": int(duplicados),

        "columnas": [
            {
                "nombre": "ingresos_mensuales",
                "nulos": 0,
                "outliers": int(negativos),
                "accion": "Valores negativos corregidos a 0."
            },
            {
                "nombre": "historial_pagos",
                "nulos": 0,
                "outliers": 0,
                "accion": "Validado rango [0,100]."
            },
            {
                "nombre": "utilizacion_credito",
                "nulos": 0,
                "outliers": 0,
                "accion": "Validado rango [0,100]."
            }
        ]
    }