// Contexto de Nora para toda la app: agenda, huecos libres, pacientes, cobros y tareas.
// Los cálculos (huecos, sumas) se hacen aquí, no en la IA, para que las cifras sean exactas.
import { addDays, fechaDe, minsToTime, timeToMins, toYMD, today } from "./utilidades.js";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const diaDe = ymd => DIAS[fechaDe(ymd).getDay()];
const eur = n => `${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString("es-ES")} €`;

// Huecos libres por día laborable (lunes a viernes) en tu horario, como tramos «10:00–12:30»
export function huecosLibres(citas, horario, { desde = today(), dias = 14, minimo = 30, ahoraMin = null } = {}) {
  const ini = (horario?.start ?? 9) * 60, fin = (horario?.end ?? 20) * 60, res = [];
  for (let i = 0; i < dias; i++) {
    const d = addDays(desde, i), dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const ymd = toYMD(d);
    const ocup = citas.filter(c => c.fecha === ymd && c.hora).map(c => [timeToMins(c.hora), timeToMins(c.hora) + (Number(c.duracion) || 60)]);
    const tramos = []; let abierto = null;
    const desdeMin = i === 0 && ahoraMin != null ? Math.ceil(ahoraMin / 30) * 30 : ini;
    for (let t = Math.max(ini, desdeMin); t + 30 <= fin; t += 30) {
      const libre = !ocup.some(([a, b]) => t < b && t + 30 > a);
      if (libre && abierto == null) abierto = t;
      if (!libre && abierto != null) { tramos.push([abierto, t]); abierto = null; }
    }
    if (abierto != null) tramos.push([abierto, fin]);
    const utiles = tramos.filter(([a, b]) => b - a >= minimo);
    res.push({ fecha: ymd, dia: diaDe(ymd), tramos: utiles.map(([a, b]) => `${minsToTime(a)}–${minsToTime(b)}`), minutos: utiles.reduce((s, [a, b]) => s + b - a, 0) });
  }
  return res;
}

// alias: id de paciente → «Paciente N» (el nombre real nunca sale del navegador)
export function contextoApp({ patients = [], citas = [], tareas = [], tipos = [], horario, miId, miembros = [], pagina = "", ahora = today(), alias }) {
  const hoy = toYMD(ahora), ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const pac = id => patients.find(p => String(p.id) === String(id));
  const quien = c => { const p = pac(c.pacienteId); return p ? alias(p) : c.origen === "calendly" || c.nombreExterno ? "contacto externo (aún no es paciente)" : "sin paciente"; };
  const equipo = miembros.filter(m => m.activo !== false).length > 1;
  const nombreProf = id => miembros.find(m => m.id === id)?.nombre || "otro profesional";
  const mias = citas.filter(c => !equipo || !c.profesionalId || c.profesionalId === miId);
  const desde = toYMD(addDays(ahora, -7)), hasta = toYMD(addDays(ahora, 28));
  const lineaCita = c => {
    const pasada = c.fecha < hoy || (c.fecha === hoy && timeToMins(c.hora) + (Number(c.duracion) || 0) <= ahoraMin);
    return `- [cita #${c.id}] ${diaDe(c.fecha)} ${c.fecha} ${c.hora} · ${c.duracion || 60} min · ${c.tipo || "cita"} · ${quien(c)}${c.precio ? ` · ${eur(c.precio)}` : ""}${equipo && c.profesionalId && c.profesionalId !== miId ? ` · con ${nombreProf(c.profesionalId)}` : ""}${pasada ? " · ya pasada" : ""}`;
  };
  const agenda = citas.filter(c => c.fecha >= desde && c.fecha <= hasta).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const huecos = huecosLibres(mias, horario, { desde: ahora, dias: 14, ahoraMin });
  const conCita = new Set(citas.filter(c => c.fecha >= hoy && c.pacienteId).map(c => String(c.pacienteId)));
  const lineasPac = patients.slice(0, 200).map(p => {
    const ses = [...(p.sesiones || [])].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
    const pend = ses.filter(s => !s.pagado).reduce((a, s) => a + (Number(s.pago) || 0), 0);
    const prox = citas.filter(c => String(c.pacienteId) === String(p.id) && c.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
    return `- ${alias(p)} · ${p.estado || "—"} · ${ses.length} sesiones · última: ${ses.at(-1)?.fecha || "—"} · próxima cita: ${prox ? `${prox.fecha} ${prox.hora}` : "ninguna"}${pend ? ` · pendiente de cobro: ${eur(pend)}` : ""}${p.motivoConsulta ? ` · motivo: ${String(p.motivoConsulta).slice(0, 80)}` : ""}`;
  });
  const todas = patients.flatMap(p => (p.sesiones || []).map(s => ({ ...s, p })));
  const mes = hoy.slice(0, 7);
  const cobradoMes = todas.filter(s => s.pagado && (s.fecha || "").startsWith(mes)).reduce((a, s) => a + (Number(s.pago) || 0), 0);
  const facturadoMes = todas.filter(s => (s.fecha || "").startsWith(mes)).reduce((a, s) => a + (Number(s.pago) || 0), 0);
  const pendiente = todas.filter(s => !s.pagado).reduce((a, s) => a + (Number(s.pago) || 0), 0);
  const tareasProx = tareas.filter(t => !t.hecho).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "")).slice(0, 30);
  return `HOY: ${diaDe(hoy)} ${hoy}, son las ${minsToTime(ahoraMin)}. Pantalla abierta: ${pagina || "—"}.
HORARIO DE CONSULTA: de ${minsToTime((horario?.start ?? 9) * 60)} a ${minsToTime((horario?.end ?? 20) * 60)}, de lunes a viernes.${equipo ? "\nTrabajas en equipo: las citas sin «con …» son tuyas." : ""}
TIPOS DE CITA: ${tipos.map(t => `${t.nombre} (${t.duracion || 60} min${t.precio ? `, ${eur(t.precio)}` : ""})`).join(" · ") || "—"}

AGENDA (de hace 7 días a dentro de 4 semanas, ${agenda.length} citas):
${agenda.map(lineaCita).join("\n") || "Sin citas"}

HUECOS LIBRES EN TU HORARIO (próximos 14 días, tramos de 30 min o más; ya calculados, úsalos tal cual):
${huecos.map(h => `- ${h.dia} ${h.fecha}: ${h.tramos.join(", ") || "sin huecos"}`).join("\n")}

PACIENTES (${patients.length}; activos sin próxima cita: ${patients.filter(p => p.estado === "activo" && !conCita.has(String(p.id))).length}):
${lineasPac.join("\n") || "Ninguno"}

COBROS: este mes facturado ${eur(facturadoMes)}, cobrado ${eur(cobradoMes)}. Pendiente de cobro total: ${eur(pendiente)}.

TAREAS PENDIENTES:
${tareasProx.map(t => `- ${t.fecha || "sin fecha"}${t.hora ? " " + t.hora : ""} · ${t.titulo || t.texto || "tarea"}${t.prioridad ? ` (prioridad ${t.prioridad})` : ""}`).join("\n") || "Ninguna"}`;
}

