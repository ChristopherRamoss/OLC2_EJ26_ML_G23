import { useState } from "react";
import Sidebar from "./components/Sidebar";
import CargaDatos from "./pages/CargaDatos";
import Metricas from "./pages/Metricas";
import Hiperparametros from "./pages/Hiperparametros";
import Prediccion from "./pages/Prediccion";
import "./App.css";

export default function App() {
  const [page, setPage]       = useState("carga");
  const [trained, setTrained] = useState(false);

  const pages = {
    carga:     <CargaDatos onTrained={() => setTrained(true)} />,
    metricas:  <Metricas />,
    hiper:     <Hiperparametros trained={trained} />,
    prediccion:<Prediccion trained={trained} />,
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
