import pandas as pd

# Columnas numéricas de entrada (sin la columna objetivo)
COLUMNAS_VARIABLES = [
    "ingresos_mensuales",
    "deuda_activa",
    "historial_pagos",
    "antiguedad_laboral",
    "creditos_activos",
    "monto_solicitado",
    "atrasos_previos",
    "dependientes_economicos",
    "utilizacion_credito",
]


def limpiar_datos(df):
    df = df.copy()
    registros_originales = len(df)

    # 1. Eliminar duplicados                -----------------------------------------------------------
    duplicados = int(df.duplicated().sum())
    df = df.drop_duplicates()

    # 2. Eliminar montos solicitados en 0 inconsistencia    -----------------------------------------------------------
    montos_cero = int((df["monto_solicitado"] == 0).sum())
    df = df[df["monto_solicitado"] != 0]

    # 3. Limpiar columna por columna -----------------------------------------------------------
    reporte_columnas = []

    for col in COLUMNAS_VARIABLES:
        nulos = int(df[col].isnull().sum())
        outliers = 0
        acciones = []

        # Imputar nulos con la mediana
        if nulos > 0:
            mediana = df[col].median()
            df[col] = df[col].fillna(mediana)
            acciones.append(f"{nulos} nulo(s) reemplazado(s) con la mediana ({mediana:.2f}).")

        # Reglas específicas por columna
        if col == "ingresos_mensuales":
            mask = df[col] < 0
            outliers = int(mask.sum())
            if outliers > 0:
                df.loc[mask, col] = 0
                acciones.append(f"{outliers} valor(es) negativo(s) corregido(s) a 0.")

        elif col in ("historial_pagos", "utilizacion_credito"):
            mask = (df[col] < 0) | (df[col] > 100)
            outliers = int(mask.sum())
            if outliers > 0:
                df[col] = df[col].clip(0, 100)
                acciones.append(f"{outliers} valor(es) fuera de [0,100] ajustado(s) al límite más cercano.")

        elif col == "monto_solicitado":
            # Los 0 ya se eliminaron arriba aquí solo se reportan negativos
            mask = df[col] < 0
            outliers = int(mask.sum())
            if outliers > 0:
                df.loc[mask, col] = df[col].median()
                acciones.append(f"{outliers} valor(es) negativo(s) reemplazado(s) con la mediana.")
            if montos_cero > 0:
                acciones.append(f"{montos_cero} registro(s) con monto solicitado = 0 fueron eliminados.")

        elif col in ("deuda_activa", "antiguedad_laboral", "creditos_activos",
                      "atrasos_previos", "dependientes_economicos"):
            mask = df[col] < 0
            outliers = int(mask.sum())
            if outliers > 0:
                df.loc[mask, col] = df[col].median()
                acciones.append(f"{outliers} valor(es) negativo(s) reemplazado(s) con la mediana.")

        # Si no se hizo ningún cambio
        if not acciones:
            acciones.append("Sin cambios.")

        reporte_columnas.append({
            "nombre":   col,
            "nulos":    nulos,
            "outliers": outliers,
            "accion":   " ".join(acciones),
        })

    # 4. Totales globales -----------------------------------------------------------
    nulos_total    = sum(c["nulos"]    for c in reporte_columnas)
    outliers_total = sum(c["outliers"] for c in reporte_columnas)
    eliminados      = duplicados + montos_cero
    registros_finales = len(df)

    return {
        "df": df,
        "registros_originales": registros_originales,
        "registros_finales":    registros_finales,
        "nulos_total":          nulos_total,
        "outliers_total":       outliers_total,
        "eliminados":           eliminados,
        "columnas":             reporte_columnas,
    }