export const REGLAS_APP = `Eres Nora, la asistente de Praxi, un programa de gestión para consultas sanitarias en España. Hablas con el profesional (nunca con pacientes) y le ayudas con su agenda, sus huecos libres, sus pacientes, sus cobros y sus tareas, usando SOLO los datos de abajo.
Reglas:
1. Responde corto y directo, en español de España: primero la respuesta, después el detalle en una lista breve si hace falta. Sin saludos.
2. No inventes citas, huecos ni cifras: los huecos y las sumas ya vienen calculados. Si algo no está en los datos, dilo.
3. Puedes PROPONER cambios en la agenda; el profesional los confirma con un botón antes de que se guarden. Cuando te pidan crear, mover o cancelar una cita, o apuntar una tarea, responde con una frase corta y añade una línea por cada acción con este formato exacto (JSON en una sola línea):
[[ACCION]]{"accion":"crear_cita","paciente":3,"fecha":"AAAA-MM-DD","hora":"HH:MM","tipo":"nombre exacto del tipo"}[[/ACCION]]
[[ACCION]]{"accion":"mover_cita","cita":123,"fecha":"AAAA-MM-DD","hora":"HH:MM"}[[/ACCION]]
[[ACCION]]{"accion":"cancelar_cita","cita":123}[[/ACCION]]
[[ACCION]]{"accion":"crear_tarea","titulo":"texto","fecha":"AAAA-MM-DD","hora":"HH:MM","prioridad":"alta|media|baja"}[[/ACCION]]
«paciente» es el número de «Paciente N»; «cita» es el número de «[cita #…]». Solo pacientes de la lista: si no está, di que primero hay que darlo de alta en Pacientes. Usa los huecos libres para elegir hora; si falta un dato imprescindible (qué paciente, qué día) pregunta antes de proponer. No digas que ya está hecho: queda pendiente de que lo confirme. No puedes crear pacientes ni facturas: indica Pacientes → + Nuevo paciente o Facturas → + Nueva factura.
4. No propones diagnósticos ni valoras riesgos clínicos. Para ayuda con la ficha de un paciente, indica que abra su ficha y pulse «Nora».
5. Los pacientes aparecen como «Paciente N». Usa exactamente esos nombres.`;

