import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

# son las columnas que espera el modelo
FEATURES = [
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

COLUMNA_OBJETIVO = "en_riesgo"



# ÁRBOL DE DECISION -----------------------------------------------------------------------------------
class Nodo:
    """Nodo del árbol — puede ser interno (pregunta) o hoja (respuesta)."""
    def __init__(self):
        self.feature_idx  = None   
        self.umbral       = None  
        self.izquierda    = None   
        self.derecha      = None 
        self.prediccion   = None 
        self.probabilidad = None  


class ArbolDecision:

    def __init__(self, max_depth=5, max_leaf_nodes=20,
                 min_samples=2, max_features=None):
        self.max_depth      = max_depth
        self.max_leaf_nodes = max_leaf_nodes
        self.min_samples    = min_samples
        self.max_features   = max_features
        self.raiz           = None
        self._hojas         = 0

    def fit(self, X, y):
        self._hojas      = 0
        self.n_features  = X.shape[1]
        self.max_features = self.max_features or self.n_features
        self.raiz        = self._construir(X, y, profundidad=0)
        return self

    def _construir(self, X, y, profundidad):
        n         = len(y)
        n_riesgo  = int(np.sum(y))

        # Condiciones de parada - crear hoja
        if (n_riesgo == 0 or n_riesgo == n or
                profundidad >= self.max_depth or
                n < self.min_samples or
                self._hojas >= self.max_leaf_nodes):
            return self._crear_hoja(y)

        # Buscar mejor división
        feature, umbral = self._mejor_split(X, y)
        if feature is None:
            return self._crear_hoja(y)

        # Dividir y construir subárboles
        izq = X[:, feature] <= umbral
        nodo             = Nodo()
        nodo.feature_idx = feature
        nodo.umbral      = umbral
        nodo.izquierda   = self._construir(X[izq],  y[izq],  profundidad + 1)
        nodo.derecha     = self._construir(X[~izq], y[~izq], profundidad + 1)
        return nodo

    def _crear_hoja(self, y):
        self._hojas += 1
        nodo              = Nodo()
        nodo.prediccion   = 1 if np.sum(y) > len(y) / 2 else 0
        nodo.probabilidad = float(np.sum(y) / len(y)) if len(y) > 0 else 0.0
        return nodo

    def _mejor_split(self, X, y):
        mejor_gini    = float("inf")
        mejor_feature = None
        mejor_umbral  = None
        n             = len(y)

        # Subconjunto aleatorio de features (clave del Random Forest)
        candidatos = np.random.choice(
            self.n_features,
            size=min(self.max_features, self.n_features),
            replace=False
        )

        for fi in candidatos:
            umbrales = np.unique(X[:, fi])
            if len(umbrales) < 2:
                continue
            umbrales = (umbrales[:-1] + umbrales[1:]) / 2  # puntos medios

            for u in umbrales:
                izq = y[X[:, fi] <= u]
                der = y[X[:, fi] >  u]
                if len(izq) == 0 or len(der) == 0:
                    continue
                gini = self._gini_ponderado(izq, der, n)
                if gini < mejor_gini:
                    mejor_gini    = gini
                    mejor_feature = fi
                    mejor_umbral  = u

        return mejor_feature, mejor_umbral

    def _gini_ponderado(self, izq, der, n_total):
        def gini(y):
            if len(y) == 0:
                return 0
            p = np.sum(y) / len(y)
            return 1 - (p**2 + (1-p)**2)
        return (len(izq)/n_total)*gini(izq) + (len(der)/n_total)*gini(der)

    def predict(self, X):
        return np.array([self._recorrer(x, self.raiz) for x in X])

    def predict_proba(self, X):
        return np.array([self._recorrer_proba(x, self.raiz) for x in X])

    def _recorrer(self, x, nodo):
        if nodo.prediccion is not None:
            return nodo.prediccion
        if x[nodo.feature_idx] <= nodo.umbral:
            return self._recorrer(x, nodo.izquierda)
        return self._recorrer(x, nodo.derecha)

    def _recorrer_proba(self, x, nodo):
        if nodo.probabilidad is not None:
            return nodo.probabilidad
        if x[nodo.feature_idx] <= nodo.umbral:
            return self._recorrer_proba(x, nodo.izquierda)
        return self._recorrer_proba(x, nodo.derecha)


# RANDOM FOREST -----------------------------------------------------------------------------------

class RandomForest:


    def __init__(self, n_estimators=100, max_depth=5,
                 max_leaf_nodes=20, random_state=42):
        self.n_estimators   = n_estimators
        self.max_depth      = max_depth
        self.max_leaf_nodes = max_leaf_nodes
        self.random_state   = random_state
        self.arboles        = []
        self._importancias  = None

    def fit(self, X, y):

        np.random.seed(self.random_state)
        self.arboles       = []
        n, n_features      = X.shape
        mf                 = max(1, int(np.sqrt(n_features)))
        importancias_acum  = np.zeros(n_features)

        for _ in range(self.n_estimators):
            # Bootstrap
            idx    = np.random.choice(n, size=n, replace=True)
            X_boot = X[idx]
            y_boot = y[idx]

            arbol = ArbolDecision(
                max_depth      = self.max_depth,
                max_leaf_nodes = self.max_leaf_nodes,
                max_features   = mf,
            )
            arbol.fit(X_boot, y_boot)
            self.arboles.append(arbol)
            importancias_acum += self._importancia_arbol(arbol.raiz, n_features)

        total = importancias_acum.sum()
        self._importancias = (importancias_acum / total
                              if total > 0 else importancias_acum)
        return self

    def _importancia_arbol(self, nodo, n_features):
        imp = np.zeros(n_features)
        self._acumular(nodo, imp)
        return imp

    def _acumular(self, nodo, imp):
        if nodo is None or nodo.prediccion is not None:
            return
        if nodo.feature_idx is not None:
            imp[nodo.feature_idx] += 1
        self._acumular(nodo.izquierda, imp)
        self._acumular(nodo.derecha,   imp)

    def predict(self, X):
        """Votación por mayoría entre todos los árboles."""
        if not self.arboles:
            raise RuntimeError("Modelo no entrenado.")
        X     = np.array(X)
        votos = np.array([a.predict(X) for a in self.arboles])
        return (votos.mean(axis=0) >= 0.5).astype(int)

    def predict_proba(self, X):
        """Probabilidad promedio de riesgo según todos los árboles."""
        if not self.arboles:
            raise RuntimeError("Modelo no entrenado.")
        X     = np.array(X)
        probas = np.array([a.predict_proba(X) for a in self.arboles])
        return probas.mean(axis=0)

    def feature_importance(self):
        """Importancia de cada variable ordenada de mayor a menor."""
        return sorted(
            [{"variable": FEATURES[i], "importancia": round(float(v), 4)}
             for i, v in enumerate(self._importancias)],
            key=lambda x: x["importancia"], reverse=True
        )



# FUNCIÓN PRINCIPAL DE ENTRENAMIENTO ----------------------------------------------------------------------

def entrenar(df, n_estimators=100, max_depth=5, max_leaf_nodes=20):

    # Separar features y target
    X = df[FEATURES].values.astype(float)
    y = df[COLUMNA_OBJETIVO].values.astype(int)

    # Split 80% train / 20% test (sklearn — utilidad estándar)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Entrenar modelo propio
    modelo = RandomForest(
        n_estimators   = n_estimators,
        max_depth      = max_depth,
        max_leaf_nodes = max_leaf_nodes,
        random_state   = 42,
    )
    modelo.fit(X_train, y_train)

    # Evaluar con sklearn (métricas estándar verificables)
    y_pred = modelo.predict(X_test)
    cm     = confusion_matrix(y_test, y_pred)

    metricas = {
        "accuracy":  round(float(accuracy_score(y_test,  y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":    round(float(recall_score(y_test,    y_pred, zero_division=0)), 4),
        "f1":        round(float(f1_score(y_test,        y_pred, zero_division=0)), 4),
        "confusion_matrix": {
            "vn": int(cm[0][0]),  # Verdadero Negativo: real=0, pred=0
            "fp": int(cm[0][1]),  # Falso Positivo:     real=0, pred=1
            "fn": int(cm[1][0]),  # Falso Negativo:     real=1, pred=0
            "vp": int(cm[1][1]),  # Verdadero Positivo: real=1, pred=1
        }
    }

    return modelo, metricas