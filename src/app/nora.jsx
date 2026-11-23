import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RECURSOS } from "../recursos.js";
import { DemoCtx, EquipoCtx } from "./constantes.js";
import { C, st } from "./estilos.js";
import { crearSeudonimos, enviarIA } from "./ia.jsx";
import { estiloNora } from "./noraContexto.js";
import { nombreArchivo, pdfPersonalizado, valoresCampos } from "./personalizarPdf.js";
import { edadDe, telWhatsApp, toYMD, today } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// NORA — la asistente de Praxi
// Ayuda con la documentación y la comunicación. No diagnostica ni valora el
// riesgo: eso queda siempre en manos del profesional.
// ══════════════════════════════════════════════════════════════════════════════
export const ALIAS = "Paciente X";

export const REGLAS_NORA = `Eres Nora, la asistente de Praxi, un programa de gestión para consultas de psicología, neuropsicología y nutrición en España. Trabajas para el profesional sanitario, nunca hablas directamente con el paciente.

Tu función es ayudar con la DOCUMENTACIÓN y la COMUNICACIÓN: ordenar notas, resumir, redactar borradores y elegir materiales. Reglas que no puedes saltarte:
1. No propones diagnósticos, hipótesis diagnósticas, pruebas ni tratamientos farmacológicos, y no valoras el nivel de riesgo. Si te lo piden, explica en una frase que eso corresponde al juicio clínico del profesional y ofrece lo que sí puedes hacer (resumir lo registrado, ordenar la información).
2. No inventas datos: usa solo lo que aparece en la ficha o en lo que te escribe el profesional. Si falta algo, déjalo indicado entre corchetes, por ejemplo [completar: fecha de alta].
3. Si en el material aparecen ideas de muerte, suicidio, autolesiones, violencia o maltrato, recógelo de forma literal y añade al final la línea «⚠ Revisa: en las notas aparece [lo que sea]. Valora el riesgo y documenta tu decisión.» No valores tú el riesgo.
4. Escribes en español de España, claro y profesional, sin adornos. Sin saludos ni despedidas salvo en mensajes para el paciente.
5. El paciente aparece como «${ALIAS}». Mantén ese nombre tal cual en tus respuestas.`;

const ord = arr => [...(arr || [])].sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

// Ficha del paciente en texto (sin nombre real ni fecha de nacimiento: solo la edad)
export function fichaTexto(patient, { citas = [] } = {}) {
  const sesiones = ord(patient.sesiones);
  const hoy = toYMD(today());
  const proximas = ord(citas.filter(c => String(c.pacienteId) === String(patient.id) && c.fecha >= hoy)).slice(0, 3);
  const fc = patient.formulacionCaso || {};
  return `FICHA DE ${ALIAS}
- Edad: ${edadDe(patient.fechaNacimiento) ?? "no registrada"} · Estado: ${patient.estado || "—"}
- Motivo de consulta: ${patient.motivoConsulta || "no registrado"}

HISTORIA CLÍNICA:
${[patient.historiaClinica?.texto, ...(patient.historiaClinica?.entradas || []).map(e => `[${e.fecha || ""}] ${e.texto}`)].filter(Boolean).join("\n") || "No registrada"}

FORMULACIÓN:
${Object.entries({ "Hábitos": fc.habitosDiarios, "Sueño": fc.sueno, "Alimentación": fc.alimentacion, "Actividad física": fc.deporte, "Familia": fc.familia, "Relaciones": fc.relaciones, "Trabajo o estudios": fc.trabajo, "Estresores": fc.factoresEstresantes, "Protectores": fc.factoresProtectores, "Otros": fc.otrosFactores }).filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "No registrada"}

OBJETIVOS:
${(patient.objetivos || []).map(o => `- ${o.objetivo} (${o.logrado ? "logrado" : "en curso"})`).join("\n") || "Ninguno"}

PRUEBAS Y ESCALAS:
${ord(patient.pruebasRealizadas).map(p => `- ${p.fecha} · ${p.prueba}: ${p.resultado}${p.observaciones ? ` (${p.observaciones})` : ""}`).join("\n") || "Ninguna"}

INFORMES MÉDICOS:
${(patient.informesMedicos || []).map(i => `- ${i.fecha} · ${i.titulo}: ${i.descripcion}`).join("\n") || "Ninguno"}

SESIONES (${sesiones.length}):
${sesiones.map(s => `Sesión ${s.numero} · ${s.fecha}${s.estadoEmocional != null ? ` · ánimo ${s.estadoEmocional}/10` : ""}
${[s.trabajado, s.observaciones, s.observacionesAdicionales].filter(Boolean).join("\n")}`).join("\n\n") || "Sin sesiones registradas"}

PRÓXIMAS CITAS: ${proximas.map(c => `${c.fecha} ${c.hora || ""}`).join(", ") || "ninguna"}`;
}

