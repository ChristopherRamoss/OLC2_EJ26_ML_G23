# CreditGuard

Sistema de predicción de riesgo crediticio utilizando técnicas de Machine Learning supervisado.

---

# Integrantes

* Esmeralda Del Rosario Guillén Veliz - 201901002
* Christopher Miguel Angel Ramos Ascencio - 202200057

---

# Descripción del Proyecto

CreditGuard es una aplicación web que permite analizar historiales financieros de clientes y predecir si un solicitante representa o no un riesgo crediticio.

El sistema permite:

* Cargar datasets en formato CSV.
* Limpiar automáticamente datos inconsistentes.
* Entrenar un modelo de Machine Learning.
* Visualizar métricas de desempeño.
* Ajustar hiperparámetros.
* Realizar predicciones sobre nuevos solicitantes.

La arquitectura del sistema fue diseñada bajo un modelo cliente-servidor, separando completamente la interfaz visual del procesamiento interno del modelo.

---

# Tecnologías Utilizadas

## Frontend

* React
* Vite
* JavaScript
* CSS
* Fetch API

## Backend

* Python 3
* Flask
* Flask-CORS
* Pandas
* NumPy

## Machine Learning

* Árbol de decisión implementado manualmente
* Random Forest implementado manualmente
* Bootstrap Sampling
* Índice Gini
* Voting Ensemble

---

# Arquitectura del Sistema

El sistema fue dividido en dos componentes principales.

## Frontend

Responsable de:

* Interfaz gráfica
* Carga de archivos CSV
* Visualización de métricas
* Ajuste de hiperparámetros
* Solicitudes HTTP hacia el backend

## Backend

Responsable de:

* Procesamiento del dataset
* Limpieza de datos
* Entrenamiento del modelo
* Reentrenamiento
* Predicciones
* Gestión de endpoints REST

---

# API Implementada

El backend expone los siguientes endpoints.

| Endpoint | Método | Función                        |
| -------- | ------ | ------------------------------ |
| /upload  | POST   | Cargar archivo CSV             |
| /clean   | POST   | Limpiar dataset                |
| /train   | POST   | Entrenar modelo                |
| /metrics | GET    | Obtener métricas               |
| /retrain | POST   | Reentrenar con hiperparámetros |
| /predict | POST   | Realizar predicción            |

---

# Proceso de Limpieza de Datos

La limpieza de datos fue implementada en el archivo `cleaner.py`.

Esta etapa garantiza que el modelo reciba información consistente y reduce errores durante el entrenamiento.

---

## 1. Copia del DataFrame

Se crea una copia independiente del dataset.

```python
df = df.copy()
```

### Justificación

Se evita modificar directamente el archivo original cargado por el usuario y se mantiene una versión intacta durante toda la sesión.

---

## 2. Eliminación de Datos Duplicados

Se detectan registros completamente repetidos.

```python
duplicados = df.duplicated().sum()
df = df.drop_duplicates()
```

### Justificación

Los datos duplicados generan sesgo estadístico dentro del entrenamiento, ya que ciertos patrones quedan sobrerrepresentados. Por esta razón se decidió eliminarlos.

---

## 3. Detección de Valores Nulos

Se cuentan valores faltantes dentro del dataset.

```python
nulos_total = int(df.isnull().sum().sum())
```

Luego se reemplazan utilizando la mediana.

```python
df[col] = df[col].fillna(df[col].median())
```

### Justificación

Se eligió reemplazar usando la mediana porque:

* Conserva el tamaño del dataset.
* Evita eliminar registros útiles.
* La mediana es robusta frente a valores extremos.

---

## 4. Corrección de Ingresos Negativos

Se detectan valores negativos en ingresos mensuales.

```python
negativos = (df["ingresos_mensuales"] < 0).sum()
```

Luego se corrigen.

```python
df["ingresos_mensuales"] = df["ingresos_mensuales"].clip(lower=0)
```

