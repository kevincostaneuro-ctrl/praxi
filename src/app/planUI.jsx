// Planes en la app: «Tu plan» (Equipo), avisos de prueba / solo lectura / impago y el aviso
// que sale cuando el plan no deja hacer un cambio. El pago lo hace Stripe (api/pago.js).
import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { C, st } from "./estilos.js";
import { Modal } from "./ui.jsx";
import { PLANES, idsPacientesActivos } from "./plan.js";

const euros = n => `${Number.isInteger(n) ? n : n.toFixed(2).replace(".", ",")} €`;

async function irAPago(cuerpo) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const r = await fetch("/api/pago", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url) throw new Error(j.error || "No se ha podido abrir el pago.");
  window.location.href = j.url;
}

// ── Franja superior: prueba que acaba, solo lectura o pago pendiente ─────────
export function BannerPlan({ plan, esAdmin, onVerPlanes }) {
  let tono, texto;
  if (plan.plan === "caducado") { tono = "rojo"; texto = <>Tu prueba gratuita ha terminado. Praxi está en <b>solo lectura</b>: puedes consultar y exportar todo, pero no crear ni modificar.</>; }
  else if (plan.impago) { tono = "ambar"; texto = <>No hemos podido cobrar tu última cuota. Actualiza la tarjeta para no perder el acceso.</>; }
  else if (plan.plan === "prueba" && plan.diasPrueba <= 15) { tono = "ambar"; texto = <>Te {plan.diasPrueba === 1 ? "queda 1 día" : `quedan ${plan.diasPrueba} días`} de prueba gratuita.</>; }
  else return null;
  const [col, bg] = tono === "rojo" ? [C.red, C.rD] : [C.amber, C.amD];
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: bg, border: `1px solid ${col}40`, borderRadius: 12, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: C.text }}>
      <span>{texto}</span>
      {esAdmin ? <button style={{ ...st.btn("sm"), background: col }} onClick={onVerPlanes}>{plan.impago ? "Actualizar tarjeta" : "Elegir plan"}</button>
        : <span style={{ fontSize: 12, color: C.walnut }}>Avisa al administrador de tu clínica.</span>}
    </div>
  );
}

// ── Aviso cuando el plan no deja hacer un cambio ─────────────────────────────
export function AvisoPlan({ tipo, esAdmin, onVerPlanes, onClose }) {
  const lectura = tipo === "lectura";
  return (
    <Modal title={lectura ? "Praxi está en solo lectura" : "Has llegado a 10 pacientes activos"} onClose={onClose} width={440}>
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
        {lectura
          ? <>Tu prueba gratuita ha terminado. Tus datos siguen aquí: puedes consultarlos, exportarlos y borrarlos cuando quieras. Para volver a crear y modificar, elige un plan.</>
          : <>El plan Básico incluye hasta 10 pacientes activos a la vez. Con Profesional no hay límite de pacientes.</>}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
        <button style={st.btn("ghost")} onClick={onClose}>Ahora no</button>
        {esAdmin ? <button style={st.btn()} onClick={() => { onClose(); onVerPlanes(); }}>Ver planes</button>
          : <span style={{ fontSize: 12, color: C.walnut, alignSelf: "center" }}>Avisa al administrador de tu clínica.</span>}
      </div>
    </Modal>
  );
}

// ── Tarjeta de un plan ───────────────────────────────────────────────────────
function TarjetaPlan({ id, periodo, actual, destacado, cargando, onElegir }) {
  const p = PLANES[id];
  const anual = periodo === "anual" && p.anual;
  const precio = anual ? p.anual : p.mensual;
  const puntos = {
    basico: ["Hasta 10 pacientes activos", "Nora incluida, igual que en Profesional", "1 profesional"],
    profesional: ["Pacientes ilimitados", "Nora incluida", "1 profesional"],
    clinica: ["3 profesionales incluidos", `+${euros(p.extra || 19)}/mes por profesional extra`, "Agenda y equipo compartidos"],
  }[id];
  return (
    <div style={{ background: destacado ? C.bone : "transparent", border: `1px solid ${destacado ? C.accent : C.border}`, borderRadius: 14, padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{id === "fundador" ? "Fundador" : p.nombre}</span>
        {id === "fundador" && <span style={st.badge(C.accent, C.amD)}>Oferta</span>}
      </div>
      <div style={{ color: C.ink }}>
        <span style={{ fontSize: 26, fontFamily: "'Instrument Serif',serif" }}>{euros(precio)}</span>
        <span style={{ fontSize: 12, color: C.muted }}> /{anual ? "año" : "mes"}</span>
        {anual && <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>2 meses gratis</div>}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: C.text, lineHeight: 1.7, flex: 1 }}>{puntos.map(t => <li key={t}>{t}</li>)}</ul>
      {actual
        ? <div style={{ ...st.badge(C.green, C.gD), textAlign: "center" }}>Tu plan actual</div>
        : <button style={{ ...st.btn(destacado ? "primary" : "sm"), padding: "8px 12px", background: destacado ? C.accent : C.clay, opacity: cargando ? 0.6 : 1 }} disabled={!!cargando} onClick={() => onElegir(id)}>{cargando === id ? "Abriendo…" : "Elegir"}</button>}
    </div>
  );
}

