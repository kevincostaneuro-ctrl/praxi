import { MONTHS_ES, WORK_END, WORK_START, pad } from "./constantes.js";

// La app nunca habla directamente con Anthropic: llama a /api/ia (servidor de
// Vercel, donde está la clave) y antes sustituye los nombres de los pacientes
// por alias ("Paciente 1"…), que se deshacen al recibir la respuesta.
export const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
export const edadDe=f=>{if(!f)return null;const d=new Date(f);if(isNaN(d))return null;const h=new Date();let e=h.getFullYear()-d.getFullYear();if(h<new Date(h.getFullYear(),d.getMonth(),d.getDate()))e--;return e;};
export const hourLabel = h=>`${pad(h)}:00`;
export const toYMD = d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const today = ()=>new Date();
export const addDays = (d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
export const startOfWeek = d=>{const r=new Date(d);const day=r.getDay();r.setDate(r.getDate()+(day===0?-6:1-day));return r;};
export const diasEntre=(a,b)=>Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);
export const capit=s=>s.charAt(0).toUpperCase()+s.slice(1);
// "Hoy", "Mañana", "Ayer" o "Sábado 24"
export const etiquetaDia=d=>{const n=diasEntre(today(),d);if(n===0)return"Hoy";if(n===1)return"Mañana";if(n===-1)return"Ayer";return capit(d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric"}));};
export const etiquetaSemana=d=>{const n=Math.round(diasEntre(startOfWeek(today()),startOfWeek(d))/7);if(n===0)return"Esta semana";if(n===1)return"Siguiente";if(n===-1)return"Anterior";return n>0?`Dentro de ${n} semanas`:`Hace ${-n} semanas`;};
export const etiquetaMes=d=>{const t=today();const n=(d.getFullYear()-t.getFullYear())*12+d.getMonth()-t.getMonth();if(n===0)return"Este mes";if(n===1)return"Siguiente";if(n===-1)return"Anterior";return MONTHS_ES[d.getMonth()];};
export const fechaDe=s=>{const[y,m,dd]=s.split("-").map(Number);return new Date(y,m-1,dd);};
export const timeToMins = t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
export const minsToTime = m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
export async function postMake(url,data){if(!url)return{ok:false};try{await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});return{ok:true};}catch{return{ok:false};}}
export function getFreeSlots(dateStr,citas){
  const occ=citas.filter(c=>c.fecha===dateStr).map(c=>({s:timeToMins(c.hora),e:timeToMins(c.hora)+c.duracion}));
  const free=[];
  for(let t=WORK_START*60;t+30<=WORK_END*60;t+=30){if(!occ.some(o=>t<o.e&&t+30>o.s))free.push(minsToTime(t));}
  return free;
}
// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
// ── Pantallas de acceso (Supabase Auth) ───────────────────────────────────────
export const leerInvitacion=()=>{
  try{
    const t=new URLSearchParams(window.location.search).get("inv");
    if(t){localStorage.setItem("praxi_inv",t);return t;}
    return localStorage.getItem("praxi_inv")||null;
  }catch{return null;}
};
export const olvidarInvitacion=()=>{try{localStorage.removeItem("praxi_inv");}catch{}};
export const traducirError=e=>{
  const m=(e?.message||String(e||"")).toLowerCase();
  if(m.includes("invalid login"))return "Email o contraseña incorrectos.";
  if(m.includes("email not confirmed"))return "Todavía no has confirmado tu email. Revisa tu bandeja de entrada (y spam).";
  if(m.includes("already registered")||m.includes("already been registered"))return "Ya existe una cuenta con ese email. Inicia sesión.";
  if(m.includes("password should be")||m.includes("at least"))return "La contraseña debe tener al menos 8 caracteres.";
  if(m.includes("rate limit")||m.includes("security purposes"))return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  if(m.includes("otro email"))return "Esta invitación es para otro email. Entra con el email al que te invitaron.";
  if(m.includes("no válida")||m.includes("caducada"))return "La invitación no es válida o ha caducado. Pide una nueva al administrador.";
  if(m.includes("ya pertenece"))return "Tu cuenta ya pertenece a una clínica.";
  if(m.includes("aceptar los términos"))return "Para crear la clínica tienes que aceptar los Términos y el Contrato de encargo.";
  if(m.includes("código de acceso"))return "El código de acceso no es válido o ya se ha usado todas las veces permitidas.";
  if(m.includes("guardar_mis_datos_facturacion")||m.includes("datos_facturacion"))return "Falta preparar la base de datos: ejecuta supabase/07_datos_facturacion.sql en Supabase.";
  if(m.includes("guardar_mi_enlace")||m.includes("enlace_videollamada"))return "Falta preparar la base de datos: ejecuta supabase/06_videollamada.sql en Supabase.";
  if(m.includes("debe empezar por https"))return "El enlace debe empezar por https://";
  if(m.includes("failed to fetch")||m.includes("network"))return "No hay conexión con el servidor. Revisa tu internet.";
  return e?.message||"Ha ocurrido un error.";
};

// WhatsApp: número en formato internacional (sin +). Móviles españoles de 9 cifras → 34…
export const telWhatsApp=t=>{let d=String(t||"").replace(/[^\d+]/g,"");if(d.startsWith("+"))return d.slice(1);if(d.startsWith("00"))return d.slice(2);if(d.length===9)return"34"+d;return d;};
export const mensajeCita=(nombre,fecha,hora,enlace)=>{
  const dia=fecha?fechaDe(fecha).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).replace(",",""):"";
  return `Hola ${(nombre||"").split(" ")[0]}, te confirmo tu sesión del ${dia} a las ${hora}.`+(enlace?`\n\nEnlace para la videollamada: ${enlace}`:"")+`\n\nSi necesitas cambiarla, avísame. Un saludo.`;
};
export const fechaES=f=>{if(!f)return"";const[y,m,d]=f.split("-");return`${d}/${m}/${y}`;};
export const eur2=n=>`${(Math.round((Number(n)||0)*100)/100).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
