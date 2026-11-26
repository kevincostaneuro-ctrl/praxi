// Seguridad de la cuenta: verificación en dos pasos (código de una app como Google
// Authenticator) y aviso de términos actualizados. La base de datos exige el segundo
// paso para ver datos clínicos a quien lo tiene activado (supabase/10_seguridad.sql).
import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { C, st } from "./estilos.js";
import { Modal } from "./ui.jsx";
import { PRAXI_LOGO } from "./constantes.js";

const limpiarCodigo = v => v.replace(/\D/g, "").slice(0, 6);
const inputCodigo = { ...st.input, fontSize: 22, letterSpacing: "0.4em", textAlign: "center", fontFamily: "monospace", maxWidth: 220 };

async function verificarCodigo(factorId, code) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw new Error(/invalid|expired/i.test(error.message) ? "Código incorrecto o caducado. Prueba con el que aparece ahora en tu app." : error.message);
}

// ── Pantalla del segundo paso al iniciar sesión ─────────────────────────────
export function PasoDos({ onListo, onSalir }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
    if (codigo.length !== 6) return;
    setEnviando(true); setError("");
    try {
      const { data, error: e } = await supabase.auth.mfa.listFactors();
      if (e) throw e;
      const factor = data?.totp?.[0];
      if (!factor) throw new Error("No se encuentra tu verificación en dos pasos.");
      await verificarCodigo(factor.id, codigo);
      onListo();
    } catch (e) { setError(e.message); setEnviando(false); setCodigo(""); }
  };
  useEffect(() => { if (codigo.length === 6) enviar(); }, [codigo]);
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Manrope',sans-serif" }}>
      <div style={{ ...st.card, background: C.bone, padding: "32px 28px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <img src={PRAXI_LOGO} alt="praXi" style={{ height: 44, display: "block", margin: "0 auto 18px" }} />
        <div style={{ fontSize: 28, fontFamily: "'Instrument Serif',serif", color: C.ink }}>Verificación en dos pasos</div>
        <div style={{ fontSize: 13, color: C.walnut, margin: "8px 0 20px", lineHeight: 1.6 }}>Escribe el código de 6 cifras que aparece en tu app de autenticación.</div>
        <input autoFocus inputMode="numeric" autoComplete="one-time-code" style={{ ...inputCodigo, margin: "0 auto" }} value={codigo} onChange={e => setCodigo(limpiarCodigo(e.target.value))} placeholder="000000" disabled={enviando} />
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 12 }}>{error}</div>}
        <button style={{ ...st.btn(), width: "100%", marginTop: 18, opacity: enviando || codigo.length !== 6 ? 0.6 : 1 }} disabled={enviando || codigo.length !== 6} onClick={enviar}>{enviando ? "Comprobando…" : "Entrar"}</button>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 18, lineHeight: 1.6 }}>¿Has perdido el móvil? Escríbenos desde el email de tu cuenta y te ayudamos a recuperar el acceso.</div>
        <button style={{ ...st.btn("ghost"), fontSize: 12, marginTop: 8 }} onClick={onSalir}>Cerrar sesión</button>
      </div>
    </div>
  );
}

