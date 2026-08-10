import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#F5EFE4",
  bone: "#FBF8F1",
  card: "#EBE3D2",
  sand: "#E2D9C8",
  border: "#D9C9A8",
  accent: "#A66B3F",
  walnut: "#6B4A30",
  ink: "#221610",
  text: "#3B2A1E",
  muted: "#9A7E68",
  dim: "#B8A898",
  green: "#4A6438",
  gD: "#E8EFE2",
};

const FEATURES = [
  {
    icon: "🧠",
    title: "Historia clínica real",
    desc: "Diseñada por un neuropsicólogo. Historia clínica, formulación de caso, evolución sesión a sesión y objetivos terapéuticos estructurados.",
  },
  {
    icon: "📅",
    title: "Agenda inteligente",
    desc: "Calendario semanal y diario con videollamada integrada, recordatorios automáticos por WhatsApp y gestión multi-profesional.",
  },
  {
    icon: "✦",
    title: "Asistente IA",
    desc: "La IA conoce a cada paciente — su historia, sus sesiones, su formulación. Te ayuda a redactar notas, generar informes y analizar el caso.",
  },
  {
    icon: "🧾",
    title: "Facturación automática",
    desc: "Genera facturas en PDF, controla pagos pendientes y obtén informes mensuales de ingresos con un clic.",
  },
  {
    icon: "👥",
    title: "Multi-profesional",
    desc: "Un admin gestiona la clínica, cada profesional ve solo sus pacientes. Agenda global compartida para coordinación del equipo.",
  },
  {
    icon: "🔒",
    title: "Seguro y privado",
    desc: "Datos cifrados, hosting en Europa, cumplimiento RGPD. Tus pacientes están protegidos.",
  },
];

const PLANES = [
  {
    nombre: "Básico",
    precio: "9,99€",
    desc: "Para empezar",
    color: C.muted,
    features: [
      "Hasta 15 pacientes activos",
      "Agenda y calendario",
      "Historia clínica",
      "Facturación PDF",
      "Recordatorios por email",
    ],
  },
  {
    nombre: "Pro",
    precio: "29,99€",
    desc: "Para consultas activas",
    color: C.accent,
    destacado: true,
    features: [
      "Pacientes ilimitados",
      "Todo lo del plan Básico",
      "Asistente IA",
      "Recordatorios WhatsApp",
      "Videollamada integrada",
      "Informes clínicos automáticos",
    ],
  },
  {
    nombre: "Clínica",
    precio: "60€",
    desc: "Para equipos",
    color: C.walnut,
    features: [
      "Hasta 3 profesionales incluidos",
      "Todo lo del plan Pro",
      "Agenda global multi-profesional",
      "Panel de administración",
      "Pacientes compartidos",
      "Soporte prioritario",
    ],
  },
];

