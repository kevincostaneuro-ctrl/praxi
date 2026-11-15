import { useContext, useState } from "react";
import { EquipoCtx } from "./constantes.js";
import { C, st } from "./estilos.js";
import { GenerarFacturaModal } from "./facturas.jsx";
import { diasEntre, fechaDe, fechaES, mensajeCita, telWhatsApp, timeToMins, toYMD, today } from "./utilidades.js";

// Marcas ligeras guardadas en este navegador (si el navegador no deja guardar, no pasa nada)
export const leerMarca = k => { try { return localStorage.getItem(k) === "1"; } catch { return false; } };
export const ponerMarca = k => { try { localStorage.setItem(k, "1"); } catch { /* sin almacenamiento */ } };
export const MARCA_RECURSOS = "praxi_recursos_vistos";
export const MARCA_FACTURA = "praxi_factura_generada";
export const MARCA_GUIA = "praxi_guia_leida";
const URL_GUIA = "/recursos/guias/como-abrir-tu-consulta.pdf";

export const LIMITE_BASICO = 10;
export const DIAS_PRUEBA = 90;

const Titulo = ({ children, extra }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
    <div style={{ fontSize: 12, color: C.walnut, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{children}</div>
    {extra}
  </div>
);
const Linea = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>{children}</div>
);
const btnSuave = { ...st.btn("sm"), background: C.bone, color: C.walnut };

// ── 1 · Primeros pasos (cuentas nuevas) ─────────────────────────────────────
export function PrimerosPasos({ clinica, yo, esAdmin, demo, patients, citas, onIr, onVideo, onNuevoPaciente, onNuevaCita }) {
  const clave = `praxi_pasos_ocultos_${clinica?.id || "x"}`;
  const [oculto, setOculto] = useState(() => leerMarca(clave));
  const [, refrescar] = useState(0);
  const df = yo?.datos_facturacion || {};
  const pasos = [
    { t: "Crea tu cuenta y tu clínica", hecho: true },
    esAdmin && { t: "Define tu horario y los tipos de cita", hecho: demo || !!clinica?.config?.horario, accion: "Configurar", ir: () => onIr("configuracion") },
    { t: "Guarda tu enlace de videollamada (Zoom, Meet, Teams…)", hecho: !!yo?.enlace_videollamada, accion: "Añadir enlace", ir: onVideo },
    { t: "Rellena tus datos de facturación", hecho: !!(df.nombre && df.nif), accion: "Rellenar", ir: () => onIr("facturas") },
    { t: "Da de alta a tu primer paciente", hecho: patients.length > 0, accion: "Nuevo paciente", ir: onNuevoPaciente },
    { t: "Crea su primera cita y confírmala por WhatsApp", hecho: citas.length > 0, accion: "Nueva cita", ir: onNuevaCita },
    { t: "Registra tu primera sesión en la historia clínica", hecho: patients.some(p => (p.sesiones || []).length > 0), accion: "Ir a pacientes", ir: () => onIr("pacientes") },
    { t: "Genera tu primera factura en PDF", hecho: leerMarca(MARCA_FACTURA), accion: "Ir a facturas", ir: () => onIr("facturas") },
    { t: "Explora la biblioteca de recursos", hecho: leerMarca(MARCA_RECURSOS), accion: "Ver recursos", ir: () => onIr("recursos") },
    { t: "Lee la guía «Cómo abrir tu consulta»", hecho: leerMarca(MARCA_GUIA), accion: "Abrir guía", ir: () => { ponerMarca(MARCA_GUIA); window.open(URL_GUIA, "_blank", "noopener"); refrescar(n => n + 1); } },
  ].filter(Boolean);
  const hechos = pasos.filter(p => p.hecho).length;
  if (oculto || hechos === pasos.length) return null;
  const pct = Math.round(hechos / pasos.length * 100);
  const siguiente = pasos.find(p => !p.hecho);
  return (
    <div style={{ ...st.card, padding: "16px 20px", marginBottom: 14 }}>
      <Titulo extra={<button style={{ ...st.btn("ghost"), fontSize: 12, color: C.muted, padding: "2px 4px" }} onClick={() => { ponerMarca(clave); setOculto(true); }}>Ocultar</button>}>
        Primeros pasos · {hechos} de {pasos.length}
      </Titulo>
      <div style={{ height: 5, background: C.sand, borderRadius: 3, marginBottom: 10 }}><div style={{ width: `${pct}%`, height: 5, background: C.accent, borderRadius: 3 }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", columnGap: 24 }}>
        {pasos.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
              background: p.hecho ? C.gD : p === siguiente ? C.accent : C.bone, color: p.hecho ? C.green : p === siguiente ? "#fff" : C.muted, border: `1px solid ${p.hecho ? C.gD : C.border}` }}>{p.hecho ? "✓" : i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: p.hecho ? C.muted : C.text, textDecoration: p.hecho ? "line-through" : "none", fontWeight: p === siguiente ? 600 : 400 }}>{p.t}</span>
            {!p.hecho && p.ir && <button style={p === siguiente ? st.btn("sm") : btnSuave} onClick={p.ir}>{p.accion}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 2 · Citas de hoy con acciones ───────────────────────────────────────────
export function CitasHoy({ citas, patients, onAbrirPaciente, onEditCita, onNuevaCita }) {
  const { miembros, miId } = useContext(EquipoCtx);
  const hoy = toYMD(today());
  const ahora = today(); const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const lista = citas.filter(c => c.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora));
  const pac = id => patients.find(p => p.id == id);
  const enlaceDe = c => {
    if ((c.zoomLink || "").trim()) return c.zoomLink.trim();
    const p = pac(c.pacienteId);
    const prof = miembros.find(m => m.id === (p?.profesionalId || miId)) || miembros.find(m => m.id === miId);
    return prof?.enlace_videollamada || "";
  };
  return (
    <div style={{ ...st.card, padding: "16px 20px" }}>
      <Titulo extra={<span style={st.badge(C.accent, C.sand)}>{lista.length}</span>}>Citas de hoy</Titulo>
      {lista.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "6px 0", fontSize: 13, color: C.muted }}>
          No tienes citas hoy.<button style={btnSuave} onClick={onNuevaCita}>+ Nueva cita</button>
        </div>
      )}
      {lista.map(c => {
        const p = pac(c.pacienteId);
        const nombre = p ? `${p.nombre} ${p.apellidos}` : (c.nombreExterno || "Primera llamada");
        const ini = timeToMins(c.hora), fin = ini + (Number(c.duracion) || 0);
        const estado = ahoraMin >= fin ? "pasada" : ahoraMin >= ini - 10 ? "ahora" : "luego";
        const enlace = enlaceDe(c);
        const tel = telWhatsApp(p?.telefono || c.telefonoExterno);
        return (
          <Linea key={c.id}>
            <div style={{ width: 46, fontSize: 13, fontWeight: 700, color: estado === "ahora" ? C.accent : estado === "pasada" ? C.dim : C.walnut }}>{c.hora}</div>
            <div onClick={() => onEditCita(c)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: estado === "pasada" ? C.muted : C.ink }}>{nombre}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{c.tipo || "Cita"} · {c.duracion} min{estado === "ahora" ? " · ahora" : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {enlace && estado !== "pasada" && <a href={enlace} target="_blank" rel="noreferrer" style={{ ...(estado === "ahora" ? st.btn("sm") : btnSuave), textDecoration: "none" }}>🎥 Entrar</a>}
              {tel && estado === "luego" && <a href={`https://wa.me/${tel}?text=${encodeURIComponent(mensajeCita(p?.nombre || nombre, c.fecha, c.hora, enlace))}`} target="_blank" rel="noreferrer" style={{ ...btnSuave, textDecoration: "none" }}>WhatsApp</a>}
              {p && estado !== "luego" && <button style={estado === "pasada" ? st.btn("sm") : btnSuave} onClick={() => onAbrirPaciente(p.id)}>Registrar sesión</button>}
            </div>
          </Linea>
        );
      })}
    </div>
  );
}

