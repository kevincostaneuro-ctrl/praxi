import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DemoCtx, EquipoCtx } from "./constantes.js";
import { C, st } from "./estilos.js";
import { crearSeudonimos, enviarIA } from "./ia.jsx";
import { NORA, NoraMarca, VentanaNora } from "./nora.jsx";
import { contextoApp, estiloNora, leerAcciones, REGLAS_APP, saludoNora, validarAccion } from "./noraContexto.js";
import { fechaDe } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// NORA EN TODA LA APP — botón flotante y chat con la agenda, los huecos,
// los pacientes, los cobros y las tareas
// ══════════════════════════════════════════════════════════════════════════════
const ACCESOS = [
  { icono: "☀️", titulo: "Mi día", desc: "Citas de hoy y con quién", pregunta: "¿Qué citas tengo hoy, de qué tipo y con quién?" },
  { icono: "🕓", titulo: "Huecos libres", desc: "Esta semana", pregunta: "¿Qué huecos libres tengo esta semana?" },
  { icono: "👥", titulo: "Sin próxima cita", desc: "Pacientes a recuperar", pregunta: "¿Qué pacientes activos no tienen próxima cita?" },
  { icono: "💶", titulo: "Cobros", desc: "Lo que te deben", pregunta: "¿Cuánto tengo pendiente de cobro y de quién?" },
];
const PAGINAS = { dashboard: "Dashboard", calendario: "Calendario", pacientes: "Pacientes", facturas: "Facturas", recursos: "Recursos", admin: "Equipo", configuracion: "Configuración" };

const fechaLarga = ymd => fechaDe(ymd).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
const nombre = p => (p ? `${p.nombre} ${p.apellidos || ""}`.trim() : "sin paciente");

// Tarjeta de confirmación de una acción propuesta por Nora
function TarjetaAccion({ accion, estado, datos, onConfirmar, onDescartar }) {
  const v = validarAccion(accion, datos);
  const titulo = { crear_cita: "Nueva cita", mover_cita: "Mover cita", cancelar_cita: "Cancelar cita", crear_tarea: "Nueva tarea" }[accion.accion] || "Acción";
  let detalle = "";
  if (v.ok && accion.accion === "crear_cita") detalle = `${nombre(v.paciente)} · ${fechaLarga(v.fecha)} a las ${v.hora} · ${v.tipo?.nombre || "cita"}`;
  if (v.ok && accion.accion === "mover_cita") detalle = `${nombre(v.paciente)} · de ${fechaLarga(v.cita.fecha)} ${v.cita.hora} → ${fechaLarga(v.fecha)} a las ${v.hora}`;
  if (v.ok && accion.accion === "cancelar_cita") detalle = `${nombre(v.paciente)} · ${fechaLarga(v.cita.fecha)} a las ${v.cita.hora} · ${v.cita.tipo || "cita"}`;
  if (v.ok && accion.accion === "crear_tarea") detalle = `${v.titulo} · ${fechaLarga(v.fecha)} ${v.hora} · prioridad ${v.prioridad}`;
  const boton = { crear_cita: "Revisar y guardar", mover_cita: "Revisar y guardar", cancelar_cita: "Sí, cancelar la cita", crear_tarea: "Añadir tarea" }[accion.accion];
  return (
    <div style={{ background: C.card, border: `1.5px solid ${estado ? C.border : NORA.fabBorde || C.border}`, borderRadius: 12, padding: "10px 12px", fontSize: 12.5 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: NORA.tinteTexto }}>{titulo}</div>
      {v.ok ? <div style={{ color: C.text, margin: "3px 0 6px", lineHeight: 1.45, fontWeight: 600 }}>{detalle}</div> : <div style={{ color: C.red, margin: "3px 0 6px" }}>{v.error}</div>}
      {v.ok && v.avisos.map(a => <div key={a} style={{ color: "#A8661E", fontSize: 12, marginBottom: 4 }}>⚠ {a}</div>)}
      {estado ? <div style={{ color: C.muted, fontSize: 12 }}>{estado}</div>
        : <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          {v.ok && <button onClick={() => onConfirmar(v)} style={{ ...st.btn("sm"), background: accion.accion === "cancelar_cita" ? C.red : NORA.tinteTexto, color: "#fff", border: "none" }}>{boton}</button>}
          <button onClick={onDescartar} style={{ ...st.btn("ghost"), fontSize: 12 }}>Descartar</button>
        </div>}
    </div>
  );
}

// Botón «Nora» para la cabecera de cada página (a la izquierda de «+ Nueva cita», «+ Nuevo paciente»…)
export function BotonNora() {
  const { abrirNora } = useContext(EquipoCtx) || {};
  if (!abrirNora) return null;
  return (
    <button onClick={abrirNora} title="Pregúntale a Nora: agenda, huecos, pacientes, cobros…" style={{ ...st.btn("sm"), background: NORA.tinte, color: NORA.tinteTexto, display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, padding: "4px 14px 4px 5px" }}>
      <NoraMarca size={26} />Nora
    </button>
  );
}

