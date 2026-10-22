// Páginas legales: Política de privacidad, Términos (con Contrato de encargo) y Aviso legal
import { useEffect } from "react";
import {
  TITULAR, NIF, DOMICILIO, EMAIL_CONTACTO, WEB, FECHA_TEXTOS,
  COPIAS_SEGURIDAD, SUBENCARGADOS, DATOS_LEGALES_COMPLETOS,
} from "./legal.js";

const C = {
  bg: "#F5EFE4", bone: "#FBF8F1", border: "#D9C9A8", accent: "#A66B3F",
  walnut: "#6B4A30", ink: "#221610", text: "#3B2A1E", muted: "#9A7E68",
};

const H = ({ children, id }) => (
  <h2 id={id} style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 24, color: C.ink, margin: "36px 0 10px", scrollMarginTop: 20 }}>{children}</h2>
);
const H3 = ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: "22px 0 6px" }}>{children}</h3>;
const P = ({ children }) => <p style={{ margin: "0 0 12px" }}>{children}</p>;
const L = ({ children }) => <ul style={{ margin: "0 0 12px", paddingLeft: 22 }}>{children}</ul>;
const A = ({ href, children }) => <a href={href} style={{ color: C.accent }}>{children}</a>;
const Mail = () => <A href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</A>;
const Titular = () => (
  <><strong>{TITULAR}</strong>{NIF ? `, con NIF ${NIF}` : ""}{DOMICILIO ? ` y domicilio en ${DOMICILIO}` : ""}</>
);

function PaginaLegal({ titulo, children }) {
  // Ir a la sección del enlace (#encargo, #medidas…) al abrir la página
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50);
    else window.scrollTo(0, 0);
  }, []);
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Manrope',sans-serif", color: C.text }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px", fontSize: 15, lineHeight: 1.75 }}>
        <a href="/" style={{ fontSize: 13, color: C.accent, textDecoration: "none" }}>← Volver a Praxi</a>
        <h1 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 40, color: C.ink, margin: "20px 0 6px", lineHeight: 1.15 }}>{titulo}</h1>
        <div style={{ fontSize: 13, color: C.muted }}>Última actualización: {FECHA_TEXTOS}</div>
        {children}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.muted, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <A href="/privacidad">Privacidad</A>
          <A href="/terminos">Términos y contrato de encargo</A>
          {DATOS_LEGALES_COMPLETOS && <A href="/aviso-legal">Aviso legal</A>}
          <Mail />
        </div>
      </div>
    </div>
  );
}

