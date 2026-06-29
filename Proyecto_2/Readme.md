

# Manual Técnico: Proyecto TalentMosaic

TalentMosaic es una plataforma avanzada de análisis y segmentación de datos diseñada para la gestión de freelancers y reseñas. Este manual detalla los componentes técnicos y la lógica operativa del sistema.

---

# Integrantes

* Esmeralda Del Rosario Guillén Veliz - 201901002
* Christopher Miguel Angel Ramos Ascencio - 202200057

---


## Frontend
npm create vite@latest Proyecto2/Frontend -- --template react

- cd Proyecto_2
- cd Frontend
- npm install
- npm install rechartsp
- npm run dev

## Bakend

- cd Proyecto_2
- cd Backend
- python -m venv .venv
- .venv\Scripts\activate
- pip install -r requirements.txt
- python app.py

# 1. Arquitectura del Sistema

El sistema está desarrollado para entornos de computación eficiente, optimizado para procesar grandes volúmenes de datos mediante algoritmos de Machine Learning no supervisado.

# 2. Módulos Operativos

### 2.1. Carga y Preprocesamiento

Este módulo es responsable de la ingestión y depuración de los datasets (CSV). Las tareas incluyen:

- **Limpieza**: Eliminación de duplicados y corrección de registros inconsistentes.
- **Imputación**: Relleno de valores nulos (NaN) para garantizar la integridad matemática.
- **Feature Engineering**: Cálculo automático de variables derivadas, como la longitud de reseñas.

### 2.2. Configuración y Entrenamiento


El sistema ofrece flexibilidad para aplicar diferentes enfoques matemáticos según la naturaleza del dataset:

## K-Means

Es el algoritmo principal y más eficiente para el sistema. Funciona particionando los datos en `k` grupos, donde cada observación pertenece al grupo cuyo centroide (media) está más cerca. Es ideal para detectar grupos con formas esféricas bien definidas.

## DBSCAN (Density-Based Spatial Clustering of Applications with Noise)

A diferencia de K-Means, este algoritmo agrupa puntos basándose en la densidad local. Es extremadamente útil en el sistema para detectar valores atípicos (*outliers*), ya que los puntos que no pertenecen a ninguna región densa se clasifican automáticamente como ruido, lo cual es vital para limpiar perfiles de freelancers inusuales.

## Clustering Jerárquico

Genera una jerarquía de clústeres representada mediante un dendrograma. Es preferido cuando se busca entender la relación anidada entre los datos; permite al usuario observar cómo se fusionan o dividen los grupos a diferentes niveles de similitud.



# Métricas de Distancia
Las métricas de distancia soportadas son: **Euclidiana** (distancia geométrica) y **Manhattan** (distancia de cuadrícula).

La métrica de distancia es la función que define qué tan "lejos" o "cerca" está un freelancer o una reseña de otra:

## Distancia Euclidiana

Es la distancia en línea recta entre dos puntos en un espacio multidimensional. Es la métrica estándar para K-Means en TalentMosaic, ideal cuando las variables (como años de experiencia o ingresos) tienen escalas comparables.

## Distancia Manhattan

Calcula la distancia como la suma de las diferencias absolutas de las coordenadas (como moverse por los bloques de una cuadrícula). Es más robusta frente a valores atípicos que la Euclidiana, funcionando como una alternativa de alta precisión para datasets donde los valores extremos podrían distorsionar la media.


# 2.3. Procesamiento de Lenguaje Natural (NLP)

Para las reseñas, se implementaron técnicas de vectorización:

## Técnicas de Vectorización para Reseñas

Dado que los algoritmos de Machine Learning no pueden procesar texto directamente, el sistema implementa un paso de vectorización para transformar palabras en espacios numéricos (vectores):

## TF-IDF (Term Frequency-Inverse Document Frequency)

- **TF (Frecuencia de término)**: Mide la importancia de una palabra dentro de una reseña específica.
- **IDF (Frecuencia inversa de documento)**: Reduce el peso de las palabras que aparecen en todas las reseñas (como "el", "es", "que") y aumenta el peso de las palabras únicas o distintivas (como "excelente", "profesional", "tardío").

**Resultado Técnico**: Genera una matriz dispersa de alta calidad donde cada fila es una reseña y cada columna una característica semántica ponderada, permitiendo que el modelo detecte patrones ocultos en el sentimiento del cliente.

## Bag of Words (BoW)