// ── Tareas de Nora ───────────────────────────────────────────────────────────
export const DOCUMENTOS = {
  alta: { titulo: "Informe de alta", guion: "Identificación (con huecos), motivo de consulta, tratamiento (enfoque, técnicas, nº de sesiones), evolución, evaluación inicial y final si hay escalas, situación al alta, objetivos alcanzados y pendientes, recomendaciones y plan de prevención de recaídas." },
  derivacion: { titulo: "Informe de derivación", guion: "Destinatario [completar], motivo de la derivación [completar si no consta], resumen clínico (motivo de consulta, intervención realizada y nº de sesiones, escalas), medicación si consta, y una línea final indicando que el paciente ha autorizado la derivación [confirmar]." },
  psicologico: { titulo: "Informe psicológico", guion: "Datos (con huecos), motivo de la evaluación, procedimiento (pruebas registradas), resultados descritos sin interpretar más allá de lo anotado, conclusiones [a completar por el profesional] y recomendaciones." },
};
export const MENSAJES = {
  recordatorio: "Recordatorio de la próxima cita (usa la fecha de PRÓXIMAS CITAS si la hay; si no, deja [día y hora]).",
  tarea: "Recordar la tarea para casa acordada en la última sesión y animar a hacerla.",
  cambio: "Proponer cambiar la cita, con [nuevo día y hora] como hueco y pidiendo confirmación.",
  seguimiento: "Mensaje breve de seguimiento entre sesiones para saber cómo está.",
};

export function instruccion(tarea, { notas = "", documento = "alta", mensaje = "recordatorio", indicacion = "" } = {}) {
  const extra = indicacion.trim() ? `\nIndicaciones del profesional: ${indicacion.trim()}` : "";
  switch (tarea) {
    case "nota": return `Convierte estas notas de la sesión de hoy en una nota clínica en formato SOAP, con cuatro apartados titulados exactamente «S · Subjetivo», «O · Objetivo», «A · Análisis» y «P · Plan». Usa solo lo que dicen las notas (en A, el progreso y lo que el profesional haya valorado; no añadas hipótesis tuyas). Frases cortas. Si un apartado no tiene información, escribe «Sin datos en las notas».${extra}\n\nNOTAS:\n${notas}`;
    case "resumen": return `Prepárame para la próxima sesión con un resumen de 5 a 7 viñetas: motivo y momento del proceso, qué se trabajó en la última sesión, tareas pendientes, evolución de escalas o del ánimo si hay datos, objetivos en curso y algo que conviene retomar. Sin opiniones diagnósticas.${extra}`;
    case "documento": { const d = DOCUMENTOS[documento]; return `Redacta un borrador de «${d.titulo}» a partir de la ficha. Estructura: ${d.guion} Usa títulos de sección en mayúsculas. Lo que no esté en la ficha, como hueco entre corchetes. Termina con «Borrador generado con ayuda de Nora: revisar antes de firmar».${extra}`; }
    case "recursos": return `Elige los 3 recursos del CATÁLOGO que mejor encajan con lo trabajado y los objetivos de ${ALIAS}. Responde SOLO con tres líneas con este formato exacto: CÓDIGO | motivo en una frase. Usa únicamente códigos del catálogo.${extra}\n\nCATÁLOGO:\n${RECURSOS.map(r => `${r.codigo} | ${r.cat === "paciente" ? "para el paciente" : "para el profesional"} | ${r.titulo}: ${r.desc}`).join("\n")}`;
    case "mensaje": return `Escribe un mensaje de WhatsApp para ${ALIAS}, de parte de su profesional. Objetivo: ${MENSAJES[mensaje]} Tutea, tono cercano y profesional, máximo 60 palabras, sin datos clínicos sensibles (el móvil puede verlo otra persona). Dirígete al paciente como «${ALIAS}». Responde solo con el texto del mensaje.${extra}`;
    default: return indicacion;
  }
}

