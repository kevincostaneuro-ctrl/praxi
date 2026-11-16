import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DemoCtx, EquipoCtx } from "./constantes.js";
import { C, st } from "./estilos.js";
import { crearSeudonimos, enviarIA } from "./ia.jsx";
import { NORA, NoraMarca } from "./nora.jsx";
import { contextoApp, REGLAS_APP } from "./noraContexto.js";

// ══════════════════════════════════════════════════════════════════════════════
// NORA EN TODA LA APP — botón flotante y chat con la agenda, los huecos,
// los pacientes, los cobros y las tareas
// ══════════════════════════════════════════════════════════════════════════════
const SUGERENCIAS = {
  dashboard: ["¿Qué citas tengo hoy y de qué tipo?", "Resúmeme la semana", "¿Qué tengo pendiente?"],
  calendario: ["¿Qué huecos libres tengo esta semana?", "¿Qué día de la próxima semana tengo más libre?", "Resúmeme la agenda de mañana"],
  pacientes: ["¿Qué pacientes activos no tienen próxima cita?", "¿Quién lleva más tiempo sin venir?", "¿Cuántas sesiones he hecho este mes?"],
  facturas: ["¿Cuánto llevo cobrado este mes?", "¿Quién me debe dinero?", "¿Cuánto tengo pendiente de cobro?"],
  recursos: ["¿Qué pacientes tengo con ansiedad?", "¿Qué citas tengo hoy?"],
};
const PAGINAS = { dashboard: "Dashboard", calendario: "Calendario", pacientes: "Pacientes", facturas: "Facturas", recursos: "Recursos", admin: "Equipo", configuracion: "Configuración" };

export function NoraGlobal({ pagina, patients, citas, tareas, horario }) {
  const demo = useContext(DemoCtx);
  const { miId, miembros = [] } = useContext(EquipoCtx) || {};
  const [abierta, setAbierta] = useState(false);
  const [chat, setChat] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const abajo = useRef();
  useEffect(() => { abajo.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, cargando]);
  useEffect(() => { const f = e => { if (e.key === "Escape") setAbierta(false); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, []);

  const aliasDe = useMemo(() => { const m = new Map(); patients.forEach((p, i) => m.set(String(p.id), `Paciente ${i + 1}`)); return m; }, [patients]);
  const seud = useMemo(() => crearSeudonimos(patients.map(p => ({ nombre: p.nombre, apellidos: p.apellidos, alias: aliasDe.get(String(p.id)) }))), [patients, aliasDe]);

  const enviar = async texto => {
    const q = (texto ?? pregunta).trim(); if (!q || cargando) return;
    setPregunta(""); const nuevos = [...chat, { role: "user", content: q }]; setChat(nuevos);
    if (demo) { setChat(m => [...m, { role: "assistant", content: "En la demo Nora no está activa. Con tu cuenta podrás preguntarle por tu agenda, tus huecos libres, tus pacientes y tus cobros." }]); return; }
    setCargando(true);
    try {
      const sistema = `${REGLAS_APP}\n\n${contextoApp({ patients, citas, tareas, horario, miId, miembros, pagina: PAGINAS[pagina] || pagina, alias: p => aliasDe.get(String(p.id)) })}`;
      const r = await enviarIA({ system: sistema, messages: nuevos.slice(-12), seud });
      setChat(m => [...m, { role: "assistant", content: r }]);
    } catch (e) { setChat(m => [...m, { role: "assistant", content: e.message || "Nora no ha podido responder." }]); }
    setCargando(false);
  };

  const sugerencias = SUGERENCIAS[pagina] || SUGERENCIAS.dashboard;

  if (!abierta) return (
    <button className="praxi-nora-fab" onClick={() => setAbierta(true)} aria-label="Pregúntale a Nora"
      style={{ position: "fixed", right: 22, bottom: 22, zIndex: 90, display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px 8px 8px", border: "none", borderRadius: 999, background: NORA.fondo, color: NORA.texto, fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 8px 24px rgba(40,30,70,.22)" }}>
      <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.22)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><NoraMarca size={26} /></span>
      <span className="praxi-nora-fab-txt">Pregúntale a Nora</span>
    </button>
  );

  return (
    <div className="praxi-nora" role="dialog" aria-label="Nora" style={{ position: "fixed", top: 0, right: 0, width: 420, maxWidth: "100vw", height: "100vh", background: C.bone, borderLeft: `1px solid ${C.border}`, zIndex: 110, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(59,42,30,0.12)" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: NORA.tinte }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <NoraMarca size={32} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nora</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>Agenda, huecos, pacientes y cobros</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {chat.length > 0 && <button onClick={() => setChat([])} style={{ ...st.btn("ghost"), fontSize: 12 }}>Nueva</button>}
          <button onClick={() => setAbierta(false)} aria-label="Cerrar Nora" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {chat.length === 0 && <div>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>Pregúntame lo que necesites de tu consulta: qué citas tienes y con quién, qué huecos te quedan libres, quién no tiene próxima cita o cuánto te deben.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sugerencias.map(s => <button key={s} onClick={() => enviar(s)} style={{ ...st.btn("sm"), textAlign: "left", padding: "9px 12px", fontSize: 12.5, background: C.card, color: NORA.tinteTexto, border: `1px solid ${C.border}`, borderRadius: 10 }}>{s}</button>)}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>Los nombres de tus pacientes no salen de Praxi: Nora los ve como «Paciente 1, 2…». Para notas o informes de un paciente, abre su ficha y pulsa «Nora».</div>
        </div>}
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "88%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? NORA.tinteTexto : C.card, color: m.role === "user" ? "#fff" : C.text, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {cargando && <div style={{ fontSize: 13, color: C.muted, display: "flex", gap: 8, alignItems: "center" }}><NoraMarca size={20} /> Nora está mirando tu consulta…</div>}
        <div ref={abajo} />
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <input autoFocus style={{ ...st.input, flex: 1, fontSize: 13 }} value={pregunta} onChange={e => setPregunta(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()} placeholder="Pregúntale a Nora…" aria-label="Pregunta para Nora" />
        <button style={{ ...st.btn(), padding: "0 16px", background: NORA.tinteTexto, color: "#fff" }} onClick={() => enviar()} disabled={cargando || !pregunta.trim()} aria-label="Enviar">↑</button>
      </div>
    </div>
  );
}
