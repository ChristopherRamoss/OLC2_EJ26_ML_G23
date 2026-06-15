# CreditGuard — Manual Técnico

## Descripción General

CreditGuard es un sistema de predicción de riesgo crediticio desarrollado como proyecto académico para el curso **Organización de Lenguajes y Compiladores 2 (OLC2)**. El objetivo del sistema es analizar información financiera histórica de clientes y determinar, mediante técnicas de aprendizaje supervisado, si un solicitante representa o no un riesgo crediticio.

El sistema fue diseñado bajo una arquitectura cliente-servidor, separando completamente la interfaz gráfica del procesamiento interno y entrenamiento del modelo.

El sistema permite:

* Cargar datasets en formato CSV.
* Realizar limpieza y validación automática de datos.
* Entrenar un modelo de Machine Learning.
* Visualizar métricas de desempeño.
* Reentrenar el modelo utilizando hiperparámetros personalizados.
* Realizar predicciones sobre nuevos solicitantes.

---

## Tecnologías Utilizadas

### Frontend

* React
* Vite
* JavaScript
* Fetch API
* CSS

### Backend

* Python
* Flask
* Flask-CORS
* Pandas
* NumPy

### Machine Learning

* Árbol de decisión implementado manualmente
* Random Forest implementado manualmente
* Bootstrap Sampling
* Índice Gini
* Voting Ensemble

---

## Estructura del Proyecto

```text
CreditGuard/
│
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py
│   ├── cleaner.py
│   ├── model.py
│   ├── requirements.txt
│   └── __pycache__/
│
├── creditguard_dataset.csv
├── prueba.csv
└── README.md
```

---

## Arquitectura del Sistema

El sistema fue desarrollado utilizando una arquitectura modular dividida en frontend y backend.

### Frontend

Responsabilidades:

* Interfaz gráfica del usuario.
* Carga de archivos CSV.
* Visualización de resultados.
* Configuración de hiperparámetros.
* Solicitud de predicciones.
* Comunicación mediante peticiones HTTP.

### Backend

Responsabilidades:

* Procesamiento del archivo CSV.
* Limpieza y validación de datos.
* Entrenamiento del modelo.
* Exposición de endpoints REST.
* Predicción de nuevos registros.

---

# Proceso de Limpieza de Datos

La limpieza de datos constituye una fase crítica dentro del sistema, ya que garantiza que el modelo reciba información consistente y libre de errores que puedan afectar el entrenamiento.

El proceso fue implementado en el archivo `cleaner.py`.

---

## 1. Copia del Dataset

Se genera una copia independiente del DataFrame original.

```python
df = df.copy()
```

### Decisión de diseño

Se decidió trabajar sobre una copia para evitar modificar permanentemente el dataset original cargado por el usuario y conservar una versión intacta durante toda la sesión.

---

## 2. Eliminación de Registros Duplicados

Se detectan registros completamente repetidos.

```python
duplicados = df.duplicated().sum()
df = df.drop_duplicates()
```

### Decisión de diseño

Los registros duplicados pueden introducir sesgo estadístico durante el entrenamiento del modelo, haciendo que ciertos patrones tengan una representación artificialmente mayor.

Por esta razón se decidió eliminar duplicados.

---

## 3. Detección e Imputación de Valores Nulos

Se detectan valores faltantes dentro del dataset.

```python
nulos_total = int(df.isnull().sum().sum())
```

Posteriormente se reemplazan utilizando la mediana.

```python
df[col] = df[col].fillna(df[col].median())
```

### Decisión de diseño

Se eligió utilizar la mediana en lugar de eliminar registros debido a las siguientes razones:

* Se conserva el tamaño original del dataset.
* La mediana es menos sensible a valores extremos.
* Se evita eliminar información útil de otras variables.

---

## 4. Corrección de Ingresos Negativos

Se detectan ingresos mensuales menores a cero.

```python
negativos = (df["ingresos_mensuales"] < 0).sum()
```

Posteriormente se corrigen.

```python
df["ingresos_mensuales"] = df["ingresos_mensuales"].clip(lower=0)
```

### Decisión de diseño

Dentro del contexto financiero un ingreso negativo representa un valor inválido.

Se decidió corregir a cero en lugar de eliminar registros para evitar pérdida innecesaria de información.

---

## 5. Validación de Rangos Permitidos

Dos variables representan porcentajes y deben mantenerse dentro del intervalo válido.

### Historial de pagos

```python
df["historial_pagos"] = df["historial_pagos"].clip(0,100)
```

### Utilización de crédito

```python
df["utilizacion_credito"] = df["utilizacion_credito"].clip(0,100)
```

### Decisión de diseño

Se decidió ajustar valores fuera del rango en lugar de eliminar registros para conservar información útil y evitar reducir el volumen de entrenamiento.

---

# Selección del Modelo de Machine Learning

El modelo seleccionado fue **Random Forest**, implementado manualmente.