export function NoraGlobal({ abierta, setAbierta, pagina, patients, citas, tareas, horario, tipos = [], setCitas, setTareas, onNuevaCita, onEditarCita }) {
  const demo = useContext(DemoCtx);
  const { miId, miembros = [], preferenciasNora, miNombre } = useContext(EquipoCtx) || {};
  const [chat, setChat] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const abajo = useRef();
  useEffect(() => { abajo.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, cargando]);
  useEffect(() => { const f = e => { if (e.key === "Escape") setAbierta(false); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, []);

  const aliasDe = useMemo(() => { const m = new Map(); patients.forEach((p, i) => m.set(String(p.id), `Paciente ${i + 1}`)); return m; }, [patients]);
  const seud = useMemo(() => crearSeudonimos(patients.map(p => ({ nombre: p.nombre, apellidos: p.apellidos, alias: aliasDe.get(String(p.id)) }))), [patients, aliasDe]);

  const pacientePorNumero = n => patients.find(p => aliasDe.get(String(p.id)) === `Paciente ${Number(n)}`) || null;
  const datos = { patients, citas, tipos, horario, pacientePorNumero };
  const marcar = (i, k, estado) => setChat(m => m.map((x, j) => j === i ? { ...x, estados: { ...(x.estados || {}), [k]: estado } } : x));
  const confirmar = (i, k, accion, v) => {
    if (accion.accion === "crear_cita") { onNuevaCita?.({ pacienteId: v.paciente.id, fecha: v.fecha, hora: v.hora, tipoId: v.tipo?.id }); marcar(i, k, "Abierta en el formulario de cita para que la guardes."); setAbierta(false); }
    if (accion.accion === "mover_cita") { onEditarCita?.({ ...v.cita, fecha: v.fecha, hora: v.hora }); marcar(i, k, "Abierta en el formulario de cita para que la guardes."); setAbierta(false); }
    if (accion.accion === "cancelar_cita") { setCitas?.(cs => cs.filter(c => c.id !== v.cita.id)); marcar(i, k, "Cita cancelada ✓"); }
    if (accion.accion === "crear_tarea") { setTareas?.(ts => [...ts, { id: Date.now(), titulo: v.titulo, texto: "", fecha: v.fecha, hora: v.hora, prioridad: v.prioridad, hecho: false }]); marcar(i, k, "Tarea añadida a tu agenda ✓"); }
  };

  const enviar = async texto => {
    const q = (texto ?? pregunta).trim(); if (!q || cargando) return;
    setPregunta(""); const nuevos = [...chat, { role: "user", content: q }]; setChat(nuevos);
    if (demo) { setChat(m => [...m, { role: "assistant", content: "En la demo Nora no está activa. Con tu cuenta podrás preguntarle por tu agenda, tus huecos libres, tus pacientes y tus cobros." }]); return; }
    setCargando(true);
    try {
      const sistema = `${REGLAS_APP}${estiloNora(preferenciasNora)}\n\n${contextoApp({ patients, citas, tareas, tipos, horario, miId, miembros, pagina: PAGINAS[pagina] || pagina, alias: p => aliasDe.get(String(p.id)) })}`;
      const historial = nuevos.slice(-12).map(({ role, content }) => ({ role, content }));
      const { texto: limpio, acciones } = leerAcciones(await enviarIA({ system: sistema, messages: historial, seud }));
      setChat(m => [...m, { role: "assistant", content: limpio || (acciones.length ? "Te propongo esto:" : "…"), acciones }]);
    } catch (e) { setChat(m => [...m, { role: "assistant", content: e.message || "Nora no ha podido responder." }]); }
    setCargando(false);
  };

  // El saludo cambia cada vez que se abre Nora (o se empieza una conversación nueva)
  const saludo = useMemo(() => saludoNora({ nombre: preferenciasNora?.nombre || miNombre }), [abierta, chat.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!abierta) return null;

  return (
    <VentanaNora zIndex={110}>
      <div data-asa title="Arrastra para mover" style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: NORA.tinte, cursor: "move", userSelect: "none" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <NoraMarca size={32} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nora</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>Tu asistente en Praxi</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {chat.length > 0 && <button onClick={() => setChat([])} style={{ ...st.btn("ghost"), fontSize: 12 }}>Nueva</button>}
          <button onClick={() => setAbierta(false)} aria-label="Minimizar Nora" title="Minimizar (la conversación se guarda)" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: "0 4px" }}>—</button>
          <button onClick={() => { setAbierta(false); setChat([]); }} aria-label="Cerrar Nora" title="Cerrar y empezar de cero" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: "0 4px" }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {chat.length === 0 && <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          <div>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, lineHeight: 1.1, color: C.text }}>{saludo.titulo}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{saludo.subtitulo}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ACCESOS.map(a => (
              <button key={a.titulo} className="nora-acceso" onClick={() => enviar(a.pregunta)} disabled={cargando}
                style={{ textAlign: "left", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 12px 11px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">{a.icono}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.titulo}</span>
                <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.35 }}>{a.desc}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: "auto", display: "flex", gap: 6, alignItems: "center" }}><span aria-hidden="true">🔒</span>Tus pacientes no salen de Praxi</div>
        </div>}
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 6 }}>
            <div style={{ maxWidth: "88%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? NORA.fondo : C.card, color: m.role === "user" ? "#fff" : C.text, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.content}</div>
            {(m.acciones || []).map((a, k) => <div key={k} style={{ width: "88%" }}><TarjetaAccion accion={a} estado={m.estados?.[k]} datos={datos} onConfirmar={v => confirmar(i, k, a, v)} onDescartar={() => marcar(i, k, "Descartada")} /></div>)}
          </div>
        ))}
        {cargando && <div style={{ fontSize: 13, color: C.muted, display: "flex", gap: 8, alignItems: "center" }}><NoraMarca size={20} vivo /> Nora está mirando tu consulta…</div>}
        <div ref={abajo} />
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <input autoFocus style={{ ...st.input, flex: 1, fontSize: 13 }} value={pregunta} onChange={e => setPregunta(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()} placeholder="Escribe o pide una cita…" aria-label="Pregunta para Nora" />
        <button style={{ ...st.btn(), padding: "0 16px", background: NORA.tinteTexto, color: "#fff" }} onClick={() => enviar()} disabled={cargando || !pregunta.trim()} aria-label="Enviar">↑</button>
      </div>
    </VentanaNora>
  );
}
