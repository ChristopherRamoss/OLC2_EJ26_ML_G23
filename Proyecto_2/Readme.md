

# Manual Técnico: Proyecto TalentMosaic

TalentMosaic es una plataforma avanzada de análisis y segmentación de datos diseñada para la gestión de freelancers y reseñas. Este manual detalla los componentes técnicos y la lógica operativa del sistema.


## Frontend
npm create vite@latest Proyecto2/Frontend -- --template react
npm install
npm install rechartsp
npm run dev

## Bakend

cd Backend
pip install -r requirements.txt
python app.py

## 1. Arquitectura del Sistema

El sistema está desarrollado para entornos de computación eficiente, optimizado para procesar grandes volúmenes de datos mediante algoritmos de Machine Learning no supervisado.

## 2. Módulos Operativos

### 2.1. Carga y Preprocesamiento

Este módulo es responsable de la ingestión y depuración de los datasets (CSV). Las tareas incluyen:

- **Limpieza**: Eliminación de duplicados y corrección de registros inconsistentes.
- **Imputación**: Relleno de valores nulos (NaN) para garantizar la integridad matemática.
- **Feature Engineering**: Cálculo automático de variables derivadas, como la longitud de reseñas.

### 2.2. Configuración y Entrenamiento

Permite la segmentación basada en algoritmos de clustering:

| Algoritmo | Descripción Técnica |
|-----------|----------------------|
| K-Means | Agrupación basada en centroides, eficiente para estructuras esféricas. |
| DBSCAN | Basado en densidad, ideal para detectar ruido (outliers). |
| Jerárquico | Genera una estructura de árbol (dendrograma) para relaciones complejas. |

Las métricas de distancia soportadas son: **Euclidiana** (distancia geométrica) y **Manhattan** (distancia de cuadrícula).

### 2.3. Procesamiento de Lenguaje Natural (NLP)

Para las reseñas, se implementaron técnicas de vectorización:

- **TF-IDF**: Ponderación que resalta palabras distintivas y reduce el impacto de términos comunes.
- **Bag of Words**: Conteo simple de frecuencias.

## 3. Interpretación y Validación

### 3.1. Interpretación (PCA 2D)

Utiliza Análisis de Componentes Principales (PCA) para reducir la dimensionalidad de los datos y visualizar la dispersión de los clústeres en un plano bidimensional, facilitando el análisis visual de la calidad de los grupos.

### 3.2. Métricas de Validación

- **Coeficiente de Silueta**: Mide la cohesión y separación (Rango: -1 a 1).
- **Índice de Davies-Bouldin**: Mide el solapamiento (Menor es mejor).
- **Índice Calinski-Harabasz**: Mide la compacidad (Mayor es mejor).
- **Método del Codo (WCSS)**: Determina el valor óptimo de k minimizando la inercia.

## 4. Clasificación (Inferencia)

Utiliza el modelo entrenado para asignar nuevos registros a los segmentos existentes, calculando la afinidad estadística (distancia) entre los nuevos datos y los centroides aprendidos.

## 5. Exportación

El sistema genera reportes en formato CSV para los datasets procesados y un PDF ejecutivo que integra visualizaciones, nubes de palabras y resúmenes estadísticos de los segmentos.


# Documentación Técnica de API: TalentMosaic

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

## Profundización Técnica de Procesos

### Lógica de Entrenamiento (`/train`)

El endpoint de entrenamiento no solo agrupa datos; es un proceso multi-etapa:

- **Escalado**: Los datos numéricos se normalizan mediante `StandardScaler` para que variables con rangos distintos (ej. ingresos vs. años de experiencia) no sesguen la distancia euclidiana.
- **NLP**: Se aplica una matriz TF-IDF con stop-words eliminadas, convirtiendo documentos de texto en espacios vectoriales de alta dimensión.
- **Optimización**: Se ejecuta el Método del Codo internamente para validar que el parámetro `k` seleccionado minimiza la varianza intra-clúster.

### Inferencia y Clasificación (`/classify`)

La clasificación de nuevos registros es una operación determinista. Dado un punto `x`, el sistema aplica la misma transformación realizada durante el entrenamiento y calcula `min(distancia(x, centroide_i))` para todo `i`, asegurando que el nuevo freelancer se clasifique bajo la lógica del modelo ya validado.
