import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
// Fuentes servidas desde nuestro propio dominio (sin enviar la IP de los visitantes a Google)
import "@fontsource/manrope/200.css";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/playfair-display/400-italic.css";

import Landing from "./Landing.jsx";
import App from "./App.jsx";
import { Privacidad, Terminos, AvisoLegal } from "./Legal.jsx";

// Si algo falla al pintar, en vez de una pantalla en blanco se muestra un aviso
// (los datos ya guardados no se pierden: están en la base de datos)
class Recuperacion extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", background: "#F5EEE3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope',sans-serif", padding: 16 }}>
        <div style={{ maxWidth: 420, background: "#FBF8F1", border: "1px solid #D9C9A8", borderRadius: 18, padding: "32px 30px", textAlign: "center", color: "#3B2A1E" }}>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, marginBottom: 10 }}>Algo no ha ido bien</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#9A7E68", marginBottom: 20 }}>Tus datos guardados están a salvo. Recarga la página para continuar. Si vuelve a pasar, escríbenos indicando qué estabas haciendo.</div>
          <button onClick={() => window.location.reload()} style={{ background: "#A66B3F", color: "#FBF8F1", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Recargar</button>
        </div>
      </div>
    );
  }
}

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<App demo />} />
        <Route path="/app" element={<App />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/aviso-legal" element={<AvisoLegal />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Recuperacion>
      <Root />
    </Recuperacion>
  </StrictMode>
);
