import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import App from "./App";

const DEMO_USER = {
  nombre: "Kevin Costa",
  email: "kevin@praxi.com",
  password: "psico2026",
  clinica: "Consulta Neuro Kevin",
  especialidad: "Neuropsicólogo",
  plan: "pro",
};


const DC = {
  bg: "#F5EFE4", bone: "#FBF8F1", sand: "#E2D9C8",
  border: "#D9C9A8", accent: "#A66B3F", walnut: "#6B4A30",
  ink: "#221610", text: "#3B2A1E", muted: "#9A7E68",
  green: "#4A6438", gD: "#E8EFE2", amber: "#C48C2A",
  red: "#B85040", rD: "#FAEAE8",
};

const PLANES = {
  basico:  { nombre: "Básico",  precio: "9,99€",  desc: "Hasta 20 pacientes · IA seguimientos · Agenda · Facturación" },
  pro:     { nombre: "Pro",     precio: "29,99€", desc: "Pacientes ilimitados · IA · WhatsApp · Videollamada" },
  clinica: { nombre: "Clínica", precio: "60€",    desc: "Hasta 6 profesionales · Todo lo del plan Pro · Admin" },
};

const PROFESIONALES_CLINICA = [
  { ini: "K", nombre: "Kevin Costa", esp: "Neuropsicólogo · Admin", yo: true },
  { ini: "M", nombre: "María López", esp: "Psicóloga", yo: false },
  { ini: "A", nombre: "Ana García",  esp: "Fisioterapeuta", yo: false },
];

const FACTURAS = [
  { id: "PRX-002", fecha: "2026-08-01", concepto: "Plan Pro — Agosto 2026", importe: "29,99€" },
  { id: "PRX-001", fecha: "2026-07-01", concepto: "Plan Pro — Julio 2026",  importe: "29,99€" },
];

function getSaludo(nombre) {
  const h = new Date().getHours();
  const saludo = h >= 6 && h <= 12 ? "Buenos días" : h >= 13 && h <= 21 ? "Buenas tardes" : "Buenas noches";
  return `${saludo}, ${nombre.split(" ")[0]}`;
}

const Badge = ({ children, color = C.green, bg = C.gD }) => (
  <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{children}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.bone, borderRadius: 14, border: `1px solid ${C.border}`, ...style }}>{children}</div>
);

