// Protección de datos de la clínica (solo administrador, en Equipo):
// contrato de encargo aceptado y su copia, documentos legales, Nora on/off y copias propias.
import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, st } from "./estilos.js";
import { COPIAS_SEGURIDAD, VERSION_TERMINOS } from "../legal.js";

const DIA = 86400000;
const claveCopia = id => `praxi_copia_${id}`;
const fecha = f => new Date(f).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

// Fecha de la última descarga completa de datos (guardada en este navegador)
export function ultimaCopia(clinicaId) {
  try { const v = localStorage.getItem(claveCopia(clinicaId)); return v ? Number(v) : null; } catch { return null; }
}
export function marcarCopia(clinicaId) {
  try { localStorage.setItem(claveCopia(clinicaId), String(Date.now())); } catch { /* sin almacenamiento */ }
}
export function diasSinCopia(clinicaId, ahora = Date.now()) {
  const u = ultimaCopia(clinicaId);
  return u ? Math.floor((ahora - u) / DIA) : null;
}

// Aviso suave para el administrador si hace más de 7 días que no descarga sus datos
// Desaparece solo cuando haya copias automáticas (COPIAS_SEGURIDAD = true en legal.js)
export function AvisoCopia({ clinica, onIr, onCerrar }) {
  if (COPIAS_SEGURIDAD) return null;
  const dias = diasSinCopia(clinica.id);
  if (dias !== null && dias < 7) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: C.bone, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: C.text }}>
      <span>{dias === null ? "Todavía no has descargado una copia de los datos de tu clínica." : `Hace ${dias} días que no descargas una copia de los datos de tu clínica.`} Guarda una copia cada semana en un lugar seguro.</span>
      <span style={{ display: "flex", gap: 8 }}>
        <button style={st.btn("sm")} onClick={onIr}>Descargar copia</button>
        <button style={{ ...st.btn("ghost"), fontSize: 12 }} onClick={onCerrar}>Ahora no</button>
      </span>
    </div>
  );
}

function Enlace({ href, children, nota }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, color: C.ink, textDecoration: "none", fontSize: 13 }}>
      <span><b style={{ fontWeight: 600 }}>{children}</b>{nota && <span style={{ color: C.muted }}> · {nota}</span>}</span>
      <span style={{ color: C.accent }}>Abrir ↗</span>
    </a>
  );
}

export function ProteccionDatos({ clinica, miembros = [], demo, onClinica }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const aceptadoPor = miembros.find(m => m.user_id && m.user_id === clinica.terminos_aceptados_por);
  const vigente = clinica.terminos_version === VERSION_TERMINOS;
  const noraActiva = !clinica.config?.nora_desactivada;
  const dias = diasSinCopia(clinica.id);

  const descargarContrato = () => {
    try {
      localStorage.setItem("praxi_copia_contrato", JSON.stringify({
        clinica: clinica.nombre, version: clinica.terminos_version,
        fecha: clinica.terminos_aceptados_en, admin: aceptadoPor?.nombre || "", email: aceptadoPor?.email || "",
      }));
    } catch { /* sin almacenamiento: la página saldrá sin cabecera */ }
    window.open("/terminos?imprimir=1#encargo", "_blank", "noopener");
  };

  const cambiarNora = async () => {
    if (demo) { setError("En la demo no se puede cambiar."); return; }
    setGuardando(true); setError("");
    const config = { ...(clinica.config || {}), nora_desactivada: noraActiva };
    const { data, error: e } = await supabase.from("clinicas").update({ config }).eq("id", clinica.id).select("id");
    setGuardando(false);
    if (e || !data?.length) { setError("No se ha podido guardar. Inténtalo de nuevo."); return; }
    onClinica?.(c => ({ ...c, config }));
  };

  const seccion = { fontSize: 12, color: C.walnut, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 };
  return (
    <div style={{ ...st.card, marginTop: 16, padding: "18px 22px" }}>
      <div style={{ ...seccion, marginBottom: 4 }}>Protección de datos</div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>Tu clínica es la responsable de los datos de sus pacientes y Praxi trata esos datos por encargo suyo. Aquí tienes lo que te pediría una inspección.</div>

      <div style={{ background: C.bone, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Contrato de encargo del tratamiento</div>
          {clinica.terminos_aceptados_en
            ? <div style={{ fontSize: 12, color: C.text, marginTop: 3, lineHeight: 1.6 }}>Aceptado el {fecha(clinica.terminos_aceptados_en)}{aceptadoPor ? ` por ${aceptadoPor.nombre}` : ""} · versión {clinica.terminos_version}</div>
            : <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Sin datos de aceptación.</div>}
          {!vigente && clinica.terminos_aceptados_en && <div style={{ fontSize: 12, color: C.amber, marginTop: 3 }}>Hay una versión nueva pendiente de aceptar.</div>}
        </div>
        <button style={{ ...st.btn("sm"), opacity: vigente ? 1 : 0.5 }} disabled={!vigente} onClick={descargarContrato}>Descargar copia (PDF)</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <Enlace href="/terminos#encargo" nota="obligaciones de Praxi como encargado">Contrato de encargo (art. 28 RGPD)</Enlace>
        <Enlace href="/terminos#medidas" nota="cómo se protegen los datos">Medidas de seguridad</Enlace>
        <Enlace href="/terminos#subencargados" nota="quién más interviene y dónde">Subencargados</Enlace>
        <Enlace href="/privacidad">Política de privacidad de Praxi</Enlace>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <div style={{ flex: "1 1 280px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Asistente Nora en tu clínica</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginTop: 2 }}>Nora envía el texto que le pides a Anthropic (EE. UU.), con el nombre del paciente cambiado por un alias. Si lo prefieres, puedes apagarla para todo el equipo.</div>
        </div>
        <button style={{ ...st.btn("sm"), background: noraActiva ? C.clay : C.accent, opacity: guardando ? 0.6 : 1 }} disabled={guardando} onClick={cambiarNora}>{guardando ? "Guardando…" : noraActiva ? "Apagar Nora" : "Encender Nora"}</button>
      </div>
      <div style={{ fontSize: 12, color: noraActiva ? C.green : C.muted, marginTop: 6 }}>{noraActiva ? "Nora está encendida." : "Nora está apagada para toda la clínica."}</div>

      <div style={{ fontSize: 12, color: C.muted, marginTop: 16, lineHeight: 1.6 }}>
        Última copia descargada en este ordenador: <b style={{ color: dias !== null && dias < 7 ? C.green : C.amber }}>{dias === null ? "ninguna" : dias === 0 ? "hoy" : `hace ${dias} ${dias === 1 ? "día" : "días"}`}</b>. La descarga completa está más abajo.
      </div>
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}
    </div>
  );
}