// ── Configuración → Seguridad de la cuenta ──────────────────────────────────
export function SeguridadCuenta({ demo }) {
  const [estado, setEstado] = useState("cargando"); // cargando | inactiva | activando | activa
  const [factor, setFactor] = useState(null);
  const [alta, setAlta] = useState(null); // { id, qr, secreto }
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [quitar, setQuitar] = useState(false);

  const cargar = async () => {
    if (demo) { setEstado("inactiva"); return; }
    const { data } = await supabase.auth.mfa.listFactors();
    const f = data?.totp?.[0];
    setFactor(f || null); setEstado(f ? "activa" : "inactiva");
  };
  useEffect(() => { cargar(); }, []);

  const empezar = async () => {
    if (demo) { setError("En la demo no se puede activar."); return; }
    setError(""); setOcupado(true);
    try {
      // Restos de un intento anterior sin terminar
      const { data: l } = await supabase.auth.mfa.listFactors();
      for (const f of (l?.all || []).filter(f => f.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Praxi" });
      if (e) throw e;
      setAlta({ id: data.id, qr: data.totp.qr_code, secreto: data.totp.secret }); setCodigo(""); setEstado("activando");
    } catch (e) { setError(e.message || "No se ha podido empezar."); }
    setOcupado(false);
  };
  const confirmar = async () => {
    setError(""); setOcupado(true);
    try { await verificarCodigo(alta.id, codigo); setAlta(null); await cargar(); }
    catch (e) { setError(e.message); setCodigo(""); }
    setOcupado(false);
  };
  const desactivar = async () => {
    setError(""); setOcupado(true);
    try {
      const { error: e } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (e) throw e;
      await supabase.auth.refreshSession();
      setQuitar(false); await cargar();
    } catch (e) { setError(e.message || "No se ha podido desactivar."); }
    setOcupado(false);
  };

  return (
    <div style={{ ...st.card, padding: "22px 26px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Verificación en dos pasos</div>
        {estado === "activa" && <span style={st.badge(C.green, C.gD)}>Activada</span>}
        {estado === "inactiva" && <span style={st.badge(C.amber, C.amD)}>Recomendada</span>}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.6, maxWidth: 620 }}>
        Además de la contraseña, al entrar se pide un código de tu móvil. Si alguien consigue tu contraseña, no podrá ver los datos de tus pacientes.
      </div>

      {estado === "inactiva" && <button style={{ ...st.btn(), marginTop: 16, opacity: ocupado ? 0.6 : 1 }} disabled={ocupado} onClick={empezar}>{ocupado ? "Preparando…" : "Activar"}</button>}

      {estado === "activando" && alta && <div style={{ marginTop: 18, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 10, border: `1px solid ${C.border}` }}><img src={alta.qr} alt="Código QR para tu app de autenticación" width={170} height={170} style={{ display: "block" }} /></div>
        <div style={{ flex: "1 1 260px", fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          <div><b>1.</b> Abre una app de autenticación (Google Authenticator, Microsoft Authenticator, 1Password…) y escanea el código.</div>
          <div style={{ fontSize: 12, color: C.muted, margin: "4px 0 10px" }}>¿No puedes escanear? Escribe esta clave: <code style={{ background: C.bone, padding: "2px 6px", borderRadius: 4, wordBreak: "break-all" }}>{alta.secreto}</code></div>
          <div><b>2.</b> Escribe el código de 6 cifras que te muestra:</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <input inputMode="numeric" autoComplete="one-time-code" style={inputCodigo} value={codigo} onChange={e => setCodigo(limpiarCodigo(e.target.value))} placeholder="000000" />
            <button style={{ ...st.btn(), opacity: ocupado || codigo.length !== 6 ? 0.6 : 1 }} disabled={ocupado || codigo.length !== 6} onClick={confirmar}>{ocupado ? "Comprobando…" : "Confirmar"}</button>
            <button style={st.btn("ghost")} onClick={() => { setAlta(null); setEstado("inactiva"); setError(""); }}>Cancelar</button>
          </div>
        </div>
      </div>}

      {estado === "activa" && <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: C.text }}>Cada vez que inicies sesión te pediremos el código de tu app.</span>
        <button style={{ ...st.btn("ghost"), fontSize: 12, color: C.red }} onClick={() => setQuitar(true)}>Desactivar</button>
      </div>}
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}

      {quitar && <Modal title="¿Desactivar la verificación en dos pasos?" onClose={() => setQuitar(false)} width={420}>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>Tu cuenta volverá a depender solo de la contraseña. Con datos de salud no lo recomendamos.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button style={st.btn("ghost")} onClick={() => setQuitar(false)}>Mantenerla</button>
          <button style={{ ...st.btn(), background: C.red, opacity: ocupado ? 0.6 : 1 }} disabled={ocupado} onClick={desactivar}>Desactivar</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── Términos actualizados (solo administrador) ──────────────────────────────
export function NuevosTerminos({ version, onAceptados, onLuego }) {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const aceptar = async () => {
    setEnviando(true); setError("");
    const { error: e } = await supabase.rpc("aceptar_terminos", { p_version: version });
    if (e) { setError("No se ha podido guardar. Inténtalo de nuevo más tarde."); setEnviando(false); return; }
    onAceptados(version);
  };
  return (
    <Modal title="Hemos actualizado los términos" onClose={onLuego} width={480}>
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.65 }}>
        Como administrador de la clínica, necesitamos que aceptes la nueva versión de los <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: C.accent }}>Términos y el contrato de encargo del tratamiento</a>. Los cambios principales:
        <ul style={{ margin: "10px 0", paddingLeft: 20 }}>
          <li>Planes de pago, prueba gratuita de 3 meses y qué pasa al terminar (solo lectura, con exportación siempre disponible).</li>
          <li>Stripe como proveedor de pagos.</li>
          <li>Verificación en dos pasos y cuánto se guarda el registro de accesos.</li>
          <li>Más detalle sobre cómo trata los datos el asistente Nora.</li>
        </ul>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: C.text, cursor: "pointer", marginTop: 6 }}>
        <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} style={{ marginTop: 3 }} />
        <span>He leído y acepto los Términos y el contrato de encargo del tratamiento en nombre de mi clínica.</span>
      </label>
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button style={st.btn("ghost")} onClick={onLuego}>Más tarde</button>
        <button style={{ ...st.btn(), opacity: !ok || enviando ? 0.6 : 1 }} disabled={!ok || enviando} onClick={aceptar}>{enviando ? "Guardando…" : "Aceptar"}</button>
      </div>
    </Modal>
  );
}