const SLabel = ({ children }) => (
  <div style={{ fontSize: 11, color: C.walnut, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 12 }}>{children}</div>
);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.border}` }}>
    <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{value}</span>
  </div>
);

function ClientDashboard({ user, onLogout, onEnterApp }) {
  const [activeTab, setActiveTab] = useState("inicio");
  const [clinicaNombre, setClinicaNombre] = useState(user?.clinica || "Consulta Neuro Kevin");
  const [editingClinica, setEditingClinica] = useState(false);
  const [tempNombre, setTempNombre] = useState(clinicaNombre);
  const navigate = useNavigate();

  const plan = "pro"; // TODO: conectar a Supabase
  const planData = PLANES[plan];
  const nombre = user?.nombre || "Kevin Costa";

  const tabs = [
    { id: "inicio", label: "Inicio" },
    { id: "clinica", label: "Mi clínica" },
    { id: "facturacion", label: "Facturación" },
    { id: "cuenta", label: "Mi cuenta" },
  ];

  return (
    <div style={{ fontFamily: "'Manrope',sans-serif", background: DC.bg, minHeight: "100vh", color: DC.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: DC.bone, borderBottom: `1px solid ${DC.border}`, padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 22, color: DC.ink }}>pra</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 26, color: DC.accent, lineHeight: 0.9, marginLeft: 2 }}>X</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 22, color: DC.ink }}>i</span>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: DC.accent, marginLeft: 10, marginBottom: 3 }} />
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: DC.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: DC.bone }}>
              {nombre[0]}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: DC.ink }}>{nombre}</span>
          </div>
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${DC.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: DC.muted, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 48px" }}>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: 32, borderBottom: `1px solid ${DC.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? DC.accent : DC.muted,
              borderBottom: activeTab === t.id ? `2px solid ${DC.accent}` : "2px solid transparent",
              marginBottom: -1, fontFamily: "'Manrope',sans-serif",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── INICIO ── */}
        {activeTab === "inicio" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, fontWeight: 400, color: DC.ink, margin: "0 0 6px" }}>
                {getSaludo(nombre)}
              </h1>
              <p style={{ fontSize: 14, color: DC.muted }}>{clinicaNombre} · Plan {planData.nombre}</p>
            </div>

            <div style={{ background: DC.ink, borderRadius: 20, padding: "32px 40px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: DC.bone, marginBottom: 6 }}>Tu consulta te espera</div>
                <div style={{ fontSize: 13, color: DC.muted }}>Accede a tu gestión clínica, pacientes y agenda</div>
              </div>
              <button onClick={onEnterApp} style={{ background: DC.accent, color: DC.bone, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Entrar a la app →
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
              <Card style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 11, color: DC.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Plan activo</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: DC.ink, marginBottom: 2 }}>{planData.nombre}</div>
                <div style={{ fontSize: 12, color: DC.muted }}>{planData.precio}/mes</div>
              </Card>
              <Card style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 11, color: DC.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Período gratuito</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: DC.green, marginBottom: 2 }}>61 días</div>
                <div style={{ fontSize: 12, color: DC.muted }}>Hasta el 1 nov 2026</div>
              </Card>
              <Card style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 11, color: DC.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Miembro desde</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: DC.ink, marginBottom: 2 }}>Ago 2026</div>
                <div style={{ fontSize: 12, color: DC.muted }}>Beta tester</div>
              </Card>
            </div>

            <Card style={{ padding: "20px 24px" }}>
              <SLabel>Última factura de Praxi</SLabel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DC.ink }}>{FACTURAS[0].concepto}</div>
                  <div style={{ fontSize: 12, color: DC.muted, marginTop: 2 }}>{FACTURAS[0].id} · {FACTURAS[0].fecha}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: DC.ink }}>{FACTURAS[0].importe}</span>
                  <Badge>Pagada</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── MI CLÍNICA ── */}
        {activeTab === "clinica" && (
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, fontWeight: 400, color: DC.ink, margin: "0 0 24px" }}>Mi clínica</h2>

            <Card style={{ padding: "28px 32px", marginBottom: 14 }}>
              <SLabel>Nombre de la clínica</SLabel>
              {editingClinica ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input value={tempNombre} onChange={e => setTempNombre(e.target.value)}
                    style={{ border: `1px solid ${DC.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 16, background: DC.bg, color: DC.text, outline: "none", flex: 1 }} autoFocus />
                  <button onClick={() => { setClinicaNombre(tempNombre); setEditingClinica(false); }}
                    style={{ background: DC.accent, color: DC.bone, border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Guardar</button>
                  <button onClick={() => setEditingClinica(false)}
                    style={{ background: "none", border: `1px solid ${DC.border}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: DC.muted, cursor: "pointer" }}>Cancelar</button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 600, color: DC.ink }}>{clinicaNombre}</span>
                  <button onClick={() => { setTempNombre(clinicaNombre); setEditingClinica(true); }}
                    style={{ background: "none", border: `1px solid ${DC.border}`, borderRadius: 8, padding: "7px 16px", fontSize: 12, color: DC.muted, cursor: "pointer" }}>Editar</button>
                </div>
              )}
            </Card>

            <Card style={{ padding: "28px 32px", marginBottom: 14 }}>
              <SLabel>Profesionales</SLabel>
              {plan === "clinica" ? (
                <>
                  {PROFESIONALES_CLINICA.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${DC.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.yo ? DC.accent : DC.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: DC.bone }}>{p.ini}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: DC.ink }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: DC.muted }}>{p.esp}</div>
                      </div>
                      {p.yo ? <Badge>Tú</Badge> : <button style={{ background: "none", border: `1px solid ${DC.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: DC.muted, cursor: "pointer" }}>Eliminar</button>}
                    </div>
                  ))}
                  {PROFESIONALES_CLINICA.length < 6 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", marginTop: 4 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: DC.sand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: DC.muted }}>+</div>
                      <div style={{ fontSize: 13, color: DC.muted, flex: 1 }}>Invitar profesional <span style={{ color: DC.muted, fontSize: 11 }}>({PROFESIONALES_CLINICA.length}/6)</span></div>
                      <button style={{ background: DC.accent, color: DC.bone, border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Invitar</button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: DC.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: DC.bone }}>{nombre[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DC.ink }}>{nombre}</div>
                    <div style={{ fontSize: 11, color: DC.muted }}>{user?.especialidad || "Neuropsicólogo"} · Admin</div>
                  </div>
                  <Badge>Tú</Badge>
                </div>
              )}
            </Card>

            <Card style={{ padding: "28px 32px" }}>
              <SLabel>Plan actual</SLabel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: DC.ink, marginBottom: 4 }}>Plan {planData.nombre}</div>
                  <div style={{ fontSize: 13, color: DC.muted }}>{planData.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: DC.accent }}>{planData.precio}<span style={{ fontSize: 13, fontWeight: 400, color: DC.muted }}>/mes</span></div>
                  <button style={{ marginTop: 8, background: "none", border: `1px solid ${DC.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: DC.muted, cursor: "pointer" }}>Cambiar plan</button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── FACTURACIÓN ── */}
        {activeTab === "facturacion" && (
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, fontWeight: 400, color: DC.ink, margin: "0 0 6px" }}>Facturación</h2>
            <p style={{ fontSize: 13, color: DC.muted, marginBottom: 28 }}>Historial de pagos de tu suscripción a Praxi</p>

            <Card style={{ padding: "18px 24px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: DC.muted, marginBottom: 4 }}>Período gratuito activo hasta</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: DC.green }}>1 noviembre 2026 <span style={{ fontSize: 13, fontWeight: 400, color: DC.muted }}>· sin cargo</span></div>
              </div>
              <Badge>3 meses gratuitos</Badge>
            </Card>

            <Card style={{ padding: "18px 24px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: DC.muted, marginBottom: 4 }}>Próximo cargo</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: DC.ink }}>{planData.precio} <span style={{ fontSize: 13, fontWeight: 400, color: DC.muted }}>el 1 nov 2026</span></div>
              </div>
              <div style={{ fontSize: 12, color: DC.muted }}>•••• •••• •••• 4242</div>
            </Card>

            <Card style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${DC.border}`, fontSize: 11, color: DC.walnut, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Historial de facturas</div>
              {FACTURAS.map((f, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: i < FACTURAS.length - 1 ? `1px solid ${DC.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DC.ink }}>{f.concepto}</div>
                    <div style={{ fontSize: 11, color: DC.muted, marginTop: 2 }}>{f.id} · {f.fecha}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: DC.ink }}>{f.importe}</span>
                    <Badge>Pagada</Badge>
                    <button style={{ background: "none", border: `1px solid ${DC.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, color: DC.muted, cursor: "pointer" }}>PDF</button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ── MI CUENTA ── */}
        {activeTab === "cuenta" && (
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, fontWeight: 400, color: DC.ink, margin: "0 0 24px" }}>Mi cuenta</h2>

            <Card style={{ padding: "28px 32px", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: DC.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: DC.bone }}>{nombre[0]}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: DC.ink }}>{nombre}</div>
                  <div style={{ fontSize: 13, color: DC.muted }}>{user?.especialidad || "Neuropsicólogo"}</div>
                </div>
                <button style={{ marginLeft: "auto", background: "none", border: `1px solid ${DC.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 12, color: DC.muted, cursor: "pointer" }}>Editar perfil</button>
              </div>
              <Row label="Nombre" value={nombre} />
              <Row label="Email" value={user?.email || "kevincostaneuro@gmail.com"} />
              <Row label="Teléfono" value="+34 612 345 678" />
              <Row label="Profesión" value={user?.especialidad || "Neuropsicólogo/a"} />
              <Row label="Consulta" value={clinicaNombre} />
              <Row label="Miembro desde" value="Agosto 2026" />
            </Card>

            <Card style={{ padding: "28px 32px", marginBottom: 14 }}>
              <SLabel>Seguridad</SLabel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${DC.border}` }}>
                <span style={{ fontSize: 13, color: DC.muted }}>Contraseña</span>
                <button style={{ background: "none", border: `1px solid ${DC.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: DC.muted, cursor: "pointer" }}>Cambiar contraseña</button>
              </div>
            </Card>

            <button style={{ background: DC.rD, color: DC.red, border: `1px solid ${DC.red}`, borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar suscripción
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


const RC = {
  bg: "#F5EFE4", bone: "#FBF8F1", border: "#D9C9A8",
  accent: "#A66B3F", ink: "#221610", muted: "#9A7E68",
  green: "#4A6438", gD: "#E8EFE2", walnut: "#6B4A30",
};

const TERMINOS = [
  ["1. Aceptación de los términos", "Al crear una cuenta en Praxi, aceptas los presentes términos de uso. Si no estás de acuerdo con alguno de ellos, no debes utilizar el servicio."],
  ["2. Descripción del servicio", "Praxi es una plataforma de gestión clínica para profesionales sanitarios. Permite gestionar pacientes, agenda, facturación y documentación clínica. El servicio se presta mediante suscripción mensual."],
  ["3. Acceso y cuenta", "El acceso a Praxi es personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales. Praxi no se responsabiliza de accesos no autorizados derivados del incumplimiento de esta obligación."],
  ["4. Uso adecuado", "El servicio está destinado exclusivamente a profesionales sanitarios para el ejercicio de su actividad. Queda prohibido el uso del servicio para fines ilegales, fraudulentos o contrarios a la ética profesional."],
  ["5. Propiedad intelectual", "Todos los elementos de Praxi (diseño, código, marca, contenidos) son propiedad de Praxi SL. Queda prohibida su reproducción o uso sin autorización expresa."],
  ["6. Modificación y cancelación", "Praxi se reserva el derecho de modificar el servicio o los presentes términos con previo aviso. El usuario puede cancelar su cuenta en cualquier momento desde su área de cliente."],
  ["7. Limitación de responsabilidad", "Praxi no es responsable de decisiones clínicas tomadas a partir del uso de la plataforma. La información gestionada en Praxi es responsabilidad exclusiva del profesional sanitario titular de la cuenta."],
  ["8. Legislación aplicable", "Los presentes términos se rigen por la legislación española. Para cualquier disputa, las partes se someten a los juzgados y tribunales de Madrid."],
];

const PRIVACIDAD = [
  ["1. Responsable del tratamiento", "Praxi SL, con domicilio en Madrid (España). Contacto: privacidad@praxi.es"],
  ["2. Datos que recogemos", "Recogemos los datos que el usuario facilita al registrarse (nombre, email, teléfono, profesión y nombre de la consulta), así como los datos de uso de la plataforma necesarios para la prestación del servicio."],
  ["3. Datos de pacientes", "Los datos clínicos introducidos en Praxi son responsabilidad exclusiva del profesional sanitario. Praxi actúa como encargado del tratamiento conforme al artículo 28 del RGPD. Se firma un Acuerdo de Encargo de Tratamiento (DPA) con cada cuenta."],
  ["4. Finalidad y base legal", "Los datos del usuario se tratan para la gestión de la cuenta y prestación del servicio (base legal: ejecución de contrato). No se utilizan para publicidad de terceros ni se ceden a terceros salvo obligación legal."],
  ["5. Conservación", "Los datos se conservan mientras la cuenta esté activa. Tras la cancelación, se eliminan en un plazo máximo de 30 días, salvo obligación legal de conservación."],
  ["6. Hosting y transferencias", "Los datos se alojan en servidores ubicados en la Unión Europea (Supabase EU region). No se realizan transferencias internacionales de datos fuera del Espacio Económico Europeo."],
  ["7. Derechos del usuario", "El usuario puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición escribiendo a privacidad@praxi.es. Tiene derecho a presentar reclamación ante la AEPD."],
  ["8. Cookies", "Praxi utiliza únicamente cookies técnicas necesarias para el funcionamiento del servicio. No se utilizan cookies de seguimiento ni publicidad."],
];

const PREFIJOS = [
  ["🇪🇸", "+34", "España"], ["🇦🇷", "+54", "Argentina"], ["🇲🇽", "+52", "México"],
  ["🇨🇴", "+57", "Colombia"], ["🇨🇱", "+56", "Chile"], ["🇵🇪", "+51", "Perú"],
  ["🇻🇪", "+58", "Venezuela"], ["🇪🇨", "+593", "Ecuador"], ["🇺🇸", "+1", "EEUU"],
  ["🇬🇧", "+44", "Reino Unido"], ["🇩🇪", "+49", "Alemania"], ["🇫🇷", "+33", "Francia"],
  ["🇵🇹", "+351", "Portugal"], ["🇮🇹", "+39", "Italia"],
];

const PROFESIONES = ["Psicólogo/a", "Neuropsicólogo/a", "Fisioterapeuta", "Nutricionista", "Logopeda", "Terapeuta ocupacional", "Médico/a", "Enfermero/a", "Coach o terapeuta", "Otro profesional sanitario"];

function Modal({ open, onClose, title, sections }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(34,22,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: DC.bone, borderRadius: 20, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto", border: `1px solid ${DC.border}` }}>
        <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${DC.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: DC.bone, borderRadius: "20px 20px 0 0" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 18, color: DC.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: DC.bg, border: `1px solid ${DC.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: DC.muted, cursor: "pointer" }}>Cerrar ✕</button>
        </div>
        <div style={{ padding: "24px 28px" }}>
          <p style={{ fontSize: 12, color: DC.muted, marginBottom: 16 }}>Última actualización: agosto de 2026</p>
          {sections.map(([titulo, texto], i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 15, color: DC.ink, marginBottom: 6 }}>{titulo}</div>
              <p style={{ fontSize: 13, color: DC.walnut, lineHeight: 1.7 }}>{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", border: `1px solid ${DC.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, background: DC.bg, color: DC.ink, outline: "none", fontFamily: "'Manrope',sans-serif", boxSizing: "border-box" };
const labelStyle = { fontSize: 10, color: DC.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 };

function Registro() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: "", apellidos: "", email: "", prefijo: "+34", telefono: "", profesion: "", consulta: "", password: "", confirm: "", terms: false });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ fontFamily: "'Manrope',sans-serif", background: RC.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Instrument+Serif:ital@1&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <Modal open={modal === "terminos"} onClose={() => setModal(null)} title="Términos de uso" sections={TERMINOS} />
      <Modal open={modal === "privacidad"} onClose={() => setModal(null)} title="Política de privacidad" sections={PRIVACIDAD} />

      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", lineHeight: 1, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 36, color: RC.ink, letterSpacing: "-1px" }}>pra</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 43, color: RC.accent, letterSpacing: "-1px", lineHeight: 0.9, marginLeft: 2 }}>X</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 36, color: RC.ink, letterSpacing: "-1px" }}>i</span>
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: RC.accent, marginLeft: 14, marginBottom: 5 }} />
          </div>
          <div style={{ fontSize: 9, color: RC.muted, letterSpacing: "4px", textTransform: "uppercase" }}>gestión clínica</div>
        </div>

        {/* Card */}
        <div style={{ background: RC.bone, border: `1px solid ${RC.border}`, borderRadius: 24, padding: "40px 44px", boxShadow: "0 8px 40px rgba(59,42,30,0.07)" }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: RC.ink, margin: "0 0 6px", fontStyle: "italic" }}>Crea tu cuenta</h1>
            <p style={{ fontSize: 13, color: RC.muted }}>3 meses gratuitos · Sin tarjeta de crédito</p>
          </div>

          {/* Nombre y apellidos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Nombre</label><input style={inputStyle} placeholder="María" value={form.nombre} onChange={e => set("nombre", e.target.value)} /></div>
            <div><label style={labelStyle}>Apellidos</label><input style={inputStyle} placeholder="González López" value={form.apellidos} onChange={e => set("apellidos", e.target.value)} /></div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email profesional</label>
            <input style={inputStyle} type="email" placeholder="maria@clinica.com" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>

          {/* Teléfono con prefijo */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Teléfono</label>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
              <select style={{ ...inputStyle }} value={form.prefijo} onChange={e => set("prefijo", e.target.value)}>
                {PREFIJOS.map(([flag, code, pais]) => (
                  <option key={code} value={code}>{flag} {code} {pais}</option>
                ))}
              </select>
              <input style={inputStyle} type="tel" placeholder="612 345 678" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
            </div>
          </div>

          {/* Profesión */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Profesión</label>
            <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} value={form.profesion} onChange={e => set("profesion", e.target.value)}>
              <option value="" disabled>Selecciona tu profesión</option>
              {PROFESIONES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Nombre consulta */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Nombre de tu consulta o clínica</label>
            <input style={inputStyle} placeholder="Consulta María González" value={form.consulta} onChange={e => set("consulta", e.target.value)} />
          </div>

          {/* Contraseña */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div><label style={labelStyle}>Contraseña</label><input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} /></div>
            <div><label style={labelStyle}>Confirmar contraseña</label><input style={inputStyle} type="password" placeholder="••••••••" value={form.confirm} onChange={e => set("confirm", e.target.value)} /></div>
          </div>

          {/* Términos */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
            <input type="checkbox" checked={form.terms} onChange={e => set("terms", e.target.checked)} style={{ marginTop: 2, accentColor: RC.accent, cursor: "pointer", flexShrink: 0, width: "auto" }} />
            <div style={{ fontSize: 11, color: RC.muted, lineHeight: 1.6 }}>
              Acepto los{" "}
              <span onClick={() => setModal("terminos")} style={{ color: RC.accent, fontWeight: 500, cursor: "pointer" }}>términos de uso</span>
              {" "}y la{" "}
              <span onClick={() => setModal("privacidad")} style={{ color: RC.accent, fontWeight: 500, cursor: "pointer" }}>política de privacidad</span>
              , incluyendo el tratamiento de datos sanitarios conforme al RGPD.
            </div>
          </div>

          <button onClick={() => navigate("/login")} style={{ width: "100%", background: RC.accent, color: RC.bone, border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope',sans-serif", marginBottom: 16 }}>
            Crear cuenta
          </button>

          <div style={{ textAlign: "center", fontSize: 12, color: RC.muted }}>
            ¿Ya tienes cuenta?{" "}
            <span onClick={() => navigate("/login")} style={{ color: RC.accent, fontWeight: 500, cursor: "pointer" }}>Iniciar sesión</span>
          </div>

        </div>

        {/* Trust */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
          {["🔒 RGPD compliant", "🇪🇺 Datos en Europa", "✦ 3 meses gratuitos"].map(t => (
            <div key={t} style={{ fontSize: 11, color: RC.muted }}>{t}</div>
          ))}
        </div>

      </div>
    </div>
  );
}

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