function TablaSubencargados() {
  const td = { padding: "10px 12px", borderBottom: `1px solid ${C.border}`, verticalAlign: "top", fontSize: 13.5 };
  return (
    <div style={{ overflowX: "auto", margin: "0 0 14px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: C.bone, borderRadius: 10 }}>
        <thead><tr>{["Proveedor", "Para qué", "Dónde", "Qué datos"].map(h => <th key={h} style={{ ...td, textAlign: "left", fontSize: 12, color: C.walnut, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>)}</tr></thead>
        <tbody>{SUBENCARGADOS.map(s => (
          <tr key={s.nombre}><td style={{ ...td, fontWeight: 700 }}>{s.nombre}</td><td style={td}>{s.servicio}</td><td style={td}>{s.ubicacion}</td><td style={td}>{s.datos}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// POLÍTICA DE PRIVACIDAD
// ═════════════════════════════════════════════════════════════════════════════
export function Privacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <H>1. Quién es el responsable</H>
      <P>El responsable de los datos descritos en esta política es <Titular />, titular de Praxi ({WEB}). Para cualquier cuestión sobre tus datos escribe a <Mail />.</P>

      <H>2. A quién se aplica</H>
      <L>
        <li><strong>Personas que se apuntan a la lista de espera</strong> o nos escriben.</li>
        <li><strong>Profesionales que usan la aplicación</strong> (administradores y miembros de una clínica).</li>
        <li><strong>Pacientes de las clínicas que usan Praxi.</strong> En este caso el responsable de tus datos es <strong>tu clínica o tu profesional</strong>, no Praxi: Praxi solo los guarda y gestiona por cuenta de la clínica, como <em>encargado del tratamiento</em>, según el <A href="/terminos#encargo">contrato de encargo</A>. Para ejercer tus derechos dirígete a tu clínica. Si nos escribes a nosotros, trasladaremos tu solicitud a la clínica sin demora.</li>
      </L>

      <H>3. Qué datos tratamos, para qué y por qué</H>
      <H3>Lista de espera</H3>
      <L>
        <li><strong>Datos:</strong> nombre, email, profesión y fecha del consentimiento.</li>
        <li><strong>Finalidad:</strong> gestionar tu solicitud de acceso y avisarte del lanzamiento de Praxi.</li>
        <li><strong>Base legal:</strong> tu consentimiento (art. 6.1.a RGPD), que puedes retirar cuando quieras.</li>
        <li><strong>Plazo:</strong> hasta que lo retires o, como máximo, 12 meses después del lanzamiento.</li>
      </L>
      <H3>Cuenta de usuario de la aplicación</H3>
      <L>
        <li><strong>Datos:</strong> nombre, email, especialidad, clínica a la que perteneces y tu rol. La contraseña se guarda cifrada de forma irreversible: nadie, tampoco Praxi, puede leerla.</li>
        <li><strong>Finalidad:</strong> darte acceso, prestar el servicio y enviarte los emails necesarios (confirmación de cuenta, recuperación de contraseña, invitaciones).</li>
        <li><strong>Base legal:</strong> la ejecución del contrato de servicio (art. 6.1.b RGPD).</li>
        <li><strong>Plazo:</strong> mientras tengas cuenta. Después se eliminan, salvo lo que debamos conservar por obligación legal.</li>
      </L>
      <H3>Registro de accesos</H3>
      <L>
        <li><strong>Datos:</strong> qué usuario consulta, crea, modifica o borra cada ficha o cita, y cuándo.</li>
        <li><strong>Finalidad:</strong> la seguridad de la información clínica y poder demostrar quién accedió a ella.</li>
        <li><strong>Base legal:</strong> el cumplimiento de las obligaciones de seguridad del RGPD (art. 6.1.c y art. 32) y el interés legítimo en proteger el servicio (art. 6.1.f).</li>
        <li><strong>Plazo:</strong> mientras exista la clínica en Praxi. Solo lo puede consultar el administrador de la clínica.</li>
      </L>
      <H3>Emails que nos envías</H3>
      <L>
        <li><strong>Datos:</strong> los que incluyas en tu mensaje. <strong>Finalidad:</strong> responderte. <strong>Base legal:</strong> tu solicitud y nuestro interés legítimo en atenderla. <strong>Plazo:</strong> el necesario para resolverla.</li>
      </L>

      <H>4. Con quién compartimos los datos</H>
      <P>No vendemos ni cedemos datos a terceros. Usamos estos proveedores, que los tratan por cuenta nuestra, con contrato y solo siguiendo nuestras instrucciones:</P>
      <TablaSubencargados />
      <P>Solo comunicaremos datos a autoridades cuando una ley nos obligue.</P>

      <H>5. Transferencias fuera de la Unión Europea</H>
      <P>Los datos de la aplicación se guardan en la Unión Europea. Algunos proveedores son empresas con sede en EE. UU.; cuando puedan acceder a datos desde fuera del Espacio Económico Europeo, lo hacen con las garantías del capítulo V del RGPD (cláusulas contractuales tipo de la Comisión Europea o el Marco de Privacidad de Datos UE-EE. UU., según el proveedor).</P>

      <H>6. Tus derechos</H>
      <P>Puedes pedir <strong>acceso</strong>, <strong>rectificación</strong>, <strong>supresión</strong>, <strong>oposición</strong>, <strong>limitación</strong> y <strong>portabilidad</strong> de tus datos, y retirar tu consentimiento cuando quieras, escribiendo a <Mail />. Responderemos en un mes como máximo. Si no estás de acuerdo con nuestra respuesta, puedes reclamar ante la Agencia Española de Protección de Datos (<A href="https://www.aepd.es">www.aepd.es</A>).</P>

      <H>7. Cookies y almacenamiento en el navegador</H>
      <P>No usamos cookies de análisis ni de publicidad. La aplicación solo guarda en tu navegador la información técnica imprescindible para mantener tu sesión iniciada, que no requiere consentimiento. Las fuentes tipográficas se sirven desde nuestro propio dominio.</P>

      <H>8. Seguridad</H>
      <P>Aplicamos las medidas descritas en el <A href="/terminos#medidas">Anexo II de los Términos</A>: alojamiento en la UE, cifrado, control de acceso por roles aplicado por la propia base de datos, separación total entre clínicas y registro de accesos.</P>

      <H>9. Cambios</H>
      <P>Si cambiamos esta política lo indicaremos con una nueva fecha de actualización y, si el cambio es relevante, te avisaremos por email o dentro de la aplicación.</P>
    </PaginaLegal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TÉRMINOS DEL SERVICIO + ANEXOS (contrato de encargo, medidas, subencargados)
// ═════════════════════════════════════════════════════════════════════════════
export function Terminos() {
  return (
    <PaginaLegal titulo="Términos del servicio y contrato de encargo del tratamiento">
      <P>Estos términos regulan el uso de Praxi por parte de profesionales sanitarios y clínicas (el <strong>Cliente</strong>). Quien crea una clínica en Praxi los acepta en nombre propio o de la entidad que representa, y con ellos el <A href="#encargo">contrato de encargo del tratamiento</A> del Anexo I. Praxi es un servicio para profesionales; no está dirigido a consumidores.</P>
      <P><strong>Índice:</strong> <A href="#t1">Términos</A> · <A href="#encargo">Anexo I. Contrato de encargo</A> · <A href="#medidas">Anexo II. Medidas de seguridad</A> · <A href="#subencargados">Anexo III. Subencargados</A></P>

      <H id="t1">1. Quién presta el servicio</H>
      <P>Praxi es un software de gestión clínica en la nube ofrecido por <Titular />, contacto <Mail /> (en adelante, <strong>Praxi</strong>).</P>

      <H>2. Acceso anticipado</H>
      <P>Praxi está en fase de <strong>acceso anticipado</strong>. Durante esta fase:</P>
      <L>
        <li>El acceso es gratuito y solo con código o invitación.</li>
        <li>Las funciones pueden cambiar, fallar o interrumpirse, y el servicio puede finalizar avisando con 30 días de antelación.</li>
        <li>{COPIAS_SEGURIDAD ? "Se realizan copias de seguridad diarias." : <><strong>No hay copias de seguridad automáticas.</strong> Los datos borrados o perdidos no se pueden recuperar.</>}</li>
        <li><strong>El Cliente se compromete a no introducir datos reales de pacientes</strong> y a usar solo datos ficticios, salvo que Praxi le confirme por escrito que su cuenta está habilitada para uso con datos reales.</li>
      </L>

      <H>3. Cuenta, equipo y credenciales</H>
      <P>Quien crea la clínica es su <strong>administrador</strong>: puede invitar y desactivar miembros, asignar pacientes y borrar la clínica. El Cliente responde del uso que hagan los miembros que invite. Cada persona tiene credenciales personales e intransferibles y debe avisar a Praxi en cuanto sospeche un uso indebido.</P>

      <H>4. Obligaciones del Cliente</H>
      <L>
        <li>Usar Praxi de forma lícita y conforme a su deontología profesional.</li>
        <li>Respecto a los datos de sus pacientes, el Cliente es el <strong>responsable del tratamiento</strong>: le corresponde tener una base legal para tratarlos, informar a los pacientes, recabar los consentimientos necesarios y atender sus derechos.</li>
        <li>Cumplir las obligaciones de conservación de la historia clínica (Ley 41/2002). Antes de borrar pacientes o la clínica, el Cliente debe exportar lo que tenga obligación de conservar.</li>
        <li>No usar Praxi para fines distintos a la gestión de su actividad profesional.</li>
      </L>

      <H>5. Precio</H>
      <P>Durante el acceso anticipado el servicio es gratuito. Cuando haya planes de pago, sus precios se publicarán en la web y se avisará al Cliente con al menos 30 días de antelación. El Cliente podrá entonces contratar un plan o darse de baja.</P>

      <H>6. Disponibilidad</H>
      <P>Praxi pondrá medios razonables para que el servicio funcione de forma continua, pero no garantiza una disponibilidad determinada, especialmente durante el acceso anticipado.</P>

      <H>7. Propiedad</H>
      <P>El software, la marca y el diseño de Praxi pertenecen a su titular. <strong>Los datos que introduce el Cliente son del Cliente</strong>: Praxi no adquiere ningún derecho sobre ellos y solo los trata para prestar el servicio.</P>

      <H>8. Responsabilidad</H>
      <P>Praxi no responde de los daños indirectos ni del lucro cesante, ni de los derivados de un uso contrario a estos términos. Salvo dolo o culpa grave, su responsabilidad total frente al Cliente se limita a lo que este haya pagado por el servicio en los 12 meses anteriores. Nada de lo anterior limita las responsabilidades que la normativa de protección de datos atribuye a cada parte.</P>

      <H>9. Duración y baja</H>
      <P>El contrato dura mientras la clínica exista en Praxi. El administrador puede <strong>exportar todos los datos</strong> y <strong>borrar la clínica</strong> en cualquier momento desde el menú Equipo; al borrarla se eliminan de forma inmediata todos sus datos{COPIAS_SEGURIDAD ? ", y las copias de seguridad desaparecen en su ciclo ordinario (máximo 7 días)" : ""}. Praxi puede suspender una cuenta que incumpla gravemente estos términos, avisando antes salvo urgencia.</P>

      <H>10. Cambios en estos términos</H>
      <P>Si se modifican, se avisará al Cliente por email o dentro de la aplicación. Los cambios relevantes, especialmente en el contrato de encargo, requerirán una nueva aceptación.</P>

      <H>11. Ley aplicable</H>
      <P>Estos términos se rigen por la ley española. Para cualquier conflicto, las partes se someten a los juzgados y tribunales del domicilio del titular de Praxi.</P>

      {/* ── ANEXO I ── */}
      <H id="encargo">Anexo I. Contrato de encargo del tratamiento (art. 28 RGPD)</H>
      <P><strong>Partes:</strong> el Cliente, como <strong>responsable del tratamiento</strong>, y Praxi (<Titular />), como <strong>encargado del tratamiento</strong>. Este contrato se acepta al crear la clínica y queda registrada la fecha y la versión aceptada.</P>

      <H3>1. Objeto</H3>
      <P>Praxi tratará por cuenta del Cliente los datos personales necesarios para prestar el servicio de gestión clínica: almacenamiento, consulta, modificación, organización y supresión de la información que el Cliente y su equipo introduzcan en la aplicación.</P>
      <H3>2. Duración</H3>
      <P>Mientras el Cliente tenga su clínica en Praxi. Al terminar se aplica la cláusula 9.</P>
      <H3>3. Naturaleza y finalidad</H3>
      <P>Gestión de la actividad clínica del Cliente: pacientes, historia clínica, sesiones y evolución, agenda, documentación y facturación. Praxi no trata los datos para ninguna finalidad propia.</P>
      <H3>4. Datos y personas afectadas</H3>
      <L>
        <li><strong>Pacientes:</strong> datos identificativos y de contacto, datos de salud (historia clínica, notas de sesión, evaluaciones, informes, documentos), datos económicos de las sesiones y facturación.</li>
        <li><strong>Profesionales del Cliente:</strong> nombre, email, especialidad, rol y registro de accesos.</li>
        <li>Los datos de salud son una <strong>categoría especial</strong> (art. 9 RGPD).</li>
      </L>
      <H3>5. Obligaciones de Praxi como encargado</H3>
      <L>
        <li>Tratar los datos solo siguiendo las instrucciones documentadas del Cliente, que son estos términos y el uso que el Cliente haga de la aplicación. Si una instrucción infringiera la normativa, Praxi lo comunicará al Cliente.</li>
        <li>No utilizarlos para fines propios ni comunicarlos a terceros, salvo a los subencargados del Anexo III o por obligación legal.</li>
        <li>Garantizar que las personas autorizadas a tratar los datos se han comprometido a la confidencialidad.</li>
        <li>Aplicar las medidas de seguridad del Anexo II (art. 32 RGPD).</li>
        <li>Llevar el registro de actividades de tratamiento como encargado (art. 30.2 RGPD).</li>
        <li>Ayudar al Cliente a atender los derechos de los pacientes y a cumplir sus obligaciones de seguridad, evaluación de impacto y consulta previa (arts. 32 a 36 RGPD).</li>
        <li>Poner a disposición del Cliente la información necesaria para demostrar el cumplimiento de este contrato y permitir auditorías razonables, con preaviso y a cargo del Cliente.</li>
      </L>
      <H3>6. Subencargados</H3>
      <P>El Cliente autoriza a Praxi a recurrir a los subencargados del Anexo III. Praxi le informará por email de cualquier alta o sustitución con al menos 15 días de antelación; si el Cliente se opone, podrá darse de baja. Praxi impone a los subencargados las mismas obligaciones de protección de datos y responde frente al Cliente de su cumplimiento.</P>
      <H3>7. Violaciones de seguridad</H3>
      <P>Praxi notificará al Cliente cualquier violación de la seguridad que afecte a sus datos <strong>sin dilación indebida y como máximo en 48 horas</strong> desde que tenga conocimiento, con la información del art. 33.3 RGPD de que disponga, para que el Cliente pueda notificarla a la AEPD en 72 horas y, en su caso, a los pacientes.</P>
      <H3>8. Derechos de los pacientes</H3>
      <P>Si un paciente dirige una solicitud a Praxi, Praxi la trasladará al Cliente sin demora y no la contestará por su cuenta. La aplicación permite al Cliente consultar, rectificar, exportar y suprimir los datos de cada paciente.</P>
      <H3>9. Fin del encargo</H3>
      <P>Al terminar, el Cliente puede <strong>exportar sus datos</strong> desde la aplicación. Al borrar la clínica, Praxi suprime todos los datos de forma inmediata{COPIAS_SEGURIDAD ? " y las copias de seguridad desaparecen en un máximo de 7 días" : ""}, sin conservar copia, salvo obligación legal.</P>
      <H3>10. Obligaciones del Cliente como responsable</H3>
      <P>Disponer de base legal para tratar los datos de sus pacientes, informarles, recabar los consentimientos que procedan, realizar la evaluación de impacto si es necesaria y supervisar el tratamiento.</P>

      {/* ── ANEXO II ── */}
      <H id="medidas">Anexo II. Medidas de seguridad</H>
      <L>
        <li><strong>Ubicación:</strong> base de datos en servidores de la Unión Europea (Fráncfort).</li>
        <li><strong>Cifrado:</strong> todas las conexiones usan HTTPS/TLS y los datos se guardan cifrados en el servidor.</li>
        <li><strong>Contraseñas:</strong> se almacenan con un algoritmo de hash irreversible; nadie puede leerlas.</li>
        <li><strong>Control de acceso:</strong> las reglas de acceso las aplica la propia base de datos, no solo la pantalla. Cada clínica solo puede acceder a sus datos. Cada profesional solo a los pacientes que tiene asignados; el administrador, a todos los de su clínica.</li>
        <li><strong>Altas y bajas:</strong> los miembros solo entran por invitación nominativa, que caduca en 7 días y solo vale para el email invitado. El administrador puede desactivar a un miembro y su acceso se corta al momento.</li>
        <li><strong>Registro de accesos:</strong> queda registrado quién consulta, crea, modifica o borra cada ficha y cita, y cuándo. Nadie puede modificarlo ni borrarlo desde la aplicación.</li>
        <li><strong>Copias de seguridad:</strong> {COPIAS_SEGURIDAD ? "diarias, conservadas 7 días." : "no disponibles durante el acceso anticipado; se activarán antes del uso con datos reales."}</li>
        <li><strong>Mínimo privilegio:</strong> los datos clínicos no se envían a servicios de análisis, publicidad ni inteligencia artificial.</li>
      </L>

      {/* ── ANEXO III ── */}
      <H id="subencargados">Anexo III. Subencargados</H>
      <TablaSubencargados />
      <P>Las transferencias fuera del Espacio Económico Europeo, cuando las haya, se realizan con las garantías del capítulo V del RGPD.</P>
    </PaginaLegal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AVISO LEGAL (LSSI art. 10)
// ═════════════════════════════════════════════════════════════════════════════
export function AvisoLegal() {
  const pendiente = <em style={{ color: C.muted }}>pendiente</em>;
  return (
    <PaginaLegal titulo="Aviso legal">
      <H>Titular del sitio web</H>
      <L>
        <li><strong>Titular:</strong> {TITULAR}</li>
        <li><strong>NIF:</strong> {NIF || pendiente}</li>
        <li><strong>Domicilio:</strong> {DOMICILIO || pendiente}</li>
        <li><strong>Email:</strong> <Mail /></li>
        <li><strong>Sitio web:</strong> {WEB}</li>
        <li><strong>Actividad:</strong> desarrollo y comercialización de software de gestión clínica para profesionales sanitarios.</li>
      </L>
      <H>Condiciones de uso de la web</H>
      <P>El acceso a esta web es gratuito e implica aceptar este aviso legal. El uso de la aplicación se rige por los <A href="/terminos">Términos del servicio</A> y el tratamiento de datos por la <A href="/privacidad">Política de privacidad</A>.</P>
      <H>Propiedad intelectual</H>
      <P>Los textos, el diseño, la marca, el logotipo y el software de Praxi pertenecen a su titular. No se pueden reproducir ni distribuir sin autorización.</P>
      <H>Responsabilidad</H>
      <P>El titular procura que la información de la web sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni responde del uso que se haga de ella.</P>
      <H>Ley aplicable</H>
      <P>Este aviso legal se rige por la ley española.</P>
    </PaginaLegal>
  );
}
