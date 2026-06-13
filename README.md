# OLC2_EJ26_ML_G23
## Proceso de Limpieza de Datos

Antes del entrenamiento del modelo se implementó una etapa de preprocesamiento con el objetivo de mejorar la calidad del conjunto de datos y reducir el impacto de inconsistencias que pudieran afectar el aprendizaje del algoritmo.

### Copia del conjunto de datos

Como primera medida se realizó una copia del DataFrame original utilizando `df.copy()`. Esto permitió preservar los datos cargados originalmente y ejecutar todas las transformaciones sobre una copia independiente, evitando modificaciones accidentales sobre el conjunto de datos fuente.

### Eliminación de registros duplicados

Se identificaron y eliminaron registros completamente duplicados mediante el método `drop_duplicates()`. La presencia de observaciones repetidas puede introducir sesgos durante el entrenamiento, ya que ciertos patrones reciben un peso artificialmente mayor que el resto de los datos.

### Tratamiento de valores faltantes

Los valores nulos fueron reemplazados utilizando la mediana de cada variable numérica. Se eligió la mediana en lugar del promedio debido a que es menos sensible a valores extremos y permite conservar registros que contienen información útil en otras variables. Esta estrategia evita la pérdida innecesaria de observaciones y mantiene la estabilidad de la distribución de los datos.

### Corrección de ingresos negativos

La variable `ingresos_mensuales` no admite valores negativos desde una perspectiva financiera. Los registros con ingresos menores a cero fueron corregidos a un valor de cero, asumiendo que corresponden a errores de captura o inconsistencias en el origen de los datos. Se optó por esta corrección en lugar de eliminar los registros para conservar información relevante presente en las demás variables.

### Normalización de variables porcentuales

Las variables `historial_pagos` y `utilizacion_credito` fueron restringidas al rango válido de 0 a 100 mediante la función `clip()`. Los valores inferiores al límite mínimo fueron ajustados a 0 y los superiores al límite máximo fueron ajustados a 100. Esta transformación garantiza la coherencia de los datos con las restricciones definidas por el dominio del problema.

### Resultado del preprocesamiento

Al finalizar la limpieza se obtuvo un conjunto de datos consistente, libre de duplicados, con valores faltantes tratados y con todas las variables dentro de sus rangos válidos. Este proceso contribuye a mejorar la calidad del entrenamiento, reducir ruido en los datos y aumentar la confiabilidad de las métricas generadas por el modelo de predicción de riesgo crediticio.


# model.py — Modelo de predicción de riesgo crediticio
# CreditGuard · OLC2 · USAC · Junio 2026

## Decisiones de diseño

Se implementó Random Forest desde cero usando únicamente numpy.
Se eligió este algoritmo porque:

1. El enunciado pide hiperparámetros de árboles (`n_estimators`, `max_depth`, `max_leaf_nodes`), que son exactamente los parámetros de Random Forest.

2. Maneja bien datos desbalanceados (más clientes sin riesgo que con riesgo), gracias al muestreo bootstrap por árbol.

3. No requiere normalización de variables, lo que simplifica el preprocesamiento de datos numéricos de distintas escalas (ingresos en miles vs historial en 0-100).

## Uso de sklearn

Se usa sklearn **ÚNICAMENTE** para:
- `train_test_split`: división estándar de datos (utilidad)
- métricas: `accuracy`, `precision`, `recall`, `f1`, `confusion_matrix` (cálculo verificable con fórmulas estándar de la industria)

El clasificador (Random Forest + Árbol de Decisión) es de implementación propia con numpy.

## Árbol de Decisión

Árbol de Decisión binario implementado con numpy.

Usa el índice de Gini para encontrar el mejor split en cada nodo:

```math
Gini = 1 - Σ(pᵢ²)