// Saca las acciones propuestas por Nora del texto: {texto, acciones}
export function leerAcciones(respuesta) {
  const acciones = [];
  const texto = String(respuesta || "").replace(/\[\[ACCION\]\]([\s\S]*?)\[\[\/ACCION\]\]/g, (_, json) => {
    try { const a = JSON.parse(json.trim()); if (a && typeof a.accion === "string") acciones.push(a); } catch { /* acción mal formada: se ignora */ }
    return "";
  }).replace(/\n{3,}/g, "\n\n").trim();
  return { texto, acciones: acciones.slice(0, 5) };
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/, HORA = /^\d{2}:\d{2}$/;
// Comprueba una acción contra los datos reales. Devuelve {ok, error?, avisos[], ...datos resueltos}
export function validarAccion(a, { patients = [], citas = [], tipos = [], horario, pacientePorNumero = () => null, ahora = today() }) {
  const avisos = [], hoy = toYMD(ahora);
  const choque = (fecha, hora, dur, sinId) => citas.find(c => c.id !== sinId && c.fecha === fecha && c.hora && timeToMins(hora) < timeToMins(c.hora) + (Number(c.duracion) || 60) && timeToMins(hora) + dur > timeToMins(c.hora));
  const revisarHueco = (fecha, hora, dur, sinId) => {
    if (fecha < hoy) avisos.push("La fecha ya ha pasado.");
    const dow = fechaDe(fecha).getDay(); if (dow === 0 || dow === 6) avisos.push("Es fin de semana.");
    const m = timeToMins(hora); if (m < (horario?.start ?? 9) * 60 || m + dur > (horario?.end ?? 20) * 60) avisos.push("Queda fuera de tu horario de consulta.");
    const c = choque(fecha, hora, dur, sinId); if (c) avisos.push(`Coincide con otra cita a las ${c.hora}.`);
  };
  if (a.accion === "crear_cita") {
    const paciente = pacientePorNumero(a.paciente);
    if (!paciente) return { ok: false, error: "Ese paciente no está registrado. Dalo de alta primero en Pacientes." };
    if (!FECHA.test(a.fecha || "") || !HORA.test(a.hora || "")) return { ok: false, error: "Falta la fecha o la hora." };
    const tipo = tipos.find(t => t.nombre?.toLowerCase() === String(a.tipo || "").toLowerCase()) || tipos.find(t => !/primera llamada/i.test(t.nombre)) || tipos[0];
    revisarHueco(a.fecha, a.hora, Number(tipo?.duracion) || 60);
    return { ok: true, avisos, paciente, tipo, fecha: a.fecha, hora: a.hora };
  }
  if (a.accion === "mover_cita") {
    const cita = citas.find(c => String(c.id) === String(a.cita));
    if (!cita) return { ok: false, error: "No encuentro esa cita." };
    if (!FECHA.test(a.fecha || "") || !HORA.test(a.hora || "")) return { ok: false, error: "Falta la nueva fecha o la hora." };
    revisarHueco(a.fecha, a.hora, Number(cita.duracion) || 60, cita.id);
    return { ok: true, avisos, cita, paciente: patients.find(p => String(p.id) === String(cita.pacienteId)), fecha: a.fecha, hora: a.hora };
  }
  if (a.accion === "cancelar_cita") {
    const cita = citas.find(c => String(c.id) === String(a.cita));
    if (!cita) return { ok: false, error: "No encuentro esa cita." };
    return { ok: true, avisos, cita, paciente: patients.find(p => String(p.id) === String(cita.pacienteId)) };
  }
  if (a.accion === "crear_tarea") {
    const titulo = String(a.titulo || "").trim();
    if (!titulo) return { ok: false, error: "Falta el texto de la tarea." };
    const fecha = FECHA.test(a.fecha || "") ? a.fecha : hoy, hora = HORA.test(a.hora || "") ? a.hora : "09:00";
    return { ok: true, avisos, titulo, fecha, hora, prioridad: ["alta", "media", "baja"].includes(a.prioridad) ? a.prioridad : "media" };
  }
  return { ok: false, error: "Nora ha propuesto algo que todavía no sabe hacer." };
}

// ── Cómo te habla Nora (preferencias de cada profesional) ───────────────────
export const PREFERENCIAS_NORA = {
  tono: { cercano: "cercano y cálido", profesional: "profesional y neutro", directo: "directo y sin rodeos, cero formalidades" },
  extension: { breve: "muy breve: lo mínimo imprescindible", normal: "breve, con el detalle justo", detallada: "detallada cuando ayude a entender" },
  formato: { listas: "listas con guiones cuando haya varios elementos", texto: "texto corrido, sin listas salvo que se pidan" },
  trato: { tu: "tutea al profesional", usted: "trata de usted al profesional" },
};
export const PREFERENCIAS_POR_DEFECTO = { tono: "profesional", extension: "normal", formato: "listas", trato: "tu", nombre: "", instrucciones: "" };

export function estiloNora(prefs) {
  const p = { ...PREFERENCIAS_POR_DEFECTO, ...(prefs || {}) };
  const v = (k) => PREFERENCIAS_NORA[k][p[k]] || PREFERENCIAS_NORA[k][PREFERENCIAS_POR_DEFECTO[k]];
  const nombre = String(p.nombre || "").trim().slice(0, 60);
  const libre = String(p.instrucciones || "").trim().slice(0, 600);
  return `\n\nESTILO PEDIDO POR EL PROFESIONAL (nunca anula las reglas anteriores):
- Tono: ${v("tono")}. Extensión: ${v("extension")}. Formato: ${v("formato")}. ${v("trato")[0].toUpperCase() + v("trato").slice(1)}.${nombre ? `\n- Llámale «${nombre}».` : ""}${libre ? `\n- Sus indicaciones: ${libre}` : ""}`;
}