// ── 3 · Cobros pendientes ───────────────────────────────────────────────────
export function CobrosPendientes({ patients, setPatients, onIr }) {
  const [factura, setFactura] = useState(null);
  const lista = patients.flatMap(p => (p.sesiones || []).filter(s => !s.pagado && Number(s.pago) > 0).map(s => ({ p, s })))
    .sort((a, b) => (a.s.fecha || "").localeCompare(b.s.fecha || ""));
  const total = lista.reduce((a, x) => a + (Number(x.s.pago) || 0), 0);
  const cobrar = (pid, sid) => setPatients(ps => ps.map(p => p.id === pid ? { ...p, sesiones: p.sesiones.map(s => s.id === sid ? { ...s, pagado: true } : s) } : p));
  const hoy = today();
  return (
    <div style={{ ...st.card, padding: "16px 20px" }}>
      <Titulo extra={<span style={st.badge(total ? C.amber : C.green, total ? C.amD : C.gD)}>{Math.round(total).toLocaleString("es-ES")} €</span>}>Cobros pendientes</Titulo>
      {lista.length === 0 && <div style={{ fontSize: 13, color: C.green, padding: "6px 0" }}>No tienes sesiones pendientes de cobro.</div>}
      {lista.slice(0, 6).map(({ p, s }) => {
        const dias = s.fecha ? diasEntre(fechaDe(s.fecha), hoy) : null;
        return (
          <Linea key={`${p.id}-${s.id}`}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre} {p.apellidos}</div>
              <div style={{ fontSize: 12, color: dias > 30 ? C.amber : C.muted }}>{fechaES(s.fecha)}{dias > 0 ? ` · hace ${dias} ${dias === 1 ? "día" : "días"}` : ""}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.walnut, minWidth: 48, textAlign: "right" }}>{Number(s.pago).toLocaleString("es-ES")} €</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={btnSuave} onClick={() => setFactura({ p, s })}>Factura</button>
              <button style={{ ...st.btn("sm"), background: C.gD, color: C.green }} onClick={() => cobrar(p.id, s.id)}>Cobrada</button>
            </div>
          </Linea>
        );
      })}
      {lista.length > 6 && <div style={{ fontSize: 12, color: C.muted, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>Y {lista.length - 6} más · <span style={{ color: C.accent, cursor: "pointer" }} onClick={() => onIr("facturas")}>ver todas en Facturas</span></div>}
      {factura && (() => {
        const pa = patients.find(x => x.id === factura.p.id) || factura.p;
        const se = (pa.sesiones || []).find(x => x.id === factura.s.id) || factura.s;
        return <GenerarFacturaModal patient={pa} sesion={se} onClose={() => setFactura(null)}
          onGuardarNumero={n => setPatients(ps => ps.map(x => x.id === pa.id ? { ...x, sesiones: x.sesiones.map(y => y.id === se.id ? { ...y, factura: n } : y) } : x))} />;
      })()}
    </div>
  );
}