// «PAC-03 | motivo» → [{recurso, motivo}]
export function leerRecursos(texto) {
  const vistos = new Set();
  return String(texto || "").split("\n").map(l => l.replace(/^[\s\-*•\d.)]+/, "")).map(l => { const [cod, ...rest] = l.split("|"); return { cod: (cod || "").trim().toUpperCase(), motivo: rest.join("|").trim() }; })
    .map(({ cod, motivo }) => ({ recurso: RECURSOS.find(r => r.codigo === cod), motivo }))
    .filter(x => x.recurso && !vistos.has(x.recurso.url) && vistos.add(x.recurso.url)).slice(0, 3);
}

const TAREAS = [
  { id: "nota", icono: "✎", titulo: "Nota de sesión", desc: "Tus notas sueltas, en formato SOAP" },
  { id: "resumen", icono: "◷", titulo: "Resumen para la cita", desc: "Cómo va el caso en un minuto" },
  { id: "documento", icono: "▤", titulo: "Borrador de informe", desc: "Alta, derivación o psicológico" },
  { id: "recursos", icono: "❏", titulo: "¿Qué recurso le doy?", desc: "Tres de la biblioteca, personalizados" },
  { id: "mensaje", icono: "✉", titulo: "Mensaje al paciente", desc: "Listo para WhatsApp" },
];

// Identidad visual de Nora (cuatro propuestas; NORA_ESTILO elige la activa)
export const NORA_ESTILOS = {
  A: { nombre: "Aurora", fondo: "linear-gradient(135deg,#7B5CF0,#1FB5A8)", texto: "#fff", tinte: "#ECE8FB", tinteTexto: "#4B3BB0" },
  B: { nombre: "Verde salvia", fondo: "#2E6F68", texto: "#F4EEE3", tinte: "#DCEBE6", tinteTexto: "#2E6F68" },
  C: { nombre: "Burbuja", fondo: "#4B4FD1", texto: "#fff", tinte: "#E4E4FA", tinteTexto: "#3B3FB0" },
  D: { nombre: "Orbe vivo", fondo: "radial-gradient(circle at 35% 30%,#FFD3B8,#F0715A 55%,#C2405F)", texto: "#fff", tinte: "#FBE3DC", tinteTexto: "#B23D52", fab: "#fff", fabTexto: "#B23D52", fabBorde: "#F3B9A8" },
};
export const NORA_ESTILO = "D";
export const NORA = NORA_ESTILOS[NORA_ESTILO];

export function NoraMarca({ size = 26, vivo = false }) {
  const glifo = NORA_ESTILO === "B"
    ? <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: size * 0.62, lineHeight: 1 }}>N</span>
    : NORA_ESTILO === "C"
      ? <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64"><path d="M10 12h44a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H30l-12 10V46h-8a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill="#fff" /></svg>
      : NORA_ESTILO === "D" ? null
        : <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64"><path d="M32 4c3 17 11 25 28 28-17 3-25 11-28 28-3-17-11-25-28-28 17-3 25-11 28-28z" fill="#fff" /></svg>;
  return <span aria-hidden="true" className={vivo && NORA_ESTILO === "D" ? "nora-respira" : undefined} style={{ width: size, height: size, borderRadius: NORA_ESTILO === "C" ? size * 0.32 : "50%", background: NORA.fondo, color: NORA.texto, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: NORA_ESTILO === "D" ? `0 0 0 ${Math.max(2, size * 0.12)}px rgba(240,113,90,.18)` : "none" }}>{glifo}</span>;
}