La elección se realizó debido a que el problema consiste en clasificación binaria.

```text
0 = Cliente sin riesgo
1 = Cliente en riesgo
```

---

## Razones para elegir Random Forest

Se seleccionó este algoritmo debido a las siguientes ventajas:

* Buen desempeño en clasificación binaria.
* Reduce overfitting comparado con árboles individuales.
* Maneja adecuadamente múltiples variables numéricas.
* Captura relaciones no lineales entre variables.
* Genera mayor estabilidad mediante votación entre múltiples árboles.

---

# Implementación del Modelo

El archivo `model.py` contiene la implementación completa del algoritmo.

Se desarrollaron dos estructuras principales.

---

## Árbol de Decisión

Clase implementada:

```python
class ArbolDecision
```

Cada nodo contiene:

```python
feature_idx
umbral
izquierda
derecha
prediccion
probabilidad
```

Cada árbol busca dividir el dataset utilizando el criterio de menor impureza.

---

## Índice Gini

Se utilizó como criterio de división.

Fórmula utilizada:

```text
Gini = 1 - (p² + (1-p)²)
```

Donde:

* p = proporción de registros positivos.

Se selecciona el split que produzca la menor impureza.

---

## Random Forest

Clase implementada:

```python
class RandomForest
```

Proceso interno:

1. Generar muestras bootstrap.
2. Entrenar múltiples árboles independientes.
3. Seleccionar subconjuntos aleatorios de variables.
4. Obtener predicción individual por árbol.
5. Aplicar votación por mayoría.

---

## Bootstrap Sampling

Cada árbol recibe una muestra aleatoria con reemplazo.

```python
idx = np.random.choice(n, size=n, replace=True)
```

### Decisión de diseño

Se utiliza bootstrap sampling para generar diversidad entre árboles y reducir correlación entre modelos individuales.

---

## Selección Aleatoria de Variables

Cada árbol trabaja únicamente con un subconjunto aleatorio de variables.

```python
sqrt(total_features)
```

### Decisión de diseño

Evitar dependencia excesiva de una sola variable e incrementar diversidad del bosque.

---

# Métricas de Evaluación

El modelo se evalúa mediante cuatro métricas principales.

## Accuracy

Porcentaje global de predicciones correctas.

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
2 * (Precision * Recall) / (Precision + Recall)
```

---

# API REST Implementada

El backend expone los siguientes endpoints.

---

## POST /upload

Función:

* Recibir archivo CSV.
* Leer dataset utilizando Pandas.
* Mostrar distribución inicial.
* Mostrar primeras filas.

---

## POST /clean

Función:

* Eliminar duplicados.
* Detectar valores nulos.
* Imputar datos faltantes.
* Corregir valores inválidos.
* Generar reporte de limpieza.

---

## POST /train

Función:

* Separar variables independientes.
* Entrenar modelo Random Forest.
* Calcular métricas de desempeño.

---

## GET /metrics

Función:

* Devolver métricas del último entrenamiento realizado.

---

## POST /retrain

Función:

* Reentrenar el modelo utilizando hiperparámetros personalizados.

Parámetros:

```text
n_estimators
max_depth
max_leaf_nodes
```

---

## POST /predict

Función:

* Recibir datos de un nuevo solicitante.
* Ejecutar predicción utilizando modelo entrenado.

Resultado:

```text
0 = Sin riesgo
1 = En riesgo
```

---

# Decisiones de Diseño Tomadas

Durante el desarrollo se tomaron las siguientes decisiones técnicas.

### Arquitectura cliente-servidor

Permite independencia total entre frontend y backend.

---

### Diseño modular

Separación entre:

* API
* Limpieza
* Modelo

Facilita mantenimiento y escalabilidad.

---

### Estado temporal en memoria

Se decidió no utilizar base de datos debido a que el sistema procesa información temporal cargada directamente por el usuario.

---

### Modelo implementado manualmente

Se desarrolló el algoritmo desde cero para cumplir con los requerimientos académicos del proyecto.

---

### Corrección de datos en lugar de eliminación excesiva

Se priorizó conservar la mayor cantidad posible de datos para entrenamiento.

Los modelos supervisados requieren suficiente volumen de información para generalizar correctamente.

---

# Ejecución del Sistema

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Backend:

```text
http://localhost:5000
```

Frontend:

```text
http://localhost:5173
```

---

# Conclusiones Técnicas

Se desarrolló un sistema completo de clasificación supervisada capaz de procesar información financiera, limpiar datos inconsistentes, entrenar un modelo Random Forest implementado manualmente y generar predicciones sobre nuevos solicitantes.

La arquitectura modular permitió separar responsabilidades y facilitar mantenimiento del sistema.

La etapa de limpieza fue diseñada para priorizar conservación de información sin comprometer calidad del entrenamiento.

La implementación manual del algoritmo permitió comprender internamente el funcionamiento de árboles de decisión, bootstrap sampling, selección aleatoria de atributos y votación por mayoría.