// ── 6 · Tu plan ─────────────────────────────────────────────────────────────
// Paciente activo: con una cita o una sesión en los últimos 90 días, o con una cita futura
export function pacientesActivosPlan(patients, citas) {
  const hoy = today();
  const desde = toYMD(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 90));
  const ids = new Set();
  citas.forEach(c => { if (c.pacienteId && c.fecha >= desde) ids.add(String(c.pacienteId)); });
  patients.forEach(p => { if ((p.sesiones || []).some(s => (s.fecha || "") >= desde)) ids.add(String(p.id)); });
  return patients.filter(p => ids.has(String(p.id))).length;
}

export function TuPlan({ clinica, patients, citas, demo }) {
  const activos = pacientesActivosPlan(patients, citas);
  const inicio = clinica?.creado_en ? new Date(clinica.creado_en) : null;
  const quedan = inicio ? DIAS_PRUEBA - diasEntre(inicio, today()) : (demo ? DIAS_PRUEBA : null);
  const enPrueba = quedan != null && quedan > 0;
  const pct = Math.min(100, Math.round(activos / LIMITE_BASICO * 100));
  const cerca = activos >= LIMITE_BASICO - 2;
  const supera = activos > LIMITE_BASICO;
  return (
    <div style={{ ...st.card, padding: "16px 20px" }}>
      <Titulo extra={enPrueba && <span style={st.badge(C.green, C.gD)}>{quedan} {quedan === 1 ? "día" : "días"} de prueba</span>}>Tu plan</Titulo>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 2 }}>{enPrueba ? "Prueba gratuita · todo incluido" : "Acceso anticipado"}</div>
      <div style={{ fontSize: 13, color: C.text, marginTop: 12 }}><b>{activos}</b> de {LIMITE_BASICO} pacientes activos <span style={{ color: C.muted }}>(límite del plan Básico)</span></div>
      <div style={{ height: 6, background: C.sand, borderRadius: 3, marginTop: 8 }}><div style={{ width: `${pct}%`, height: 6, background: cerca ? C.amber : C.accent, borderRadius: 3 }} /></div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
        Cuenta como activo quien ha tenido cita o sesión en los últimos 90 días.
        {supera ? " Superas el límite de Básico: al terminar la prueba te corresponde Profesional (ilimitado)." : cerca ? " Estás cerca del límite de Básico: con Profesional los pacientes son ilimitados." : " Básico: hasta 10 pacientes activos · Profesional: ilimitados."}
      </div>
    </div>
  );
}
