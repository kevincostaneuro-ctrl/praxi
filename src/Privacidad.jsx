// Política de privacidad (lista de espera y web pública)
export const VERSION_PRIVACIDAD = "2026-10-22";
export const EMAIL_CONTACTO = "contacto.praxiclinic@gmail.com";

const C = {
  bg: "#F5EFE4", bone: "#FBF8F1", border: "#D9C9A8", accent: "#A66B3F",
  walnut: "#6B4A30", ink: "#221610", text: "#3B2A1E", muted: "#9A7E68",
};

const H = ({ children }) => (
  <h2 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 24, color: C.ink, margin: "36px 0 10px" }}>{children}</h2>
);
const P = ({ children }) => <p style={{ margin: "0 0 12px" }}>{children}</p>;
const Mail = () => <a href={`mailto:${EMAIL_CONTACTO}`} style={{ color: C.accent }}>{EMAIL_CONTACTO}</a>;

export default function Privacidad() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Manrope',sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px", fontSize: 15, lineHeight: 1.75 }}>
        <a href="/" style={{ fontSize: 13, color: C.accent, textDecoration: "none" }}>← Volver a Praxi</a>
        <h1 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 40, color: C.ink, margin: "20px 0 6px" }}>Política de privacidad</h1>
        <div style={{ fontSize: 13, color: C.muted }}>Última actualización: 22 de octubre de 2026</div>

        <H>1. Quién es el responsable</H>
        <P>El responsable del tratamiento de tus datos es <strong>Kevin Costa</strong>, titular del proyecto Praxi. Puedes escribirle para cualquier cuestión sobre tus datos a <Mail />.</P>

        <H>2. Qué datos recogemos</H>
        <P>Cuando te apuntas a la lista de espera recogemos tu <strong>nombre</strong>, tu <strong>email</strong> y tu <strong>profesión</strong>, además de la fecha en que diste tu consentimiento.</P>
        <P>No pedimos datos de salud ni de pacientes en este formulario.</P>

        <H>3. Para qué los usamos</H>
        <P>Para gestionar tu solicitud de acceso a Praxi: avisarte cuando tu acceso esté disponible y enviarte información relacionada con el lanzamiento de la aplicación. No los usamos para nada más.</P>

        <H>4. Por qué podemos tratarlos</H>
        <P>Porque nos das tu <strong>consentimiento</strong> al marcar la casilla del formulario (artículo 6.1.a del RGPD). Puedes retirarlo cuando quieras escribiendo a <Mail />, sin que afecte a lo que se hizo antes de retirarlo.</P>

        <H>5. Cuánto tiempo los guardamos</H>
        <P>Hasta que retires tu consentimiento o, como máximo, 12 meses después del lanzamiento de Praxi. Pasado ese plazo los eliminamos.</P>

        <H>6. Con quién los compartimos</H>
        <P>No vendemos ni cedemos tus datos a terceros. Para que el servicio funcione usamos estos proveedores, que tratan los datos por cuenta nuestra y solo siguiendo nuestras instrucciones:</P>
        <ul style={{ margin: "0 0 12px", paddingLeft: 22 }}>
          <li><strong>Supabase</strong>: base de datos donde se guarda la lista, alojada en Fráncfort (Unión Europea).</li>
          <li><strong>Brevo</strong>: envío de emails (empresa con sede en la Unión Europea).</li>
          <li><strong>Vercel</strong>: alojamiento de la página web.</li>
        </ul>
        <P>Si algún proveedor tratara datos fuera del Espacio Económico Europeo, se hará con las garantías que exige el RGPD.</P>

        <H>7. Tus derechos</H>
        <P>Puedes pedir en cualquier momento <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>, <strong>suprimirlos</strong>, <strong>oponerte</strong> a su tratamiento, <strong>limitarlo</strong> o solicitar su <strong>portabilidad</strong>. Escríbenos a <Mail /> indicando qué derecho quieres ejercer; te responderemos en el plazo máximo de un mes.</P>
        <P>Si crees que no hemos tratado bien tus datos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noreferrer" style={{ color: C.accent }}>www.aepd.es</a>).</P>

        <H>8. Seguridad</H>
        <P>Los datos se guardan cifrados y solo el responsable puede consultarlos. Nadie puede leer la lista de espera desde la web.</P>
      </div>
    </div>
  );
}