const copiar = t => navigator.clipboard?.writeText(t).catch(() => {});

export function NoraPanel({ patient, citas = [], inicial = null, onClose, onGuardarNota }) {
  const demo = useContext(DemoCtx);
  const equipo = useContext(EquipoCtx) || {};
  const seud = useMemo(() => crearSeudonimos([{ nombre: patient.nombre, apellidos: patient.apellidos, alias: ALIAS }]), [patient.nombre, patient.apellidos]);
  const sistema = useMemo(() => `${REGLAS_NORA}${estiloNora(equipo.preferenciasNora)}\n\n${fichaTexto(patient, { citas })}`, [patient, citas, equipo.preferenciasNora]);
  const [tarea, setTarea] = useState(inicial);
  const [notas, setNotas] = useState("");
  const [documento, setDocumento] = useState("alta");
  const [mensaje, setMensaje] = useState("recordatorio");
  const [indicacion, setIndicacion] = useState("");
  const [resultado, setResultado] = useState(null); // {tarea, texto}
  const [chat, setChat] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [sesionDestino, setSesionDestino] = useState("");
  const abajo = useRef();
  const lanzado = useRef(false);
  useEffect(() => { abajo.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, resultado, cargando]);

  const pedir = async (t, opciones = {}) => {
    setAviso(""); setResultado(null);
    if (demo) { setResultado({ tarea: t, texto: "En la demo Nora no está activa. Solicita acceso para usarla con tus pacientes." }); return; }
    setCargando(true);
    try { setResultado({ tarea: t, texto: await enviarIA({ system: sistema, messages: [{ role: "user", content: instruccion(t, { notas, documento, mensaje, indicacion, ...opciones }) }], seud }) }); }
    catch (e) { setAviso(e.message || "Nora no ha podido responder."); }
    setCargando(false);
  };
  // El resumen y las recomendaciones se lanzan solos si se abre Nora desde un atajo
  useEffect(() => { if (!lanzado.current && (inicial === "resumen" || inicial === "recursos")) { lanzado.current = true; pedir(inicial); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const preguntar = async () => {
    const q = pregunta.trim(); if (!q) return;
    setPregunta(""); const nuevos = [...chat, { role: "user", content: q }]; setChat(nuevos);
    if (demo) { setChat(m => [...m, { role: "assistant", content: "En la demo Nora no está activa." }]); return; }
    setCargando(true);
    try { const r = await enviarIA({ system: sistema, messages: nuevos.slice(-12), seud }); setChat(m => [...m, { role: "assistant", content: r }]); }
    catch (e) { setChat(m => [...m, { role: "assistant", content: e.message || "Nora no ha podido responder." }]); }
    setCargando(false);
  };

  const descargar = async r => {
    try {
      const valores = valoresCampos({ recurso: r, paciente: patient, profesional: equipo.miNombre, clinica: equipo.clinicaNombre });
      const url = URL.createObjectURL(await pdfPersonalizado(r, valores));
      const a = document.createElement("a"); a.href = url; a.download = nombreArchivo(r, valores); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { setAviso("No se pudo preparar el PDF."); }
  };

  const sesionesDesc = ord(patient.sesiones).reverse();
  const tel = telWhatsApp(patient.telefono);
  const textoMensaje = resultado?.tarea === "mensaje" ? resultado.texto.replace(/^["«]|["»]$/g, "").replaceAll(`${patient.nombre} ${patient.apellidos}`.trim(), patient.nombre) : "";

  const btnTarea = (t, activo) => ({ ...st.btn("sm"), textAlign: "left", padding: "9px 12px", background: activo ? C.sand : C.card, color: C.text, border: `1px solid ${activo ? C.accent : C.border}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "center", width: "100%" });
  const area = { ...st.textarea, minHeight: 110, fontSize: 13 };

  return (
    <div className="praxi-nora" role="dialog" aria-label="Nora" style={{ position: "fixed", top: 0, right: 0, width: 420, maxWidth: "100vw", height: "100vh", background: C.bone, borderLeft: `1px solid ${C.border}`, zIndex: 100, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(59,42,30,0.12)" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: NORA.tinte }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <NoraMarca size={32} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nora</div>
            <div style={{ fontSize: 11.5, color: C.muted }}>Asistente de documentación · {patient.nombre} {patient.apellidos}</div>
          </div>
        </div>
        <button onClick={onClose} aria-label="Cerrar Nora" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TAREAS.map(t => (
            <button key={t.id} onClick={() => { setTarea(t.id); setResultado(null); setAviso(""); if (t.id === "resumen" || t.id === "recursos") pedir(t.id); }} style={btnTarea(t, tarea === t.id)}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: C.bone, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 14, flexShrink: 0 }}>{t.icono}</span>
              <span><span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{t.titulo}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{t.desc}</span></span>
            </button>
          ))}
        </div>

        {tarea === "nota" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea style={area} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Pega o escribe tus notas tal cual: frases sueltas, abreviaturas, lo que has dictado…" />
            <button style={st.btn()} disabled={cargando || !notas.trim()} onClick={() => pedir("nota")}>Ordenar en formato SOAP</button>
          </div>
        )}
        {tarea === "documento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select style={st.input} value={documento} onChange={e => setDocumento(e.target.value)} aria-label="Tipo de informe">
              {Object.entries(DOCUMENTOS).map(([k, d]) => <option key={k} value={k}>{d.titulo}</option>)}
            </select>
            <input style={st.input} value={indicacion} onChange={e => setIndicacion(e.target.value)} placeholder="Indicaciones opcionales (destinatario, tono, extensión…)" />
            <button style={st.btn()} disabled={cargando} onClick={() => pedir("documento")}>Preparar borrador</button>
          </div>
        )}
        {tarea === "mensaje" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <select style={st.input} value={mensaje} onChange={e => setMensaje(e.target.value)} aria-label="Tipo de mensaje">
              <option value="recordatorio">Recordatorio de cita</option><option value="tarea">Recordar la tarea para casa</option>
              <option value="cambio">Cambio de cita</option><option value="seguimiento">Seguimiento entre sesiones</option>
            </select>
            <input style={st.input} value={indicacion} onChange={e => setIndicacion(e.target.value)} placeholder="Algo que quieras añadir (opcional)" />
            <button style={st.btn()} disabled={cargando} onClick={() => pedir("mensaje")}>Escribir mensaje</button>
          </div>
        )}

        {cargando && <div style={{ fontSize: 13, color: C.muted, display: "flex", gap: 8, alignItems: "center" }}><NoraMarca size={20} vivo /> Nora está escribiendo…</div>}
        {aviso && <div role="alert" style={{ fontSize: 12.5, color: C.red, background: C.rD, borderRadius: 8, padding: "8px 12px" }}>{aviso}</div>}

        {resultado && resultado.tarea === "recursos" && !demo && (() => {
          const elegidos = leerRecursos(resultado.texto);
          if (!elegidos.length) return <div style={{ ...st.card, padding: 14, fontSize: 13, whiteSpace: "pre-wrap" }}>{resultado.texto}</div>;
          return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {elegidos.map(({ recurso: r, motivo }) => (
              <div key={r.url} style={{ ...st.card, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: C.muted }}>{r.codigo} · {r.cat === "paciente" ? "Para el paciente" : "Para el profesional"}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, margin: "2px 0 4px" }}>{r.titulo}</div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>{motivo}</div>
                <button style={{ ...st.btn("teal"), padding: "5px 12px", fontSize: 12 }} onClick={() => descargar(r)}>Descargar personalizado</button>
              </div>
            ))}
          </div>;
        })()}

        {resultado && (resultado.tarea !== "recursos" || demo) && (
          <div style={{ ...st.card, padding: "14px 16px" }}>
            {resultado.tarea === "mensaje"
              ? <textarea style={{ ...area, minHeight: 100 }} value={textoMensaje} onChange={e => setResultado(r => ({ ...r, texto: e.target.value }))} aria-label="Mensaje" />
              : <textarea style={{ ...area, minHeight: 220, lineHeight: 1.55 }} value={resultado.texto} onChange={e => setResultado(r => ({ ...r, texto: e.target.value }))} aria-label="Texto de Nora" />}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <button style={st.btn("sm")} onClick={() => copiar(resultado.tarea === "mensaje" ? textoMensaje : resultado.texto)}>Copiar</button>
              {resultado.tarea === "mensaje" && tel && <a style={{ ...st.btn("teal"), padding: "5px 12px", fontSize: 12, textDecoration: "none" }} href={`https://wa.me/${tel}?text=${encodeURIComponent(textoMensaje)}`} target="_blank" rel="noreferrer">Abrir en WhatsApp</a>}
              {resultado.tarea === "nota" && onGuardarNota && !demo && <>
                <select style={{ ...st.input, width: "auto", padding: "4px 8px", fontSize: 12 }} value={sesionDestino} onChange={e => setSesionDestino(e.target.value)} aria-label="Sesión donde guardar">
                  <option value="">Nueva sesión de hoy</option>
                  {sesionesDesc.map(s => <option key={s.id} value={s.id}>Sesión {s.numero} · {s.fecha}</option>)}
                </select>
                <button style={{ ...st.btn("teal"), padding: "5px 12px", fontSize: 12 }} onClick={() => { onGuardarNota(resultado.texto, sesionDestino); setAviso(""); setResultado(r => ({ ...r, guardada: true })); }}>{resultado.guardada ? "Guardada ✓" : "Guardar en la ficha"}</button>
              </>}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Revísalo antes de usarlo. Nora puede equivocarse.</div>
          </div>
        )}

        {chat.length > 0 && <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {chat.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "88%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? C.accent : C.card, color: m.role === "user" ? C.bone : C.text, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
        </div>}
        <div ref={abajo} />
      </div>

      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <input style={{ ...st.input, flex: 1, fontSize: 13 }} value={pregunta} onChange={e => setPregunta(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && preguntar()} placeholder="Pregúntale algo sobre la ficha…" aria-label="Pregunta para Nora" />
        <button style={{ ...st.btn(), padding: "0 16px" }} onClick={preguntar} disabled={cargando || !pregunta.trim()} aria-label="Enviar">↑</button>
      </div>
    </div>
  );
}

// Guarda una nota de Nora en una sesión existente o crea la sesión de hoy
export function anadirNota(p, texto, sesionId) {
  if (sesionId) return { ...p, sesiones: p.sesiones.map(s => String(s.id) === String(sesionId) ? { ...s, trabajado: s.trabajado ? `${s.trabajado}\n\n${texto}` : texto } : s) };
  const n = p.sesiones.length + 1;
  return { ...p, sesiones: [...p.sesiones, { id: Date.now(), numero: n, fecha: toYMD(today()), pago: 0, pagado: false, trabajado: texto, observaciones: "", estadoEmocional: 5, alianza: 5, observacionesAdicionales: "", factura: `FAC-${String(p.id).slice(-2)}${String(n).padStart(3, "0")}` }] };
}

// Botón «Ordenar con Nora» para el formulario de sesión: devuelve la nota en SOAP
export async function notaSOAP(patient, notas) {
  const seud = crearSeudonimos([{ nombre: patient.nombre, apellidos: patient.apellidos, alias: ALIAS }]);
  return enviarIA({ system: `${REGLAS_NORA}\n\n${fichaTexto(patient)}`, messages: [{ role: "user", content: instruccion("nota", { notas }) }], seud });
}