- **Lógica**: Crea un vocabulario único de todas las reseñas y cuenta la frecuencia de aparición de cada palabra. Es un enfoque más sencillo y directo. A diferencia de TF-IDF, no pondera la importancia, pero es extremadamente rápido para datasets donde la presencia de palabras clave específicas es suficiente para la segmentación.

# 3. Interpretación y Validación

### 3.1. Interpretación (PCA 2D)

Utiliza Análisis de Componentes Principales (PCA) para reducir la dimensionalidad de los datos y visualizar la dispersión de los clústeres en un plano bidimensional, facilitando el análisis visual de la calidad de los grupos.

# 4. Métricas de Evaluacion y Validación

### Métricas de Validación de Clustering

Una vez entrenado el modelo, el sistema calcula métricas críticas para asegurar que los segmentos no sean aleatorios:

## Coeficiente de Silueta

Mide qué tan parecidos son los registros a su propio grupo frente a otros.

- **Rango [-1, 1]**: Un valor > 0.5 indica una estructura de clústeres sólida y bien definida. Valores cercanos a 0 sugieren solapamiento.

## Índice de Davies-Bouldin

Mide la relación entre la distancia intra-clúster y la distancia inter-clúster.

- **Interpretación**: Cuanto menor sea el valor, mejor es el modelo, ya que indica que los grupos están bien separados y son compactos.

## Índice Calinski-Harabasz

Evalúa la relación entre la dispersión de los clústeres y la dispersión dentro de ellos.

- **Interpretación**: Un valor alto confirma que los grupos son distintos y compactos.

## Método del Codo (WCSS)

El sistema grafica la inercia para diferentes valores de `k`. El "codo" (el punto de inflexión donde la caída de la inercia se vuelve menos pronunciada) es el valor de `k` matemáticamente óptimo para la segmentación.

# 5. Clasificación (Inferencia)

Utiliza el modelo entrenado para asignar nuevos registros a los segmentos existentes, calculando la afinidad estadística (distancia) entre los nuevos datos y los centroides aprendidos.

# 6. Exportación

El sistema genera reportes en formato CSV para los datasets procesados y un PDF ejecutivo que integra visualizaciones, nubes de palabras y resúmenes estadísticos de los segmentos.


# 7. Documentación Técnica de API

Detalles de los endpoints de la API de TalentMosaic, proporcionando la lógica de negocio subyacente para cada operación de procesamiento de datos y Machine Learning.

##  Especificaciones de los Endpoints

| Endpoint | Método | Descripción Técnica |
|----------|--------|----------------------|
| `/upload/freelancers` | POST | Ingesta el CSV de freelancers. Realiza validación de esquema y carga de datos en un DataFrame de pandas en memoria. |
| `/upload/resenas` | POST | Ingesta el CSV de reseñas. Valida la estructura de texto y prepara las columnas para la vectorización posterior. |
| `/clean` | POST | Ejecuta la pipeline de limpieza: imputación de nulos (valor medio/mediana), eliminación de registros duplicados basados en `freelancer_id`, y normalización de texto. |
| `/train` | POST | Aplica algoritmos (K-Means, DBSCAN) sobre los datos escalados. Incluye la vectorización TF-IDF para reseñas y el cálculo de centroides para la inferencia. |
| `/classify` | POST | Recibe un nuevo vector de características. Calcula la distancia Euclidiana respecto a los centroides del modelo entrenado y retorna la etiqueta del segmento más cercano. |
| `/export` | POST | Genera archivos (CSV) o reportes (PDF) basados en el estado actual del modelo en memoria. |
| `/export/download/<nombre>` | GET | Procesa el flujo de descarga de archivos exportados mediante streaming de bytes. |

##  Técnicas de Procesos

### Lógica de Entrenamiento (`/train`)

El endpoint de entrenamiento no solo agrupa datos; es un proceso multi-etapa:

- **Escalado**: Los datos numéricos se normalizan mediante `StandardScaler` para que variables con rangos distintos (ej. ingresos vs. años de experiencia) no sesguen la distancia euclidiana.
- **NLP**: Se aplica una matriz TF-IDF con stop-words eliminadas, convirtiendo documentos de texto en espacios vectoriales de alta dimensión.
- **Optimización**: Se ejecuta el Método del Codo internamente para validar que el parámetro `k` seleccionado minimiza la varianza intra-clúster.

### Inferencia y Clasificación (`/classify`)

La clasificación de nuevos registros es una operación determinista. Dado un punto `x`, el sistema aplica la misma transformación realizada durante el entrenamiento y calcula `min(distancia(x, centroide_i))` para todo `i`, asegurando que el nuevo freelancer se clasifique bajo la lógica del modelo ya validado.