export default function Landing() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setEmail("");
  };

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: `${C.bone}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 300, color: C.accent, letterSpacing: "-0.5px" }}>praxi</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2 }}>gestión clínica</div>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#features" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Funcionalidades</a>
          <a href="#precios" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Precios</a>
          <button onClick={() => navigate("/app")} style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 48px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.gD, color: C.green, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, marginBottom: 28, letterSpacing: "0.05em" }}>
          Lista de espera abierta · 3 meses gratis para los primeros
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 64, fontWeight: 400, lineHeight: 1.1, color: C.ink, margin: "0 0 24px", letterSpacing: "-1px" }}>
          La gestión clínica que<br />
          <span style={{ color: C.accent, fontStyle: "italic" }}>entiende tu consulta</span>
        </h1>
        <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 48px", fontWeight: 400 }}>
          Diseñado por un neuropsicólogo para que funcione de verdad. Historia clínica real, agenda inteligente y asistente IA que conoce a cada paciente.
        </p>

        {/* Waitlist form */}
        {sent ? (
          <div style={{ background: C.gD, border: `1px solid ${C.green}`, borderRadius: 14, padding: "20px 32px", display: "inline-flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.green }}>¡Estás en la lista!</div>
              <div style={{ fontSize: 13, color: C.green, opacity: 0.8 }}>Te avisamos cuando esté listo. Tendrás 3 meses gratis.</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleWaitlist} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 14, background: C.bone, color: C.text, outline: "none", width: 280 }}
            />
            <button type="submit" style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Unirme a la lista de espera
            </button>
          </form>
        )}
        <div style={{ marginTop: 16, fontSize: 12, color: C.dim }}>Sin tarjeta de crédito · 3 meses gratis · Cancela cuando quieras</div>
      </section>

      {/* APP PREVIEW */}
      <section style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 48px" }}>
        <div style={{ background: C.ink, borderRadius: 20, padding: "3px", boxShadow: "0 40px 80px rgba(34,22,16,0.25)" }}>
          <div style={{ background: C.ink, borderRadius: "18px 18px 0 0", padding: "12px 16px", display: "flex", gap: 6, alignItems: "center" }}>
            {["#FF5F57", "#FFBD2E", "#28CA41"].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
            <div style={{ flex: 1, background: "#2A1E18", borderRadius: 6, height: 24, margin: "0 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, color: "#6B4A30" }}>praxi-kevin-8beb.vercel.app/app</span>
            </div>
          </div>
          {/* App mockup */}
          <div style={{ display: "flex", height: 480, borderRadius: "0 0 18px 18px", overflow: "hidden" }}>
            {/* Sidebar */}
            <div style={{ width: 200, background: "#F5EFE4", borderRight: `1px solid ${C.border}`, padding: "20px 0", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "0 20px 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 300, color: C.accent }}>praxi</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>gestión clínica</div>
              </div>
              {["Dashboard", "Calendario", "Pacientes", "Facturas", "Recursos"].map((item, i) => (
                <div key={i} style={{ padding: "8px 20px", fontSize: 12, color: i === 0 ? C.accent : C.muted, background: i === 0 ? `${C.accent}11` : "transparent", fontWeight: i === 0 ? 600 : 400 }}>▪ {item}</div>
              ))}
            </div>
            {/* Main content */}
            <div style={{ flex: 1, background: C.bg, padding: 24, overflowY: "hidden" }}>
              <div style={{ fontSize: 22, fontFamily: "'Instrument Serif', serif", marginBottom: 16, color: C.ink }}>Dashboard</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                {[["14", "Pacientes activos"], ["5", "Citas hoy"], ["0€", "Cobrado este mes"], ["830€", "Total pendiente"]].map(([v, l], i) => (
                  <div key={i} style={{ background: C.bone, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.bone, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.walnut, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Agenda de hoy</div>
                {[["09:00", "María González", "Seguimiento"], ["10:00", "Primera llamada", "Calendly"], ["11:00", "Carlos Ruiz", "Seguimiento"]].map(([h, n, t], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.muted, width: 40 }}>{h}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{n}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: C.ink, margin: 0 }}>Todo lo que necesitas en un solo sitio</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: C.bone, borderRadius: 16, padding: "28px 28px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section style={{ background: C.ink, padding: "80px 48px", textAlign: "center", marginBottom: 0 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 20 }}>Por qué Praxi</div>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 400, color: C.bone, lineHeight: 1.5, margin: "0 0 24px", fontStyle: "italic" }}>
            "Los programas que existen están hechos por developers. Praxi lo ha construido un neuropsicólogo que pasa consulta."
          </p>
          <div style={{ fontSize: 13, color: C.muted }}>Kevin Costa · Neuropsicólogo clínico-funcional</div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Precios</div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: C.ink, margin: "0 0 12px" }}>Simple y sin sorpresas</h2>
          <p style={{ fontSize: 14, color: C.muted }}>IVA incluido · Cancela cuando quieras</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {PLANES.map((p, i) => (
            <div key={i} style={{ background: p.destacado ? C.ink : C.bone, borderRadius: 20, padding: "36px 32px", border: p.destacado ? `2px solid ${C.accent}` : `1px solid ${C.border}`, position: "relative" }}>
              {p.destacado && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.bone, fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, letterSpacing: "0.05em" }}>MÁS POPULAR</div>}
              <div style={{ fontSize: 13, fontWeight: 600, color: p.destacado ? C.muted : C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>{p.nombre}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: p.destacado ? C.bone : C.ink }}>{p.precio}</span>
                <span style={{ fontSize: 13, color: p.destacado ? C.muted : C.muted }}>/mes</span>
              </div>
              <div style={{ fontSize: 12, color: p.destacado ? C.muted : C.muted, marginBottom: 28 }}>{p.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: C.accent, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: p.destacado ? "#C8A882" : C.muted, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: p.destacado ? "none" : `1px solid ${C.border}`, background: p.destacado ? C.accent : "transparent", color: p.destacado ? C.bone : C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Unirme a la lista de espera
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: C.sand, borderTop: `1px solid ${C.border}`, padding: "80px 48px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: C.ink, margin: "0 0 16px" }}>
          Empieza con 3 meses gratis
        </h2>
        <p style={{ fontSize: 15, color: C.muted, marginBottom: 36 }}>Apúntate a la lista de espera y sé de los primeros en probarlo.</p>
        {sent ? (
          <div style={{ background: C.gD, border: `1px solid ${C.green}`, borderRadius: 14, padding: "16px 32px", display: "inline-flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: C.green, fontWeight: 600 }}>✓ Ya estás en la lista</span>
          </div>
        ) : (
          <form onSubmit={handleWaitlist} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 14, background: C.bone, color: C.text, outline: "none", width: 280 }} />
            <button type="submit" style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Quiero probarlo</button>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.ink, padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 300, color: C.accent }}>praxi</div>
        <div style={{ fontSize: 12, color: C.muted }}>© 2026 Praxi · Gestión Clínica · Hecho en España</div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>Privacidad</a>
          <a href="#" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>Términos</a>
          <a href="#" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>Contacto</a>
        </div>
      </footer>
    </div>
  );
}
