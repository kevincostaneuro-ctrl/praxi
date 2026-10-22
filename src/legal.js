// ═════════════════════════════════════════════════════════════════════════════
// DATOS LEGALES DE PRAXI — un único sitio para cambiarlos.
// Cuando rellenes NIF y DOMICILIO, el aviso legal aparecerá en el pie de la web.
// ═════════════════════════════════════════════════════════════════════════════
export const TITULAR = "Kevin Costa";
export const NIF = "";          // RELLENAR: tu NIF (al darte de alta como autónomo)
export const DOMICILIO = "";    // RELLENAR: dirección postal completa (calle, CP, ciudad)
export const EMAIL_CONTACTO = "contacto.praxiclinic@gmail.com";
export const WEB = "www.praxiclinic.com";

// Cambia la versión cada vez que modifiques el texto correspondiente
export const VERSION_PRIVACIDAD = "2026-10-22";
export const VERSION_TERMINOS = "2026-10-22";
export const FECHA_TEXTOS = "22 de octubre de 2026";

// Ponlo a true cuando contrates el plan Pro de Supabase (copias diarias)
export const COPIAS_SEGURIDAD = false;

export const DATOS_LEGALES_COMPLETOS = Boolean(NIF && DOMICILIO);

// Proveedores que tratan datos por cuenta de Praxi (subencargados)
export const SUBENCARGADOS = [
  {
    nombre: "Supabase, Inc.",
    servicio: "Base de datos, autenticación de usuarios y almacenamiento de toda la información clínica",
    ubicacion: "Servidores en Fráncfort (Alemania, UE). Empresa con sede en EE. UU.",
    datos: "Todos los datos de la aplicación",
  },
  {
    nombre: "Vercel, Inc.",
    servicio: "Alojamiento y entrega de la página web y de la aplicación",
    ubicacion: "Red global; empresa con sede en EE. UU.",
    datos: "Datos técnicos de conexión (dirección IP, navegador). Las consultas al asistente IA pasan por su servidor sin guardarse",
  },
  {
    nombre: "Sendinblue SAS (Brevo)",
    servicio: "Envío de emails del servicio (confirmación de cuenta, recuperación de contraseña, invitaciones, avisos)",
    ubicacion: "Francia (UE)",
    datos: "Nombre y email de usuarios y de personas en la lista de espera. No recibe datos clínicos",
  },
  {
    nombre: "Anthropic, PBC",
    servicio: "Asistente IA: genera las respuestas cuando un profesional lo usa",
    ubicacion: "EE. UU.",
    datos: "Solo cuando el profesional usa el asistente: el contenido clínico de la ficha consultada (o los datos de facturación), con el nombre y apellidos sustituidos por un alias y la edad en lugar de la fecha de nacimiento",
  },
];
