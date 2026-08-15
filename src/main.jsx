import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Registro from "./Registro";
import ClientDashboard from "./Dashboard";
import App from "./App";

const DEMO_USER = {
  nombre: "Kevin Costa",
  email: "kevin@praxi.com",
  password: "psico2026",
  clinica: "Consulta Neuro Kevin",
  especialidad: "Neuropsicólogo",
  plan: "pro",
};

function Root() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [inApp, setInApp] = React.useState(false);

  if (inApp) return <App onBack={() => setInApp(false)} />;
  if (loggedIn) return <ClientDashboard user={DEMO_USER} onLogout={() => setLoggedIn(false)} onEnterApp={() => setInApp(true)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/demo" element={<App isDemo={true} />} />
        <Route path="/login" element={
          <LoginPage onLogin={() => setLoggedIn(true)} />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [error, setError] = React.useState("");
  const C = { bg:"#F5EFE4",bone:"#FBF8F1",border:"#D9C9A8",accent:"#A66B3F",ink:"#221610",muted:"#9A7E68" };

  const handle = () => {
    if (email === DEMO_USER.email && pass === DEMO_USER.password) { onLogin(); }
    else setError("Email o contraseña incorrectos");
  };

  return (
    <div style={{ fontFamily:"'Manrope',sans-serif", background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%", maxWidth:420, background:C.bone, border:`1px solid ${C.border}`, borderRadius:24, padding:"52px 48px", boxShadow:"0 8px 40px rgba(59,42,30,0.08)" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", lineHeight:1, marginBottom:10 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:48, color:C.ink, letterSpacing:"-1px" }}>pra</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:57, color:C.accent, letterSpacing:"-1px", lineHeight:0.9, marginLeft:3 }}>X</span>
            <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:48, color:C.ink, letterSpacing:"-1px" }}>i</span>
            <span style={{ display:"inline-block", width:11, height:11, borderRadius:"50%", background:C.accent, marginLeft:16, marginBottom:7 }}/>
          </div>
          <div style={{ fontSize:8, color:C.muted, letterSpacing:"4px", textTransform:"uppercase" }}>gestión clínica</div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:6 }}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"
            style={{ width:"100%", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, background:C.bg, color:C.ink, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <label style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>Contraseña</label>
            <span style={{ fontSize:11, color:C.accent, cursor:"pointer" }}>¿La olvidaste?</span>
          </div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
            style={{ width:"100%", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, background:C.bg, color:C.ink, outline:"none", boxSizing:"border-box" }}
            onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        {error && <div style={{ fontSize:12, color:"#B85040", marginBottom:14, textAlign:"center" }}>{error}</div>}
        <button onClick={handle} style={{ width:"100%", background:C.accent, color:C.bone, border:"none", borderRadius:10, padding:"14px 0", fontSize:14, fontWeight:600, cursor:"pointer", marginBottom:16 }}>
          Iniciar sesión
        </button>
        <div style={{ textAlign:"center", fontSize:12, color:C.muted }}>
          ¿No tienes cuenta? <a href="/registro" style={{ color:C.accent, fontWeight:500, textDecoration:"none" }}>Crear cuenta</a>
        </div>
        <div style={{ textAlign:"center", fontSize:11, color:C.muted, marginTop:16 }}>Demo: kevin@praxi.com / psico2026</div>
      </div>
    </div>
  );
}

import React from "react";
createRoot(document.getElementById("root")).render(<StrictMode><Root /></StrictMode>);
