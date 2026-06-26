import pandas as pd
import numpy as np


class EDAService:

    def __init__(self, dataframe):
        self.df = dataframe.copy()

    def analizar_freelancers(self):

        reporte = {}

        # Info general

        reporte["info_general"] = {
            "filas": int(self.df.shape[0]),
            "columnas": int(self.df.shape[1]),
            "nombres_columnas": self.df.columns.tolist(),
            "tipos_datos": self.df.dtypes.astype(str).to_dict(),
            "memoria_mb": round(
                self.df.memory_usage(deep=True).sum() / (1024 ** 2), 3
            )
        }

        # Valores nulos

        reporte["nulos"] = self.df.isnull().sum().to_dict()

        reporte["porcentaje_nulos"] = (
            (self.df.isnull().sum() / len(self.df)) * 100
        ).round(2).to_dict()

        # Valores duplicaods

        reporte["duplicados"] = int(self.df.duplicated().sum())

        # Estadísticas descriptivas

        estadisticas = {}

        columnas_numericas = self.df.select_dtypes(include=np.number).columns

        for columna in columnas_numericas:

            estadisticas[columna] = {

                "media": float(self.df[columna].mean()),

                "mediana": float(self.df[columna].median()),

                "desviacion": float(self.df[columna].std()),

                "minimo": float(self.df[columna].min()),

                "q1": float(self.df[columna].quantile(.25)),

                "q3": float(self.df[columna].quantile(.75)),

                "maximo": float(self.df[columna].max())

            }

        reporte["estadisticas"] = estadisticas

        # Asimetría 

        reporte["asimetria"] = (
            self.df
            .select_dtypes(include=np.number)
            .skew()
            .round(3)
            .to_dict()
        )

        # Outliers

        outliers = {}

        for columna in columnas_numericas:

            q1 = self.df[columna].quantile(.25)
            q3 = self.df[columna].quantile(.75)

            iqr = q3 - q1

            inferior = q1 - 1.5 * iqr
            superior = q3 + 1.5 * iqr

            cantidad = (
                (self.df[columna] < inferior) |
                (self.df[columna] > superior)
            ).sum()

            outliers[columna] = {

                "cantidad": int(cantidad),

                "limite_inferior": float(inferior),

                "limite_superior": float(superior)

            }

        reporte["outliers"] = outliers

        # Correlación

        correlacion = (
            self.df
            .select_dtypes(include=np.number)
            .corr()
            .round(3)
            .to_dict()
        )

        reporte["correlacion"] = correlacion

        # Variables categóricas

        categorias = {}

        columnas_texto = self.df.select_dtypes(include="object").columns

        for columna in columnas_texto:

            categorias[columna] = {

                "valores_unicos": int(self.df[columna].nunique()),

                "moda": str(self.df[columna].mode()[0]),

                "frecuencias":
                    self.df[columna]
                    .value_counts()
                    .head(10)
                    .to_dict()

            }

        reporte["categorias"] = categorias

        # Validación de rangos
        validaciones = {}

        if "tasa_finalizacion" in self.df.columns:

            validaciones["tasa_finalizacion"] = int(
                (
                    (self.df["tasa_finalizacion"] < 0) |
                    (self.df["tasa_finalizacion"] > 100)
                ).sum()
            )

        if "calificacion_promedio" in self.df.columns:

            validaciones["calificacion_promedio"] = int(
                (
                    (self.df["calificacion_promedio"] < 0) |
                    (self.df["calificacion_promedio"] > 5)
                ).sum()
            )

        if "ingresos_totales" in self.df.columns:

            validaciones["ingresos_negativos"] = int(
                (self.df["ingresos_totales"] < 0).sum()
            )

        reporte["validaciones"] = validaciones

        # Recomendaciones

        recomendaciones = []

        for columna in columnas_numericas:

            if reporte["porcentaje_nulos"][columna] > 0:

                if abs(reporte["asimetria"][columna]) < 0.5:

                    recomendaciones.append({

                        "columna": columna,

                        "accion": "Imputar con media",

                        "motivo": "Distribución aproximadamente simétrica"

                    })

                else:

                    recomendaciones.append({

                        "columna": columna,

                        "accion": "Imputar con mediana",

                        "motivo": "Distribución asimétrica"

                    })

            if reporte["outliers"][columna]["cantidad"] > 0:

                recomendaciones.append({

                    "columna": columna,

                    "accion": "Revisar valores atípicos mediante IQR",

                    "motivo": "Se detectaron posibles outliers"

                })

        if reporte["duplicados"] > 0:

            recomendaciones.append({

                "accion": "Eliminar registros duplicados",

                "motivo": "Se encontraron registros repetidos"

            })

        reporte["recomendaciones"] = recomendaciones

        return reporte