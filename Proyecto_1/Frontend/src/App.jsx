import { useState } from "react";
import Sidebar from "./components/Sidebar";
import CargaDatos from "./pages/CargaDatos";
import Metricas from "./pages/Metricas";
import Hiperparametros from "./pages/Hiperparametros";
import Prediccion from "./pages/Prediccion";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("carga");

  // Estado global compartido aca guardamos la persistencia ----------------------------

  // Pipeline de Carga de Datos
  const [status,      setStatus]      = useState({ loaded: false, cleaned: false, trained: false });
  const [fileName,    setFileName]    = useState(null);
  const [uploadData,  setUploadData]  = useState(null);
  const [cleanReport, setCleanReport] = useState(null);
  const [dataView,    setDataView]    = useState("distribucion");

  // Métricas y historial de entrenamientos
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  // Hiperparámetros
  const [hiperVals,    setHiperVals]    = useState({ n_estimators: 100, max_depth: 5, max_leaf_nodes: 20 });
  const [prevMetrics,  setPrevMetrics]  = useState(null);
  const [newMetrics,   setNewMetrics]   = useState(null);

  // Predicción individual
  const [predForm,   setPredForm]   = useState({});
  const [predResult, setPredResult] = useState(null);
  const [predErrors, setPredErrors] = useState({});

  const trained = status.trained;

  // Agrega una entrada al historial de entrenamientos -----------------------------------------------------------
  const addHistoryEntry = (m) => {
    setMetrics(m);
    setHistory((h) => {
      const entry = {
        nombre:    `Entreno ${h.length + 1}`,
        timestamp: new Date().toLocaleTimeString(),
        Exactitud: parseFloat((m.accuracy  * 100).toFixed(1)),
        Precisión: parseFloat((m.precision * 100).toFixed(1)),
        Recall:    parseFloat((m.recall    * 100).toFixed(1)),
        "F1 Score":parseFloat((m.f1        * 100).toFixed(1)),
        accuracy:  m.accuracy,
        precision: m.precision,
        recall:    m.recall,
        f1:        m.f1,
      };
      return [...h, entry].slice(-8);
    });
  };

  const pages = {
    carga: (
      <CargaDatos
        status={status} setStatus={setStatus}
        fileName={fileName} setFileName={setFileName}
        uploadData={uploadData} setUploadData={setUploadData}
        cleanReport={cleanReport} setCleanReport={setCleanReport}
        dataView={dataView} setDataView={setDataView}
        onTrainSuccess={addHistoryEntry}
      />
    ),
    metricas: (
      <Metricas metrics={metrics} history={history} />
    ),
    hiper: (
      <Hiperparametros
        trained={trained}
        vals={hiperVals} setVals={setHiperVals}
        prevMetrics={prevMetrics} setPrevMetrics={setPrevMetrics}
        newMetrics={newMetrics} setNewMetrics={setNewMetrics}
        onRetrainSuccess={addHistoryEntry}
      />
    ),
    prediccion: (
      <Prediccion
        trained={trained}
        form={predForm} setForm={setPredForm}
        result={predResult} setResult={setPredResult}
        errors={predErrors} setErrors={setPredErrors}
      />
    ),
  };

  return (
    <div className="layout">
      <Sidebar current={page} onChange={setPage} trained={trained} />
      <main className="content">
        {pages[page]}
      </main>
    </div>
  );
}