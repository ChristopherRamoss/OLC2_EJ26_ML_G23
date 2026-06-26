import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Carga from "./pages/Carga";
import Entrenamiento from "./pages/Entrenamiento";
import Interpretacion from "./pages/Interpretacion";
import Evaluacion from "./pages/Evaluacion";
import Clasificacion from "./pages/Clasificacion";
import Exportacion from "./pages/Exportacion";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("carga");

  // ── Estado global compartido (persiste entre vistas) ──────────

  // Vista 1 — Carga
  const [freelancersFile, setFreelancersFile] = useState(null);
  const [resenasFile,     setResenasFile]     = useState(null);
  const [freelancersData, setFreelancersData] = useState(null); // preview + stats
  const [resenasData,     setResenasData]     = useState(null);
  const [cleanReport,     setCleanReport]     = useState(null);
  const [cleaned,         setCleaned]         = useState(false);

  // Vista 2 — Entrenamiento
  const [modeloFreelancers, setModeloFreelancers] = useState(null); // resultado entrenamiento
  const [modeloResenas,     setModeloResenas]     = useState(null);

  // Vista 3 — Interpretación
  const [interpView, setInterpView] = useState("freelancers");

  // Vista 4 — Evaluación
  const [evalView, setEvalView] = useState("freelancers");

  // Vista 5 — Clasificación
  const [clasifType,   setClasifType]   = useState("freelancer");
  const [clasifResult, setClasifResult] = useState(null);

  const trainedFreelancers = !!modeloFreelancers;
  const trainedResenas     = !!modeloResenas;
  const anyTrained         = trainedFreelancers || trainedResenas;

  const pages = {
    carga: (
      <Carga
        freelancersFile={freelancersFile} setFreelancersFile={setFreelancersFile}
        resenasFile={resenasFile}         setResenasFile={setResenasFile}
        freelancersData={freelancersData} setFreelancersData={setFreelancersData}
        resenasData={resenasData}         setResenasData={setResenasData}
        cleanReport={cleanReport}         setCleanReport={setCleanReport}
        cleaned={cleaned}                 setCleaned={setCleaned}
      />
    ),
    entrenamiento: (
      <Entrenamiento
        cleaned={cleaned}
        modeloFreelancers={modeloFreelancers} setModeloFreelancers={setModeloFreelancers}
        modeloResenas={modeloResenas}         setModeloResenas={setModeloResenas}
      />
    ),
    interpretacion: (
      <Interpretacion
        modeloFreelancers={modeloFreelancers}
        modeloResenas={modeloResenas}
        view={interpView} setView={setInterpView}
      />
    ),
    evaluacion: (
      <Evaluacion
        modeloFreelancers={modeloFreelancers}
        modeloResenas={modeloResenas}
        view={evalView} setView={setEvalView}
      />
    ),
    clasificacion: (
      <Clasificacion
        trainedFreelancers={trainedFreelancers}
        trainedResenas={trainedResenas}
        modeloFreelancers={modeloFreelancers}
        modeloResenas={modeloResenas}
        type={clasifType}       setType={setClasifType}
        result={clasifResult}   setResult={setClasifResult}
      />
    ),
    exportacion: (
      <Exportacion
        anyTrained={anyTrained}
        trainedFreelancers={trainedFreelancers}
        trainedResenas={trainedResenas}
        modeloFreelancers={modeloFreelancers}
        modeloResenas={modeloResenas}
      />
    ),
  };

  return (
    <div className="layout">
      <Sidebar
        current={page}
        onChange={setPage}
        cleaned={cleaned}
        trainedFreelancers={trainedFreelancers}
        trainedResenas={trainedResenas}
        anyTrained={anyTrained}
      />
      <main className="content">{pages[page]}</main>
    </div>
  );
}