// ── Fundador: opción exclusiva aparte, con el cupo de plazas ─────────────────
export function OpcionFundador({ ocupadas, actual, cargando, onElegir }) {
  const total = 100;
  const n = Math.min(total, Math.max(0, ocupadas ?? 0));
  const quedan = total - n;
  const agotado = quedan <= 0;
  return (
    <div style={{ marginTop: 14, background: `linear-gradient(135deg, ${C.bone}, ${C.amD})`, border: `1px solid ${C.accent}`, borderRadius: 16, padding: "18px 20px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: C.accent }}>Opción exclusiva</span>
          <span style={st.badge(C.walnut, C.bone)}>Hasta el 31 de marzo de 2027</span>
        </div>
        <div style={{ fontSize: 22, fontFamily: "'Instrument Serif',serif", color: C.ink, marginTop: 6 }}>Plan Fundador · Profesional por 15 €/mes</div>
        <div style={{ fontSize: 12, color: C.text, marginTop: 4, lineHeight: 1.6 }}>Todo lo de Profesional con el precio congelado para siempre mientras mantengas la suscripción. Solo para las 100 primeras cuentas.</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.walnut, marginBottom: 6 }}>
            <span><b style={{ color: C.ink }}>{n}</b> de {total} plazas ocupadas</span>
            <span style={{ color: quedan <= 15 ? C.red : C.walnut, fontWeight: 600 }}>{agotado ? "Agotado" : `Quedan ${quedan}`}</span>
          </div>
          <div style={{ height: 8, background: C.sand, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${n}%`, minWidth: n ? 6 : 0, height: 8, background: `linear-gradient(90deg, ${C.aL}, ${C.accent})`, borderRadius: 4, transition: "width 600ms ease" }} />
          </div>
        </div>
      </div>
      <div style={{ flex: "1 0 170px", textAlign: "center" }}>
        <div style={{ color: C.ink }}><span style={{ fontSize: 34, fontFamily: "'Instrument Serif',serif" }}>15 €</span><span style={{ fontSize: 12, color: C.muted }}> /mes</span></div>
        <div style={{ fontSize: 11, color: C.muted, textDecoration: "line-through" }}>24 €/mes</div>
        {actual ? <div style={{ ...st.badge(C.green, C.gD), marginTop: 8 }}>Tu plan actual</div>
          : <button style={{ ...st.btn(), marginTop: 8, opacity: cargando || agotado ? 0.6 : 1 }} disabled={!!cargando || agotado} onClick={onElegir}>{cargando === "fundador" ? "Abriendo…" : agotado ? "Plazas agotadas" : "Quiero ser fundador"}</button>}
      </div>
    </div>
  );
}

// ── Tu plan (Equipo) ─────────────────────────────────────────────────────────
export function TuPlan({ plan, suscripcion, patients, citas, demo, abrir = false }) {
  const [periodo, setPeriodo] = useState("mensual");
  const [cargando, setCargando] = useState(null);
  const [error, setError] = useState("");
  const [verPlanes, setVerPlanes] = useState(abrir);
  const activos = idsPacientesActivos(patients, citas);
  const nActivos = patients.filter(p => activos.has(String(p.id))).length;
  const pagando = suscripcion && ["activa", "impagada"].includes(suscripcion.estado) && suscripcion.stripe_subscription_id;
  const cortesia = suscripcion?.estado === "cortesia";
  const [fundadorAbierto] = useState(() => Date.now() < new Date("2027-04-01T00:00:00+02:00").getTime());
  const [fundadores, setFundadores] = useState(null);
  useEffect(() => {
    if (!verPlanes || !fundadorAbierto) return;
    if (demo) { setFundadores(37); return; }
    supabase.rpc("plazas_fundador").then(({ data }) => setFundadores(typeof data === "number" ? data : 0), () => setFundadores(0));
  }, [verPlanes, fundadorAbierto, demo]);

  const ejecutar = async (cuerpo, marca) => {
    if (demo) { setError("En la demo no se puede contratar un plan."); return; }
    setError(""); setCargando(marca);
    try { await irAPago(cuerpo); } catch (e) { setError(e.message); setCargando(null); }
  };

  const titulo = {
    prueba: "Prueba gratuita · todo incluido",
    caducado: "Prueba terminada · solo lectura",
  }[plan.plan] || `${PLANES[plan.plan]?.nombre || "Plan"}${cortesia ? " · cortesía" : ""}`;
  const fin = suscripcion?.fin_periodo ? new Date(suscripcion.fin_periodo).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : null;

  const planes = ["basico", "profesional", "clinica"];
  return (
    <div style={{ ...st.card, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: C.walnut, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Tu plan</div>
        {plan.plan === "prueba" && <span style={st.badge(C.green, C.gD)}>{plan.diasPrueba} {plan.diasPrueba === 1 ? "día" : "días"} de prueba</span>}
        {plan.impago && <span style={st.badge(C.amber, C.amD)}>Pago pendiente</span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: plan.plan === "caducado" ? C.red : C.ink }}>{titulo}</div>
      {pagando && fin && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{suscripcion.estado === "impagada" ? "Cobro pendiente desde el" : "Se renueva el"} {fin} · {suscripcion.periodo === "anual" ? "pago anual" : "pago mensual"}</div>}

      {(plan.plan === "prueba" || plan.plan === "basico") && <>
        <div style={{ fontSize: 13, color: C.text, marginTop: 12 }}><b>{nActivos}</b> de 10 pacientes activos <span style={{ color: C.muted }}>(límite del plan Básico)</span></div>
        <div style={{ height: 6, background: C.sand, borderRadius: 3, marginTop: 8 }}><div style={{ width: `${Math.min(100, nActivos * 10)}%`, height: 6, background: nActivos >= 8 ? C.amber : C.accent, borderRadius: 3 }} /></div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>Cuenta como activo quien ha tenido cita o sesión en los últimos 90 días o tiene una cita próxima.</div>
      </>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {pagando && <button style={st.btn("sm")} disabled={!!cargando} onClick={() => ejecutar({ accion: "gestionar" }, "gestionar")}>{cargando === "gestionar" ? "Abriendo…" : "Gestionar suscripción"}</button>}
        {!pagando && !cortesia && !verPlanes && <button style={st.btn("sm")} onClick={() => setVerPlanes(true)}>{plan.plan === "prueba" ? "Ver planes" : "Elegir plan"}</button>}
      </div>
      {pagando && <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Cambia de tarjeta, descarga tus facturas o cancela cuando quieras.</div>}

      {verPlanes && !pagando && !cortesia && <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.muted }}>Precios finales, IVA incluido. Sin permanencia.</div>
          <div style={{ display: "flex", background: C.bone, border: `1px solid ${C.border}`, borderRadius: 999, padding: 3 }}>
            {["mensual", "anual"].map(p => <button key={p} onClick={() => setPeriodo(p)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontFamily: "inherit", background: periodo === p ? C.accent : "transparent", color: periodo === p ? "#fff" : C.walnut }}>{p === "mensual" ? "Mensual" : "Anual · 2 meses gratis"}</button>)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
          {planes.filter(id => periodo === "mensual" || PLANES[id].anual).map(id => (
            <TarjetaPlan key={id} id={id} periodo={periodo} actual={plan.plan === id} destacado={id === "profesional"} cargando={cargando} onElegir={id => ejecutar({ accion: "elegir", plan: id, periodo: PLANES[id].anual ? periodo : "mensual" }, id)} />
          ))}
        </div>
        {periodo === "anual" && <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Básico solo tiene pago mensual.</div>}
        {fundadorAbierto && <OpcionFundador ocupadas={fundadores} actual={plan.plan === "fundador"} cargando={cargando} onElegir={() => ejecutar({ accion: "elegir", plan: "fundador", periodo: "mensual" }, "fundador")} />}
        <div style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>El pago se hace en una página segura de Stripe. Tus datos clínicos nunca salen de Praxi.</div>
      </div>}
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}
    </div>
  );
}