### Justificación

Se decidió corregir a cero en lugar de eliminar registros para no perder información adicional contenida en otras variables.

---

## 5. Validación de Rangos Permitidos

Dos variables representan porcentajes y deben permanecer dentro del rango válido.

### Historial de pagos

```python
df["historial_pagos"] = df["historial_pagos"].clip(0,100)
```

### Utilización de crédito

```python
df["utilizacion_credito"] = df["utilizacion_credito"].clip(0,100)
```

### Justificación

Se decidió ajustar automáticamente valores fuera de rango en lugar de eliminar los  registros para conservar la mayor cantidad de información posible.

---

# Selección del Modelo

Se seleccionó el algoritmo **Random Forest** para resolver el problema de clasificación binaria.

Clasificación objetivo:

```text
0 = Cliente sin riesgo
1 = Cliente en riesgo
```

---

## Razones de Selección

Random Forest fue elegido por las siguientes ventajas:

* Buen desempeño en clasificación binaria.
* Reduce overfitting respecto a un árbol individual.
* Maneja múltiples variables numéricas.
* Captura relaciones no lineales.
* Produce modelos más estables mediante votación entre árboles.

---

# Implementación del Modelo

El modelo fue desarrollado manualmente en `model.py`. No se utilizó implementación automática de Random Forest.

---

## Árbol de Decisión

Se implementó una estructura tipo nodo.

```python
class Nodo
class ArbolDecision
```

Cada nodo contiene:

* Variable utilizada para dividir.
* Umbral de división.
* Nodo izquierdo.
* Nodo derecho.
* Predicción final.

---

## Índice Gini

Se utilizó como criterio de división.

Fórmula:

```text
Gini = 1 - (p² + (1-p)²)
```

Donde:

* p = proporción de casos positivos.

El algoritmo busca minimizar impureza.

---

## Random Forest

Se implementó una clase independiente.

```python
class RandomForest
```

Proceso interno:

1. Generar muestras bootstrap.
2. Entrenar múltiples árboles.
3. Seleccionar subconjuntos aleatorios de variables.
4. Obtener predicción individual.
5. Aplicar votación por mayoría.

---

## Bootstrap Sampling

Cada árbol recibe una muestra aleatoria con reemplazo.

```python
idx = np.random.choice(n, size=n, replace=True)
```

### Justificación

Permite introducir variabilidad entre árboles individuales y reduce correlación interna.

---

# Entrenamiento del Modelo

El entrenamiento sigue el siguiente proceso.

## Separación de Variables

Se separan variables independientes y variable objetivo.

```text
9 variables predictoras
1 variable objetivo (en_riesgo)
```

---

## División del Dataset

Se utiliza división:

```text
80% entrenamiento
20% prueba
```

Implementado mediante:

```python
train_test_split()
```

---

# Métricas Utilizadas

El sistema evalúa el modelo usando cuatro métricas.

---

## Accuracy

Porcentaje total de predicciones correctas.

```text
(TP + TN) / Total
```

---

## Precision

Capacidad de identificar correctamente clientes de riesgo.

```text
TP / (TP + FP)
```

---

## Recall

Capacidad de detectar todos los casos positivos reales.

```text
TP / (TP + FN)
```

---

## F1 Score

Balance entre precision y recall.

```text
2 × (Precision × Recall) / (Precision + Recall)
```

---

# Decisiones de Diseño Tomadas

Durante el desarrollo se tomaron las siguientes decisiones técnicas:

### Arquitectura cliente-servidor

Se separó frontend y backend para facilitar mantenimiento.

### Diseño modular

Separación entre:

* API (`app.py`)
* Limpieza (`cleaner.py`)
* Modelo (`model.py`)

---

# Ejecución del Proyecto

## Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Servidor:

```text
http://localhost:5000
```

---

## Frontend

```bash
cd Frontend
npm install
npm run dev
```

Servidor:

```text
http://localhost:5173
```

---


