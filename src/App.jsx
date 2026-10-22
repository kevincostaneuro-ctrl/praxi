import { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { supabase, leerTodo, sincronizar } from "./supabase.js";
import { RECURSOS } from "./recursos";
import { VERSION_TERMINOS } from "./legal.js";
// ── Asistente IA ─────────────────────────────────────────────────────────────
// Oculto hasta configurar la clave de Anthropic en Vercel. Para activarlo: true.
const IA_VISIBLE = false;
// La app nunca habla directamente con Anthropic: llama a /api/ia (servidor de
// Vercel, donde está la clave) y antes sustituye los nombres de los pacientes
// por alias ("Paciente 1"…), que se deshacen al recibir la respuesta.
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function crearSeudonimos(pares){
  const nombresRepetidos=new Set();
  const vistos=new Set();
  pares.forEach(p=>{const n=(p.nombre||"").trim().toLowerCase();if(vistos.has(n))nombresRepetidos.add(n);vistos.add(n);});
  const reemplazos=[];
  pares.forEach(({nombre,apellidos,alias})=>{
    const n=(nombre||"").trim(),a=(apellidos||"").trim(),full=`${n} ${a}`.trim();
    if(full.length>=3)reemplazos.push([full,alias]);
    if(a.length>=3)reemplazos.push([a,alias]);
    if(n.length>=3)reemplazos.push([n,nombresRepetidos.has(n.toLowerCase())?"[paciente]":alias]);
  });
  reemplazos.sort((x,y)=>y[0].length-x[0].length);
  const enmascarar=txt=>reemplazos.reduce((s,[t,al])=>s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escRe(t)}(?![\\p{L}\\p{N}])`,"giu"),al),txt||"");
  const vuelta=pares.map(p=>[p.alias,`${p.nombre||""} ${p.apellidos||""}`.trim()]).sort((x,y)=>y[0].length-x[0].length);
  const desenmascarar=txt=>vuelta.reduce((s,[al,n])=>s.split(al).join(n),txt||"");
  return{enmascarar,desenmascarar};
}
async function enviarIA({system,messages,seud}){
  const{data}=await supabase.auth.getSession();
  const token=data.session?.access_token;
  if(!token)throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  let r;
  try{
    r=await fetch("/api/ia",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
      body:JSON.stringify({system:seud.enmascarar(system),messages:messages.map(m=>({role:m.role,content:seud.enmascarar(m.content)}))})});
  }catch{throw new Error("No se ha podido conectar con el asistente. Revisa tu conexión.");}
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"El asistente no ha podido responder.");
  return seud.desenmascarar(j.texto);
}
const edadDe=f=>{if(!f)return null;const d=new Date(f);if(isNaN(d))return null;const h=new Date();let e=h.getFullYear()-d.getFullYear();if(h<new Date(h.getFullYear(),d.getMonth(),d.getDate()))e--;return e;};
const DemoCtx=createContext(false);
// Equipo: quién soy, si soy admin y los miembros de la clínica
const EquipoCtx=createContext({esAdmin:true,miembros:[],miId:null,registrarVista:()=>{}});

const PRAXI_LOGO="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATwAAAB2CAYAAABVsS+4AAAWfmNhQlgAABZ+anVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAFlhqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOjk3MDcyNzY0LWQ5MTItNDgxNS04NWIxLWZmZmEyZDEzZmI2YgAAAAOTanVtYgAAAClqdW1kYzJhcwARABCAAACqADibcQNjMnBhLmFzc2VydGlvbnMAAAAAuGp1bWIAAABEanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5pbmdyZWRpZW50LnYzAAAAABhjMnNodm2EDQbAWyJEphhpr9wNWQAAAGxjYm9yo2lkYzpmb3JtYXRpaW1hZ2UvcG5namluc3RhbmNlSUR4LHhtcDppaWQ6ZDJiMDg2ZjUtOTYxYy00YTc5LWI2MTYtNDY5YzEzNmFlOTA2bHJlbGF0aW9uc2hpcGhwYXJlbnRPZgAAAeJqdW1iAAAAQWp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuYWN0aW9ucy52MgAAAAAYYzJzaFJlJpPkAZPn9JcsJ67IxxoAAAGZY2JvcqJnYWN0aW9uc4KiZmFjdGlvbmtjMnBhLm9wZW5lZGpwYXJhbWV0ZXJzoWtpbmdyZWRpZW50c4GiY3VybHgtc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5pbmdyZWRpZW50LnYzZGhhc2hYILXaPaSAuJCQ1WTi+7TCkaDUgS4sQQalFvnE8b+Zo5QxpGZhY3Rpb254HWNvbS5hbnRocm9waWMuY2xhdWRlLnByb3ZpZGVkanBhcmFtZXRlcnOheB9jb20uYW50aHJvcGljLm9yaWdpbi1jb25maWRlbmNlZ3Vua25vd25rZGVzY3JpcHRpb254ZkNsYXVkZSBwcm92aWRlZCB0aGlzIGZpbGUgYXQgdGhlIHJlcXVlc3Qgb2YgYSB1c2VyIGFuZCBtYXkgaGF2ZSBjcmVhdGVkIG9yIG1vZGlmaWVkIHRoZSBmaWxlIGNvbnRlbnRzLm1zb2Z0d2FyZUFnZW50oWRuYW1lZkNsYXVkZXJhbGxBY3Rpb25zSW5jbHVkZWT1AAAAyGp1bWIAAABAanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5oYXNoLmRhdGEAAAAAGGMyc2gja813DQTaZ4aJmNqAP78jAAAAgGNib3KlY2FsZ2ZzaGEyNTZjcGFkTQAAAAAAAAAAAAAAAABkaGFzaFggZ4zxoi3wWvcJQGb7b4KBskCVjqpuHu49473ZGfSD1cVkbmFtZW5qdW1iZiBtYW5pZmVzdGpleGNsdXNpb25zgaJlc3RhcnQYIWZsZW5ndGgZFooAAAI+anVtYgAAACdqdW1kYzJjbAARABCAAACqADibcQNjMnBhLmNsYWltLnYyAAAAAg9jYm9ypWNhbGdmc2hhMjU2aXNpZ25hdHVyZXhNc2VsZiNqdW1iZj0vYzJwYS91cm46YzJwYTo5NzA3Mjc2NC1kOTEyLTQ4MTUtODViMS1mZmZhMmQxM2ZiNmIvYzJwYS5zaWduYXR1cmVqaW5zdGFuY2VJRHgseG1wOmlpZDoyYzEzODMwYi0wNmI4LTRiNTAtYmI0Yi03YWViMjFkODdlNjJyY3JlYXRlZF9hc3NlcnRpb25zg6JjdXJseC1zZWxmI2p1bWJmPWMycGEuYXNzZXJ0aW9ucy9jMnBhLmluZ3JlZGllbnQudjNkaGFzaFggtdo9pIC4kJDVZOL7tMKRoNSBLixBBqUW+cTxv5mjlDGiY3VybHgqc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5hY3Rpb25zLnYyZGhhc2hYINlbdVgZyIdwhgMoOp0vufUYAcgQA+f6eUtWloD8iD5WomN1cmx4KXNlbGYjanVtYmY9YzJwYS5hc3NlcnRpb25zL2MycGEuaGFzaC5kYXRhZGhhc2hYIJqflx0PdlCz9uKjS6yWHcGwB/VmIHBgu8X0guqLjojSdGNsYWltX2dlbmVyYXRvcl9pbmZvo2RuYW1lb0FudGhyb3BpYyBGaWxlc2d2ZXJzaW9uZTEuMC4wa3NwZWNWZXJzaW9uZTIuNC4wAAAQOGp1bWIAAAAoanVtZGMyY3MAEQAQgAAAqgA4m3EDYzJwYS5zaWduYXR1cmUAAAAQCGNib3LShFkCEqIBJhghWQIKMIICBjCCAY2gAwIBAgIUQOWgCu7COdC+uIP6BkIFPWdVEwAwCgYIKoZIzj0EAwMwSTEXMBUGA1UEChMOQW50aHJvcGljLCBQQkMxLjAsBgNVBAMTJUFudGhyb3BpYyBDb250ZW50IENyZWRlbnRpYWxzIFJvb3QgQ0EwHhcNMjYwODA3MTg0MzU2WhcNMjgwODA2MTk0MzU2WjBEMRcwFQYDVQQKEw5BbnRocm9waWMsIFBCQzEpMCcGA1UEAxMgQW50aHJvcGljIENsYXVkZSBDb250ZW50IFNpZ25pbmcwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASYegpry1AYBRTVNL1CpTlbROnY3dey+UrsF9C3phYrATN3ZHf93Mo8RQN0KOUuOn19P4oWNFWe5n2/She9N7eTo1gwVjAOBgNVHQ8BAf8EBAMCB4AwFQYDVR0lBA4wDAYKKwYBBAGD6F4CATAMBgNVHRMBAf8EAjAAMB8GA1UdIwQYMBaAFM5R4gSBTmRbI/jjxM+aPpzB11zCMAoGCCqGSM49BAMDA2cAMGQCMDFzHRSeAXrSy1WOzkbhPZ6Km2wGTmZ/2gK18k8BQGXyqz88Rdrz6CTX9flAnYNVxgIwcF9c3fVhqmJKpi+UhasNUMko69cyX6STPfta3Q8EjyzDjzoyrol46FP6VFHhvUcJoWNwYWRZDZ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
// ── DATOS DE LA DEMO PÚBLICA (/demo) ─────────────────────────────────────────
// La app real (/app) carga clínica, equipo y pacientes desde Supabase.
const INITIAL_CLINICA={id:"c1",nombre:"Clínica Praxi (demo)"};

const INITIAL_PROFESIONALES=[
  {id:"u1",nombre:"Profesional demo",email:"demo@praxiclinic.com",
   especialidad:"Psicología clínica",color:"#A66B3F",rol:"admin",activo:true,enlace_videollamada:"https://meet.google.com/abc-defg-hij"},
  {id:"u2",nombre:"María López",email:"maria@ejemplo.com",
   especialidad:"Psicología Clínica",color:"#6B8C5A",rol:"profesional",activo:true,enlace_videollamada:"https://zoom.us/j/1234567890"},
];

const CLINICA_STORE=INITIAL_CLINICA;
const WORK_START = 8, WORK_END = 20;
const HOURS = Array.from({ length: WORK_END - WORK_START }, (_, i) => WORK_START + i);
const HALF_HOURS = HOURS.flatMap(h => [`${pad(h)}:00`, `${pad(h)}:30`]);
const DAYS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const NOTE_TEMPLATES = [
  { label: "SOAP", text: "S (Subjetivo): \nO (Objetivo): \nA (Análisis): \nP (Plan): " },
  { label: "TCC", text: "Situación activadora: \nPensamientos automáticos: \nEmociones: \nConductas: \nReestructuración: " },
  { label: "Seguimiento", text: "Estado general: \nTemas trabajados: \nTécnicas utilizadas: \nTareas para casa: \nPróximos objetivos: " },
  { label: "Libre", text: "" },
];
const DEFAULT_CONSENT = `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO PSICOLÓGICO

Yo, [NOMBRE DEL PACIENTE], con DNI _________________, declaro haber sido informado/a de:

1. LA NATURALEZA DEL TRATAMIENTO
   El tratamiento psicológico consiste en intervenciones basadas en evidencia científica orientadas a mejorar el bienestar emocional y psicológico del paciente.

2. VOLUNTARIEDAD
   La participación en el tratamiento es completamente voluntaria. El paciente puede interrumpirlo en cualquier momento sin que ello suponga perjuicio alguno.

3. CONFIDENCIALIDAD
   Toda la información compartida durante las sesiones es estrictamente confidencial y está protegida por el secreto profesional, salvo en los casos en que la ley obligue a su revelación (riesgo grave para el paciente u otras personas).

4. PROTECCIÓN DE DATOS
   Los datos personales serán tratados conforme al Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018. Serán utilizados exclusivamente para la gestión del tratamiento.

5. FORMATO DE LAS SESIONES
   Las sesiones se realizarán en formato online a través de plataformas seguras (Zoom). Cada sesión tendrá una duración de 60 minutos con frecuencia semanal o según acuerdo.

6. HONORARIOS
   El coste por sesión es de ___ €. El pago se realizará según las condiciones acordadas. La cancelación deberá comunicarse con al menos 24 horas de antelación.

7. DERECHOS DEL PACIENTE
   El paciente tiene derecho a acceder, rectificar o suprimir sus datos, así como a solicitar un informe de alta en cualquier momento.

Habiendo leído y comprendido la información anterior, PRESTO MI CONSENTIMIENTO para el inicio del proceso terapéutico.

Fecha: _________________ Firma: _________________`;

const C = {
  // Canvas & surfaces
  bg:"#F5EFE4",       // --canvas
  card:"#EBE3D2",     // --canvas-2
  bone:"#FBF8F1",     // --bone (modals)
  sand:"#D9C9A8",     // --sand (borders, decorative)
  // Brand
  accent:"#A66B3F",   // --terracotta (CTA, focal)
  aL:"#C4895A",       // terracotta light
  aD:"#7A4E2D",       // terracotta dark (hover)
  clay:"#B89271",     // --clay (secondary buttons, dividers)
  clayD:"#9A7558",    // clay dark
  // Text
  text:"#3B2A1E",     // --espresso (body)
  ink:"#221610",      // --ink (display, max contrast)
  walnut:"#6B4A30",   // --walnut (captions, alt body)
  muted:"#9A7E68",    // muted text on cream
  dim:"#B89271",      // very muted / disabled
  border:"#D9C9A8",   // --sand hairline
  // Status (warm, no pure greens/blues)
  green:"#6B8C5A",    // olive green — paid
  gD:"#E8EFE2",       // green bg tint
  amber:"#C48C2A",    // warm amber — pending
  amD:"#FDF3DC",      // amber bg tint
  red:"#B85040",      // warm red — error/danger
  rD:"#FAEAE8",       // red bg tint
  // Calendly accent (terracotta variant)
  teal:"#8B6B52",     // warm brown as calendly color
  tD:"#EDE6DE",       // calendly bg tint
};

function pad(n){return String(n).padStart(2,"0");}
const hourLabel = h=>`${pad(h)}:00`;
const toYMD = d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = ()=>new Date();
const addDays = (d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
const startOfWeek = d=>{const r=new Date(d);const day=r.getDay();r.setDate(r.getDate()+(day===0?-6:1-day));return r;};
const diasEntre=(a,b)=>Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);
const capit=s=>s.charAt(0).toUpperCase()+s.slice(1);
// "Hoy", "Mañana", "Ayer" o "Sábado 24"
const etiquetaDia=d=>{const n=diasEntre(today(),d);if(n===0)return"Hoy";if(n===1)return"Mañana";if(n===-1)return"Ayer";return capit(d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric"}));};
const etiquetaSemana=d=>{const n=Math.round(diasEntre(startOfWeek(today()),startOfWeek(d))/7);if(n===0)return"Esta semana";if(n===1)return"Siguiente";if(n===-1)return"Anterior";return n>0?`Dentro de ${n} semanas`:`Hace ${-n} semanas`;};
const etiquetaMes=d=>{const t=today();const n=(d.getFullYear()-t.getFullYear())*12+d.getMonth()-t.getMonth();if(n===0)return"Este mes";if(n===1)return"Siguiente";if(n===-1)return"Anterior";return MONTHS_ES[d.getMonth()];};
const fechaDe=s=>{const[y,m,dd]=s.split("-").map(Number);return new Date(y,m-1,dd);};
const timeToMins = t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
const minsToTime = m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
async function postMake(url,data){if(!url)return{ok:false};try{await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});return{ok:true};}catch{return{ok:false};}}
function getFreeSlots(dateStr,citas){
  const occ=citas.filter(c=>c.fecha===dateStr).map(c=>({s:timeToMins(c.hora),e:timeToMins(c.hora)+c.duracion}));
  const free=[];
  for(let t=WORK_START*60;t+30<=WORK_END*60;t+=30){if(!occ.some(o=>t<o.e&&t+30>o.s))free.push(minsToTime(t));}
  return free;
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const st={
  app:{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Manrope',sans-serif",display:"flex"},
  sidebar:{width:240,background:C.bone,borderRight:`1px solid ${C.border}`,padding:"24px 0",display:"flex",flexDirection:"column",gap:2,flexShrink:0},
  sidebarBrand:{padding:"0 24px 20px",borderBottom:`1px solid ${C.border}`,marginBottom:8},
  main:{flex:1,padding:32,overflowY:"auto"},
  card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:18},
  input:{background:C.bone,border:`1px solid ${C.border}`,borderRadius:4,padding:"9px 12px",color:C.text,fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"'Manrope',sans-serif"},
  textarea:{background:C.bone,border:`1px solid ${C.border}`,borderRadius:4,padding:"9px 12px",color:C.text,fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"'Manrope',sans-serif",resize:"vertical",minHeight:80},
  label:{fontSize:11,color:C.walnut,marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500},
  modal:{position:"fixed",inset:0,background:"rgba(34,22,16,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,backdropFilter:"blur(6px)"},
  modalBox:(w=500)=>({background:C.bone,border:`1px solid ${C.border}`,borderRadius:18,padding:32,width:w,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 1px 2px rgba(59,42,30,0.06),0 8px 24px -12px rgba(59,42,30,0.18)"}),
  btn:(v="primary")=>({padding:v==="sm"?"5px 14px":"10px 22px",borderRadius:10,border:"none",cursor:"pointer",fontSize:v==="sm"?12:13,fontWeight:500,fontFamily:"'Manrope',sans-serif",letterSpacing:"0.01em",transition:"background 200ms cubic-bezier(0.4,0,0.2,1),transform 120ms",
    background:v==="ghost"?"transparent":v==="danger"?C.rD:v==="teal"?C.tD:v==="success"?C.gD:C.accent,
    color:v==="ghost"?C.muted:v==="danger"?C.red:v==="teal"?C.walnut:v==="success"?C.green:C.bone}),
  badge:(col,bg)=>({display:"inline-block",padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:500,letterSpacing:"0.03em",color:col,background:bg}),
  statCard:{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"20px 24px"},
  th:{padding:"10px 16px",textAlign:"left",fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:`1px solid ${C.border}`,fontWeight:500},
  td:{padding:"12px 16px",fontSize:13,borderBottom:`1px solid ${C.border}`,verticalAlign:"middle",color:C.text},
  navItem:(a)=>({display:"flex",alignItems:"center",gap:10,padding:"10px 24px",cursor:"pointer",
    color:a?C.accent:C.walnut,background:a?"rgba(166,107,63,0.08)":"transparent",
    borderLeft:a?`3px solid ${C.accent}`:"3px solid transparent",
    fontSize:15,fontWeight:a?500:400,transition:"all 150ms"}),
  tab:(a)=>({padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:a?500:400,
    color:a?C.accent:C.walnut,borderBottom:a?`2px solid ${C.accent}`:"2px solid transparent",
    marginBottom:-1,background:"transparent",border:"none",fontFamily:"'Manrope',sans-serif",letterSpacing:"0.01em"}),
  tabs:{display:"flex",gap:2,marginBottom:24,borderBottom:`1px solid ${C.border}`},
  rowActions:{display:"flex",gap:6,alignItems:"center"},
};

// ── TIME PICKER ────────────────────────────────────────────────────────────────
function TimePicker({value,onChange}){
  const[open,setOpen]=useState(false);
  const[step,setStep]=useState("hour");
  const[selH,setSelH]=useState(()=>value?Number(value.split(":")[0]):9);
  const[pos,setPos]=useState({top:0,left:0});
  const triggerRef=useRef();
  const dropRef=useRef();
  const skipClose=useRef(false);

  // Calcular posición fixed al abrir
  const calcPos=()=>{
    if(!triggerRef.current)return;
    const r=triggerRef.current.getBoundingClientRect();
    const dropH=300;
    const top=window.innerHeight-r.bottom>dropH?r.bottom+4:r.top-dropH-4;
    const left=Math.min(r.left,window.innerWidth-240);
    setPos({top:Math.max(8,top),left:Math.max(8,left)});
  };

  // Cerrar al hacer click fuera
  useEffect(()=>{
    if(!open)return;
    const handler=()=>{
      if(skipClose.current){skipClose.current=false;return;}
      setOpen(false);setStep("hour");
    };
    document.addEventListener("click",handler);
    return()=>document.removeEventListener("click",handler);
  },[open]);

  const HOURS=Array.from({length:24},(_,i)=>i);
  const MINS=[0,5,10,15,20,25,30,35,40,45,50,55];

  const toggle=()=>{
    if(!open)calcPos();
    skipClose.current=true;
    setOpen(v=>!v);
    setStep("hour");
  };

  const pickHour=h=>{
    skipClose.current=true;
    setSelH(h);
    setStep("min");
  };

  const pickMin=m=>{
    const result=`${String(selH).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    onChange(result);
    setOpen(false);
    setStep("hour");
  };

  const goBack=()=>{skipClose.current=true;setStep("hour");};

  return(
    <div style={{position:"relative"}}>
      <div
        ref={triggerRef}
        onClick={toggle}
        style={{...st.input,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}
      >
        <span style={{fontSize:13,fontWeight:value?600:400,color:value?C.text:C.dim,fontFamily:"'Manrope',sans-serif"}}>{value||"--:--"}</span>
        <span style={{fontSize:13,color:C.muted}}>🕐</span>
      </div>

      {open&&(
        <div
          ref={dropRef}
          onClick={e=>{e.stopPropagation();skipClose.current=true;}}
          style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:C.bone,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 8px 32px rgba(59,42,30,0.22)",padding:16,width:232}}
        >
          {/* Cabecera */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:C.walnut,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em"}}>
              {step==="hour"?"Selecciona hora":"Selecciona minutos"}
            </span>
            {step==="min"&&(
              <button onClick={goBack} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontWeight:600,padding:"2px 8px",borderRadius:6}}>
                ← {String(selH).padStart(2,"0")}h
              </button>
            )}
          </div>

          {/* Display hora actual */}
          <div style={{textAlign:"center",fontSize:28,fontWeight:300,letterSpacing:"0.1em",marginBottom:14,fontFamily:"'Manrope',sans-serif"}}>
            <span style={{color:step==="hour"?C.accent:C.text,borderBottom:step==="hour"?`2px solid ${C.accent}`:"2px solid transparent",paddingBottom:2,transition:"color 150ms"}}>{String(selH).padStart(2,"0")}</span>
            <span style={{color:C.dim,margin:"0 3px"}}>:</span>
            <span style={{color:step==="min"?C.accent:C.dim,borderBottom:step==="min"?`2px solid ${C.accent}`:"2px solid transparent",paddingBottom:2,transition:"color 150ms"}}>
              {value&&Number(value.split(":")[0])===selH?value.split(":")[1]:"--"}
            </span>
          </div>

          {/* Grid horas */}
          {step==="hour"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:3}}>
              {HOURS.map(h=>(
                <button key={h} onClick={()=>pickHour(h)} style={{padding:"6px 2px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:h===selH?700:400,background:h===selH?C.accent:"transparent",color:h===selH?C.bone:C.text,transition:"background 100ms"}}>
                  {String(h).padStart(2,"0")}
                </button>
              ))}
            </div>
          )}

          {/* Grid minutos */}
          {step==="min"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
              {MINS.map(m=>{
                const cur=value?Number(value.split(":")[1]):null;
                const isSel=cur===m&&value&&Number(value.split(":")[0])===selH;
                return(
                  <button key={m} onClick={()=>pickMin(m)} style={{padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:isSel?700:400,background:isSel?C.accent:"transparent",color:isSel?C.bone:C.text,transition:"background 100ms"}}>
                    {String(m).padStart(2,"0")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Avatar=({nombre,apellidos,size=40})=>{
  const i=((nombre?.[0]||"")+(apellidos?.[0]||"")).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:C.aL,flexShrink:0}}>{i}</div>;
};
const Modal=({onClose,title,children,width})=>(
  <div style={st.modal} onClick={onClose}>
    <div style={st.modalBox(width)} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontSize:17,fontWeight:700}}>{title}</span>
        <button style={st.btn("ghost")} onClick={onClose}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
const Field=({label,children})=><div><label style={st.label}>{label}</label>{children}</div>;
const MFooter=({onCancel,onSave,saveLabel="Guardar",saving=false})=>(
  <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
    <button style={st.btn("ghost")} onClick={onCancel}>Cancelar</button>
    <button style={st.btn()} onClick={onSave} disabled={saving}>{saving?"Guardando...":saveLabel}</button>
  </div>
);
const Empty=({text})=><div style={{color:C.muted,fontSize:14,padding:"28px 20px",textAlign:"center",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`}}>{text}</div>;
const SecLabel=({text})=><div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,margin:"12px 0 8px"}}>{text}</div>;
const StatCard=({val,label,color})=><div style={st.statCard}><div style={{fontSize:28,fontWeight:700,color:color||C.accent,letterSpacing:"-1px"}}>{val}</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>{label}</div></div>;

// ── SAMPLE DATA ────────────────────────────────────────────────────────────────
const mkPatient=()=>({id:Date.now(),nombre:"",apellidos:"",telefono:"",email:"",fechaNacimiento:"",estado:"activo",
  motivoConsulta:"",
  historiaClinica:{antecedentesFamiliares:"",antecedentesPersonales:"",tratamientosPrevios:"",medicacionActual:"",enfermedadesMedicas:"",consumoSustancias:"",desarrolloEvolutivo:""},
  formulacionCaso:{habitosDiarios:"",sueno:"",alimentacion:"",deporte:"",familia:"",relaciones:"",trabajo:"",factoresEstresantes:"",factoresProtectores:"",otrosFactores:""},
  informesMedicos:[],pruebasRealizadas:[],sesiones:[],objetivos:[],consentimiento:false,consentimientoTexto:DEFAULT_CONSENT,informeAlta:"",documentos:[]});

const mk=(id,n,ap,tel,email,fnac,estado,motivo,consent,sesArr,objArr,prArr,infArr)=>({
  id,nombre:n,apellidos:ap,telefono:tel,email,fechaNacimiento:fnac,estado,motivoConsulta:motivo,
  consentimiento:consent,consentimientoTexto:DEFAULT_CONSENT,informeAlta:"",documentos:[],
  informesMedicos:infArr||[],pruebasRealizadas:prArr||[],sesiones:sesArr||[],objetivos:objArr||[],
  dni:"",sexo:"",nacionalidad:"",direccion:"",codigoPostal:"",ciudad:"",mutua:"",numPoliza:"",
  numFacturacion:"",situacionLaboral:"",trabajoActual:"",referencia:"",observacionesAdmin:""
});
const ses=(id,num,fecha,pago,pagado,fac,trab)=>({id,numero:num,fecha,pago,pagado,factura:fac,trabajado:trab,observaciones:""});
const ob=(id,objetivo,logrado)=>({id,objetivo,logrado});
const pr=(id,fecha,prueba,resultado,observaciones="")=>({id,fecha,prueba,resultado,observaciones});
const mf=(id,fecha,titulo,descripcion,medico)=>({id,fecha,titulo,descripcion,medico});

const SAMPLE_PATIENTS=[
  mk(1,"María","González López","612 345 678","maria@email.com","1990-03-15","activo","Ansiedad generalizada con preocupación excesiva, insomnio y tensión muscular.",true,
    [ses(1,1,"2026-01-15",80,true,"FAC-101","Evaluación inicial. Historia clínica."),ses(2,2,"2026-02-01",80,true,"FAC-102","Psicoeducación ansiedad."),ses(3,3,"2026-02-15",80,true,"FAC-103","Respiración diafragmática."),ses(4,4,"2026-03-01",80,false,"FAC-104","Reestructuración cognitiva.")],
    [ob(1,"Reducir episodios de ansiedad semanales",false),ob(2,"Aplicar respiración de forma autónoma",true)],
    [pr(1,"2026-01-15","BAI","Puntuación 28 — Ansiedad moderada"),pr(2,"2026-03-15","BAI","Puntuación 14 — Ansiedad leve","Mejora significativa")],
    [mf(1,"2026-01-10","Informe psiquiátrico","Diagnóstico TAG. Se recomienda TCC.","Dr. Pérez")]),

  mk(2,"Carlos","Ruiz Martínez","634 567 890","carlos@email.com","1998-07-22","activo","Episodio depresivo mayor. Anhedonia, fatiga crónica y dificultad de concentración.",false,
    [ses(5,1,"2026-02-10",80,true,"FAC-201","Evaluación estado depresivo."),ses(6,2,"2026-02-24",80,true,"FAC-202","Activación conductual."),ses(7,3,"2026-03-10",80,false,"FAC-203","Pensamientos automáticos negativos.")],
    [ob(3,"Recuperar rutina de actividad física",false),ob(4,"Mejorar calidad del sueño",false)],
    [pr(3,"2026-02-10","PHQ-9","Puntuación 17 — Depresión moderada-grave")]),

  mk(3,"Ana","Martínez Vega","611 223 344","ana@email.com","1985-11-30","activo","Fobia social y evitación de situaciones interpersonales.",true,
    [ses(8,1,"2026-01-20",80,true,"FAC-301","Evaluación. Jerarquía de situaciones."),ses(9,2,"2026-02-03",80,true,"FAC-302","Exposición gradual en imaginación."),ses(10,3,"2026-03-05",80,true,"FAC-303","Exposición real: cafetería.")],
    [ob(5,"Mantener conversación 10 min con desconocido",false)],
    [pr(4,"2026-01-20","SPIN","Puntuación 42 — Fobia social severa")]),

  mk(4,"Javier","Fernández Mora","655 667 788","javier@email.com","1978-05-14","activo","Trastorno adaptativo tras divorcio. Dificultad para gestionar cambios vitales.",true,
    [ses(11,1,"2026-02-18",90,true,"FAC-401","Acogida. Contexto del divorcio."),ses(12,2,"2026-03-04",90,true,"FAC-402","Identidad personal post-ruptura."),ses(13,3,"2026-03-18",90,false,"FAC-403","Nuevas rutinas. Plan semanal.")],
    [ob(6,"Establecer rutina estable con los hijos",false)],[]),

  mk(5,"Laura","Sánchez Díaz","677 889 900","laura@email.com","2001-02-28","activo","TCA (restricción). Distorsión de imagen corporal y rituales alimentarios.",true,
    [ses(14,1,"2026-01-08",90,true,"FAC-501","Evaluación TCA. Psicoeducación."),ses(15,2,"2026-01-22",90,true,"FAC-502","Registro alimentario."),ses(16,3,"2026-02-05",90,true,"FAC-503","Exposición espejo."),ses(17,4,"2026-02-19",90,true,"FAC-504","Mindful eating."),ses(18,5,"2026-03-05",90,false,"FAC-505","Prevención recaídas.")],
    [ob(7,"Alcanzar IMC saludable",false),ob(8,"Reducir pensamientos sobre el peso",false)],
    [pr(5,"2026-01-08","EDE-Q","Puntuación 4.2 — TCA significativo"),pr(6,"2026-03-05","EDE-Q","Puntuación 2.8 — Mejora moderada")],
    [mf(2,"2026-01-05","Informe nutricionista","Pauta alimentaria. Seguimiento conjunto.","Dra. Gómez")]),

  mk(6,"Pedro","López Castillo","699 001 122","pedro@email.com","1972-08-19","activo","TOC con rituales de comprobación. Interfiere gravemente en vida laboral.",true,
    [ses(19,1,"2026-02-12",80,true,"FAC-601","Evaluación Y-BOCS. Modelo ERP."),ses(20,2,"2026-02-26",80,true,"FAC-602","Jerarquía obsesiones. Primer ERP."),ses(21,3,"2026-03-12",80,true,"FAC-603","ERP: comprobar puerta 1 vez.")],
    [ob(9,"Reducir rituales a menos de 5 min/día",false)],
    [pr(7,"2026-02-12","Y-BOCS","Puntuación 28 — TOC grave")]),

  mk(7,"Sofía","Ramírez Torres","633 445 566","sofia@email.com","1995-04-03","activo","Duelo complicado por fallecimiento materno. Bloqueo emocional.",true,
    [ses(22,1,"2026-03-01",80,true,"FAC-701","Acogida. Valoración del duelo."),ses(23,2,"2026-03-15",80,false,"FAC-702","Trabajo emocional. Carta despedida.")],
    [ob(10,"Retomar actividad laboral",false)],[]),

  mk(8,"Miguel","García Blanco","622 334 455","miguel@email.com","1988-12-07","activo","Burnout y estrés crónico. Desmotivación e irritabilidad.",true,
    [ses(24,1,"2026-01-25",80,true,"FAC-801","Evaluación burnout MBI."),ses(25,2,"2026-02-08",80,true,"FAC-802","Gestión del tiempo. Límites."),ses(26,3,"2026-02-22",80,true,"FAC-803","Mindfulness. Autocuidado."),ses(27,4,"2026-03-08",80,false,"FAC-804","Plan desconexión digital.")],
    [ob(11,"Salir del trabajo antes de las 19h",false),ob(12,"Mindfulness 10 min diarios",true)],
    [pr(8,"2026-01-25","MBI","Burnout clínico en todas las subescalas")]),

  mk(9,"Elena","Vidal Moreno","644 556 677","elena@email.com","1992-09-21","activo","TDAH adulto. Procrastinación severa, desorganización e impulsividad.",true,
    [ses(28,1,"2026-02-14",80,true,"FAC-901","Evaluación TDAH. Conners."),ses(29,2,"2026-02-28",80,true,"FAC-902","Organización. GTD adaptado."),ses(30,3,"2026-03-14",80,false,"FAC-903","Pomodoro. Reducción distractores.")],
    [ob(13,"Usar agenda de forma consistente 21 días",false)],
    [pr(9,"2026-02-14","CAARS","T>65 en Inatención y Hiperactividad"),pr(10,"2026-03-14","CAARS","T=60 — Leve mejoría")]),

  mk(10,"Roberto","Jiménez Fuentes","655 667 778","roberto@email.com","1965-03-12","activo","Trastorno de pánico con agorafobia. Evitación de transportes.",true,
    [ses(31,1,"2026-01-18",80,true,"FAC-1001","Psicoeducación pánico."),ses(32,2,"2026-02-01",80,true,"FAC-1002","Respiración controlada."),ses(33,3,"2026-02-15",80,true,"FAC-1003","Exposición: autobús."),ses(34,4,"2026-03-01",80,false,"FAC-1004","Exposición: metro.")],
    [ob(14,"Usar metro sin acompañante",false)],
    [pr(11,"2026-01-18","PDSS","Puntuación 14 — Pánico grave")]),

  mk(11,"Isabel","Morales Ruiz","666 778 889","isabel@email.com","2003-07-15","activo","Autolesiones en contexto de desregulación emocional. Posible TLP.",true,
    [ses(35,1,"2026-02-20",90,true,"FAC-1101","Evaluación seguridad. Plan de crisis."),ses(36,2,"2026-03-06",90,true,"FAC-1102","DBT: mindfulness.")],
    [ob(15,"Identificar emociones antes de actuar",false)],[],
    [mf(3,"2026-02-18","Informe psiquiátrico","Descartar TLP. Seguimiento intensivo.","Dra. Martín")]),

  mk(12,"Antonio","Pérez Gallego","677 889 990","antonio@email.com","1958-01-24","activo","Depresión en la tercera edad. Soledad y pérdida de rol tras jubilación.",true,
    [ses(37,1,"2026-03-03",80,true,"FAC-1201","Evaluación GDS. Historia vital."),ses(38,2,"2026-03-17",80,false,"FAC-1202","Revisión de vida. Significado.")],
    [ob(16,"Apuntarse a actividad grupal semanal",false)],
    [pr(12,"2026-03-03","GDS-15","Puntuación 10 — Depresión moderada")]),

  mk(13,"Carmen","Herrera Blanco","688 990 001","carmen@email.com","1980-06-30","alta","Fobia específica a agujas. Interferencia en seguimiento oncológico.",true,
    [ses(39,1,"2025-09-10",80,true,"FAC-1301","Evaluación. Jerarquía estímulos."),ses(40,2,"2025-09-24",80,true,"FAC-1302","Exposición gradual imágenes."),ses(41,3,"2025-10-08",80,true,"FAC-1303","Exposición jeringa real."),ses(42,4,"2025-10-22",80,true,"FAC-1304","Alta. Objetivo cumplido.")],
    [ob(17,"Tolerar extracción de sangre",true),ob(18,"Acudir a revisiones sin evitación",true)],[],
    [mf(4,"2025-09-08","Informe oncología","Fobia agujas. Solicitan intervención urgente.","Dr. Navarro")]),

  mk(14,"David","Castillo Romero","699 001 112","david@email.com","2000-10-05","activo","Ansiedad ante exámenes. Perfeccionismo y miedo al fracaso.",false,
    [ses(43,1,"2026-03-12",70,true,"FAC-1401","Evaluación. Creencias sobre rendimiento.")],
    [ob(19,"Estudiar sin revisar apuntes más de 2 veces",false)],[]),

  mk(15,"Lucía","Navarro Soto","611 223 335","lucia@email.com","1987-04-18","activo","Trauma complejo por abuso infantil. Pesadillas e hipervigilancia.",true,
    [ses(44,1,"2026-01-30",90,true,"FAC-1501","Evaluación PCL-5. Estabilización."),ses(45,2,"2026-02-13",90,true,"FAC-1502","Lugar seguro. Regulación SNA."),ses(46,3,"2026-02-27",90,true,"FAC-1503","EMDR fase 2. Preparación."),ses(47,4,"2026-03-13",90,false,"FAC-1504","EMDR fase 3-4.")],
    [ob(20,"Dormir sin pesadillas 5 de 7 noches",false),ob(21,"Tolerar recuerdos sin disociarse",false)],
    [pr(13,"2026-01-30","PCL-5","Puntuación 52 — TEPT probable"),pr(14,"2026-03-13","PCL-5","Puntuación 38 — Reducción significativa")]),
];

const SAMPLE_CITAS=[
  {id:1,pacienteId:1,fecha:toYMD(today()),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:2,pacienteId:2,fecha:toYMD(today()),hora:"11:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:3,pacienteId:null,fecha:toYMD(today()),hora:"10:00",duracion:30,tipoId:"t1",tipo:"Primera llamada",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"calendly",nombreExterno:"Ana Martín",telefonoExterno:"666 111 222",emailExterno:"ana@email.com",precio:0},
  {id:4,pacienteId:5,fecha:toYMD(today()),hora:"12:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:5,pacienteId:8,fecha:toYMD(today()),hora:"16:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:6,pacienteId:3,fecha:toYMD(addDays(today(),1)),hora:"09:30",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:7,pacienteId:6,fecha:toYMD(addDays(today(),1)),hora:"11:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:8,pacienteId:9,fecha:toYMD(addDays(today(),2)),hora:"10:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:9,pacienteId:4,fecha:toYMD(addDays(today(),2)),hora:"12:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:10,pacienteId:10,fecha:toYMD(addDays(today(),3)),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:11,pacienteId:11,fecha:toYMD(addDays(today(),3)),hora:"11:30",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:12,pacienteId:7,fecha:toYMD(addDays(today(),4)),hora:"10:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:13,pacienteId:12,fecha:toYMD(addDays(today(),4)),hora:"12:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:80},
  {id:14,pacienteId:14,fecha:toYMD(addDays(today(),5)),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:70},
  {id:15,pacienteId:15,fecha:toYMD(addDays(today(),5)),hora:"11:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"interno",precio:90},
  {id:16,pacienteId:null,fecha:toYMD(addDays(today(),6)),hora:"09:30",duracion:30,tipoId:"t1",tipo:"Primera llamada",notas:"",zoomLink:"https://meet.google.com/abc-defg-hij",origen:"calendly",nombreExterno:"Pablo Suárez",telefonoExterno:"688 001 234",emailExterno:"pablo@email.com",precio:0},
];
// En la demo, las fechas de ejemplo se desplazan para que la última sesión sea reciente
function demoPacientes(){
  const desf=diasEntre(fechaDe("2026-03-18"),addDays(today(),-6));
  const mover=f=>f?toYMD(addDays(fechaDe(f),desf)):f;
  return SAMPLE_PATIENTS.map((p,i)=>({...p,profesionalId:i%3===2?"u2":"demo",
    sesiones:p.sesiones.map(s=>({...s,fecha:mover(s.fecha)})),
    pruebasRealizadas:p.pruebasRealizadas.map(x=>({...x,fecha:mover(x.fecha)})),
    informesMedicos:p.informesMedicos.map(x=>({...x,fecha:mover(x.fecha)}))}));
}
// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
// ── Pantallas de acceso (Supabase Auth) ───────────────────────────────────────
const leerInvitacion=()=>{
  try{
    const t=new URLSearchParams(window.location.search).get("inv");
    if(t){localStorage.setItem("praxi_inv",t);return t;}
    return localStorage.getItem("praxi_inv")||null;
  }catch{return null;}
};
const olvidarInvitacion=()=>{try{localStorage.removeItem("praxi_inv");}catch{}};
const traducirError=e=>{
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
  if(m.includes("guardar_mi_enlace")||m.includes("enlace_videollamada"))return "Falta preparar la base de datos: ejecuta supabase/06_videollamada.sql en Supabase.";
  if(m.includes("debe empezar por https"))return "El enlace debe empezar por https://";
  if(m.includes("failed to fetch")||m.includes("network"))return "No hay conexión con el servidor. Revisa tu internet.";
  return e?.message||"Ha ocurrido un error.";
};

function CajaAcceso({children,ancho=420}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',sans-serif",padding:16,boxSizing:"border-box"}}>
      <div style={{width:"100%",maxWidth:ancho,background:C.bone,border:`1px solid ${C.border}`,borderRadius:18,padding:"40px 34px",boxSizing:"border-box",boxShadow:"0 1px 2px rgba(59,42,30,0.06),0 8px 24px -12px rgba(59,42,30,0.14)"}}>
        <a href="/"><img src={PRAXI_LOGO} alt="praXi" style={{height:52,display:"block",margin:"0 auto 28px"}}/></a>
        {children}
      </div>
    </div>
  );
}
const Aviso=({tipo="error",children})=>children?<div style={{fontSize:13,marginTop:14,padding:"9px 12px",borderRadius:8,lineHeight:1.5,color:tipo==="ok"?C.green:C.red,background:tipo==="ok"?C.gD:C.rD}}>{children}</div>:null;
const Enlace=({onClick,children})=><button type="button" onClick={onClick} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,padding:0,fontFamily:"'Manrope',sans-serif",textDecoration:"underline"}}>{children}</button>;

function Acceso({recuperando,onPasswordCambiada}){
  const inv=leerInvitacion();
  const[modo,setModo]=useState(recuperando?"nueva":inv?"alta":"login");
  const[invInfo,setInvInfo]=useState(null);
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[show,setShow]=useState(false);
  const[err,setErr]=useState("");
  const[ok,setOk]=useState("");
  const[cargando,setCargando]=useState(false);

  useEffect(()=>{if(recuperando)setModo("nueva");},[recuperando]);
  useEffect(()=>{
    if(!inv)return;
    supabase.rpc("ver_invitacion",{p_token:inv}).then(({data})=>{
      const i=data?.[0];
      if(i){setInvInfo(i);setEmail(i.email);}else{setErr("La invitación no es válida o ha caducado. Pide una nueva al administrador.");olvidarInvitacion();}
    });
  },[inv]);

  const volver=window.location.origin+"/app"+(inv?`?inv=${inv}`:"");
  const ir=m=>{setModo(m);setErr("");setOk("");};
  const ejecutar=async fn=>{setErr("");setOk("");setCargando(true);try{await fn();}catch(e){setErr(traducirError(e));}setCargando(false);};

  const entrar=()=>ejecutar(async()=>{
    const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
  });
  const crearCuenta=()=>ejecutar(async()=>{
    if(password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const{data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:volver}});
    if(error)throw error;
    if(!data.session)setOk(`Te hemos enviado un email a ${email.trim()}. Ábrelo y pulsa el enlace para confirmar tu cuenta.`);
  });
  const recuperar=()=>ejecutar(async()=>{
    const{error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/app"});
    if(error)throw error;
    setOk("Si existe una cuenta con ese email, te llegará un enlace para crear una contraseña nueva.");
  });
  const nuevaPassword=()=>ejecutar(async()=>{
    if(password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const{error}=await supabase.auth.updateUser({password});
    if(error)throw error;
    onPasswordCambiada&&onPasswordCambiada();
  });

  const accion={login:entrar,alta:crearCuenta,recuperar,nueva:nuevaPassword}[modo];
  const titulo={login:"Iniciar sesión",alta:invInfo?"Únete a tu clínica":"Crear cuenta",recuperar:"Recuperar contraseña",nueva:"Nueva contraseña"}[modo];
  const boton={login:"Entrar",alta:"Crear cuenta",recuperar:"Enviar enlace",nueva:"Guardar contraseña"}[modo];
  const enter=e=>e.key==="Enter"&&!cargando&&accion();

  return(
    <CajaAcceso>
      <div style={{fontSize:22,fontFamily:"'Instrument Serif',serif",textAlign:"center",color:C.ink,marginBottom:invInfo&&modo==="alta"?8:22}}>{titulo}</div>
      {invInfo&&modo==="alta"&&<div style={{fontSize:13,color:C.walnut,textAlign:"center",marginBottom:22,lineHeight:1.5}}>Te han invitado a <strong>{invInfo.clinica}</strong>. Crea tu contraseña para entrar.</div>}
      {!invInfo&&!inv&&modo==="alta"&&<div style={{fontSize:12,color:C.walnut,background:C.sand,borderRadius:8,padding:"9px 12px",marginBottom:18,lineHeight:1.5}}>Praxi está en acceso anticipado: para crear tu clínica necesitarás un <strong>código de acceso</strong>. Si no lo tienes, <a href="/" style={{color:C.accent}}>apúntate a la lista de espera</a>. Si te ha invitado tu clínica, usa el enlace de la invitación.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {modo!=="nueva"&&<div><label style={st.label}>Email</label>
          <input style={st.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" autoFocus={!invInfo} readOnly={!!invInfo&&modo==="alta"} onKeyDown={enter}/>
        </div>}
        {modo!=="recuperar"&&<div><label style={st.label}>{modo==="login"?"Contraseña":"Contraseña (mínimo 8 caracteres)"}</label>
          <div style={{position:"relative"}}>
            <input style={{...st.input,paddingRight:40}} type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={modo==="login"?"current-password":"new-password"} onKeyDown={enter} autoFocus={modo==="nueva"||(!!invInfo&&modo==="alta")}/>
            <button type="button" onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>{show?"🙈":"👁"}</button>
          </div>
        </div>}
      </div>
      <Aviso>{err}</Aviso>
      <Aviso tipo="ok">{ok}</Aviso>
      {modo==="alta"&&<div style={{fontSize:11.5,color:C.muted,marginTop:14,lineHeight:1.5}}>Al crear tu cuenta, tus datos se tratan según la <a href="/privacidad" target="_blank" rel="noreferrer" style={{color:C.accent}}>política de privacidad</a>.</div>}
      <button disabled={cargando} style={{...st.btn(),width:"100%",padding:"12px 0",fontSize:14,marginTop:20,opacity:cargando?0.6:1}} onClick={accion}>{cargando?"Un momento…":boton}</button>
      <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap",marginTop:18}}>
        {modo==="login"&&<Enlace onClick={()=>ir("recuperar")}>¿Has olvidado tu contraseña?</Enlace>}
        {modo==="login"&&<Enlace onClick={()=>ir("alta")}>Crear cuenta</Enlace>}
        {(modo==="alta"||modo==="recuperar")&&<Enlace onClick={()=>ir("login")}>Ya tengo cuenta</Enlace>}
      </div>
    </CajaAcceso>
  );
}

// Después de entrar, si el usuario aún no pertenece a ninguna clínica
function Onboarding({session,onListo}){
  const inv=leerInvitacion();
  const[invInfo,setInvInfo]=useState(null);
  const[form,setForm]=useState({clinica:"",nombre:"",especialidad:"",codigo:""});
  const[aceptaTerminos,setAceptaTerminos]=useState(false);
  const[err,setErr]=useState("");
  const[cargando,setCargando]=useState(false);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  useEffect(()=>{if(inv)supabase.rpc("ver_invitacion",{p_token:inv}).then(({data})=>{const i=data?.[0];if(i)setInvInfo(i);else olvidarInvitacion();});},[inv]);
  const enviar=async()=>{
    setErr("");
    if(!form.nombre.trim()){setErr("Escribe tu nombre.");return;}
    if(!invInfo&&!form.clinica.trim()){setErr("Escribe el nombre de la clínica o consulta.");return;}
    if(!invInfo&&!form.codigo.trim()){setErr("Escribe tu código de acceso.");return;}
    if(!invInfo&&!aceptaTerminos){setErr("Para crear la clínica tienes que aceptar los Términos y el Contrato de encargo.");return;}
    setCargando(true);
    const{error}=invInfo
      ?await supabase.rpc("aceptar_invitacion",{p_token:inv,p_nombre:form.nombre.trim(),p_especialidad:form.especialidad.trim()||null})
      :await supabase.rpc("crear_clinica",{p_nombre:form.clinica.trim(),p_mi_nombre:form.nombre.trim(),p_especialidad:form.especialidad.trim()||null,p_codigo:form.codigo.trim(),p_terminos_version:VERSION_TERMINOS});
    setCargando(false);
    if(error){setErr(traducirError(error));return;}
    olvidarInvitacion();
    onListo();
  };
  return(
    <CajaAcceso ancho={460}>
      <div style={{fontSize:22,fontFamily:"'Instrument Serif',serif",textAlign:"center",color:C.ink,marginBottom:8}}>{invInfo?`Únete a ${invInfo.clinica}`:"Crea tu clínica"}</div>
      <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:22,lineHeight:1.5}}>{invInfo?"Completa tu perfil para empezar.":<>Has iniciado sesión como <b style={{color:C.text}}>{session.user.email}</b>, pero esta cuenta aún no pertenece a ninguna clínica. Crea la tuya (serás el administrador) o pide una invitación a tu clínica.</>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {!invInfo&&<div><label style={st.label}>Nombre de la clínica o consulta</label><input style={st.input} value={form.clinica} onChange={f("clinica")} autoFocus/></div>}
        <div><label style={st.label}>Tu nombre y apellidos</label><input style={st.input} value={form.nombre} onChange={f("nombre")} autoFocus={!!invInfo}/></div>
        <div><label style={st.label}>Especialidad (opcional)</label><input style={st.input} value={form.especialidad} onChange={f("especialidad")}/></div>
        {!invInfo&&<div><label style={st.label}>Código de acceso</label><input style={{...st.input,textTransform:"uppercase"}} value={form.codigo} onChange={f("codigo")} onKeyDown={e=>e.key==="Enter"&&!cargando&&enviar()}/>
          <div style={{fontSize:12,color:C.muted,marginTop:6,lineHeight:1.5}}>Praxi está en acceso anticipado. ¿No tienes código? <a href="/" style={{color:C.accent}}>Apúntate a la lista de espera</a>.</div></div>}
        {!invInfo&&<label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:12.5,color:C.text,lineHeight:1.5,cursor:"pointer"}}>
          <input type="checkbox" checked={aceptaTerminos} onChange={e=>setAceptaTerminos(e.target.checked)} style={{marginTop:2,accentColor:C.accent,width:16,height:16,flexShrink:0}}/>
          <span>Acepto los <a href="/terminos" target="_blank" rel="noreferrer" style={{color:C.accent}}>Términos del servicio</a> y el <a href="/terminos#encargo" target="_blank" rel="noreferrer" style={{color:C.accent}}>Contrato de encargo del tratamiento</a>, en nombre propio o de la clínica que represento.</span>
        </label>}
      </div>
      <Aviso>{err}</Aviso>
      <button disabled={cargando} style={{...st.btn(),width:"100%",padding:"12px 0",fontSize:14,marginTop:20,opacity:cargando?0.6:1}} onClick={enviar}>{cargando?"Un momento…":invInfo?"Entrar en la clínica":"Crear clínica"}</button>
      <div style={{textAlign:"center",marginTop:16,fontSize:12,color:C.muted}}>¿No es tu cuenta? <Enlace onClick={()=>supabase.auth.signOut()}>Cerrar sesión y entrar con otra</Enlace></div>
    </CajaAcceso>
  );
}

function PantallaEstado({titulo,texto,accion}){
  return(
    <CajaAcceso>
      <div style={{fontSize:20,fontFamily:"'Instrument Serif',serif",textAlign:"center",color:C.ink,marginBottom:10}}>{titulo}</div>
      {texto&&<div style={{fontSize:13,color:C.muted,textAlign:"center",lineHeight:1.6}}>{texto}</div>}
      {accion&&<div style={{textAlign:"center",marginTop:20}}>{accion}</div>}
    </CajaAcceso>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════════════════════════════
function useReminders(citas,patients){
  const[reminders,setReminders]=useState([]);
  useEffect(()=>{
    const check=()=>{
      const now=new Date();const todayStr=toYMD(now);const nowMins=now.getHours()*60+now.getMinutes();
      const alerts=[];
      citas.filter(c=>c.fecha===todayStr).forEach(c=>{
        const cm=timeToMins(c.hora);const diff=cm-nowMins;
        const p=patients.find(p=>p.id==c.pacienteId);
        const name=c.origen==="calendly"?(c.nombreExterno||"Primera llamada"):(p?`${p.nombre} ${p.apellidos}`:"Paciente");
        if(diff>0&&diff<=30)alerts.push({id:c.id+"s",msg:`⏰ Cita con ${name} en ${diff} minutos (${c.hora})`,type:"soon"});
        else if(diff>30&&diff<=60)alerts.push({id:c.id+"h",msg:`📅 Cita con ${name} en 1 hora (${c.hora})`,type:"hour"});
      });
      setReminders(alerts);
    };
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[citas,patients]);
  return[reminders,setReminders];
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT — real printable layout
// ══════════════════════════════════════════════════════════════════════════════
function exportPatientPDF(patient){
  const cob=patient.sesiones.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0);
  const pend=patient.sesiones.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0);
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha — ${patient.nombre} ${patient.apellidos}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#3B2A1E;background:#F5EFE4;padding:30px;max-width:800px;margin:0 auto;}
    h1{font-size:26px;font-family:Georgia,serif;border-bottom:2px solid #A66B3F;padding-bottom:10px;color:#A66B3F;}
    h2{font-size:14px;background:#EBE3D2;padding:7px 12px;border-left:4px solid #A66B3F;margin-top:26px;color:#3B2A1E;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
    .field{background:#FBF8F1;border:1px solid #D9C9A8;padding:8px 10px;border-radius:6px;}
    .field .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;}
    .field .val{font-size:12px;font-weight:600;}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;}
    .green{background:#E8EFE2;color:#4A6438;}.amber{background:#FDF3DC;color:#8A5F1B;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th{background:#EBE3D2;padding:7px 10px;text-align:left;font-size:11px;border:1px solid #D9C9A8;color:#3B2A1E;}
    td{padding:7px 10px;border:1px solid #D9C9A8;font-size:11px;vertical-align:top;}
    .obj{margin:4px 0;padding:4px 8px;background:#f9f9f9;border-radius:4px;}
    .nota{margin:8px 0;padding:10px 12px;background:#FBF8F1;border:1px solid #D9C9A8;border-left:3px solid #A66B3F;border-radius:4px;white-space:pre-wrap;}
    @media print{body{padding:10px;}}
  </style></head><body>
  <h1>Ficha clínica — ${patient.nombre} ${patient.apellidos}</h1>
  <p style="color:#888;font-size:11px">Exportado el ${toYMD(today())}</p>
  ${patient.motivoConsulta?`<div style="background:#FBF8F1;border:1px solid #D9C9A8;border-left:4px solid #A66B3F;border-radius:6px;padding:12px 16px;margin-bottom:16px"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Motivo de consulta</div><div style="font-size:13px;line-height:1.7">${patient.motivoConsulta}</div></div>`:""}
  <div class="grid">
    <div class="field"><div class="lbl">Email</div><div class="val">${patient.email}</div></div>
    <div class="field"><div class="lbl">Teléfono</div><div class="val">${patient.telefono}</div></div>
    <div class="field"><div class="lbl">Fecha de nacimiento</div><div class="val">${patient.fechaNacimiento}</div></div>
    <div class="field"><div class="lbl">Estado</div><div class="val"><span class="badge ${patient.estado==="activo"?"green":"amber"}">${patient.estado}</span></div></div>
    <div class="field"><div class="lbl">Consentimiento</div><div class="val"><span class="badge ${patient.consentimiento?"green":"amber"}">${patient.consentimiento?"✓ Firmado":"Pendiente"}</span></div></div>
    <div class="field"><div class="lbl">Sesiones</div><div class="val">${patient.sesiones.length} · Cobrado ${cob}€ · Pendiente ${pend}€</div></div>
  </div>
  <h2>Objetivos terapéuticos</h2>
  ${patient.objetivos.map(o=>`<div class="obj"><span class="badge ${o.logrado?"green":"amber"}">${o.logrado?"Logrado":"En progreso"}</span> ${o.objetivo}</div>`).join("")||"<p>Sin objetivos.</p>"}
  <h2>Informes médicos</h2>
  ${patient.informesMedicos.length?`<table><thead><tr><th>Fecha</th><th>Título</th><th>Médico</th><th>Descripción</th></tr></thead><tbody>${patient.informesMedicos.map(i=>`<tr><td>${i.fecha}</td><td>${i.titulo}</td><td>${i.medico}</td><td>${i.descripcion}</td></tr>`).join("")}</tbody></table>`:"<p>Sin informes.</p>"}
  <h2>Pruebas psicológicas</h2>
  ${patient.pruebasRealizadas.length?`<table><thead><tr><th>Fecha</th><th>Prueba</th><th>Resultado</th><th>Observaciones</th></tr></thead><tbody>${patient.pruebasRealizadas.map(p=>`<tr><td>${p.fecha}</td><td>${p.prueba}</td><td>${p.resultado}</td><td>${p.observaciones}</td></tr>`).join("")}</tbody></table>`:"<p>Sin pruebas.</p>"}
  <h2>Sesiones y pagos</h2>
  ${patient.sesiones.length?`<table><thead><tr><th>Nº</th><th>Fecha</th><th>Factura</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${patient.sesiones.map(s=>`<tr><td>${s.numero}</td><td>${s.fecha}</td><td>${s.factura}</td><td>${s.pago}€</td><td><span class="badge ${s.pagado?"green":"amber"}">${s.pagado?"Pagado":"Pendiente"}</span></td></tr>`).join("")}</tbody></table>`:"<p>Sin sesiones.</p>"}
  <h2>Evolución clínica</h2>
  ${patient.sesiones.filter(s=>s.trabajado).sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(s=>`<div><strong>Sesión ${s.numero} — ${s.fecha}</strong><div class="nota">${s.trabajado}</div></div>`).join("")||"<p>Sin notas.</p>"}
  ${patient.informeAlta?`<h2>Informe de alta</h2><div class="nota">${patient.informeAlta}</div>`:""}
  <h2>Consentimiento informado</h2>
  <div class="nota" style="font-size:11px;color:#444">${(patient.consentimientoTexto||DEFAULT_CONSENT).replace(/\n/g,"<br/>")}</div>
  <p style="font-size:10px;color:#aaa;margin-top:30px;border-top:1px solid #eee;padding-top:10px">Documento generado por el sistema de gestión del consultorio · ${toYMD(today())}</p>
  </body></html>`;
  const win=window.open("","_blank");
  win.document.write(html);win.document.close();
  setTimeout(()=>win.print(),400);
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSENTIMIENTO — editable
// ══════════════════════════════════════════════════════════════════════════════
function ConsentModal({patient,onClose,onSave}){
  const[texto,setTexto]=useState(patient.consentimientoTexto||DEFAULT_CONSENT);
  const[firmado,setFirmado]=useState(patient.consentimiento||false);
  return(
    <Modal onClose={onClose} title="Consentimiento informado" width={640}>
      <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Puedes editar el texto del consentimiento antes de guardarlo.</div>
      <Field label="Texto del consentimiento">
        <textarea style={{...st.textarea,minHeight:300,fontSize:12,lineHeight:1.7,fontFamily:"inherit"}} value={texto} onChange={e=>setTexto(e.target.value)}/>
      </Field>
      <div style={{display:"flex",gap:10,alignItems:"center",margin:"16px 0",cursor:"pointer"}} onClick={()=>setFirmado(v=>!v)}>
        <div style={{width:22,height:22,borderRadius:5,border:`2px solid ${firmado?C.accent:C.border}`,background:firmado?C.aD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:C.aL,fontSize:13,flexShrink:0}}>{firmado?"✓":""}</div>
        <span style={{fontSize:13}}>El paciente ha leído y firmado el consentimiento informado</span>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
        <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={()=>{const win=window.open("","_blank");win.document.write(`<html><body style="font-family:Arial;font-size:13px;padding:30px;white-space:pre-wrap">${texto.replace(/\n/g,"<br/>")}</body></html>`);win.document.close();setTimeout(()=>win.print(),400);}}>🖨 Imprimir</button>
        <MFooter onCancel={onClose} onSave={()=>onSave({texto,firmado})}/>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ALTA
// ══════════════════════════════════════════════════════════════════════════════
function AltaModal({patient,onClose,onSave}){
  const[informe,setInforme]=useState(patient.informeAlta||`INFORME DE ALTA PSICOLÓGICA\n\nPaciente: ${patient.nombre} ${patient.apellidos}\nFecha de alta: ${toYMD(today())}\nNúmero de sesiones: ${patient.sesiones.length}\n\nMOTIVO DE CONSULTA:\n\nDIAGNÓSTICO / PROBLEMÁTICA:\n\nTRATAMIENTO REALIZADO:\n\nEVOLUCIÓN Y RESULTADOS:\n\nOBJETIVOS LOGRADOS:\n${patient.objetivos.filter(o=>o.logrado).map(o=>"- "+o.objetivo).join("\n")||"Ninguno registrado"}\n\nRECOMENDACIONES AL ALTA:\n\nEstado: ☐ Alta por objetivos ☐ Derivación ☐ Abandono`);
  return(
    <Modal onClose={onClose} title="Informe de alta y cierre de caso" width={580}>
      <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Al guardar, el paciente pasará a estado "Alta" y quedará archivado.</div>
      <Field label="Informe de alta">
        <textarea style={{...st.textarea,minHeight:300,fontFamily:"inherit",fontSize:12,lineHeight:1.7}} value={informe} onChange={e=>setInforme(e.target.value)}/>
      </Field>
      <MFooter onCancel={onClose} onSave={()=>onSave(informe)}/>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INFORME MENSUAL
// ══════════════════════════════════════════════════════════════════════════════
function InformeMensual({patients,citas,onClose}){
  const[mes,setMes]=useState(()=>toYMD(today()).slice(0,7));

  const data=useMemo(()=>{
    // Sesiones de pacientes ese mes
    const sesiones=patients.flatMap(p=>p.sesiones.filter(s=>s.fecha.startsWith(mes)).map(s=>({...s,paciente:`${p.nombre} ${p.apellidos}`})));
    const cobrado=sesiones.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0);
    const pendiente=sesiones.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0);
    const porPaciente=patients.map(p=>{
      const ss=p.sesiones.filter(s=>s.fecha.startsWith(mes));
      return{nombre:`${p.nombre} ${p.apellidos}`,sesiones:ss.length,cobrado:ss.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0),pendiente:ss.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0)};
    }).filter(p=>p.sesiones>0);
    // Citas del calendario ese mes
    const citasMes=citas.filter(c=>c.fecha.startsWith(mes)).map(c=>{
      const p=patients.find(pt=>pt.id==c.pacienteId);
      return{...c,nombrePaciente:c.origen==="calendly"?(c.nombreExterno||"Primera llamada"):(p?`${p.nombre} ${p.apellidos}`:"Sin asignar")};
    }).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
    return{sesiones,cobrado,pendiente,porPaciente,citasMes,totalCitas:citasMes.length};
  },[mes,patients,citas]);

  const maxBar=Math.max(...data.porPaciente.map(p=>p.cobrado+p.pendiente),1);
  const mesLabel=`${MONTHS_ES[parseInt(mes.split("-")[1])-1]} ${mes.split("-")[0]}`;

  const exportPDF=()=>{
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe ${mesLabel}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#3B2A1E;background:#F5EFE4;padding:32px;max-width:820px;margin:0 auto;}
      h1{font-size:22px;color:#A66B3F;border-bottom:2px solid #A66B3F;padding-bottom:10px;margin-bottom:6px;}
      h2{font-size:13px;background:#EBE3D2;padding:7px 12px;border-left:4px solid #A66B3F;margin-top:28px;color:#3B2A1E;text-transform:uppercase;letter-spacing:0.05em;}
      .sub{font-size:11px;color:#9A7E68;margin-bottom:20px;}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0;}
      .stat{background:#FBF8F1;border:1px solid #D9C9A8;border-radius:8px;padding:12px 16px;}
      .stat .val{font-size:22px;font-weight:700;color:#A66B3F;}
      .stat .lbl{font-size:10px;color:#9A7E68;text-transform:uppercase;letter-spacing:0.05em;margin-top:3px;}
      table{width:100%;border-collapse:collapse;margin-top:10px;}
      th{background:#EBE3D2;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #D9C9A8;color:#6B4A30;}
      td{padding:8px 10px;border:1px solid #D9C9A8;font-size:11px;vertical-align:top;}
      tr:nth-child(even) td{background:#FBF8F1;}
      .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;}
      .pagado{background:#E8EFE2;color:#4A6438;}
      .pendiente{background:#FDF3DC;color:#8A5F1B;}
      .bar-wrap{background:#EBE3D2;border-radius:4px;height:8px;overflow:hidden;margin-top:4px;}
      .bar-cob{height:100%;background:#6B8C5A;display:inline-block;}
      .bar-pen{height:100%;background:#C48C2A;display:inline-block;}
      footer{margin-top:40px;padding-top:10px;border-top:1px solid #D9C9A8;font-size:10px;color:#B89271;}
      @media print{body{padding:10px;background:white;}}
    </style></head><body>
    <h1>Informe mensual — ${mesLabel}</h1>
    <div class="sub">Generado el ${toYMD(today())} · Praxi Gestión Clínica</div>

    <div class="stats">
      <div class="stat"><div class="val">${data.cobrado}€</div><div class="lbl">Cobrado</div></div>
      <div class="stat"><div class="val">${data.pendiente}€</div><div class="lbl">Pendiente</div></div>
      <div class="stat"><div class="val">${data.sesiones.length}</div><div class="lbl">Sesiones</div></div>
      <div class="stat"><div class="val">${data.totalCitas}</div><div class="lbl">Citas totales</div></div>
    </div>

    <h2>Ingresos por paciente</h2>
    ${data.porPaciente.length===0?"<p>Sin sesiones este mes.</p>":`
    <table>
      <thead><tr><th>Paciente</th><th>Sesiones</th><th>Cobrado</th><th>Pendiente</th><th>Total</th></tr></thead>
      <tbody>${data.porPaciente.map(p=>`
        <tr>
          <td>${p.nombre}</td>
          <td style="text-align:center">${p.sesiones}</td>
          <td><span class="badge pagado">${p.cobrado}€</span></td>
          <td>${p.pendiente>0?`<span class="badge pendiente">${p.pendiente}€</span>`:"-"}</td>
          <td><strong>${p.cobrado+p.pendiente}€</strong></td>
        </tr>`).join("")}
        <tr style="background:#EBE3D2;font-weight:700">
          <td>TOTAL</td><td style="text-align:center">${data.sesiones.length}</td>
          <td>${data.cobrado}€</td><td>${data.pendiente}€</td>
          <td>${data.cobrado+data.pendiente}€</td>
        </tr>
      </tbody>
    </table>`}

    <h2>Detalle de sesiones facturadas</h2>
    ${data.sesiones.length===0?"<p>Sin sesiones.</p>":`
    <table>
      <thead><tr><th>Paciente</th><th>Fecha</th><th>Factura</th><th>Importe</th><th>Estado</th></tr></thead>
      <tbody>${[...data.sesiones].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(s=>`
        <tr><td>${s.paciente}</td><td>${s.fecha}</td><td>${s.factura}</td>
        <td><strong>${s.pago}€</strong></td>
        <td><span class="badge ${s.pagado?"pagado":"pendiente"}">${s.pagado?"Pagado":"Pendiente"}</span></td></tr>`).join("")}
      </tbody>
    </table>`}

    <h2>Todas las citas del mes</h2>
    ${data.citasMes.length===0?"<p>Sin citas registradas.</p>":`
    <table>
      <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Tipo de cita</th><th>Duración</th><th>Origen</th></tr></thead>
      <tbody>${data.citasMes.map(c=>`
        <tr><td>${c.fecha}</td><td>${c.hora}</td><td>${c.nombrePaciente}</td>
        <td>${c.tipo||"-"}</td><td>${c.duracion} min</td>
        <td>${c.origen==="calendly"?"Calendly":"Interno"}</td></tr>`).join("")}
      </tbody>
    </table>`}

    <footer>Praxi · Gestión Clínica · Informe ${mesLabel} · Total cobrado: ${data.cobrado}€ · Total pendiente: ${data.pendiente}€</footer>
    </body></html>`;

    const win=window.open("","_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(()=>win.print(),400);
  };

  return(
    <Modal onClose={onClose} title={`Informe mensual — ${mesLabel}`} width={660}>
      <div style={{display:"flex",gap:12,alignItems:"flex-end",marginBottom:20}}>
        <Field label="Mes"><input type="month" style={{...st.input,width:160}} value={mes} onChange={e=>setMes(e.target.value)}/></Field>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <StatCard val={`${data.cobrado}€`} label="Cobrado" color={C.green}/>
        <StatCard val={`${data.pendiente}€`} label="Pendiente" color={C.amber}/>
        <StatCard val={data.sesiones.length} label="Sesiones" color={C.aL}/>
        <StatCard val={data.totalCitas} label="Citas totales" color={C.text}/>
      </div>

      {/* Barras por paciente */}
      {data.porPaciente.length===0&&<Empty text="Sin sesiones este mes"/>}
      {data.porPaciente.map((p,i)=>(
        <div key={i} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
            <span style={{fontWeight:600}}>{p.nombre}</span>
            <span style={{color:C.muted}}>{p.sesiones} ses · <span style={{color:C.green}}>{p.cobrado}€</span>{p.pendiente>0&&<span style={{color:C.amber}}> +{p.pendiente}€ pend.</span>}</span>
          </div>
          <div style={{height:8,background:C.sand,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",display:"flex"}}>
              <div style={{width:`${(p.cobrado/maxBar)*100}%`,background:C.green,transition:"width 0.4s"}}/>
              <div style={{width:`${(p.pendiente/maxBar)*100}%`,background:C.amber}}/>
            </div>
          </div>
        </div>
      ))}

      {/* Citas del mes */}
      {data.citasMes.length>0&&(
        <div style={{marginTop:20}}>
          <SecLabel text={`Citas del mes (${data.citasMes.length})`}/>
          <div style={{background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <th style={st.th}>Fecha</th>
                <th style={st.th}>Hora</th>
                <th style={st.th}>Paciente</th>
                <th style={st.th}>Tipo</th>
                <th style={st.th}>Origen</th>
              </tr></thead>
              <tbody>{data.citasMes.map((c,i)=>(
                <tr key={i}>
                  <td style={st.td}>{c.fecha}</td>
                  <td style={st.td}>{c.hora}</td>
                  <td style={st.td}>{c.nombrePaciente}</td>
                  <td style={st.td}>{c.tipo||"—"}</td>
                  <td style={st.td}><span style={st.badge(c.origen==="calendly"?C.teal:C.walnut,c.origen==="calendly"?C.tD:C.sand)}>{c.origen==="calendly"?"Calendly":"Interno"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"space-between"}}>
        <button style={st.btn("ghost")} onClick={onClose}>Cerrar</button>
        <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={exportPDF}>🖨 Exportar PDF</button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB DOCUMENTOS — upload + view PDFs
// ══════════════════════════════════════════════════════════════════════════════
function TabDocumentos({patient,update}){
  const fileRef=useRef();
  const[viewDoc,setViewDoc]=useState(null);
  const[categoria,setCategoria]=useState("todos");

  const handleUpload=e=>{
    const files=Array.from(e.target.files);
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        update(p=>({...p,documentos:[...(p.documentos||[]),{id:Date.now()+Math.random(),nombre:file.name,tipo:file.type,datos:ev.target.result,fecha:toYMD(today()),categoria:"general",tamaño:file.size}]}));
      };
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };

  const del=id=>{if(confirm("¿Eliminar documento?"))update(p=>({...p,documentos:(p.documentos||[]).filter(d=>d.id!==id)}));};
  const updateCat=(id,cat)=>update(p=>({...p,documentos:(p.documentos||[]).map(d=>d.id===id?{...d,categoria:cat}:d)}));

  const docs=patient.documentos||[];
  const categorias=["todos","informe","prueba","consentimiento","factura","general"];
  const filtrados=categoria==="todos"?docs:docs.filter(d=>d.categoria===categoria);

  const fmtSize=b=>b>1048576?`${(b/1048576).toFixed(1)}MB`:b>1024?`${(b/1024).toFixed(0)}KB`:`${b}B`;
  const isPDF=d=>d.tipo==="application/pdf"||d.nombre.toLowerCase().endsWith(".pdf");
  const isImg=d=>d.tipo?.startsWith("image/");

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {categorias.map(cat=>(
            <button key={cat} style={{...st.btn("sm"),background:categoria===cat?C.accent:C.bone,color:categoria===cat?C.bone:C.muted,textTransform:"capitalize"}} onClick={()=>setCategoria(cat)}>{cat}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input ref={fileRef} type="file" accept=".pdf,image/*,.doc,.docx" multiple style={{display:"none"}} onChange={handleUpload}/>
          <button style={st.btn()} onClick={()=>fileRef.current.click()}>+ Subir documento</button>
        </div>
      </div>

      {filtrados.length===0&&<Empty text="Sin documentos. Sube PDFs, imágenes o documentos del paciente."/>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
        {filtrados.map(doc=>(
          <div key={doc.id} style={{...st.card,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{fontSize:28,flexShrink:0}}>{isPDF(doc)?"📄":isImg(doc)?"🖼️":"📎"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.nombre}</div>
                <div style={{fontSize:11,color:C.muted}}>{doc.fecha} · {fmtSize(doc.tamaño)}</div>
              </div>
            </div>

            {/* Category selector */}
            <select style={{...st.input,fontSize:11,padding:"4px 8px"}} value={doc.categoria||"general"} onChange={e=>updateCat(doc.id,e.target.value)}>
              {categorias.filter(c=>c!=="todos").map(c=><option key={c} value={c} style={{textTransform:"capitalize"}}>{c}</option>)}
            </select>

            {/* Preview thumbnail for images */}
            {isImg(doc)&&<img src={doc.datos} alt={doc.nombre} style={{width:"100%",height:80,objectFit:"cover",borderRadius:6,cursor:"pointer"}} onClick={()=>setViewDoc(doc)}/>}

            <div style={{display:"flex",gap:6}}>
              <button style={{...st.btn("sm"),flex:1}} onClick={()=>setViewDoc(doc)}>
                {isPDF(doc)?"Ver PDF":"Ver"}
              </button>
              <button style={{...st.btn("sm"),flex:1}} onClick={()=>{
                const a=document.createElement("a");a.href=doc.datos;a.download=doc.nombre;document.body.appendChild(a);a.click();document.body.removeChild(a);
              }}>⬇</button>
              <button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(doc.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Document viewer modal */}
      {viewDoc&&(
        <div style={st.modal} onClick={()=>setViewDoc(null)}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,width:"90vw",maxWidth:900,height:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:15,fontWeight:700}}>{viewDoc.nombre}</span>
              <div style={{display:"flex",gap:8}}>
                <button style={st.btn("sm")} onClick={()=>{const a=document.createElement("a");a.href=viewDoc.datos;a.download=viewDoc.nombre;document.body.appendChild(a);a.click();document.body.removeChild(a);}}>⬇ Descargar</button>
                <button style={st.btn("ghost")} onClick={()=>setViewDoc(null)}>✕</button>
              </div>
            </div>
            <div style={{flex:1,overflow:"hidden",borderRadius:8,background:C.bone}}>
              {isPDF(viewDoc)
                ?<iframe src={viewDoc.datos} style={{width:"100%",height:"100%",border:"none",borderRadius:8}} title={viewDoc.nombre}/>
                :isImg(viewDoc)
                  ?<img src={viewDoc.datos} alt={viewDoc.nombre} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                  :<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:C.muted,fontSize:14}}>Vista previa no disponible para este tipo de archivo</div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FICHA PACIENTE
// ══════════════════════════════════════════════════════════════════════════════
// ── TAB CITAS EN LA CLÍNICA ───────────────────────────────────────────────────
function TabCitasClinica({patient,citas,profesionales}){
  const citasPaciente=[...citas.filter(c=>c.pacienteId==patient.id)]
    .sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.hora.localeCompare(a.hora));

  if(citasPaciente.length===0) return <Empty text="Este paciente no tiene citas registradas en la clínica."/>;

  // Agrupar por profesional
  const porProf={};
  citasPaciente.forEach(c=>{
    const pid=c.profesionalId||"sin-asignar";
    if(!porProf[pid])porProf[pid]=[];
    porProf[pid].push(c);
  });

  const todayStr=toYMD(today());

  return(
    <div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>
        Todas las citas de <strong>{patient.nombre} {patient.apellidos}</strong> con cualquier profesional de la clínica.
      </div>

      {/* Resumen por profesional */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {Object.entries(porProf).map(([profId,pcitas])=>{
          const prof=profesionales.find(p=>p.id===profId);
          const proxima=pcitas.filter(c=>c.fecha>=todayStr).sort((a,b)=>a.fecha.localeCompare(b.fecha))[0];
          return(
            <div key={profId} style={{...st.card,padding:"12px 16px",flex:1,minWidth:180,borderLeft:`3px solid ${prof?.color||C.clay}`}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:prof?.color||C.clay,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{prof?.nombre?.[0]||"?"}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{prof?.nombre||"Sin asignar"}</div>
                  <div style={{fontSize:11,color:C.muted}}>{prof?.especialidad||""}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:C.muted}}>{pcitas.length} citas en total</div>
              {proxima&&<div style={{fontSize:11,color:prof?.color||C.accent,marginTop:3}}>Próxima: {proxima.fecha} · {proxima.hora}</div>}
            </div>
          );
        })}
      </div>

      {/* Lista completa */}
      <div style={st.card}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th style={st.th}>Fecha</th>
              <th style={st.th}>Hora</th>
              <th style={st.th}>Profesional</th>
              <th style={st.th}>Tipo</th>
              <th style={st.th}>Duración</th>
              <th style={st.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {citasPaciente.map(c=>{
              const prof=profesionales.find(p=>p.id===c.profesionalId);
              const isPast=c.fecha<todayStr;
              const isToday=c.fecha===todayStr;
              return(
                <tr key={c.id} style={{background:isToday?"rgba(166,107,63,0.04)":"transparent"}}>
                  <td style={st.td}>
                    <span style={{fontWeight:isToday?600:400,color:isToday?C.accent:C.text}}>{c.fecha}</span>
                    {isToday&&<span style={{...st.badge(C.accent,C.sand),fontSize:9,marginLeft:6}}>Hoy</span>}
                  </td>
                  <td style={st.td}>{c.hora}</td>
                  <td style={st.td}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:prof?.color||C.clay,flexShrink:0}}/>
                      <span>{prof?.nombre||"Sin asignar"}</span>
                    </div>
                  </td>
                  <td style={st.td}>{c.tipo||"—"}</td>
                  <td style={st.td}>{c.duracion} min</td>
                  <td style={st.td}>
                    <span style={st.badge(isPast?C.muted:isToday?C.accent:C.green, isPast?C.card:isToday?C.sand:C.gD)}>
                      {isPast?"Pasada":isToday?"Hoy":"Pendiente"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FichaPaciente({patient,setPatients,onBack,citas,setCitas,profesionales,tipos}){
  const isNew=!patient.motivoConsulta&&patient.sesiones.length===0&&!patient.historiaClinica?.texto&&!(patient.historiaClinica?.entradas||[]).length;
  const[tab,setTab]=useState("evolucion");
  const[showConsent,setShowConsent]=useState(false);
  const[showAlta,setShowAlta]=useState(false);
  const[editMotivo,setEditMotivo]=useState(false);
  const[motivoTxt,setMotivoTxt]=useState(patient.motivoConsulta||"");
  const[showIA,setShowIA]=useState(false);
  const[showNuevaCita,setShowNuevaCita]=useState(false);
  const update=fn=>setPatients(ps=>ps.map(p=>p.id===patient.id?fn(p):p));
  const{registrarVista}=useContext(EquipoCtx);
  useEffect(()=>{registrarVista(patient.id);},[patient.id]);

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
        <button style={{...st.btn("ghost"),paddingLeft:0,fontSize:18}} onClick={onBack}>←</button>
        <Avatar nombre={patient.nombre} apellidos={patient.apellidos} size={48}/>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:800}}>{patient.nombre} {patient.apellidos}</div>
          <div style={{fontSize:13,color:C.muted}}>{patient.telefono} · {patient.email}</div>
          {/* Contador de sesiones y progreso */}
          <div style={{display:"flex",gap:12,marginTop:6,alignItems:"center"}}>
            <span style={{fontSize:12,color:C.walnut,fontWeight:500}}>{patient.sesiones.length} sesiones</span>
            {patient.sesiones.length>0&&<><span style={{color:C.border}}>·</span><span style={{fontSize:12,color:C.muted}}>Última: {[...patient.sesiones].sort((a,b)=>b.fecha.localeCompare(a.fecha))[0]?.fecha}</span></>}
            {patient.objetivos.length>0&&(
              <>
                <span style={{color:C.border}}>·</span>
                <span style={{fontSize:12,color:C.walnut}}>
                  {patient.objetivos.filter(o=>o.logrado).length}/{patient.objetivos.length} objetivos
                </span>
                <div style={{height:6,width:80,background:C.sand,borderRadius:999,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(patient.objetivos.filter(o=>o.logrado).length/patient.objetivos.length)*100}%`,background:C.green,borderRadius:999}}/>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
          <span onClick={()=>setShowConsent(true)} style={{...st.badge(patient.consentimiento?C.green:C.amber,patient.consentimiento?C.gD:C.amD),cursor:"pointer"}}>
            {patient.consentimiento?"✓ Consentimiento":"⚠ Sin consentimiento"}
          </span>
          <span style={st.badge(patient.estado==="activo"?C.green:patient.estado==="alta"?C.walnut:C.muted,patient.estado==="activo"?C.gD:patient.estado==="alta"?C.sand:C.card)}>{patient.estado}</span>
          <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={()=>setShowNuevaCita(true)}>+ Nueva cita</button>
          <button style={st.btn("sm")} onClick={()=>exportPatientPDF(patient)}>🖨 Exportar PDF</button>
          {IA_VISIBLE&&<button style={{...st.btn("sm"),background:C.accent,color:C.bone}} onClick={()=>setShowIA(v=>!v)}>✦ IA</button>}
          {patient.estado==="activo"&&<button style={{...st.btn("sm"),background:C.tD,color:C.teal}} onClick={()=>setShowAlta(true)}>Dar de alta</button>}
          {patient.estado==="alta"&&<span style={{...st.badge(C.walnut,C.sand),fontSize:11}}>✓ Dado de alta</span>}
        </div>
      </div>

      {/* Banner bienvenida para pacientes nuevos */}
      {isNew&&(
        <div style={{background:C.gD,border:`1px solid ${C.green}`,borderRadius:12,padding:"14px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:20}}>👋</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.green}}>Ficha nueva — empieza por lo básico</div>
            <div style={{fontSize:12,color:C.green,opacity:0.85,marginTop:2}}>Añade el motivo de consulta, completa la historia clínica y registra la primera sesión.</div>
          </div>
        </div>
      )}

      {/* Motivo de consulta — siempre visible, editable al hacer clic */}
      <div style={{...st.card,padding:"16px 20px",marginBottom:20,borderLeft:`3px solid ${C.accent}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:6}}>Motivo de consulta</div>
            {editMotivo?(
              <textarea
                style={{...st.textarea,minHeight:80}}
                value={motivoTxt}
                onChange={e=>setMotivoTxt(e.target.value)}
                autoFocus
              />
            ):(
              <div
                onClick={()=>{setMotivoTxt(patient.motivoConsulta||"");setEditMotivo(true);}}
                style={{fontSize:14,lineHeight:1.7,color:patient.motivoConsulta?C.text:C.muted,fontStyle:patient.motivoConsulta?"normal":"italic",cursor:"pointer",minHeight:24}}
              >
                {patient.motivoConsulta||"Sin motivo de consulta registrado. Haz clic para añadir."}
              </div>
            )}
          </div>
          {editMotivo&&(
            <div style={{display:"flex",gap:6,flexShrink:0,marginTop:22}}>
              <button style={st.btn("ghost")} onClick={()=>setEditMotivo(false)}>Cancelar</button>
              <button style={st.btn()} onClick={()=>{update(p=>({...p,motivoConsulta:motivoTxt}));setEditMotivo(false);}}>Guardar</button>
            </div>
          )}
        </div>
      </div>

      {/* Pestañas reordenadas */}
      <div style={{...st.tabs,flexWrap:"nowrap",overflowX:"auto",paddingBottom:2}}>
        {[
          ["historia","Historia clínica"],
          ["formulacion","Formulación de caso"],
          ["evolucion","Evolución clínica"],
          ["objetivos","Objetivos"],
          ["pruebas","Pruebas"],
          ["informes","Informes médicos"],
          ["datos","Datos"],
          ["sesiones","Sesiones y pagos"],
        ].map(([id,label])=>(
          <button key={id} style={st.tab(tab===id)} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {tab==="historia"&&<TabHistoriaClinica patient={patient} update={update}/>}
      {tab==="formulacion"&&<TabFormulacionCaso patient={patient} update={update}/>}
      {tab==="evolucion"&&<TabEvolucion patient={patient} update={update}/>}
      {tab==="objetivos"&&<TabObjetivos patient={patient} update={update}/>}
      {tab==="pruebas"&&<TabPruebas patient={patient} update={update}/>}
      {tab==="informes"&&<TabInformes patient={patient} update={update}/>}
      {tab==="datos"&&<TabDatos patient={patient} update={update}/>}
      {tab==="sesiones"&&<TabSesiones patient={patient} update={update}/>}

      {showConsent&&<ConsentModal patient={patient} onClose={()=>setShowConsent(false)} onSave={({texto,firmado})=>{update(p=>({...p,consentimiento:firmado,consentimientoTexto:texto}));setShowConsent(false);}}/>}
      {showAlta&&<AltaModal patient={patient} onClose={()=>setShowAlta(false)} onSave={informe=>{update(p=>({...p,estado:"alta",informeAlta:informe}));setShowAlta(false);}}/>}
      {IA_VISIBLE&&showIA&&<IAPanel patient={patient} onClose={()=>setShowIA(false)}/>}
      {showNuevaCita&&<CitaModal cita={null} patients={[patient]} tipos={tipos||[]} defaultFecha={toYMD(today())} defaultHora="09:00" makeUrl="" onClose={()=>setShowNuevaCita(false)} onSave={form=>{setCitas&&setCitas(cs=>[...cs,{...form,id:Date.now(),pacienteId:patient.id,origen:"interno"}]);setShowNuevaCita(false);}} onDelete={()=>{}}/>}
    </div>
  );
}

// ── TAB INFORMES ───────────────────────────────────────────────────────────────
const mkInforme=()=>({id:null,fecha:"",titulo:"",medico:"",descripcion:""});
function TabInformes({patient,update}){
  const[show,setShow]=useState(false);const[form,setForm]=useState(mkInforme());
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const save=()=>{if(!form.titulo)return;if(form.id)update(p=>({...p,informesMedicos:p.informesMedicos.map(i=>i.id===form.id?{...form}:i)}));else update(p=>({...p,informesMedicos:[...p.informesMedicos,{...form,id:Date.now()}]}));setShow(false);};
  const del=id=>{if(confirm("¿Eliminar?"))update(p=>({...p,informesMedicos:p.informesMedicos.filter(i=>i.id!==id)}));};
  return(<div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button style={st.btn()} onClick={()=>{setForm(mkInforme());setShow(true);}}>+ Añadir informe</button></div>{patient.informesMedicos.length===0&&<Empty text="Sin informes médicos"/>}{patient.informesMedicos.map(inf=>(<div key={inf.id} style={{...st.card,marginBottom:12,padding:"14px 18px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontWeight:700,fontSize:15}}>{inf.titulo}</div><div style={{fontSize:12,color:C.muted}}>{inf.medico} · {inf.fecha}</div></div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setForm({...inf});setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(inf.id)}>Eliminar</button></div></div><div style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{inf.descripcion}</div></div>))}{show&&<Modal onClose={()=>setShow(false)} title={form.id?"Editar informe":"Añadir informe"}><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Título"><input style={st.input} value={form.titulo} onChange={f("titulo")}/></Field><Field label="Médico"><input style={st.input} value={form.medico} onChange={f("medico")}/></Field><Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field></div><Field label="Descripción"><textarea style={{...st.textarea,minHeight:110}} value={form.descripcion} onChange={f("descripcion")}/></Field></div><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}</div>);
}

// ── TAB PRUEBAS ────────────────────────────────────────────────────────────────
const mkPrueba=()=>({id:null,fecha:"",prueba:"",resultado:"",observaciones:""});
function TabPruebas({patient,update}){
  const[show,setShow]=useState(false);const[form,setForm]=useState(mkPrueba());
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const save=()=>{if(!form.prueba)return;if(form.id)update(p=>({...p,pruebasRealizadas:p.pruebasRealizadas.map(i=>i.id===form.id?{...form}:i)}));else update(p=>({...p,pruebasRealizadas:[...p.pruebasRealizadas,{...form,id:Date.now()}]}));setShow(false);};
  const del=id=>{if(confirm("¿Eliminar?"))update(p=>({...p,pruebasRealizadas:p.pruebasRealizadas.filter(i=>i.id!==id)}));};
  const grouped=useMemo(()=>[...new Set(patient.pruebasRealizadas.map(p=>p.prueba))].map(name=>{const entries=patient.pruebasRealizadas.filter(p=>p.prueba===name).sort((a,b)=>a.fecha.localeCompare(b.fecha));const scores=entries.map(e=>{const m=e.resultado.match(/\d+/);return m?parseInt(m[0]):null;}).filter(n=>n!==null);return{name,entries,scores};}).filter(g=>g.scores.length>1),[patient.pruebasRealizadas]);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button style={st.btn()} onClick={()=>{setForm(mkPrueba());setShow(true);}}>+ Añadir prueba</button></div>
      {grouped.length>0&&<div style={{marginBottom:20}}><SecLabel text="Evolución de puntuaciones"/>{grouped.map(g=>(<div key={g.name} style={{...st.card,padding:"14px 18px",marginBottom:12}}><div style={{fontWeight:600,marginBottom:10}}>{g.name}</div><div style={{display:"flex",alignItems:"flex-end",gap:8,height:60}}>{g.scores.map((sc,i)=>{const maxSc=Math.max(...g.scores)||1;const trend=i>0&&sc<g.scores[i-1];return(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flex:1}}><div style={{fontSize:10,color:trend?C.green:C.amber,fontWeight:700}}>{sc}</div><div style={{width:"100%",background:trend?C.gD:C.amD,borderRadius:4,height:`${(sc/maxSc)*100}%`,minHeight:4,border:`1px solid ${trend?C.green:C.amber}`}}/><div style={{fontSize:9,color:C.dim}}>{g.entries[i].fecha.slice(5)}</div></div>);})}</div>{g.scores[g.scores.length-1]<g.scores[0]&&<div style={{fontSize:11,color:C.green,marginTop:8}}>↓ Mejora de {g.scores[0]-g.scores[g.scores.length-1]} puntos</div>}</div>))}</div>}
      {patient.pruebasRealizadas.length===0&&<Empty text="Sin pruebas"/>}
      {patient.pruebasRealizadas.map(pr=>(<div key={pr.id} style={{...st.card,marginBottom:12,padding:"14px 18px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:15}}>{pr.prueba}</div><div style={{fontSize:12,color:C.muted}}>{pr.fecha}</div></div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setForm({...pr});setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(pr.id)}>Eliminar</button></div></div><div style={{background:C.bone,borderRadius:7,padding:"8px 12px"}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:3}}>Resultado</div><div style={{fontSize:13,fontWeight:600,color:C.aL}}>{pr.resultado}</div></div>{pr.observaciones&&<div style={{fontSize:13,color:C.muted,marginTop:8}}>{pr.observaciones}</div>}</div>))}
      {show&&<Modal onClose={()=>setShow(false)} title={form.id?"Editar prueba":"Añadir prueba"}><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Prueba"><input style={st.input} value={form.prueba} onChange={f("prueba")} placeholder="BAI, PHQ-9..."/></Field><Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field></div><Field label="Resultado"><input style={st.input} value={form.resultado} onChange={f("resultado")}/></Field><Field label="Observaciones"><textarea style={st.textarea} value={form.observaciones} onChange={f("observaciones")}/></Field></div><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}
    </div>
  );
}

// ── TAB SESIONES — payment toggle button only ──────────────────────────────────
const mkSesion=()=>({id:null,fecha:"",pago:"",pagado:false,trabajado:"",observaciones:"",estadoEmocional:5,alianza:5,observacionesAdicionales:""});
function TabSesiones({patient,update}){
  const[show,setShow]=useState(false);const[form,setForm]=useState(mkSesion());const[viewF,setViewF]=useState(null);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const nextNum=patient.sesiones.length+1;
  const save=()=>{if(!form.fecha)return;if(form.id)update(p=>({...p,sesiones:p.sesiones.map(s=>s.id===form.id?{...s,...form,pago:Number(form.pago)||0,pagado:form.pagado===true||form.pagado==="true"}:s)}));else{const fac=`FAC-${String(patient.id).slice(-2)}${String(nextNum).padStart(3,"0")}`;update(p=>({...p,sesiones:[...p.sesiones,{...form,id:Date.now(),numero:nextNum,pago:Number(form.pago)||0,pagado:form.pagado===true||form.pagado==="true",factura:fac}]}));}setShow(false);};
  const del=id=>{if(confirm("¿Eliminar sesión?"))update(p=>({...p,sesiones:p.sesiones.filter(s=>s.id!==id)}));};
  // Toggle payment — single colored button
  const togP=id=>update(p=>({...p,sesiones:p.sesiones.map(s=>s.id===id?{...s,pagado:!s.pagado}:s)}));
  const cob=patient.sesiones.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0);
  const pend=patient.sesiones.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0);
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        <StatCard val={patient.sesiones.length} label="Sesiones" color={C.aL}/>
        <StatCard val={`${cob}€`} label="Cobrado" color={C.green}/>
        <StatCard val={`${pend}€`} label="Pendiente" color={C.amber}/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button style={st.btn()} onClick={()=>{setForm(mkSesion());setShow(true);}}>+ Registrar sesión</button></div>
      {patient.sesiones.length===0&&<Empty text="Sin sesiones"/>}
      {[...patient.sesiones].reverse().map(ses=>(
        <div key={ses.id} style={{...st.card,marginBottom:10,padding:"14px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:C.aL}}>{ses.numero}</div>
              <div>
                <div style={{fontWeight:600}}>Sesión {ses.numero} <span style={{color:C.muted,fontWeight:400}}>· {ses.fecha}</span></div>
                <div style={{fontSize:12,color:C.muted}}>{ses.factura} · {ses.pago}€</div>
              </div>
            </div>
            <div style={st.rowActions}>
              {/* Single colored toggle button for payment */}
              <button
                onClick={()=>togP(ses.id)}
                style={{padding:"5px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:ses.pagado?C.gD:C.amD,color:ses.pagado?C.green:C.amber,transition:"all 0.2s"}}
              >
                {ses.pagado?"✓ Pagado":"⏳ Pendiente"}
              </button>
              <button style={st.btn("sm")} onClick={()=>setViewF(ses)}>Factura</button>
              <button style={st.btn("sm")} onClick={()=>{setForm({...ses});setShow(true);}}>Editar</button>
              <button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(ses.id)}>Eliminar</button>
            </div>
          </div>
          {ses.trabajado&&<div style={{fontSize:13,color:C.muted,lineHeight:1.6,borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10}}>{ses.trabajado}</div>}
          {(ses.estadoEmocional!=null||ses.alianza!=null)&&<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>{ses.estadoEmocional!=null&&<span style={st.badge(C.walnut,C.sand)}>Estado emocional {ses.estadoEmocional}/10</span>}{ses.alianza!=null&&<span style={st.badge(C.walnut,C.sand)}>Alianza {ses.alianza}/10</span>}</div>}
          {ses.observacionesAdicionales&&<div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginTop:8,fontStyle:"italic"}}>{ses.observacionesAdicionales}</div>}
        </div>
      ))}
      {show&&<Modal onClose={()=>setShow(false)} title={form.id?`Editar sesión ${form.numero}`:`Sesión ${nextNum}`} width={520}><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field><Field label="Importe €"><input type="number" style={st.input} value={form.pago} onChange={f("pago")}/></Field></div><Field label="Estado"><select style={st.input} value={form.pagado} onChange={e=>setForm(p=>({...p,pagado:e.target.value==="true"}))}><option value="false">Pendiente</option><option value="true">Pagado</option></select></Field><Field label="Lo trabajado en esta sesión"><textarea style={{...st.textarea,minHeight:100}} value={form.trabajado} onChange={f("trabajado")}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label={`Estado emocional: ${form.estadoEmocional??5}/10`}><input type="range" min="0" max="10" step="1" style={{width:"100%",accentColor:C.accent}} value={form.estadoEmocional??5} onChange={e=>setForm(p=>({...p,estadoEmocional:Number(e.target.value)}))}/></Field><Field label={`Alianza terapéutica: ${form.alianza??5}/10`}><input type="range" min="0" max="10" step="1" style={{width:"100%",accentColor:C.accent}} value={form.alianza??5} onChange={e=>setForm(p=>({...p,alianza:Number(e.target.value)}))}/></Field></div><Field label="Observaciones adicionales"><textarea style={{...st.textarea,minHeight:70}} value={form.observacionesAdicionales||""} onChange={f("observacionesAdicionales")}/></Field></div><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}
      {viewF&&<Modal onClose={()=>setViewF(null)} title="Factura" width={400}><div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div><div style={{fontSize:18,fontWeight:800,color:C.aL}}>FACTURA</div><div style={{fontSize:12,color:C.muted}}>{viewF.factura}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:12,color:C.muted}}>Fecha</div><div style={{fontWeight:600}}>{viewF.fecha}</div></div></div><div style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"12px 0",margin:"12px 0"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:C.muted}}>Paciente</span><span style={{fontWeight:600}}>{patient.nombre} {patient.apellidos}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.muted}}>Sesión nº {viewF.numero} — Psicología</span><span style={{fontWeight:600}}>{viewF.pago}€</span></div></div><div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800}}><span>Total</span><span style={{color:C.aL}}>{viewF.pago}€</span></div><div style={{marginTop:14,padding:"8px 12px",background:viewF.pagado?C.gD:C.amD,borderRadius:7,textAlign:"center",fontSize:13,fontWeight:600,color:viewF.pagado?C.green:C.amber}}>{viewF.pagado?"✓ Pagado":"⏳ Pendiente de pago"}</div></div></Modal>}
    </div>
  );
}

// ── TAB OBJETIVOS ──────────────────────────────────────────────────────────────
function TabObjetivos({patient,update}){
  const[show,setShow]=useState(false);const[editO,setEditO]=useState(null);const[txt,setTxt]=useState("");
  const save=()=>{if(!txt.trim())return;if(editO)update(p=>({...p,objetivos:p.objetivos.map(o=>o.id===editO.id?{...o,objetivo:txt}:o)}));else update(p=>({...p,objetivos:[...p.objetivos,{id:Date.now(),objetivo:txt,logrado:false}]}));setShow(false);};
  const tog=id=>update(p=>({...p,objetivos:p.objetivos.map(o=>o.id===id?{...o,logrado:!o.logrado}:o)}));
  const del=id=>{if(confirm("¿Eliminar?"))update(p=>({...p,objetivos:p.objetivos.filter(o=>o.id!==id)}));};
  const act=patient.objetivos.filter(o=>!o.logrado);const log=patient.objetivos.filter(o=>o.logrado);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:13,color:C.muted}}>{log.length}/{patient.objetivos.length} logrados</div><button style={st.btn()} onClick={()=>{setEditO(null);setTxt("");setShow(true);}}>+ Añadir</button></div>{patient.objetivos.length===0&&<Empty text="Sin objetivos"/>}{act.length>0&&<SecLabel text="En progreso"/>}{act.map(o=><div key={o.id} style={{...st.card,marginBottom:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}><div style={{width:20,height:20,borderRadius:4,border:`2px solid ${C.border}`,cursor:"pointer",flexShrink:0}} onClick={()=>tog(o.id)}/><div style={{flex:1,fontSize:14}}>{o.objetivo}</div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setEditO(o);setTxt(o.objetivo);setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(o.id)}>✕</button></div></div>)}{log.length>0&&<SecLabel text="Logrados"/>}{log.map(o=><div key={o.id} style={{...st.card,marginBottom:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:0.6}}><div style={{width:20,height:20,borderRadius:4,background:C.sand,border:`2px solid ${C.accent}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,fontSize:12,flexShrink:0}} onClick={()=>tog(o.id)}>✓</div><div style={{flex:1,fontSize:14,textDecoration:"line-through",color:C.muted}}>{o.objetivo}</div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setEditO(o);setTxt(o.objetivo);setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(o.id)}>✕</button></div></div>)}{show&&<Modal onClose={()=>setShow(false)} title={editO?"Editar objetivo":"Nuevo objetivo"}><Field label="Objetivo"><textarea style={st.textarea} value={txt} onChange={e=>setTxt(e.target.value)}/></Field><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}</div>);
}

// ── TAB DATOS ADMINISTRATIVOS ─────────────────────────────────────────────────
function TabDatos({patient,update}){
  const[editing,setEditing]=useState(false);
  const[form,setForm]=useState({
    dni:patient.dni||"",sexo:patient.sexo||"",nacionalidad:patient.nacionalidad||"",
    direccion:patient.direccion||"",codigoPostal:patient.codigoPostal||"",ciudad:patient.ciudad||"",
    mutua:patient.mutua||"",numPoliza:patient.numPoliza||"",numFacturacion:patient.numFacturacion||"",
    situacionLaboral:patient.situacionLaboral||"",trabajoActual:patient.trabajoActual||"",
    referencia:patient.referencia||"",observacionesAdmin:patient.observacionesAdmin||"",
  });
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const save=()=>{update(p=>({...p,...form}));setEditing(false);};

  const DatoRow=({label,value,col2Label,col2Value})=>(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"grid",gridTemplateColumns:"160px 1fr",padding:"10px 16px"}}>
        <span style={{fontSize:12,color:C.muted}}>{label}</span>
        <span style={{fontSize:13,color:C.text,fontWeight:value?500:400}}>{value||<span style={{color:C.dim,fontStyle:"italic"}}>—</span>}</span>
      </div>
      {col2Label&&<div style={{display:"grid",gridTemplateColumns:"160px 1fr",padding:"10px 16px",borderLeft:`1px solid ${C.border}`}}>
        <span style={{fontSize:12,color:C.muted}}>{col2Label}</span>
        <span style={{fontSize:13,color:C.text,fontWeight:col2Value?500:400}}>{col2Value||<span style={{color:C.dim,fontStyle:"italic"}}>—</span>}</span>
      </div>}
    </div>
  );

  if(editing) return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:16}}>
        <button style={st.btn("ghost")} onClick={()=>setEditing(false)}>Cancelar</button>
        <button style={st.btn()} onClick={save}>Guardar</button>
      </div>

      <div style={{...st.card,marginBottom:16,padding:"18px 20px"}}>
        <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:14}}>Identificación</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Field label="DNI / NIE"><input style={st.input} value={form.dni} onChange={f("dni")} placeholder="12345678A"/></Field>
          <Field label="Sexo"><select style={st.input} value={form.sexo} onChange={f("sexo")}><option value="">—</option><option>Hombre</option><option>Mujer</option><option>No binario</option><option>Prefiere no indicar</option></select></Field>
          <Field label="Nacionalidad"><input style={st.input} value={form.nacionalidad} onChange={f("nacionalidad")} placeholder="Española"/></Field>
        </div>
      </div>

      <div style={{...st.card,marginBottom:16,padding:"18px 20px"}}>
        <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:14}}>Dirección</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12}}>
          <Field label="Dirección"><input style={st.input} value={form.direccion} onChange={f("direccion")} placeholder="Calle, número, piso..."/></Field>
          <Field label="Código postal"><input style={st.input} value={form.codigoPostal} onChange={f("codigoPostal")} placeholder="28001"/></Field>
          <Field label="Ciudad"><input style={st.input} value={form.ciudad} onChange={f("ciudad")} placeholder="Madrid"/></Field>
        </div>
      </div>

      <div style={{...st.card,marginBottom:16,padding:"18px 20px"}}>
        <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:14}}>Mutua / Seguro</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Field label="Mutua"><input style={st.input} value={form.mutua} onChange={f("mutua")} placeholder="AXA, Sanitas..."/></Field>
          <Field label="Nº póliza"><input style={st.input} value={form.numPoliza} onChange={f("numPoliza")}/></Field>
          <Field label="Nº facturación"><input style={st.input} value={form.numFacturacion} onChange={f("numFacturacion")}/></Field>
        </div>
      </div>

      <div style={{...st.card,marginBottom:16,padding:"18px 20px"}}>
        <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:14}}>Situación laboral</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Situación"><select style={st.input} value={form.situacionLaboral} onChange={f("situacionLaboral")}><option value="">—</option><option>Activo</option><option>Desempleado</option><option>Autónomo</option><option>Estudiante</option><option>Jubilado</option><option>Incapacidad</option></select></Field>
          <Field label="Trabajo actual"><input style={st.input} value={form.trabajoActual} onChange={f("trabajoActual")} placeholder="Profesión..."/></Field>
        </div>
      </div>

      <div style={{...st.card,padding:"18px 20px"}}>
        <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:14}}>Otros</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <Field label="Referencia (cómo llegó)"><input style={st.input} value={form.referencia} onChange={f("referencia")} placeholder="Derivación, búsqueda web..."/></Field>
        </div>
        <Field label="Observaciones administrativas"><textarea style={{...st.textarea,minHeight:70}} value={form.observacionesAdmin} onChange={f("observacionesAdmin")}/></Field>
      </div>
    </div>
  );

  // Vista de solo lectura
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button style={st.btn()} onClick={()=>setEditing(true)}>Editar datos</button>
      </div>

      <div style={{...st.card,marginBottom:14,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:C.sand,borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Identificación</div>
        <DatoRow label="DNI / NIE" value={patient.dni} col2Label="Sexo" col2Value={patient.sexo}/>
        <DatoRow label="Fecha nacimiento" value={patient.fechaNacimiento} col2Label="Nacionalidad" col2Value={patient.nacionalidad}/>
        <DatoRow label="Dirección" value={patient.direccion} col2Label="Ciudad" col2Value={patient.ciudad?`${patient.ciudad}${patient.codigoPostal?" ("+patient.codigoPostal+")":""}`:""} />
      </div>

      <div style={{...st.card,marginBottom:14,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:C.sand,borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Mutua / Seguro</div>
        <DatoRow label="Mutua" value={patient.mutua} col2Label="Nº póliza" col2Value={patient.numPoliza}/>
        <DatoRow label="Nº facturación" value={patient.numFacturacion}/>
      </div>

      <div style={{...st.card,marginBottom:14,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:C.sand,borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Situación laboral</div>
        <DatoRow label="Situación" value={patient.situacionLaboral} col2Label="Trabajo actual" col2Value={patient.trabajoActual}/>
      </div>

      <div style={{...st.card,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:C.sand,borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Otros</div>
        <DatoRow label="Referencia" value={patient.referencia}/>
        {patient.observacionesAdmin&&<div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Observaciones</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{patient.observacionesAdmin}</div>
        </div>}
      </div>
    </div>
  );
}

// ── TAB EVOLUCIÓN CLÍNICA ──────────────────────────────────────────────────────
// ── TAB HISTORIA CLÍNICA ──────────────────────────────────────────────────────
function TabHistoriaClinica({patient,update}){
  const hc=patient.historiaClinica||{};
  const legacy=hc.texto?[{id:0,sesion:null,fecha:"",texto:hc.texto,legacy:true}]:[];
  const entradas=[...legacy,...(hc.entradas||[])].sort((a,b)=>b.id-a.id);
  const[adding,setAdding]=useState(false);
  const[txt,setTxt]=useState("");
  const[sesionSel,setSesionSel]=useState("");
  const[editId,setEditId]=useState(null);
  const[editTxt,setEditTxt]=useState("");
  const[editSes,setEditSes]=useState("");
  const sesOrdenadas=[...patient.sesiones].sort((a,b)=>b.numero-a.numero);
  const hoy=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};

  const saveNew=()=>{
    if(!txt.trim())return;
    const sesion=sesionSel?Number(sesionSel):patient.sesiones.length;
    const fecha=(sesionSel&&patient.sesiones.find(s=>s.numero===sesion)?.fecha)||hoy();
    update(p=>({...p,historiaClinica:{...p.historiaClinica,entradas:[...(p.historiaClinica?.entradas||[]),{id:Date.now(),sesion,fecha,texto:txt}]}}));
    setAdding(false);setTxt("");setSesionSel("");
  };
  const startEdit=en=>{setEditId(en.id);setEditTxt(en.texto);setEditSes(en.sesion==null?"":String(en.sesion));};
  const saveEdit=en=>{
    const sesion=editSes===""?en.sesion:Number(editSes);
    if(en.legacy){
      // convierte el texto antiguo en una entrada normal
      update(p=>({...p,historiaClinica:{...p.historiaClinica,texto:"",entradas:[...(p.historiaClinica?.entradas||[]),{id:1,sesion,fecha:"",texto:editTxt}]}}));
    }else{
      update(p=>({...p,historiaClinica:{...p.historiaClinica,entradas:(p.historiaClinica?.entradas||[]).map(x=>x.id===en.id?{...x,texto:editTxt,sesion}:x)}}));
    }
    setEditId(null);
  };
  const del=en=>{
    if(en.legacy)update(p=>({...p,historiaClinica:{...p.historiaClinica,texto:""}}));
    else update(p=>({...p,historiaClinica:{...p.historiaClinica,entradas:(p.historiaClinica?.entradas||[]).filter(x=>x.id!==en.id)}}));
  };

  const SesSelect=({value,onChange,allowCurrent})=>(
    <select style={{...st.input,fontSize:12,width:"auto",minWidth:200,padding:"6px 10px"}} value={value} onChange={e=>onChange(e.target.value)}>
      {allowCurrent&&<option value="">Sesión actual ({patient.sesiones.length})</option>}
      {!allowCurrent&&<option value="">Sin sesión asignada</option>}
      {sesOrdenadas.map(s=><option key={s.id} value={s.numero}>Sesión {s.numero} — {s.fecha}</option>)}
    </select>
  );

  const serif={fontSize:14,lineHeight:1.9,fontFamily:"'Instrument Serif',serif"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{color:C.muted,fontSize:13}}>{entradas.length} {entradas.length===1?"registro":"registros"}</div>
        {!adding&&<button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={()=>{setAdding(true);setTxt("");setSesionSel("");}}>+ Nueva entrada</button>}
      </div>

      {adding&&(
        <div style={{...st.card,padding:"18px 20px",marginBottom:14}}>
          <textarea autoFocus style={{...st.textarea,...serif,minHeight:220,padding:"16px 18px",borderRadius:10,resize:"vertical"}}
            value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Escribe la historia clínica de esta sesión..."/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:C.muted}}>Sesión:</span>
              {SesSelect({value:sesionSel,onChange:setSesionSel,allowCurrent:true})}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={st.btn("ghost")} onClick={()=>setAdding(false)}>Cancelar</button>
              <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={saveNew}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {entradas.length===0&&!adding&&(
        <div onClick={()=>setAdding(true)} style={{...st.card,padding:"28px 32px",...serif,color:C.dim,fontStyle:"italic",cursor:"pointer",minHeight:120}}>
          Sin registros. Haz clic para añadir la primera entrada.
        </div>
      )}

      {entradas.map(en=>(
        <div key={en.id} style={{...st.card,padding:"16px 22px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:C.accent,fontWeight:600}}>
              {en.sesion!=null?`Sesión ${en.sesion}`:"Registro inicial"}{en.fecha?` · ${en.fecha}`:""}
            </span>
            {editId!==en.id&&(
              <div style={{display:"flex",gap:6}}>
                <button style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer"}} onClick={()=>startEdit(en)}>Editar</button>
                <button style={{fontSize:11,color:"#c0392b",background:"none",border:"none",cursor:"pointer"}} onClick={()=>del(en)}>Eliminar</button>
              </div>
            )}
          </div>
          {editId===en.id?(
            <div>
              <textarea autoFocus style={{...st.textarea,...serif,minHeight:180,padding:"14px 16px",borderRadius:10,resize:"vertical"}} value={editTxt} onChange={e=>setEditTxt(e.target.value)}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,color:C.muted}}>Sesión:</span>
                  {SesSelect({value:editSes,onChange:setEditSes})}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={st.btn("ghost")} onClick={()=>setEditId(null)}>Cancelar</button>
                  <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={()=>saveEdit(en)}>Guardar</button>
                </div>
              </div>
            </div>
          ):(
            <div style={{...serif,whiteSpace:"pre-wrap",color:C.text}}>{en.texto}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function TabFormulacionCaso({patient,update}){
  const historial=patient.formulacionHistorial||{};
  const[editingKey,setEditingKey]=useState(null);
  const[txt,setTxt]=useState("");
  const[sesionSel,setSesionSel]=useState("");
  const[editEntryId,setEditEntryId]=useState(null);// id de entrada en edicion
  const[editTxt,setEditTxt]=useState("");

  const toYMD=d=>{const dd=d||new Date();return `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;};

  const openNew=key=>{setEditingKey(key);setTxt("");setSesionSel("");setEditEntryId(null);};
  const cancel=()=>{setEditingKey(null);setEditEntryId(null);};

  const saveNew=()=>{
    if(!txt.trim())return;
    const sesNum=sesionSel?Number(sesionSel):patient.sesiones.length;
    const fecha=(sesionSel&&patient.sesiones.find(s=>s.numero===sesNum)?.fecha)||toYMD(new Date());
    const entry={id:Date.now(),fecha,sesion:sesNum,texto:txt};
    update(p=>({
      ...p,
      formulacionHistorial:{
        ...p.formulacionHistorial,
        [editingKey]:[...(p.formulacionHistorial?.[editingKey]||[]),entry]
      }
    }));
    setEditingKey(null);
    setSesionSel("");
    setTxt("");
  };

  const deleteEntry=(key,id)=>{
    update(p=>({
      ...p,
      formulacionHistorial:{
        ...p.formulacionHistorial,
        [key]:(p.formulacionHistorial?.[key]||[]).filter(e=>e.id!==id)
      }
    }));
  };

  const startEditEntry=(e)=>{setEditEntryId(e.id);setEditTxt(e.texto);};
  const saveEditEntry=(key,id)=>{
    update(p=>({
      ...p,
      formulacionHistorial:{
        ...p.formulacionHistorial,
        [key]:(p.formulacionHistorial?.[key]||[]).map(e=>e.id===id?{...e,texto:editTxt}:e)
      }
    }));
    setEditEntryId(null);
  };

  const SECCIONES=[
    ["habitosDiarios","Hábitos diarios","🗓"],
    ["sueno","Sueño","🌙"],
    ["alimentacion","Alimentación","🍽"],
    ["deporte","Actividad física","🏃"],
    ["familia","Familia","👨‍👩‍👧"],
    ["relaciones","Relaciones sociales","🤝"],
    ["trabajo","Trabajo y estudios","💼"],
    ["factoresEstresantes","Factores estresantes","⚡"],
    ["factoresProtectores","Factores protectores","🛡"],
    ["otrosFactores","Otros factores relevantes","📌"],
  ];

  const sesOrdenadas=[...patient.sesiones].sort((a,b)=>b.numero-a.numero);

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {SECCIONES.map(([key,label,icon])=>{
        const entries=(historial[key]||[]).slice().sort((a,b)=>b.id-a.id);
        const isAdding=editingKey===key;
        return(
          <div key={key} style={{...st.card,overflow:"hidden",gridColumn:key==="otrosFactores"?"1 / -1":"auto"}}>
            {/* Cabecera */}
            <div style={{padding:"10px 14px",background:C.sand,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:14}}>{icon}</span>
                <span style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>{label}</span>
                {entries.length>0&&<span style={{fontSize:10,background:C.accent,color:C.bone,borderRadius:10,padding:"1px 6px"}}>{entries.length}</span>}
              </div>
              {!isAdding&&(
                <button style={{...st.btn("sm"),fontSize:11}} onClick={()=>openNew(key)}>+ Añadir</button>
              )}
            </div>

            {/* Formulario nueva entrada */}
            {isAdding&&(
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:"#fdfaf6"}}>
                <textarea
                  autoFocus
                  style={{...st.textarea,minHeight:100,fontSize:13,lineHeight:1.7}}
                  value={txt}
                  onChange={e=>setTxt(e.target.value)}
                  placeholder={`Nueva entrada sobre ${label.toLowerCase()}...`}
                />
                {/* Selector de sesión */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                  <span style={{fontSize:11,color:C.muted,flexShrink:0}}>Sesión:</span>
                  <select style={{...st.input,fontSize:11,flex:1,padding:"4px 8px"}} value={sesionSel} onChange={e=>setSesionSel(e.target.value)}>
                    <option value="">Sesión actual ({patient.sesiones.length})</option>
                    {sesOrdenadas.map(s=>(
                      <option key={s.id} value={s.numero}>Sesión {s.numero} — {s.fecha}</option>
                    ))}
                  </select>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
                  <button style={st.btn("ghost")} onClick={cancel}>Cancelar</button>
                  <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={saveNew}>Guardar</button>
                </div>
              </div>
            )}

            {/* Historial de entradas */}
            <div style={{padding:"8px 14px",minHeight:entries.length===0?48:0}}>
              {entries.length===0&&!isAdding&&(
                <div style={{fontSize:12,color:C.dim,fontStyle:"italic",padding:"8px 0",cursor:"pointer"}} onClick={()=>openNew(key)}>
                  Sin registrar. Haz clic para añadir.
                </div>
              )}
              {entries.map((e,i)=>(
                <div key={e.id} style={{marginBottom:i<entries.length-1?10:0,paddingBottom:i<entries.length-1?10:0,borderBottom:i<entries.length-1?`1px dashed ${C.border}`:"none"}}>
                  {editEntryId===e.id?(
                    <div>
                      <textarea style={{...st.textarea,minHeight:80,fontSize:13}} value={editTxt} onChange={ev=>setEditTxt(ev.target.value)} autoFocus/>
                      <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:6}}>
                        <button style={st.btn("ghost")} onClick={()=>setEditEntryId(null)}>Cancelar</button>
                        <button style={{...st.btn(),background:C.accent,color:C.bone,fontSize:11}} onClick={()=>saveEditEntry(key,e.id)}>Guardar</button>
                      </div>
                    </div>
                  ):(
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:10,color:C.accent,fontWeight:600}}>Sesión {e.sesion} · {e.fecha}</span>
                        <div style={{display:"flex",gap:6}}>
                          <button style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}} onClick={()=>startEditEntry(e)}>Editar</button>
                          <button style={{fontSize:10,color:"#c0392b",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}} onClick={()=>deleteEntry(key,e.id)}>Eliminar</button>
                        </div>
                      </div>
                      <div style={{fontSize:13,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{e.texto}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabEvolucion({patient,update}){
  const[openId,setOpenId]=useState(null);
  const[tmpl,setTmpl]=useState(0);
  const[drafts,setDrafts]=useState({});// {sesId: {trabajado, observaciones}}

  const ses=[...patient.sesiones].sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const openSes=s=>{
    setOpenId(s.id);
    setDrafts(d=>({...d,[s.id]:{trabajado:s.trabajado||"",observaciones:s.observaciones||""}}));
  };
  const closeSes=()=>setOpenId(null);

  const saveSes=s=>{
    const d=drafts[s.id]||{};
    update(p=>({...p,sesiones:p.sesiones.map(x=>x.id===s.id?{...x,trabajado:d.trabajado??x.trabajado,observaciones:d.observaciones??x.observaciones}:x)}));
    setOpenId(null);
  };

  const setField=(sid,key,val)=>setDrafts(d=>({...d,[sid]:{...d[sid],[key]:val}}));
  const applyTmpl=sid=>setDrafts(d=>({...d,[sid]:{...d[sid],trabajado:NOTE_TEMPLATES[tmpl].text}}));

  return(
    <div>
      <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Haz clic en una sesión para añadir observaciones y evolución clínica.</div>
      {ses.length===0&&<Empty text="Sin sesiones registradas. Añade sesiones en la pestaña Sesiones y pagos."/>}
      {ses.map(s=>{
        const isOpen=openId===s.id;
        const draft=drafts[s.id]||{};
        const tieneNotas=s.trabajado||s.observaciones;
        return(
          <div key={s.id} style={{marginBottom:12}}>
            {/* Cabecera de sesión — siempre visible */}
            <div
              onClick={()=>isOpen?closeSes():openSes(s)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:isOpen?C.sand:C.card,border:`1px solid ${isOpen?C.clay:C.border}`,borderRadius:isOpen?"14px 14px 0 0":14,cursor:"pointer",transition:"all 150ms"}}
            >
              <div style={{width:34,height:34,borderRadius:9,background:isOpen?C.accent:C.bone,border:`1px solid ${isOpen?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:isOpen?C.bone:C.walnut,flexShrink:0,transition:"all 150ms"}}>{s.numero}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>Sesión {s.numero} <span style={{fontWeight:400,color:C.muted}}>· {s.fecha}</span></div>
                {!isOpen&&tieneNotas&&<div style={{fontSize:12,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:480}}>{s.observaciones||s.trabajado}</div>}
                {!isOpen&&!tieneNotas&&<div style={{fontSize:12,color:C.dim,fontStyle:"italic",marginTop:2}}>Sin notas — clic para añadir</div>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {tieneNotas&&!isOpen&&<span style={st.badge(C.green,C.gD)}>✓</span>}
                <div style={{fontSize:12,color:C.muted,transition:"transform 200ms",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
              </div>
            </div>

            {/* Panel expandido */}
            {isOpen&&(
              <div style={{border:`1px solid ${C.clay}`,borderTop:"none",borderRadius:"0 0 14px 14px",background:C.bone,padding:"20px 20px 16px"}}>

                {/* Observaciones */}
                <div style={{marginBottom:18}}>
                  <label style={st.label}>Observaciones de sesión</label>
                  <textarea
                    style={{...st.textarea,minHeight:90,fontSize:13,lineHeight:1.7}}
                    placeholder="Notas rápidas, estado del paciente al llegar, actitud, factores externos..."
                    value={draft.observaciones??s.observaciones??""}
                    onChange={e=>setField(s.id,"observaciones",e.target.value)}
                  />
                </div>

                {/* Evolución clínica */}
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <label style={st.label}>Evolución clínica</label>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <span style={{fontSize:11,color:C.muted}}>Plantilla:</span>
                      {NOTE_TEMPLATES.map((t,i)=>(
                        <button key={i} style={{...st.btn("sm"),background:tmpl===i?C.accent:C.card,color:tmpl===i?C.bone:C.muted}} onClick={()=>setTmpl(i)}>{t.label}</button>
                      ))}
                      <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={()=>applyTmpl(s.id)}>Aplicar</button>
                    </div>
                  </div>
                  <textarea
                    style={{...st.textarea,minHeight:180,fontSize:13,lineHeight:1.7,fontFamily:"inherit"}}
                    placeholder="Describe lo trabajado en la sesión, técnicas utilizadas, respuesta del paciente, tareas para casa..."
                    value={draft.trabajado??s.trabajado??""}
                    onChange={e=>setField(s.id,"trabajado",e.target.value)}
                  />
                </div>

                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button style={st.btn("ghost")} onClick={closeSes}>Cancelar</button>
                  <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={()=>saveSes(s)}>Guardar sesión</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS DE CITA — gestionables (por profesional, en el futuro)
// ══════════════════════════════════════════════════════════════════════════════
const DEFAULT_TIPOS_CITA=[
  {id:"t1",nombre:"Primera llamada",duracion:30,precio:0},
  {id:"t2",nombre:"Seguimiento",duracion:60,precio:80},
  {id:"t3",nombre:"Evaluación",duracion:60,precio:80},
  {id:"t4",nombre:"Crisis",duracion:60,precio:80},
  {id:"t5",nombre:"Alta",duracion:60,precio:80},
];

function TiposCitaModal({tipos,setTipos,onClose}){
  const[editing,setEditing]=useState(null);
  const[form,setForm]=useState({nombre:"",duracion:60,precio:80});
  const openNew=()=>{setForm({nombre:"",duracion:60,precio:80});setEditing("new");};
  const openEdit=t=>{setForm({nombre:t.nombre,duracion:t.duracion,precio:t.precio||0});setEditing(t.id);};
  const save=()=>{
    if(!form.nombre.trim())return;
    if(editing==="new")setTipos(ts=>[...ts,{id:"t"+Date.now(),nombre:form.nombre,duracion:Number(form.duracion),precio:Number(form.precio)}]);
    else setTipos(ts=>ts.map(t=>t.id===editing?{...t,nombre:form.nombre,duracion:Number(form.duracion),precio:Number(form.precio)}:t));
    setEditing(null);
  };
  const del=id=>{if(tipos.length<=1){alert("Debe quedar al menos un tipo de cita.");return;}if(confirm("¿Eliminar este tipo de cita?"))setTipos(ts=>ts.filter(t=>t.id!==id));};
  return(
    <Modal onClose={onClose} title="Tipos de cita" width={460}>
      <div style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>Define el nombre, duración y precio por defecto de cada tipo. El precio se puede modificar al crear cada cita.</div>
      {tipos.map(t=>(
        <div key={t.id} style={{...st.card,marginBottom:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600}}>{t.nombre}</div>
            <div style={{fontSize:11,color:C.muted}}>{t.duracion} min · {t.precio||0}€</div>
          </div>
          <button style={st.btn("sm")} onClick={()=>openEdit(t)}>Editar</button>
          <button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(t.id)}>✕</button>
        </div>
      ))}
      <button style={{...st.btn("sm"),marginTop:6}} onClick={openNew}>+ Nuevo tipo de cita</button>
      {editing&&(
        <div style={{marginTop:18,padding:"16px",background:C.card,borderRadius:14,border:`1px solid ${C.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12,marginBottom:14}}>
            <Field label="Nombre"><input style={st.input} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Revisión, Pareja..."/></Field>
            <Field label="Duración (min)"><input type="number" step={5} min={5} style={st.input} value={form.duracion} onChange={e=>setForm(f=>({...f,duracion:e.target.value}))}/></Field>
            <Field label="Precio (€)"><input type="number" min={0} style={st.input} value={form.precio} onChange={e=>setForm(f=>({...f,precio:e.target.value}))}/></Field>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={st.btn("ghost")} onClick={()=>setEditing(null)}>Cancelar</button>
            <button style={st.btn()} onClick={save}>Guardar tipo</button>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:18}}>
        <button style={st.btn()} onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════════════════════════════════════
function CitaModal({cita,patients,tipos,onClose,onSave,onDelete,defaultFecha,defaultHora,defaultTipoId,defaultPacienteId,makeUrl}){
  const{miembros,miId}=useContext(EquipoCtx);
  // Enlace por defecto: el del profesional que lleva al paciente (o el tuyo)
  const enlaceDe=pid=>{const pa=patients.find(x=>x.id==pid);const prof=miembros.find(m=>m.id===(pa?.profesionalId||miId))||miembros.find(m=>m.id===miId);return prof?.enlace_videollamada||miembros.find(m=>m.id===miId)?.enlace_videollamada||"";};
  const[enlaceTocado,setEnlaceTocado]=useState(!!cita);
  const tipoInicial=tipos.find(t=>t.id===defaultTipoId)||tipos[0];
  const init=cita?{...cita,tipoId:cita.tipoId||tipos.find(t=>t.nombre===cita.tipo)?.id||tipos[0]?.id}:{pacienteId:defaultPacienteId||"",nombreExterno:"",telefonoExterno:"",emailExterno:"",fecha:defaultFecha||toYMD(today()),hora:defaultHora||"09:00",duracion:tipoInicial?.duracion||60,precio:tipoInicial?.precio||0,tipoId:tipoInicial?.id||tipos[0]?.id,notas:"",zoomLink:enlaceDe(defaultPacienteId),origen:"interno"};
  const[form,setForm]=useState(init);const[saving,setSaving]=useState(false);const[sendStatus,setSendStatus]=useState(null);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const tipoActual=tipos.find(t=>t.id===form.tipoId)||tipos[0];
  const esPL=tipoActual?.nombre==="Primera llamada";
  const save=async()=>{
    if(!form.fecha||!form.hora)return;if(!esPL&&!form.pacienteId)return;
    const zoomLink=(form.zoomLink||"").trim();const ff={...form,zoomLink,tipo:tipoActual?.nombre||""};
    if(makeUrl){
      setSaving(true);
      const p=patients.find(p=>p.id==form.pacienteId);
      const payload={
        tipo_evento:esPL?"primera_llamada":"sesion",
        paciente:esPL?form.nombreExterno:(p?`${p.nombre} ${p.apellidos}`:""),
        telefono:esPL?form.telefonoExterno:(p?.telefono||""),
        email:esPL?form.emailExterno:(p?.email||""),
        fecha:form.fecha,
        hora:form.hora,
        duracion:form.duracion,
        zoom_link:zoomLink,
        google_calendar:true,
      };
      // Dos webhooks paralelos: recordatorio 24h (WhatsApp) y 1h (email + WhatsApp)
      const[res24,res1h]=await Promise.all([
        postMake(makeUrl,{...payload,recordatorio:"24h",minutos_aviso:1440,canal:"whatsapp",mensaje:`Hola ${payload.paciente.split(" ")[0]}, te recordamos tu sesión de mañana a las ${form.hora}.${zoomLink?` Tu enlace: ${zoomLink}`:""}`}),
        postMake(makeUrl,{...payload,recordatorio:"1h",minutos_aviso:60,canal:"email_whatsapp",mensaje:`Hola ${payload.paciente.split(" ")[0]}, tu sesión empieza en 1 hora (${form.hora}).${zoomLink?` Únete aquí: ${zoomLink}`:""}`}),
      ]);
      setSaving(false);
      setSendStatus(res24.ok&&res1h.ok?"ok":"error");
      if(res24.ok&&res1h.ok){setTimeout(()=>onSave(ff),600);return;}
    }
    onSave(ff);
  };
  return(
    <Modal onClose={onClose} title={cita?"Editar cita":"Nueva cita"} width={520}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Tipo de cita">
          <select style={st.input} value={form.tipoId} onChange={e=>{const t=tipos.find(x=>x.id===e.target.value);setForm(p=>({...p,tipoId:e.target.value,duracion:t?.duracion||p.duracion,precio:t?.precio??p.precio}));}}>
            {tipos.map(t=><option key={t.id} value={t.id}>{t.nombre} — {t.duracion} min</option>)}
          </select>
        </Field>
        {esPL?(<div style={{padding:"12px 14px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.teal}`}}><div style={{fontSize:11,color:C.teal,fontWeight:700,marginBottom:10,textTransform:"uppercase"}}>Datos del contacto</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Nombre"><input style={st.input} value={form.nombreExterno||""} onChange={f("nombreExterno")}/></Field><Field label="Teléfono"><input style={st.input} value={form.telefonoExterno||""} onChange={f("telefonoExterno")}/></Field><div style={{gridColumn:"1/-1"}}><Field label="Email"><input style={st.input} value={form.emailExterno||""} onChange={f("emailExterno")}/></Field></div></div></div>):(<Field label="Paciente"><select style={st.input} value={form.pacienteId} onChange={e=>{const v=e.target.value;setForm(p=>({...p,pacienteId:v,zoomLink:enlaceTocado?p.zoomLink:enlaceDe(v)}));}}><option value="">Seleccionar...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>)}</select></Field>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field>
          <Field label="Hora"><select style={st.input} value={form.hora} onChange={f("hora")}>{HALF_HOURS.map(t=><option key={t}>{t}</option>)}</select></Field>
          <Field label="Duración"><select style={st.input} value={form.duracion} onChange={e=>setForm(p=>({...p,duracion:Number(e.target.value)}))}>{[15,30,45,60,75,90,120].map(d=><option key={d} value={d}>{d} min</option>)}</select></Field>
        </div>
        <Field label="Notas"><textarea style={st.textarea} value={form.notas} onChange={f("notas")}/></Field>
        <Field label="Enlace de videollamada">
          <div style={{display:"flex",gap:8}}>
            <input style={st.input} value={form.zoomLink||""} placeholder="https://… (vacío si es presencial)" onChange={e=>{setEnlaceTocado(true);setForm(p=>({...p,zoomLink:e.target.value}));}}/>
            {/^https:\/\//.test(form.zoomLink||"")&&<a href={form.zoomLink} target="_blank" rel="noreferrer" style={{...st.btn("sm"),textDecoration:"none",display:"inline-flex",alignItems:"center",flexShrink:0}}>Abrir</a>}
          </div>
          {!form.zoomLink&&!enlaceDe(form.pacienteId)&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>Guarda tu enlace fijo en «Mi videollamada» (abajo a la izquierda) y se pondrá solo en cada cita.</div>}
        </Field>
        {sendStatus==="ok"&&<div style={{padding:"8px 12px",background:C.gD,borderRadius:8,fontSize:12,color:C.green,fontWeight:600}}>✓ Enviado a Make</div>}
        {sendStatus==="error"&&<div style={{padding:"8px 12px",background:C.rD,borderRadius:8,fontSize:12,color:C.red}}>✗ Error Make — <button style={{...st.btn("sm"),color:C.red}} onClick={()=>onSave({...form,zoomLink:(form.zoomLink||"").trim(),tipo:tipoActual?.nombre||""})}>Guardar sin Make</button></div>}
      </div>
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"space-between"}}>
        <div>{cita&&<button style={st.btn("danger")} onClick={()=>onDelete(cita.id)}>Eliminar</button>}</div>
        <div style={{display:"flex",gap:10}}><button style={st.btn("ghost")} onClick={onClose}>Cancelar</button><button style={st.btn()} onClick={save} disabled={saving}>{saving?"Enviando...":"Guardar"}</button></div>
      </div>
    </Modal>
  );
}

// ── Horario editable: modal de configuración del rango horario ────────────────
function HorarioModal({horario,setHorario,onClose}){
  const[start,setStart]=useState(horario.start);
  const[end,setEnd]=useState(horario.end);
  const save=()=>{if(Number(start)>=Number(end)){alert("La hora de inicio debe ser anterior a la de fin.");return;}setHorario({start:Number(start),end:Number(end)});onClose();};
  return(
    <Modal onClose={onClose} title="Horario del calendario" width={420}>
      <div style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>Define la franja horaria visible en el calendario. Cada profesional podrá ajustar la suya.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Hora de inicio"><select style={st.input} value={start} onChange={e=>setStart(e.target.value)}>{Array.from({length:24},(_,h)=>h).map(h=><option key={h} value={h}>{hourLabel(h)}</option>)}</select></Field>
        <Field label="Hora de fin"><select style={st.input} value={end} onChange={e=>setEnd(e.target.value)}>{Array.from({length:24},(_,h)=>h+1).map(h=><option key={h} value={h}>{hourLabel(h)}</option>)}</select></Field>
      </div>
      <MFooter onCancel={onClose} onSave={save}/>
    </Modal>
  );
}

// ── TAREA MODAL ────────────────────────────────────────────────────────────────
function TareaModal({tarea,onClose,onSave,onDelete}){
  const[form,setForm]=useState({...tarea});
  const PRIORIDAD={baja:{color:"#6B8C5A",bg:"#E8EFE2",label:"Baja"},media:{color:"#C48C2A",bg:"#FDF3DC",label:"Media"},alta:{color:"#B85040",bg:"#FAEAE8",label:"Alta"}};
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  return(
    <Modal onClose={onClose} title="Editar tarea" width={480}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Título"><input style={st.input} value={form.titulo||""} onChange={f("titulo")}/></Field>
        <Field label="Descripción"><textarea style={{...st.textarea,minHeight:70}} value={form.texto||""} onChange={f("texto")}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field>
          <Field label="Hora"><TimePicker value={form.hora} onChange={v=>setForm(p=>({...p,hora:v}))}/></Field>
        </div>
        <Field label="Prioridad">
          <div style={{display:"flex",gap:6}}>
            {Object.entries(PRIORIDAD).map(([k,v])=>(
              <button key={k} onClick={()=>setForm(p=>({...p,prioridad:k}))} style={{flex:1,padding:"7px 0",borderRadius:8,border:`1px solid ${form.prioridad===k?v.color:C.border}`,background:form.prioridad===k?v.bg:"transparent",color:form.prioridad===k?v.color:C.muted,fontSize:12,cursor:"pointer",fontWeight:form.prioridad===k?600:400}}>{v.label}</button>
            ))}
          </div>
        </Field>
        {/* Marcar como hecha */}
        <div onClick={()=>setForm(p=>({...p,hecho:!p.hecho}))} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:form.hecho?C.gD:C.bone,borderRadius:10,border:`1px solid ${form.hecho?C.green:C.border}`}}>
          <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${form.hecho?C.green:C.border}`,background:form.hecho?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0}}>{form.hecho?"✓":""}</div>
          <span style={{fontSize:13,color:form.hecho?C.green:C.text,fontWeight:form.hecho?600:400}}>{form.hecho?"Marcada como hecha":"Marcar como hecha"}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"space-between"}}>
        <button style={st.btn("danger")} onClick={()=>{if(confirm("¿Eliminar tarea?"))onDelete(tarea.id);}}>Eliminar</button>
        <div style={{display:"flex",gap:8}}>
          <button style={st.btn("ghost")} onClick={onClose}>Cancelar</button>
          <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={()=>onSave(form)}>Guardar</button>
        </div>
      </div>
    </Modal>
  );
}

// ── HUECOS LIBRES — modal para compartir con pacientes ────────────────────────
function HuecosModal({fecha,citas,horario,onClose}){
  const[dias,setDias]=useState(5);
  const[copiado,setCopiado]=useState(false);

  const days=Array.from({length:dias},(_,i)=>addDays(fecha,i));

  const getHuecos=d=>{
    const ds=toYMD(d);
    const occ=citas.filter(c=>c.fecha===ds).map(c=>({s:timeToMins(c.hora),e:timeToMins(c.hora)+c.duracion}));
    const free=[];
    for(let t=horario.start*60;t+60<=horario.end*60;t+=30){
      if(!occ.some(o=>t<o.e&&t+30>o.s))free.push(minsToTime(t));
    }
    return free;
  };

  const DIAS_ES_LARGO=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

  const texto=days.map(d=>{
    const huecos=getHuecos(d);
    if(huecos.length===0)return null;
    const dn=DIAS_ES_LARGO[(d.getDay()+6)%7];
    const fecha_str=`${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
    return `${dn} ${fecha_str}: ${huecos.join(", ")}`;
  }).filter(Boolean).join("\n");

  const textoCompleto=`Hola, estos son mis próximos huecos disponibles:\n\n${texto}\n\n¿Cuál te viene mejor?`;

  const copiar=()=>{
    navigator.clipboard.writeText(textoCompleto);
    setCopiado(true);
    setTimeout(()=>setCopiado(false),2000);
  };

  return(
    <Modal onClose={onClose} title="Huecos libres para compartir" width={480}>
      <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Genera un mensaje listo para enviar a tus pacientes por WhatsApp o email.</div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        <label style={{...st.label,marginBottom:0,lineHeight:"28px"}}>Mostrar</label>
        {[[3,"3 días"],[5,"5 días"],[7,"1 semana"]].map(([n,l])=>(
          <button key={n} onClick={()=>setDias(n)} style={{...st.btn("sm"),background:dias===n?C.accent:C.bone,color:dias===n?C.bone:C.muted,border:`1px solid ${dias===n?C.accent:C.border}`}}>{l}</button>
        ))}
      </div>

      {texto?(<>
        <div style={{background:C.bone,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",marginBottom:16,whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.7,color:C.text}}>
          {textoCompleto}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button style={st.btn("ghost")} onClick={onClose}>Cerrar</button>
          <button style={{...st.btn(),background:copiado?C.green:C.accent,color:C.bone}} onClick={copiar}>
            {copiado?"✓ Copiado":"📋 Copiar mensaje"}
          </button>
        </div>
      </>):(
        <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>No hay huecos disponibles en este período.</div>
      )}
    </Modal>
  );
}


// ── AGENDA PERSONAL (reutilizable en Dashboard y Calendario) ──────────────────
const PRIORIDAD_T={
  baja: {color:C.green,bg:C.gD,label:"Baja"},
  media:{color:C.amber,bg:C.amD,label:"Media"},
  alta: {color:C.red,  bg:C.rD, label:"Alta"},
};
function AgendaPersonalPanel({tareas,setTareas,onEditTarea,fechaDefault}){
  const blank=()=>({titulo:"",texto:"",hora:"",prioridad:"media",fecha:fechaDefault||toYMD(today())});
  const[show,setShow]=useState(false);
  const[form,setForm]=useState(blank());
  const add=()=>{
    if(!form.titulo.trim()||!form.hora)return;
    setTareas(ts=>[...ts,{id:Date.now(),...form,hecho:false}]);
    setForm(blank());setShow(false);
  };
  const toggle=id=>setTareas(ts=>ts.map(t=>t.id===id?{...t,hecho:!t.hecho}:t));
  const del=id=>setTareas(ts=>ts.filter(t=>t.id!==id));
  const lista=[...tareas].sort((a,b)=>a.fecha.localeCompare(b.fecha)||(a.hora||"").localeCompare(b.hora||""));
  return(
    <div style={st.card}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Agenda personal</span>
        <button style={{...st.btn("sm"),background:C.accent,color:C.bone,fontSize:12}} onClick={()=>{setForm(blank());setShow(v=>!v);}}>+ Tarea</button>
      </div>
      {show&&(
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.bone,display:"flex",flexDirection:"column",gap:8}}>
          <div><label style={st.label}>Título</label>
            <input style={{...st.input,fontSize:13}} placeholder="Título de la tarea..." value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}/>
          </div>
          <div><label style={st.label}>Descripción</label>
            <textarea style={{...st.textarea,minHeight:56,fontSize:13}} placeholder="Opcional..." value={form.texto} onChange={e=>setForm(f=>({...f,texto:e.target.value}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div><label style={st.label}>Fecha</label><input type="date" style={{...st.input,fontSize:12}} value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/></div>
            <div><label style={st.label}>Hora</label><TimePicker value={form.hora} onChange={v=>setForm(f=>({...f,hora:v}))}/></div>
          </div>
          <div><label style={st.label}>Prioridad</label>
            <div style={{display:"flex",gap:5}}>
              {Object.entries(PRIORIDAD_T).map(([k,v])=>(
                <button key={k} onClick={()=>setForm(f=>({...f,prioridad:k}))} style={{flex:1,padding:"5px 0",borderRadius:8,border:`1px solid ${form.prioridad===k?v.color:C.border}`,background:form.prioridad===k?v.bg:"transparent",color:form.prioridad===k?v.color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"'Manrope',sans-serif"}}>{v.label}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button style={{...st.btn("ghost"),flex:1,fontSize:12}} onClick={()=>setShow(false)}>Cancelar</button>
            <button style={{...st.btn(),flex:1,fontSize:12}} onClick={add}>Añadir</button>
          </div>
        </div>
      )}
      {lista.length===0&&!show&&<div style={{padding:"16px",fontSize:13,color:C.dim,textAlign:"center",fontStyle:"italic"}}>Sin tareas pendientes</div>}
      {lista.map(t=>(
        <div key={t.id} onClick={()=>onEditTarea&&onEditTarea(t)} style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-start",opacity:t.hecho?0.5:1,cursor:onEditTarea?"pointer":"default"}}>
          <div onClick={e=>{e.stopPropagation();toggle(t.id);}} style={{width:16,height:16,borderRadius:4,border:`2px solid ${t.hecho?PRIORIDAD_T[t.prioridad]?.color:C.border}`,background:t.hecho?PRIORIDAD_T[t.prioridad]?.bg:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:PRIORIDAD_T[t.prioridad]?.color}}>{t.hecho?"✓":""}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:t.hecho?C.muted:C.text,textDecoration:t.hecho?"line-through":"none",lineHeight:1.4}}>{t.titulo||t.texto}</div>
            {t.titulo&&t.texto&&<div style={{fontSize:12,color:C.muted,marginTop:2,lineHeight:1.4}}>{t.texto}</div>}
            <div style={{fontSize:11,color:C.dim,marginTop:2}}>{t.fecha} · {t.hora}</div>
          </div>
          <div style={{width:6,height:6,borderRadius:"50%",background:PRIORIDAD_T[t.prioridad]?.color,flexShrink:0,marginTop:6}}/>
          <button onClick={e=>{e.stopPropagation();del(t.id);}} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:12,padding:"0 2px"}}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Mi videollamada: cada profesional guarda su enlace fijo ───────────────────
function MiVideollamadaModal({yo,demo,onClose,onGuardado,onDemo}){
  const[enlace,setEnlace]=useState(yo.enlace_videollamada||"");
  const[err,setErr]=useState("");const[guardando,setGuardando]=useState(false);
  const guardar=async()=>{
    if(demo){onDemo();return;}
    const e=enlace.trim();
    if(e&&!/^https:\/\/\S+$/i.test(e)){setErr("El enlace debe empezar por https://");return;}
    setGuardando(true);setErr("");
    const{error}=await supabase.rpc("guardar_mi_enlace",{p_enlace:e});
    setGuardando(false);
    if(error){setErr(traducirError(error));return;}
    onGuardado(e||null);
  };
  const ej=[["Zoom","Tu sala personal: en Zoom › Perfil › «ID de reunión personal», copia el enlace (zoom.us/j/…)."],
            ["Google Meet","Crea una reunión desde Google Calendar o meet.google.com › «Crear una reunión para más tarde» y copia el enlace (meet.google.com/…)."],
            ["Teams, Doxy.me u otra","Copia el enlace fijo de tu sala."]];
  return(
    <Modal onClose={onClose} title="Mi videollamada" width={520}>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:14}}>Pega el enlace fijo de tu sala de videollamada. Se pondrá solo en cada cita nueva de tus pacientes y podrás cambiarlo en una cita concreta.</div>
      <Field label="Enlace"><input style={st.input} value={enlace} onChange={e=>{setEnlace(e.target.value);setErr("");}} placeholder="https://zoom.us/j/… o https://meet.google.com/…" autoFocus/></Field>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
        {ej.map(([t,d])=><div key={t} style={{fontSize:12,color:C.text,lineHeight:1.5}}><b>{t}:</b> <span style={{color:C.muted}}>{d}</span></div>)}
      </div>
      <div style={{fontSize:12,color:C.walnut,background:C.sand,borderRadius:8,padding:"8px 12px",marginTop:14,lineHeight:1.5}}>Usa una cuenta profesional con acuerdo de protección de datos (por ejemplo Zoom de pago o Google Workspace): en la sesión se tratan datos de salud.</div>
      <Aviso>{err}</Aviso>
      <MFooter onCancel={onClose} onSave={guardar} saving={guardando}/>
    </Modal>
  );
}

// ── REJILLA HORARIA (Día y Semana comparten esta pieza) ──────────────────────
const SLOT_H=42;
const CITA_BG="#FAF6F0";
function TimeGrid({days,citas,patients,horario,onNew,onEdit,showHeader}){
  const todayStr=toYMD(today());
  const slots=[];
  for(let h=horario.start;h<horario.end;h++){slots.push(`${pad(h)}:00`);slots.push(`${pad(h)}:30`);}
  const totalH=slots.length*SLOT_H;
  const cols=`64px repeat(${days.length},1fr)`;
  const nameOf=c=>{const p=patients.find(p=>p.id==c.pacienteId);return c.origen==="calendly"||!p?(c.nombreExterno||"Primera llamada"):`${p.nombre} ${p.apellidos}`;};
  return(
    <div>
      <div style={{overflowY:"auto",maxHeight:"68vh"}}>
      {showHeader&&(
        <div style={{display:"grid",gridTemplateColumns:cols,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:3,background:C.card}}>
          <div/>
          {days.map((d,i)=>{const ds=toYMD(d);const isT=ds===todayStr;return(
            <div key={i} style={{padding:"10px 6px",textAlign:"center",borderLeft:`1px solid ${C.border}`,background:isT?"rgba(166,107,63,0.09)":"transparent"}}>
              <div style={{fontSize:12,color:isT?C.accent:C.walnut,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>{DAYS_ES[(d.getDay()+6)%7]}</div>
              <div style={{fontSize:16,fontWeight:isT?700:400,color:isT?C.accent:C.text,marginTop:2}}>{d.getDate()}</div>
            </div>
          );})}
        </div>
      )}
        <div style={{display:"grid",gridTemplateColumns:cols,position:"relative"}}>
          {/* Columna de horas */}
          <div>
            {slots.map(t=>(
              <div key={t} style={{height:SLOT_H,boxSizing:"border-box",borderBottom:`1px solid ${C.border}`,fontSize:13,color:t.endsWith(":00")?C.walnut:C.dim,fontWeight:t.endsWith(":00")?600:400,display:"flex",alignItems:"center",justifyContent:"center"}}>{t}</div>
            ))}
          </div>
          {/* Columnas de días */}
          {days.map((d,i)=>{
            const ds=toYMD(d);const isT=ds===todayStr;
            const dc=citas.filter(c=>c.fecha===ds);
            return(
              <div key={i} style={{position:"relative",height:totalH,borderLeft:`1px solid ${C.border}`,background:isT&&days.length>1?"rgba(166,107,63,0.03)":"transparent"}}>
                {slots.map(t=>(
                  <div key={t} onClick={()=>onNew(d,t)} style={{height:SLOT_H,boxSizing:"border-box",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(166,107,63,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}/>
                ))}
                {dc.map(c=>{
                  const top=(timeToMins(c.hora)-horario.start*60)/30*SLOT_H;
                  const h=Math.max(SLOT_H,(c.duracion||60)/30*SLOT_H);
                  if(top<0||top>=totalH)return null;
                  const compact=h<SLOT_H*2;
                  const caja={position:"absolute",top:top+2,left:3,right:3,height:h-4,background:CITA_BG,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,borderRadius:6,boxSizing:"border-box",overflow:"hidden",cursor:"pointer",boxShadow:"0 1px 2px rgba(59,42,30,0.06)"};
                  // Citas cortas (≤45 min): todo en una línea para que no se corte
                  if(compact)return(
                    <div key={c.id} title={`${c.hora} · ${nameOf(c)} · ${c.tipo||"Cita"}`} onClick={e=>{e.stopPropagation();onEdit(c);}}
                      style={{...caja,padding:"0 10px",display:"flex",alignItems:"center",justifyContent:days.length>1?"flex-start":"center",gap:8,whiteSpace:"nowrap"}}>
                      {days.length===1&&<span style={{fontSize:12,color:C.muted,fontWeight:600,flexShrink:0}}>{c.hora}</span>}
                      <span style={{fontSize:days.length>1?13:14,fontWeight:700,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{nameOf(c)}</span>
                      {days.length===1&&<span style={{fontSize:13,color:C.walnut,flexShrink:0}}>· {c.tipo||"Cita"}</span>}
                    </div>
                  );
                  return(
                    <div key={c.id} onClick={e=>{e.stopPropagation();onEdit(c);}}
                      style={{...caja,padding:"8px 10px",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.ink,lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:days.length>1?"nowrap":"normal"}}>{nameOf(c)}</div>
                      <div style={{fontSize:13,color:C.walnut,marginTop:2}}>{c.tipo||"Cita"}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.hora}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDARIO — Día / Semana / Mes
// ══════════════════════════════════════════════════════════════════════════════
function Calendario({patients,citas,setCitas,config,setConfig,tipos,horario,tareas,setTareas}){
  const[view,setView]=useState("day");
  const[date,setDate]=useState(today());
  const[citaM,setCitaM]=useState(null);
  const[editTarea,setEditTarea]=useState(null);
  const todayStr=toYMD(today());

  const openNew=(d,h,tipoId)=>setCitaM({cita:null,defaultFecha:toYMD(d),defaultHora:typeof h==="number"?`${pad(h)}:00`:h||"09:00",defaultTipoId:tipoId||tipos[0]?.id});
  const openEdit=c=>setCitaM({cita:c,defaultFecha:c.fecha,defaultHora:c.hora,defaultTipoId:c.tipoId});
  const saveCita=form=>{if(form.id)setCitas(cs=>cs.map(c=>c.id===form.id?{...c,...form}:c));else setCitas(cs=>[...cs,{...form,id:Date.now(),pacienteId:form.pacienteId?Number(form.pacienteId):null}]);setCitaM(null);};
  const delCita=id=>{setCitas(cs=>cs.filter(c=>c.id!==id));setCitaM(null);};

  const nav=dir=>{const d=new Date(date);if(view==="week")d.setDate(d.getDate()+dir*7);else if(view==="month"){d.setDate(1);d.setMonth(d.getMonth()+dir);}else d.setDate(d.getDate()+dir);setDate(d);};
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const navLabel=()=>{
    if(view==="week"){const ws=startOfWeek(date);const we=addDays(ws,6);return`${ws.getDate()} ${MONTHS_ES[ws.getMonth()]} – ${we.getDate()} ${MONTHS_ES[we.getMonth()]} ${we.getFullYear()}`;}
    if(view==="month")return`${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
    return cap(date.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}));
  };
  const nameOf=c=>{const p=patients.find(p=>p.id==c.pacienteId);return c.origen==="calendly"||!p?(c.nombreExterno||"Primera llamada"):`${p.nombre} ${p.apellidos}`;};

  const CitasList=({lista,titulo,conFecha})=>(
    <div style={{...st.card,padding:"14px 16px"}}>
      <div style={{fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:10}}>{titulo}</div>
      {lista.length===0&&<div style={{fontSize:13,color:C.muted,fontStyle:"italic"}}>Sin citas</div>}
      {lista.map(c=>(
        <div key={c.id} onClick={()=>openEdit(c)} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,cursor:"pointer"}}>
          <Avatar nombre={nameOf(c)} apellidos="" size={28}/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nameOf(c)}</div>
            <div style={{fontSize:11,color:C.muted}}>{conFecha?`${c.fecha.slice(8,10)}/${c.fecha.slice(5,7)} · `:""}{c.hora} · {c.duracion}min</div>
          </div>
        </div>
      ))}
    </div>
  );

  const Stat=({val,label})=>(
    <div style={st.statCard}>
      <div style={{fontSize:28,fontWeight:700,color:C.accent,lineHeight:1}}>{val}</div>
      <div style={{fontSize:13,color:C.muted,marginTop:6}}>{label}</div>
    </div>
  );

  // Vista Día
  const DayV=()=>{
    const ds=toYMD(date);
    const dc=[...citas.filter(c=>c.fecha===ds)].sort((a,b)=>a.hora.localeCompare(b.hora));
    return(
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:16,alignItems:"start"}}>
        <div style={{...st.card,overflow:"hidden",maxWidth:860,width:"100%",margin:"0 auto"}}>
          <TimeGrid days={[date]} citas={citas} patients={patients} horario={horario} onNew={openNew} onEdit={openEdit}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Stat val={dc.length} label={["Hoy","Mañana","Ayer"].includes(etiquetaDia(date))?`Citas ${etiquetaDia(date).toLowerCase()}`:`Citas el ${etiquetaDia(date).toLowerCase()}`}/>
          <CitasList lista={dc} titulo="Citas del día"/>
          <AgendaPersonalPanel tareas={tareas} setTareas={setTareas} onEditTarea={setEditTarea} fechaDefault={ds}/>
        </div>
      </div>
    );
  };

  // Vista Semana (lunes a domingo)
  const WeekV=()=>{
    const ws=startOfWeek(date);
    const days=Array.from({length:7},(_,i)=>addDays(ws,i));
    const keys=days.map(toYMD);
    const cw=[...citas.filter(c=>keys.includes(c.fecha))].sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
    return(
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:16,alignItems:"start"}}>
        <div style={{...st.card,overflow:"hidden"}}>
          <TimeGrid days={days} citas={citas} patients={patients} horario={horario} onNew={openNew} onEdit={openEdit} showHeader/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Stat val={cw.length} label={{"Esta semana":"Citas esta semana","Siguiente":"Citas la semana siguiente","Anterior":"Citas la semana anterior"}[etiquetaSemana(date)]||`Citas · ${etiquetaSemana(date).toLowerCase()}`}/>
          <CitasList lista={cw} titulo="Citas de la semana" conFecha/>
          <AgendaPersonalPanel tareas={tareas} setTareas={setTareas} onEditTarea={setEditTarea}/>
        </div>
      </div>
    );
  };

  // Vista Mes
  const MonthV=()=>{
    const first=new Date(date.getFullYear(),date.getMonth(),1);
    const gridStart=startOfWeek(first);
    const cells=Array.from({length:42},(_,i)=>addDays(gridStart,i));
    const mesKey=`${date.getFullYear()}-${pad(date.getMonth()+1)}`;
    const cm=[...citas.filter(c=>c.fecha.startsWith(mesKey))].sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
    return(
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:16,alignItems:"start"}}>
        <div style={{...st.card,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:`1px solid ${C.border}`}}>
            {DAYS_ES.map(d=><div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {cells.map((d,i)=>{
              const ds=toYMD(d);const inMonth=d.getMonth()===date.getMonth();const isT=ds===todayStr;
              const n=citas.filter(c=>c.fecha===ds).length;
              return(
                <div key={i} onClick={()=>{setDate(d);setView("day");}}
                  style={{minHeight:84,padding:"8px 10px",borderLeft:i%7?`1px solid ${C.border}`:"none",borderTop:i>=7?`1px solid ${C.border}`:"none",cursor:"pointer",background:isT?"rgba(166,107,63,0.09)":"transparent",opacity:inMonth?1:0.4}}
                  onMouseEnter={e=>{if(!isT)e.currentTarget.style.background="rgba(166,107,63,0.05)";}}
                  onMouseLeave={e=>{if(!isT)e.currentTarget.style.background="transparent";}}>
                  <div style={{fontSize:14,fontWeight:isT?700:500,color:isT?C.accent:C.text}}>{d.getDate()}</div>
                  {n>0&&<div style={{marginTop:8,display:"inline-block",fontSize:11,fontWeight:600,color:C.accent,background:C.sand,borderRadius:999,padding:"2px 8px"}}>{n} {n===1?"cita":"citas"}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Stat val={cm.length} label="Citas este mes"/>
          <AgendaPersonalPanel tareas={tareas} setTareas={setTareas} onEditTarea={setEditTarea}/>
        </div>
      </div>
    );
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Calendario</div>
        <button style={st.btn()} onClick={()=>openNew(date,"09:00",tipos[0]?.id)}>+ Añadir</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:16,marginBottom:16,alignItems:"center"}}>
       <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:10}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <button style={st.btn("sm")} onClick={()=>nav(-1)}>‹</button>
        <button title="Volver a hoy" style={{...st.btn("sm"),background:C.bone,color:C.muted,minWidth:96}} onClick={()=>setDate(today())}>{view==="week"?etiquetaSemana(date):view==="month"?etiquetaMes(date):etiquetaDia(date)}</button>
        <button style={st.btn("sm")} onClick={()=>nav(1)}>›</button>
        </div>
        <div style={{fontSize:15,fontWeight:700,textAlign:"center",whiteSpace:"nowrap"}}>{navLabel()}</div>
        <div/>
       </div>
        <div style={{justifySelf:"end",display:"flex",gap:3,background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,padding:3}}>
          {[["day","Día"],["week","Semana"],["month","Mes"]].map(([v,l])=><button key={v} style={{...st.btn("sm"),background:view===v?C.aD:"transparent",color:view===v?C.bone:C.muted,border:"none"}} onClick={()=>setView(v)}>{l}</button>)}
        </div>
      </div>
      {view==="day"?DayV():view==="week"?WeekV():MonthV()}
      {citaM&&<CitaModal cita={citaM.cita} patients={patients} tipos={tipos} defaultFecha={citaM.defaultFecha} defaultHora={citaM.defaultHora} defaultTipoId={citaM.defaultTipoId} makeUrl={config.makeOut} onClose={()=>setCitaM(null)} onSave={saveCita} onDelete={delCita}/>}
      {editTarea&&<TareaModal tarea={editTarea} onClose={()=>setEditTarea(null)} onSave={t=>{setTareas(ts=>ts.map(x=>x.id===t.id?t:x));setEditTarea(null);}} onDelete={id=>{setTareas(ts=>ts.filter(t=>t.id!==id));setEditTarea(null);}}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PACIENTES
// ══════════════════════════════════════════════════════════════════════════════
function Pacientes({patients,setPatients,onSelect,autoNew,onAutoNewDone}){
  const{esAdmin,miembros,miId}=useContext(EquipoCtx);
  const nombreProf=id=>miembros.find(m=>m.id===id)?.nombre||"Sin asignar";
  const[editP,setEditP]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[showM,setShowM]=useState(false);const[form,setForm]=useState(mkPatient());const[editId,setEditId]=useState(null);const[filtro,setFiltro]=useState("todos");
  const openNew=()=>{setForm({...mkPatient(),profesionalId:miId});setEditId(null);setShowM(true);};
  useEffect(()=>{if(autoNew){openNew();onAutoNewDone&&onAutoNewDone();}},[autoNew]);
  const openEdit=(p,e)=>{e.stopPropagation();setForm({...p});setEditId(p.id);setShowM(true);};
  const save=()=>{if(!form.nombre)return;if(editId)setPatients(ps=>ps.map(p=>p.id===editId?{...p,...form}:p));else setPatients(ps=>[...ps,{...mkPatient(),...form,id:Date.now(),profesionalId:esAdmin?(form.profesionalId||miId):miId}]);setShowM(false);};
  const del=(id,e)=>{e.stopPropagation();if(confirm("¿Eliminar este paciente?\n\nSe eliminarán todas las sesiones, evolución clínica y facturas. No se puede deshacer."))setPatients(ps=>ps.filter(p=>p.id!==id));};
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const lista=filtro==="todos"?patients:patients.filter(p=>p.estado===filtro);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.5px"}}>Pacientes</div><div style={{color:C.muted,fontSize:13}}>{patients.length} registrados</div></div><div style={{display:"flex",gap:8}}><select style={{...st.input,width:130}} value={filtro} onChange={e=>setFiltro(e.target.value)}><option value="todos">Todos</option><option value="activo">Activos</option><option value="alta">Con alta</option><option value="inactivo">Inactivos</option></select><button style={st.btn()} onClick={openNew}>+ Nuevo paciente</button></div></div><div style={st.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={st.th}>Paciente</th><th style={st.th}>Teléfono</th><th style={st.th}>Sesiones</th><th style={st.th}>Estado</th><th style={st.th}>Consentimiento</th><th style={st.th}>Docs</th>{esAdmin&&<th style={st.th}>Profesional</th>}<th style={st.th}>Acciones</th></tr></thead><tbody>{lista.map(p=>(<tr key={p.id} onClick={()=>onSelect(p.id)} style={{cursor:"pointer"}}><td style={st.td}><div style={{display:"flex",gap:10,alignItems:"center"}}><Avatar nombre={p.nombre} apellidos={p.apellidos} size={34}/><div><div style={{fontWeight:600}}>{p.nombre} {p.apellidos}</div><div style={{fontSize:11,color:C.muted}}>{p.email}</div></div></div></td><td style={st.td}>{p.telefono}</td><td style={st.td}><span style={st.badge(C.accent,C.sand)}>{p.sesiones.length}</span></td><td style={st.td}><span style={st.badge(p.estado==="activo"?C.green:p.estado==="alta"?C.walnut:C.muted,p.estado==="activo"?C.gD:p.estado==="alta"?C.sand:C.card)}>{p.estado}</span></td><td style={st.td}><span style={st.badge(p.consentimiento?C.green:C.amber,p.consentimiento?C.gD:C.amD)}>{p.consentimiento?"✓":"Pendiente"}</span></td><td style={st.td}><span style={st.badge(C.muted,C.card)}>{(p.documentos||[]).length}</span></td>{esAdmin&&<td style={{...st.td,fontSize:12,color:C.walnut}}>{nombreProf(p.profesionalId)}</td>}<td style={st.td}><div style={st.rowActions}><button style={st.btn("sm")} onClick={e=>{e.stopPropagation();onSelect(p.id);}}>Ver ficha</button><button style={st.btn("sm")} onClick={e=>openEdit(p,e)}>Editar</button>{esAdmin&&<button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={e=>del(p.id,e)}>Eliminar</button>}</div></td></tr>))}</tbody></table></div>{showM&&<Modal onClose={()=>setShowM(false)} title={editId?"Editar paciente":"Nuevo paciente"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Nombre"><input style={st.input} value={form.nombre} onChange={f("nombre")}/></Field><Field label="Apellidos"><input style={st.input} value={form.apellidos} onChange={f("apellidos")}/></Field><Field label="Teléfono"><input style={st.input} value={form.telefono} onChange={f("telefono")}/></Field><Field label="Email"><input style={st.input} value={form.email} onChange={f("email")}/></Field><Field label="Fecha nacimiento"><input type="date" style={st.input} value={form.fechaNacimiento} onChange={f("fechaNacimiento")}/></Field><Field label="Estado"><select style={st.input} value={form.estado} onChange={f("estado")}><option value="activo">Activo</option><option value="alta">Alta</option><option value="inactivo">Inactivo</option></select></Field>{esAdmin&&<Field label="Profesional asignado"><select style={st.input} value={form.profesionalId||""} onChange={f("profesionalId")}>{miembros.filter(m=>m.activo||m.id===form.profesionalId).map(m=><option key={m.id} value={m.id}>{m.nombre}{m.id===miId?" (tú)":""}</option>)}</select></Field>}</div><MFooter onCancel={()=>setShowM(false)} onSave={save}/></Modal>}</div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function Configuracion({horario,setHorario,tipos,setTipos}){
  const[editTipo,setEditTipo]=useState(null);
  const[tipoForm,setTipoForm]=useState({nombre:"",duracion:60});
  const[horarioForm,setHorarioForm]=useState({start:horario.start,end:horario.end});

  const saveHorario=()=>{
    if(Number(horarioForm.start)>=Number(horarioForm.end)){alert("La hora de inicio debe ser anterior a la de fin.");return;}
    setHorario({start:Number(horarioForm.start),end:Number(horarioForm.end)});
  };
  const openNewTipo=()=>{setTipoForm({nombre:"",duracion:60});setEditTipo("new");};
  const openEditTipo=t=>{setTipoForm({nombre:t.nombre,duracion:t.duracion});setEditTipo(t.id);};
  const saveTipo=()=>{
    if(!tipoForm.nombre.trim())return;
    if(editTipo==="new")setTipos(ts=>[...ts,{id:"t"+Date.now(),nombre:tipoForm.nombre,duracion:Number(tipoForm.duracion)}]);
    else setTipos(ts=>ts.map(t=>t.id===editTipo?{...t,nombre:tipoForm.nombre,duracion:Number(tipoForm.duracion)}:t));
    setEditTipo(null);
  };
  const delTipo=id=>{if(tipos.length<=1){alert("Debe quedar al menos un tipo de cita.");return;}if(confirm("¿Eliminar?"))setTipos(ts=>ts.filter(t=>t.id!==id));};

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Configuración</div>
        <div style={{color:C.muted,fontSize:13,marginTop:2}}>Horario y tipos de cita del consultorio</div>
      </div>

      {/* Horario */}
      <div style={{...st.card,padding:"22px 26px",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>Horario del calendario</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Define la franja horaria visible en el calendario. Más adelante cada profesional podrá tener la suya.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:14,alignItems:"flex-end"}}>
          <Field label="Hora de inicio">
            <select style={st.input} value={horarioForm.start} onChange={e=>setHorarioForm(h=>({...h,start:Number(e.target.value)}))}>
              {Array.from({length:24},(_,h)=>h).map(h=><option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
          </Field>
          <Field label="Hora de fin">
            <select style={st.input} value={horarioForm.end} onChange={e=>setHorarioForm(h=>({...h,end:Number(e.target.value)}))}>
              {Array.from({length:24},(_,h)=>h+1).map(h=><option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
          </Field>
          <button style={{...st.btn(),marginBottom:1}} onClick={saveHorario}>Guardar</button>
        </div>
        <div style={{marginTop:14,fontSize:12,color:C.muted,padding:"8px 12px",background:C.bone,borderRadius:8,border:`1px solid ${C.border}`,display:"inline-block"}}>
          Horario actual: <strong style={{color:C.text}}>{hourLabel(horario.start)} – {hourLabel(horario.end)}</strong> ({(horario.end-horario.start)*2} franjas de 30 min)
        </div>
      </div>

      {/* Tipos de cita */}
      <div style={{...st.card,padding:"22px 26px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontSize:15,fontWeight:600}}>Tipos de cita</div>
          <button style={st.btn()} onClick={openNewTipo}>+ Nuevo tipo</button>
        </div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Cada tipo tiene nombre y duración. Se pueden añadir o eliminar en cualquier momento. Más adelante cada profesional tendrá los suyos.</div>

        {tipos.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{t.nombre}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{t.duracion} min</div>
            </div>
            <button style={st.btn("sm")} onClick={()=>openEditTipo(t)}>Editar</button>
            <button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>delTipo(t.id)}>Eliminar</button>
          </div>
        ))}

        {editTipo&&(
          <div style={{marginTop:16,padding:"18px 20px",background:C.card,borderRadius:14,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:C.walnut}}>{editTipo==="new"?"Nuevo tipo de cita":"Editar tipo de cita"}</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:14}}>
              <Field label="Nombre"><input style={st.input} value={tipoForm.nombre} onChange={e=>setTipoForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Revisión, Pareja, Grupo..."/></Field>
              <Field label="Duración (min)"><input type="number" step={5} min={5} style={st.input} value={tipoForm.duracion} onChange={e=>setTipoForm(f=>({...f,duracion:e.target.value}))}/></Field>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={st.btn("ghost")} onClick={()=>setEditTipo(null)}>Cancelar</button>
              <button style={st.btn()} onClick={saveTipo}>Guardar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FACTURAS
// ══════════════════════════════════════════════════════════════════════════════
function Facturas({patients,setPatients}){
  const[filtro,setFiltro]=useState("todas");
  const[busqueda,setBusqueda]=useState("");
  const[viewF,setViewF]=useState(null);
  const[editF,setEditF]=useState(null);
  const[editPago,setEditPago]=useState("");
  const[showIA,setShowIA]=useState(false);

  const updateImporte=(sesId,pacId,nuevoPago)=>{
    setPatients(ps=>ps.map(p=>p.id===pacId?{...p,sesiones:p.sesiones.map(s=>s.id===sesId?{...s,pago:Number(nuevoPago)}:s)}:p));
    setEditF(null);
  };

  const todasFacturas=useMemo(()=>
    patients.flatMap(p=>p.sesiones.map(s=>({
      ...s,
      pacienteNombre:`${p.nombre} ${p.apellidos}`,
      pacienteId:p.id,
      email:p.email,
      telefono:p.telefono,
    }))).sort((a,b)=>b.fecha.localeCompare(a.fecha))
  ,[patients]);

  const filtradas=todasFacturas
    .filter(f=>filtro==="todas"||( filtro==="pagadas"&&f.pagado)||(filtro==="pendientes"&&!f.pagado))
    .filter(f=>!busqueda||f.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase())||f.factura.toLowerCase().includes(busqueda.toLowerCase()));

  const totalCobrado=todasFacturas.filter(f=>f.pagado).reduce((a,f)=>a+f.pago,0);
  const totalPendiente=todasFacturas.filter(f=>!f.pagado).reduce((a,f)=>a+f.pago,0);

  const printFactura=f=>{
    const paciente=patients.find(p=>p.sesiones.some(s=>s.id===f.id));
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${f.factura}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:13px;color:#3B2A1E;background:#F5EFE4;padding:40px;max-width:600px;margin:0 auto;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;}
      .brand{font-size:28px;font-weight:300;color:#A66B3F;letter-spacing:-1px;}
      .brand-sub{font-size:10px;color:#9A7E68;letter-spacing:3px;text-transform:uppercase;margin-top:3px;}
      .fac-num{text-align:right;}
      .fac-num .num{font-size:20px;font-weight:700;color:#3B2A1E;}
      .fac-num .date{font-size:12px;color:#9A7E68;margin-top:4px;}
      .divider{border:none;border-top:1px solid #D9C9A8;margin:20px 0;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;}
      .block .lbl{font-size:10px;color:#9A7E68;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;}
      .block .val{font-size:13px;color:#3B2A1E;line-height:1.6;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th{background:#EBE3D2;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B4A30;}
      td{padding:12px 14px;border-bottom:1px solid #D9C9A8;font-size:13px;}
      .total-row{background:#EBE3D2;}
      .total-row td{font-weight:700;font-size:15px;padding:14px;}
      .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;}
      .pagado{background:#E8EFE2;color:#4A6438;}
      .pendiente{background:#FDF3DC;color:#8A5F1B;}
      footer{margin-top:40px;font-size:10px;color:#B89271;border-top:1px solid #D9C9A8;padding-top:12px;text-align:center;}
      @media print{body{padding:20px;background:white;}}
    </style></head><body>
    <div class="header">
      <div><img src="${PRAXI_LOGO}" alt="praXi" style="height:44px;display:block"/></div>
      <div class="fac-num"><div class="num">${f.factura}</div><div class="date">Fecha: ${f.fecha}</div></div>
    </div>
    <hr class="divider"/>
    <div class="grid">
      <div class="block"><div class="lbl">Facturado a</div><div class="val"><strong>${f.pacienteNombre}</strong><br/>${f.email||""}<br/>${f.telefono||""}</div></div>
      <div class="block"><div class="lbl">Profesional</div><div class="val">Consulta psicológica</div></div>
    </div>
    <table>
      <thead><tr><th>Descripción</th><th style="text-align:right">Importe</th></tr></thead>
      <tbody>
        <tr><td>Sesión nº ${f.numero} de psicología / atención clínica<br/><span style="font-size:11px;color:#9A7E68">Fecha: ${f.fecha}</span></td><td style="text-align:right">${f.pago.toFixed(2)} €</td></tr>
        <tr class="total-row"><td>Total</td><td style="text-align:right">${f.pago.toFixed(2)} €</td></tr>
      </tbody>
    </table>
    <div style="text-align:center;margin-bottom:24px"><span class="badge ${f.pagado?"pagado":"pendiente"}">${f.pagado?"✓ Pagado":"⏳ Pendiente de pago"}</span></div>
    <footer>Praxi · Gestión Clínica · ${f.factura} · Generada el ${toYMD(new Date())}</footer>
    </body></html>`;
    const win=window.open("","_blank");win.document.write(html);win.document.close();setTimeout(()=>win.print(),400);
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Facturas</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>{todasFacturas.length} facturas emitidas</div>
        </div>
        {IA_VISIBLE&&<button style={{...st.btn("sm"),background:C.accent,color:C.bone}} onClick={()=>setShowIA(v=>!v)}>✦ IA</button>}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:22}}>
        <StatCard val={todasFacturas.length} label="Total facturas" color={C.aL}/>
        <StatCard val={`${totalCobrado}€`} label="Cobrado" color={C.green}/>
        <StatCard val={`${totalPendiente}€`} label="Pendiente" color={C.amber}/>
      </div>

      {/* Filtros y búsqueda */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
        <input style={{...st.input,maxWidth:220}} placeholder="Buscar paciente o factura..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        <div style={{display:"flex",gap:4,background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,padding:3}}>
          {[["todas","Todas"],["pagadas","Pagadas"],["pendientes","Pendientes"]].map(([v,l])=>(
            <button key={v} style={{...st.btn("sm"),background:filtro===v?C.accent:"transparent",color:filtro===v?C.bone:C.muted,border:"none"}} onClick={()=>setFiltro(v)}>{l}</button>
          ))}
        </div>
        <div style={{fontSize:13,color:C.muted,marginLeft:"auto"}}>{filtradas.length} resultados</div>
      </div>

      {/* Tabla */}
      <div style={st.card}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th style={st.th}>Factura</th>
              <th style={st.th}>Paciente</th>
              <th style={st.th}>Fecha</th>
              <th style={st.th}>Sesión</th>
              <th style={st.th}>Importe</th>
              <th style={st.th}>Estado</th>
              <th style={st.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length===0&&<tr><td colSpan={7} style={{...st.td,textAlign:"center",color:C.muted,padding:32}}>Sin facturas</td></tr>}
            {filtradas.map(f=>(
              <tr key={f.id}>
                <td style={st.td}><span style={{fontFamily:"monospace",fontSize:12,color:C.walnut}}>{f.factura}</span></td>
                <td style={st.td}><div style={{fontWeight:600,fontSize:13}}>{f.pacienteNombre}</div></td>
                <td style={st.td}>{f.fecha}</td>
                <td style={st.td}>Sesión {f.numero}</td>
                <td style={st.td}>
                  {editF===f.id
                    ?<div style={{display:"flex",gap:5,alignItems:"center"}}>
                        <input type="number" style={{...st.input,width:70,padding:"4px 8px"}} value={editPago} onChange={e=>setEditPago(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter")updateImporte(f.id,f.pacienteId,editPago);if(e.key==="Escape")setEditF(null);}}/>
                        <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={()=>updateImporte(f.id,f.pacienteId,editPago)}>✓</button>
                        <button style={st.btn("ghost")} onClick={()=>setEditF(null)}>✕</button>
                      </div>
                    :<div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <strong>{f.pago}€</strong>
                        <button style={{...st.btn("sm"),fontSize:10,padding:"2px 7px",color:C.muted,background:"transparent"}} onClick={()=>{setEditF(f.id);setEditPago(f.pago);}}>✏</button>
                      </div>
                  }
                </td>
                <td style={st.td}><span style={st.badge(f.pagado?C.green:C.amber,f.pagado?C.gD:C.amD)}>{f.pagado?"Pagado":"Pendiente"}</span></td>
                <td style={st.td}>
                  <div style={st.rowActions}>
                    <button style={st.btn("sm")} onClick={()=>printFactura(f)}>🖨 PDF</button>
                    <button style={st.btn("sm")} onClick={()=>setViewF(f)}>Ver</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal vista previa factura */}
      {viewF&&(
        <Modal onClose={()=>setViewF(null)} title={`Factura ${viewF.factura}`} width={440}>
          <div style={{border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <img src={PRAXI_LOGO} alt="praXi" style={{height:34,display:"block"}}/>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:700,color:C.text}}>{viewF.factura}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{viewF.fecha}</div>
              </div>
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"14px 0",margin:"0 0 16px"}}>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Facturado a</div>
              <div style={{fontWeight:600}}>{viewF.pacienteNombre}</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted}}>Sesión nº {viewF.numero} — Atención clínica</span>
              <span style={{fontWeight:600}}>{viewF.pago}€</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:700,padding:"10px 0"}}>
              <span>Total</span>
              <span style={{color:C.accent}}>{viewF.pago}€</span>
            </div>
            <div style={{marginTop:16,padding:"8px 14px",background:viewF.pagado?C.gD:C.amD,borderRadius:20,textAlign:"center",fontSize:13,fontWeight:600,color:viewF.pagado?C.green:C.amber}}>
              {viewF.pagado?"✓ Pagado":"⏳ Pendiente de pago"}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
            <button style={st.btn("ghost")} onClick={()=>setViewF(null)}>Cerrar</button>
            <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={()=>printFactura(viewF)}>🖨 Imprimir PDF</button>
          </div>
        </Modal>
      )}
      {IA_VISIBLE&&showIA&&<IAFacturasPanel patients={patients} onClose={()=>setShowIA(false)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AGENDA GLOBAL — todos los profesionales
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// RECURSOS — biblioteca de PDF (todos disponibles para cualquier cuenta)
// ══════════════════════════════════════════════════════════════════════════════
// En la demo pública la biblioteca no está disponible: se muestra la vista de planes
function RecursosDemo(){
  const CATEGORIAS=[
    {id:"paciente",label:"Para el paciente",icon:"👤",desc:"Autorregistros, psicoeducación, hojas de trabajo y ejercicios para dar a tus pacientes."},
    {id:"profesional",label:"Para el profesional",icon:"🧠",desc:"Protocolos de intervención, escalas estandarizadas, guías clínicas y plantillas de informes."},
  ];
  const PLANES={basico:"Básico",pro:"Pro",clinica:"Clínica"};
  return(
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Recursos</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>Biblioteca de materiales clínicos disponibles según tu plan</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        {CATEGORIAS.map(cat=>(
          <div key={cat.id} style={{...st.card,padding:"24px 28px",textAlign:"center",opacity:0.6}}>
            <div style={{fontSize:36,marginBottom:12}}>{cat.icon}</div>
            <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>{cat.label}</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:16}}>{cat.desc}</div>
            <span style={{...st.badge(C.amber,C.amD),fontSize:11}}>Próximamente</span>
          </div>
        ))}
      </div>

      <div style={{...st.card,padding:"24px 28px",borderLeft:`3px solid ${C.accent}`,background:C.sand}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>¿Qué habrá disponible?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginTop:12}}>
          {[
            ["Plan Básico","5-10 recursos esenciales",C.muted],
            ["Plan Pro","Biblioteca completa",C.accent],
            ["Plan Clínica","Todo + recursos de equipo",C.walnut],
          ].map(([plan,desc,color])=>(
            <div key={plan} style={{padding:"12px 14px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:12,fontWeight:700,color,marginBottom:4}}>{plan}</div>
              <div style={{fontSize:12,color:C.muted}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Recursos(){
  const demo=useContext(DemoCtx);
  if(demo)return <RecursosDemo/>;
  return <BibliotecaRecursos/>;
}
function BibliotecaRecursos(){
  const[cat,setCat]=useState("paciente");
  const[q,setQ]=useState("");
  const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const lista=RECURSOS.filter(r=>r.cat===cat&&(!q.trim()||norm(r.titulo+" "+r.desc+" "+r.tipo).includes(norm(q.trim()))));
  const n=c=>RECURSOS.filter(r=>r.cat===c).length;
  return(
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Recursos</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>{RECURSOS.length} materiales clínicos en PDF, listos para imprimir o enviar</div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:12,borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        <div style={{display:"flex"}}>
          {[["paciente","Para el paciente"],["profesional","Para el profesional"]].map(([id,l])=>(
            <button key={id} onClick={()=>setCat(id)} style={st.tab(cat===id)}>{l} <span style={{color:C.muted,fontWeight:400}}>· {n(id)}</span></button>
          ))}
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar recurso…" aria-label="Buscar recurso"
          style={{...st.input,width:240,maxWidth:"100%",marginBottom:8,borderRadius:10}}/>
      </div>
      <div style={{fontSize:12.5,color:C.muted,marginBottom:16,lineHeight:1.6}}>
        {cat==="paciente"
          ?"Hojas de registro, psicoeducación y ejercicios para entregar a tus pacientes. Incluyen al pie los teléfonos 024 y 112."
          :"Escalas, protocolos y plantillas para tu práctica clínica. Las escalas reproducen la versión oficial en español e indican su fuente."}
      </div>
      {lista.length===0
        ?<div style={{...st.card,padding:32,textAlign:"center",color:C.muted,fontSize:13}}>No hay recursos que coincidan con «{q}».</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
          {lista.map(r=>(
            <div key={r.url} style={{...st.card,padding:"18px 20px",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <span style={{...st.badge(C.walnut,C.sand)}}>{r.tipo}</span>
                <span style={{fontSize:11,color:C.muted,letterSpacing:"0.05em"}}>{(r.cat==="paciente"?"PAC-":"PRO-")+r.num}</span>
              </div>
              <div style={{fontSize:15,fontWeight:600,lineHeight:1.35,color:C.text}}>{r.titulo}</div>
              <div style={{fontSize:12.5,color:C.muted,lineHeight:1.55,flex:1}}>{r.desc}</div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <a href={r.url} target="_blank" rel="noopener" style={{...st.btn("sm"),textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Abrir PDF</a>
                <a href={r.url} download style={{...st.btn("teal"),padding:"5px 14px",fontSize:12,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Descargar</a>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANEL DE IA — asistente clínico contextual
// ══════════════════════════════════════════════════════════════════════════════
function IAPanel({patient,onClose}){
  const isDemo=useContext(DemoCtx);
  const seud=useMemo(()=>crearSeudonimos([{nombre:patient.nombre,apellidos:patient.apellidos,alias:"Paciente X"}]),[patient.nombre,patient.apellidos]);
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const bottomRef=useRef();

  useEffect(()=>{
    if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const SUGERENCIAS=[
    "Analiza el caso y dime qué hipótesis diagnósticas contemplarías",
    "Resume la evolución clínica de todas las sesiones",
    "¿Qué técnicas de intervención recomiendas para este caso?",
    "Propón objetivos terapéuticos basados en la formulación",
    "Identifica factores de riesgo y protectores clave",
    "Genera un borrador de informe de derivación",
    "¿Qué pruebas complementarias añadirías?",
    "¿Qué información me falta para completar el caso?",
  ];

  const contexto=`Eres un asistente clínico experto en psicología, neuropsicología y psicoterapia. Tu función es ayudar al profesional (nunca al paciente directamente) con la gestión y análisis clínico del caso. Responde siempre en español, de forma concisa y profesional.

Cuando necesites más información para dar una respuesta útil, haz preguntas concretas al profesional — una o dos por mensaje, no más. No des respuestas genéricas si no tienes suficiente contexto: prefiere preguntar.

════════════════════════════════════════
DATOS COMPLETOS DEL PACIENTE
════════════════════════════════════════

IDENTIFICACIÓN:
- Nombre: ${patient.nombre} ${patient.apellidos}
- Edad: ${edadDe(patient.fechaNacimiento)??"No registrada"}
- Estado: ${patient.estado}

MOTIVO DE CONSULTA:
${patient.motivoConsulta||"No registrado"}

HISTORIA CLÍNICA:
${[patient.historiaClinica?.texto,...(patient.historiaClinica?.entradas||[]).map(e=>`[Sesión ${e.sesion??"-"}${e.fecha?" · "+e.fecha:""}]\n${e.texto}`)].filter(Boolean).join("\n\n")||"No registrada"}

FORMULACIÓN DE CASO:
- Hábitos diarios: ${patient.formulacionCaso?.habitosDiarios||"—"}
- Sueño: ${patient.formulacionCaso?.sueno||"—"}
- Alimentación: ${patient.formulacionCaso?.alimentacion||"—"}
- Actividad física: ${patient.formulacionCaso?.deporte||"—"}
- Familia: ${patient.formulacionCaso?.familia||"—"}
- Relaciones sociales: ${patient.formulacionCaso?.relaciones||"—"}
- Trabajo/estudios: ${patient.formulacionCaso?.trabajo||"—"}
- Factores estresantes: ${patient.formulacionCaso?.factoresEstresantes||"—"}
- Factores protectores: ${patient.formulacionCaso?.factoresProtectores||"—"}
- Otros: ${patient.formulacionCaso?.otrosFactores||"—"}

OBJETIVOS TERAPÉUTICOS:
${patient.objetivos?.length?patient.objetivos.map(o=>`- ${o.objetivo} → ${o.logrado?"✓ Logrado":"En curso"}`).join("\n"):"Ninguno registrado"}

PRUEBAS REALIZADAS:
${patient.pruebasRealizadas?.length?patient.pruebasRealizadas.map(p=>`- ${p.fecha} | ${p.prueba}: ${p.resultado}${p.observaciones?" ("+p.observaciones+")":""}`).join("\n"):"Ninguna registrada"}

INFORMES MÉDICOS:
${patient.informesMedicos?.length?patient.informesMedicos.map(i=>`- ${i.fecha} | ${i.titulo} — ${i.descripcion} [${i.medico}]`).join("\n"):"Ninguno"}

EVOLUCIÓN CLÍNICA — TODAS LAS SESIONES (${patient.sesiones?.length||0} sesiones):
${patient.sesiones?.length?[...patient.sesiones].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(s=>`
Sesión ${s.numero} — ${s.fecha}:
${s.observaciones?"Observaciones: "+s.observaciones:""}
${s.trabajado?"Evolución: "+s.trabajado:""}`).join("\n"):"Sin sesiones registradas"}

════════════════════════════════════════
Usa toda esta información para dar respuestas precisas y contextualizadas. Si algún campo está vacío y es relevante para la pregunta, pídelo al profesional.`;

  const send=async(msg)=>{
    const userMsg=msg||input.trim();
    if(!userMsg)return;
    setInput("");
    if(isDemo){setMessages(m=>[...m,{role:"user",content:userMsg},{role:"assistant",content:"En la demo el asistente IA no está activo. Solicita acceso para usarlo con tus pacientes."}]);return;}
    const newMessages=[...messages,{role:"user",content:userMsg}];
    setMessages(newMessages);
    setLoading(true);
    try{
      const reply=await enviarIA({system:contexto,messages:newMessages,seud});
      setMessages(m=>[...m,{role:"assistant",content:reply}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:e.message||"Error al conectar con la IA. Inténtalo de nuevo."}]);
    }
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",top:0,right:0,width:400,height:"100vh",background:C.bone,borderLeft:`1px solid ${C.border}`,zIndex:100,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(59,42,30,0.12)"}}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.sand}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>✦ Asistente IA</div>
          <div style={{fontSize:11,color:C.muted,marginTop:1}}>{patient.nombre} {patient.apellidos}</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.muted}}>✕</button>
      </div>

      {/* Mensajes */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.length===0&&(
          <div>
            <div style={{fontSize:13,color:C.muted,marginBottom:14,textAlign:"center",fontStyle:"italic"}}>
              Tengo el contexto completo de este paciente.<br/>¿En qué puedo ayudarte?
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {SUGERENCIAS.map((s,i)=>(
                <button key={i} onClick={()=>send(s)} style={{...st.btn("sm"),textAlign:"left",padding:"8px 12px",fontSize:12,color:C.walnut,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer",lineHeight:1.4}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?C.accent:C.card,color:m.role==="user"?C.bone:C.text,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:C.card,color:C.muted,fontSize:13}}>
              Pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
        <input
          style={{...st.input,flex:1,fontSize:13}}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Escribe una pregunta..."
        />
        <button
          style={{...st.btn(),background:C.accent,color:C.bone,padding:"0 16px",flexShrink:0}}
          onClick={()=>send()}
          disabled={loading||!input.trim()}
        >↑</button>
      </div>
    </div>
  );
}

function AgendaGlobal({citas,patients,profesionales}){
  const[weekStart,setWeekStart]=useState(()=>startOfWeek(today()));
  const[selectedCita,setSelectedCita]=useState(null);
  const todayStr=toYMD(today());
  const dayRange=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const nav=dir=>setWeekStart(d=>addDays(d,dir*7));
  const weekLabel=`${weekStart.toLocaleDateString("es-ES",{day:"numeric",month:"long"})} – ${addDays(weekStart,6).toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}`;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Agenda global</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>Todos los profesionales de la clínica</div>
        </div>
      </div>

      {/* Leyenda profesionales */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        {profesionales.filter(p=>p.activo).map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:C.bone,borderRadius:20,border:`1px solid ${C.border}`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:p.color||C.accent}}/>
            <span style={{fontSize:12,color:C.text}}>{p.nombre}</span>
            <span style={{fontSize:11,color:C.muted}}>· {p.especialidad}</span>
          </div>
        ))}
      </div>

      <div style={st.card}>
        {/* Nav semanal */}
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center"}}>
          <button style={st.btn("sm")} onClick={()=>nav(-1)}>‹</button>
          <button style={{...st.btn("sm"),background:C.bone,color:C.muted}} onClick={()=>setWeekStart(startOfWeek(today()))}>Esta semana</button>
          <button style={st.btn("sm")} onClick={()=>nav(1)}>›</button>
          <span style={{flex:1,textAlign:"center",fontSize:13,fontWeight:600,color:C.text}}>{weekLabel}</span>
        </div>

        {/* Grid 7 días */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {dayRange.map((d,i)=>{
            const ds=toYMD(d);
            const isToday=ds===todayStr;
            const dc=[...citas.filter(c=>c.fecha===ds)].sort((a,b)=>a.hora.localeCompare(b.hora));
            return(
              <div key={i} style={{borderLeft:i>0?`1px solid ${C.border}`:"none",minHeight:200}}>
                <div style={{padding:"10px 8px",textAlign:"center",borderBottom:`1px solid ${C.border}`,background:isToday?C.sand:"transparent"}}>
                  <div style={{fontSize:11,color:C.muted,textTransform:"uppercase"}}>{DAYS_ES[i]}</div>
                  <div style={{fontSize:16,fontWeight:isToday?700:400,color:isToday?C.accent:C.text,width:28,height:28,borderRadius:"50%",background:isToday?C.sand:"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"2px auto 0"}}>{d.getDate()}</div>
                </div>
                {dc.length===0&&<div style={{padding:"8px",fontSize:11,color:C.dim,textAlign:"center",fontStyle:"italic",marginTop:8}}>—</div>}
                {dc.map(c=>{
                  const prof=profesionales.find(p=>p.id===c.profesionalId)||profesionales[0];
                  const pat=patients.find(p=>p.id==c.pacienteId);
                  const isC=c.origen==="calendly";
                  const name=isC?(c.nombreExterno||"Calendly"):(pat?pat.nombre:"?");
                  return(
                    <div key={c.id} onClick={()=>setSelectedCita(selectedCita?.id===c.id?null:c)} style={{margin:"4px 6px",padding:"6px 8px",borderRadius:8,background:selectedCita?.id===c.id?(prof?.color?`${prof.color}44`:C.sand):(prof?.color?`${prof.color}18`:C.bone),borderLeft:`3px solid ${prof?.color||C.accent}`,border:selectedCita?.id===c.id?`1px solid ${prof?.color||C.accent}`:`1px solid transparent`,cursor:"pointer",transition:"background 150ms"}}>
                      <div style={{fontSize:10,fontWeight:600,color:prof?.color||C.accent}}>{c.hora} · {prof?.nombre?.split(" ")[0]}</div>
                      <div style={{fontSize:11,color:C.text,fontWeight:500,marginTop:1}}>{name}</div>
                      <div style={{fontSize:10,color:C.muted}}>{c.tipo||"Cita"}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel lateral — historial del paciente al hacer clic en una cita */}
      {selectedCita&&(()=>{
        const pat=patients.find(p=>p.id==selectedCita.pacienteId);
        const prof=profesionales.find(p=>p.id===selectedCita.profesionalId);
        const todasCitasPac=citas.filter(c=>c.pacienteId==selectedCita.pacienteId).sort((a,b)=>b.fecha.localeCompare(a.fecha));
        if(!pat)return null;
        return(
          <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",background:C.bone,borderLeft:`1px solid ${C.border}`,zIndex:50,overflowY:"auto",boxShadow:"-4px 0 24px rgba(59,42,30,0.1)"}}>
            <div style={{padding:"20px 20px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:700}}>{pat.nombre} {pat.apellidos}</div>
                <button onClick={()=>setSelectedCita(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
              </div>

              {/* Cita seleccionada */}
              <div style={{padding:"12px 14px",background:prof?.color?`${prof.color}18`:C.sand,borderRadius:10,borderLeft:`3px solid ${prof?.color||C.accent}`,marginBottom:16}}>
                <div style={{fontSize:11,color:prof?.color||C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Cita seleccionada</div>
                <div style={{fontSize:13,fontWeight:600}}>{selectedCita.fecha} · {selectedCita.hora}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{prof?.nombre} · {selectedCita.tipo||"Cita"} · {selectedCita.duracion}min</div>
                {selectedCita.zoomLink&&<a href={selectedCita.zoomLink} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.accent,display:"inline-block",marginTop:6,textDecoration:"none",background:C.sand,borderRadius:5,padding:"3px 8px"}}>🎥 Zoom</a>}
              </div>

              {/* Info básica paciente */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:8}}>Información</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
                  {pat.telefono&&<div>📞 {pat.telefono}</div>}
                  {pat.email&&<div>✉ {pat.email}</div>}
                  {pat.motivoConsulta&&<div style={{marginTop:6,fontSize:12,color:C.text,fontStyle:"italic"}}>"{pat.motivoConsulta}"</div>}
                </div>
              </div>

              {/* Todas sus citas en la clínica */}
              <div>
                <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:8}}>Todas las citas en la clínica ({todasCitasPac.length})</div>
                {todasCitasPac.map(c=>{
                  const p2=profesionales.find(p=>p.id===c.profesionalId);
                  const isPast=c.fecha<todayStr;
                  return(
                    <div key={c.id} style={{padding:"8px 10px",marginBottom:6,borderRadius:8,background:c.id===selectedCita.id?C.sand:C.card,border:`1px solid ${c.id===selectedCita.id?C.clay:C.border}`,borderLeft:`3px solid ${p2?.color||C.clay}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:12,fontWeight:600,color:isPast?C.muted:C.text}}>{c.fecha} · {c.hora}</div>
                        <span style={st.badge(isPast?C.dim:C.green,isPast?C.card:C.gD)}>{isPast?"Pasada":"Pendiente"}</span>
                      </div>
                      <div style={{fontSize:11,color:p2?.color||C.muted,marginTop:2}}>{p2?.nombre||"Sin asignar"} · {c.tipo||"Cita"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANEL DE ADMINISTRACIÓN
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// EQUIPO — miembros, roles e invitaciones (solo administrador)
// ══════════════════════════════════════════════════════════════════════════════
function EquipoPanel({clinica,miembros,yo,patients,citas,demo,onCambio,bloquearDemo,setAviso,onBorrada}){
  const[invs,setInvs]=useState([]);
  const[email,setEmail]=useState("");
  const[rol,setRol]=useState("profesional");
  const[nuevo,setNuevo]=useState(null);
  const[copiado,setCopiado]=useState(null);
  const[err,setErr]=useState("");
  const[enviando,setEnviando]=useState(false);
  const enlace=t=>`${window.location.origin}/app?inv=${t}`;
  const cargarInvs=useCallback(async()=>{
    if(demo||!clinica?.id)return;
    const{data}=await supabase.from("invitaciones").select("*").eq("clinica_id",clinica.id).eq("aceptada",false).order("creado_en",{ascending:false});
    setInvs(data||[]);
  },[demo,clinica?.id]);
  useEffect(()=>{cargarInvs();},[cargarInvs]);

  const invitar=async()=>{
    if(demo)return bloquearDemo();
    setErr("");
    const e=email.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(e)){setErr("Escribe un email válido.");return;}
    if(miembros.some(m=>m.email===e)){setErr("Esa persona ya forma parte de la clínica.");return;}
    setEnviando(true);
    const{data,error}=await supabase.from("invitaciones").insert({clinica_id:clinica.id,email:e,rol}).select().single();
    setEnviando(false);
    if(error){setErr(traducirError(error));return;}
    setNuevo({email:e,url:enlace(data.token)});setEmail("");cargarInvs();
  };
  const copiar=async url=>{try{await navigator.clipboard.writeText(url);setCopiado(url);setTimeout(()=>setCopiado(null),2000);}catch{window.prompt("Copia este enlace:",url);}};
  const anular=async id=>{if(demo)return bloquearDemo();await supabase.from("invitaciones").delete().eq("id",id);cargarInvs();};
  const actualizar=async(m,cambios)=>{
    if(demo)return bloquearDemo();
    const{error}=await supabase.from("miembros").update(cambios).eq("id",m.id);
    if(error)setAviso(/administrador activo/.test(error.message)?"La clínica debe tener al menos un administrador activo.":traducirError(error));
    onCambio();
  };
  const mailto=(to,url)=>`mailto:${to}?subject=${encodeURIComponent(`Invitación a ${clinica.nombre} en Praxi`)}&body=${encodeURIComponent(`Hola,\n\nTe invito a unirte a ${clinica.nombre} en Praxi.\n\nEntra en este enlace y crea tu contraseña usando este mismo email (${to}):\n${url}\n\nEl enlace caduca en 7 días.`)}`;
  const nPac=id=>patients.filter(p=>p.profesionalId===id).length;
  const seccion={fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500};

  return(
    <div style={{maxWidth:900}}>
      <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Equipo</div>
      <div style={{color:C.muted,fontSize:13,marginTop:2,marginBottom:20}}>{clinica?.nombre} · {miembros.filter(m=>m.activo).length} miembros activos</div>

      <div style={{...st.card,padding:"18px 20px",marginBottom:16}}>
        <div style={{...seccion,marginBottom:12}}>Invitar a un profesional</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input style={{...st.input,flex:"1 1 240px",width:"auto"}} type="email" placeholder="email@ejemplo.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&invitar()}/>
          <select style={{...st.input,width:160}} value={rol} onChange={e=>setRol(e.target.value)}>
            <option value="profesional">Profesional</option>
            <option value="admin">Administrador</option>
          </select>
          <button style={{...st.btn(),opacity:enviando?0.6:1}} disabled={enviando} onClick={invitar}>Crear invitación</button>
        </div>
        <div style={{fontSize:12,color:C.muted,marginTop:8,lineHeight:1.5}}>Un <strong>profesional</strong> solo ve sus pacientes. Un <strong>administrador</strong> ve todos, gestiona el equipo y la configuración.</div>
        {err&&<div style={{fontSize:12,color:C.red,marginTop:10}}>{err}</div>}
        {nuevo&&(
          <div style={{marginTop:14,padding:"12px 14px",background:C.gD,borderRadius:10}}>
            <div style={{fontSize:13,color:C.green,fontWeight:600,marginBottom:6}}>Invitación creada para {nuevo.email}</div>
            <div style={{fontSize:12,color:C.walnut,marginBottom:8}}>Envíale este enlace. Tendrá que registrarse con ese mismo email. Caduca en 7 días.</div>
            <div style={{fontSize:12,background:C.bone,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",wordBreak:"break-all",marginBottom:8}}>{nuevo.url}</div>
            <div style={{display:"flex",gap:8}}>
              <button style={st.btn("sm")} onClick={()=>copiar(nuevo.url)}>{copiado===nuevo.url?"✓ Copiado":"Copiar enlace"}</button>
              <a href={mailto(nuevo.email,nuevo.url)} style={{...st.btn("sm"),textDecoration:"none",background:C.bone,color:C.accent,border:`1px solid ${C.accent}`}}>Enviar por email</a>
            </div>
          </div>
        )}
      </div>

      <div style={{...st.card,marginBottom:16,overflow:"hidden"}}>
        <div style={{...seccion,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>Miembros</div>
        {miembros.map(m=>{
          const soyYo=m.id===yo?.id;
          return(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:`1px solid ${C.border}`,opacity:m.activo?1:0.55,flexWrap:"wrap"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:m.color||C.accent,color:C.bone,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>{(m.nombre||"?")[0].toUpperCase()}</div>
              <div style={{flex:"1 1 200px",minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{m.nombre}{soyYo&&<span style={{color:C.muted,fontWeight:400}}> (tú)</span>}</div>
                <div style={{fontSize:12,color:C.muted}}>{m.email}{m.especialidad?` · ${m.especialidad}`:""} · {nPac(m.id)} pacientes</div>
              </div>
              <span style={st.badge(m.rol==="admin"?C.accent:C.walnut,m.rol==="admin"?C.sand:C.card)}>{m.rol==="admin"?"Administrador":"Profesional"}</span>
              {!m.activo&&<span style={st.badge(C.red,C.rD)}>Desactivado</span>}
              {!soyYo&&(
                <div style={{display:"flex",gap:6}}>
                  {m.activo&&<button style={st.btn("sm")} onClick={()=>actualizar(m,{rol:m.rol==="admin"?"profesional":"admin"})}>{m.rol==="admin"?"Quitar admin":"Hacer admin"}</button>}
                  <button style={{...st.btn("sm"),background:m.activo?C.rD:C.gD,color:m.activo?C.red:C.green}} onClick={()=>{if(!m.activo||confirm(`¿Desactivar a ${m.nombre}?\n\nPerderá el acceso al momento. Sus pacientes siguen en la clínica y puedes reasignarlos desde Pacientes → Editar.`))actualizar(m,{activo:!m.activo});}}>{m.activo?"Desactivar":"Reactivar"}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {invs.length>0&&(
        <div style={{...st.card,overflow:"hidden"}}>
          <div style={{...seccion,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>Invitaciones pendientes</div>
          {invs.map(i=>{
            const caducada=new Date(i.expira_en)<new Date();
            return(
              <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap"}}>
                <div style={{flex:"1 1 200px",fontSize:13}}>{i.email} <span style={{color:C.muted}}>· {i.rol==="admin"?"Administrador":"Profesional"} · {caducada?"caducada":`caduca el ${new Date(i.expira_en).toLocaleDateString("es-ES")}`}</span></div>
                {!caducada&&<button style={st.btn("sm")} onClick={()=>copiar(enlace(i.token))}>{copiado===enlace(i.token)?"✓ Copiado":"Copiar enlace"}</button>}
                <button style={{...st.btn("sm"),background:C.rD,color:C.red}} onClick={()=>anular(i.id)}>Anular</button>
              </div>
            );
          })}
        </div>
      )}
      <RegistroAccesos clinica={clinica} miembros={miembros} patients={patients} demo={demo}/>
      <DatosClinica clinica={clinica} miembros={miembros} patients={patients} citas={citas} demo={demo} bloquearDemo={bloquearDemo} onBorrada={onBorrada}/>
    </div>
  );
}

// ── Registro de accesos (solo admin) ──────────────────────────────────────────
function RegistroAccesos({clinica,miembros,patients,demo}){
  const[filas,setFilas]=useState(null);
  const[error,setError]=useState("");
  const[filtro,setFiltro]=useState("");
  const cargar=useCallback(async()=>{
    if(demo){setFilas([]);return;}
    setError("");
    const{data,error}=await supabase.from("auditoria").select("*").eq("clinica_id",clinica.id).order("creado_en",{ascending:false}).limit(300);
    if(error){setError("El registro de accesos aún no está activado (falta ejecutar el archivo 04_cumplimiento.sql).");setFilas([]);return;}
    setFilas(data);
  },[demo,clinica?.id]);
  useEffect(()=>{cargar();},[cargar]);
  const quien=id=>miembros.find(m=>m.id===id)?.nombre||"—";
  const paciente=id=>{const p=patients.find(x=>x.id===Number(id));return p?`${p.nombre} ${p.apellidos||""}`.trim():`Ficha ${id} (ya no existe)`;};
  const ACC={ver:["Consultó",C.walnut,C.card],crear:["Creó",C.green,C.gD],modificar:["Modificó",C.amber,C.amD],borrar:["Borró",C.red,C.rD]};
  const lista=(filas||[]).filter(f=>!filtro||(f.tabla==="pacientes"&&String(f.registro_id)===filtro));
  const seccion={fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500};
  return(
    <div style={{...st.card,marginTop:16,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={seccion}>Registro de accesos</span>
        <div style={{display:"flex",gap:8}}>
          <select style={{...st.input,width:220,fontSize:12,padding:"6px 10px"}} value={filtro} onChange={e=>setFiltro(e.target.value)}>
            <option value="">Todas las fichas</option>
            {patients.map(p=><option key={p.id} value={String(p.id)}>{p.nombre} {p.apellidos}</option>)}
          </select>
          <button style={st.btn("sm")} onClick={cargar}>Actualizar</button>
        </div>
      </div>
      <div style={{fontSize:12,color:C.muted,padding:"10px 20px",borderBottom:`1px solid ${C.border}`}}>Quién ha consultado, creado, modificado o borrado cada ficha y cita. Nadie puede editar ni borrar este registro. Se muestran los 300 movimientos más recientes.</div>
      {error&&<div style={{fontSize:13,color:C.amber,padding:"12px 20px"}}>{error}</div>}
      {demo&&<div style={{fontSize:13,color:C.muted,padding:"12px 20px",fontStyle:"italic"}}>En la demo no se registran accesos.</div>}
      {filas&&!error&&!demo&&lista.length===0&&<div style={{fontSize:13,color:C.muted,padding:"12px 20px",fontStyle:"italic"}}>Sin movimientos todavía.</div>}
      <div style={{maxHeight:360,overflowY:"auto"}}>
        {lista.map(f=>{const[t,col,bg]=ACC[f.accion]||[f.accion,C.muted,C.card];return(
          <div key={f.id} style={{display:"flex",gap:12,alignItems:"center",padding:"8px 20px",borderBottom:`1px solid ${C.border}`,fontSize:13,flexWrap:"wrap"}}>
            <span style={{color:C.muted,fontSize:12,width:120,flexShrink:0}}>{new Date(f.creado_en).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
            <span style={{fontWeight:600,width:150,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{quien(f.miembro_id)}</span>
            <span style={st.badge(col,bg)}>{t}</span>
            <span style={{color:C.text}}>{f.tabla==="pacientes"?paciente(f.registro_id):`una cita`}</span>
          </div>
        );})}
      </div>
    </div>
  );
}

// ── Exportar y borrar la clínica (solo admin) ─────────────────────────────────
function DatosClinica({clinica,miembros,patients,citas,demo,bloquearDemo,onBorrada}){
  const[confirmar,setConfirmar]=useState("");
  const[borrando,setBorrando]=useState(false);
  const[err,setErr]=useState("");
  const exportar=()=>{
    const datos={
      exportado_en:new Date().toISOString(),
      formato:"Praxi · exportación completa de la clínica (JSON)",
      clinica:{nombre:clinica.nombre,creada:clinica.creado_en},
      equipo:miembros.map(({nombre,email,especialidad,rol,activo})=>({nombre,email,especialidad,rol,activo})),
      pacientes:patients,
      citas,
    };
    const blob=new Blob([JSON.stringify(datos,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`praxi-${(clinica.nombre||"clinica").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();URL.revokeObjectURL(a.href);
  };
  const borrar=async()=>{
    if(demo)return bloquearDemo();
    setErr("");
    if(confirmar.trim()!==clinica.nombre){setErr("Escribe el nombre exacto de la clínica para confirmar.");return;}
    if(!confirm(`Última confirmación: se borrarán para siempre ${patients.length} pacientes, ${citas.length} citas, el equipo y el registro de accesos de "${clinica.nombre}". No se puede deshacer.`))return;
    setBorrando(true);
    const{error}=await supabase.rpc("eliminar_clinica",{p_clinica:clinica.id,p_confirmacion:confirmar.trim()});
    setBorrando(false);
    if(error){setErr(/no coincide/.test(error.message)?"El nombre no coincide con el de la clínica.":traducirError(error));return;}
    onBorrada();
  };
  const seccion={fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500};
  return(
    <>
      <div style={{...st.card,marginTop:16,padding:"16px 20px"}}>
        <div style={{...seccion,marginBottom:8}}>Exportar los datos de la clínica</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>Descarga en un archivo todos los pacientes (con su historia, sesiones, evolución y documentos), las citas y el equipo. Úsalo como copia propia, para conservar la historia clínica o para llevarte tus datos a otro sistema.</div>
        <button style={st.btn()} onClick={exportar}>Descargar todo (JSON)</button>
      </div>
      <div style={{...st.card,marginTop:16,padding:"16px 20px",border:`1px solid ${C.red}`}}>
        <div style={{...seccion,color:C.red,marginBottom:8}}>Borrar la clínica</div>
        <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:12}}>Borra de forma <strong>inmediata y definitiva</strong> la clínica y todos sus datos: pacientes, historias clínicas, citas, equipo y registro de accesos. Antes, <strong>exporta los datos</strong> que estés obligado a conservar (la historia clínica, al menos 5 años según la Ley 41/2002).</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input style={{...st.input,flex:"1 1 240px",width:"auto"}} value={confirmar} onChange={e=>setConfirmar(e.target.value)} placeholder={`Escribe: ${clinica.nombre}`}/>
          <button disabled={borrando} style={{...st.btn("danger"),opacity:borrando?0.6:1}} onClick={borrar}>{borrando?"Borrando…":"Borrar la clínica"}</button>
        </div>
        {err&&<div style={{fontSize:12,color:C.red,marginTop:10}}>{err}</div>}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// IA PANEL — FACTURACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function IAFacturasPanel({patients,onClose}){
  const isDemo=useContext(DemoCtx);
  const seud=useMemo(()=>crearSeudonimos(patients.map((p,i)=>({nombre:p.nombre,apellidos:p.apellidos,alias:`Paciente ${i+1}`}))),[patients]);
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const bottomRef=useRef();

  useEffect(()=>{
    if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const todasSesiones=patients.flatMap(p=>p.sesiones.map(s=>({...s,paciente:`${p.nombre} ${p.apellidos}`})));
  const cobrado=todasSesiones.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0);
  const pendiente=todasSesiones.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0);
  const mes=new Date().toISOString().slice(0,7);
  const mesCob=todasSesiones.filter(s=>s.pagado&&s.fecha.startsWith(mes)).reduce((a,s)=>a+s.pago,0);
  const mesPend=todasSesiones.filter(s=>!s.pagado&&s.fecha.startsWith(mes)).reduce((a,s)=>a+s.pago,0);

  const porPaciente=patients.map(p=>({
    nombre:`${p.nombre} ${p.apellidos}`,
    sesiones:p.sesiones.length,
    cobrado:p.sesiones.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0),
    pendiente:p.sesiones.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0),
    ultimaSesion:p.sesiones.sort((a,b)=>b.fecha.localeCompare(a.fecha))[0]?.fecha||"—",
  })).filter(p=>p.sesiones>0);

  const pendientesDetalle=todasSesiones.filter(s=>!s.pagado)
    .sort((a,b)=>a.fecha.localeCompare(b.fecha))
    .map(s=>`- ${s.paciente} | Sesión ${s.numero} | ${s.fecha} | ${s.pago}€ | Factura: ${s.factura}`)
    .join("\n");

  const contexto=`Eres un asistente especializado en gestión económica de consultas sanitarias. Ayudas al profesional a entender y gestionar su facturación. Responde siempre en español, de forma clara y directa. Cuando necesites más información, haz preguntas concretas.

════════════════════════════════════════
DATOS DE FACTURACIÓN
════════════════════════════════════════

RESUMEN GLOBAL:
- Total cobrado: ${cobrado}€
- Total pendiente: ${pendiente}€
- Total facturado: ${cobrado+pendiente}€
- Sesiones totales: ${todasSesiones.length}

ESTE MES:
- Cobrado: ${mesCob}€
- Pendiente: ${mesPend}€

RESUMEN POR PACIENTE:
${porPaciente.map(p=>`- ${p.nombre}: ${p.sesiones} sesiones | Cobrado: ${p.cobrado}€ | Pendiente: ${p.pendiente}€ | Última sesión: ${p.ultimaSesion}`).join("\n")}

PAGOS PENDIENTES DETALLADOS:
${pendientesDetalle||"Ninguno"}

════════════════════════════════════════
Usa estos datos para responder preguntas sobre ingresos, pendientes, seguimiento de cobros y gestión económica de la consulta.`;

  const SUGERENCIAS=[
    "¿Qué pagos tengo pendientes de cobrar?",
    "¿Cuánto he ingresado este mes?",
    "¿Qué paciente tiene más deuda acumulada?",
    "Dame un resumen financiero de mi consulta",
    "¿A qué pacientes debería hacer seguimiento de cobro?",
    "¿Cuál es mi media de ingresos por sesión?",
  ];

  const send=async(msg)=>{
    const userMsg=msg||input.trim();
    if(!userMsg)return;
    setInput("");
    if(isDemo){setMessages(m=>[...m,{role:"user",content:userMsg},{role:"assistant",content:"En la demo el asistente IA no está activo. Solicita acceso para usarlo con tus pacientes."}]);return;}
    const newMessages=[...messages,{role:"user",content:userMsg}];
    setMessages(newMessages);
    setLoading(true);
    try{
      const reply=await enviarIA({system:contexto,messages:newMessages,seud});
      setMessages(m=>[...m,{role:"assistant",content:reply}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:e.message||"Error al conectar con la IA. Inténtalo de nuevo."}]);
    }
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",top:0,right:0,width:400,height:"100vh",background:C.bone,borderLeft:`1px solid ${C.border}`,zIndex:100,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(59,42,30,0.12)"}}>
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.sand}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>✦ Asistente IA</div>
          <div style={{fontSize:11,color:C.muted,marginTop:1}}>Gestión de facturación</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.muted}}>✕</button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.length===0&&(
          <div>
            <div style={{fontSize:13,color:C.muted,marginBottom:14,textAlign:"center",fontStyle:"italic"}}>
              Tengo acceso a todos tus datos de facturación.<br/>¿En qué puedo ayudarte?
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {SUGERENCIAS.map((s,i)=>(
                <button key={i} onClick={()=>send(s)} style={{...st.btn("sm"),textAlign:"left",padding:"8px 12px",fontSize:12,color:C.walnut,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer",lineHeight:1.4}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?C.accent:C.card,color:m.role==="user"?C.bone:C.text,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"10px 14px",borderRadius:"14px 14px 14px 4px",background:C.card,color:C.muted,fontSize:13}}>Pensando...</div></div>}
        <div ref={bottomRef}/>
      </div>

      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
        <input style={{...st.input,flex:1,fontSize:13}} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Pregunta sobre tu facturación..."/>
        <button style={{...st.btn(),background:C.accent,color:C.bone,padding:"0 16px",flexShrink:0}} onClick={()=>send()} disabled={loading||!input.trim()}>↑</button>
      </div>
    </div>
  );
}

function Dashboard({patients,citas,setCitas,tareas,setTareas,horario,onInforme,onEditCita,onEditTarea,onNuevaCita,onAgendar,onAbrirPaciente,onNuevoPaciente,onVerCalendario}){
  const[weekStart,setWeekStart]=useState(startOfWeek(today()));
  const ahora=today();
  const todayStr=toYMD(ahora);
  const ahoraMin=ahora.getHours()*60+ahora.getMinutes();
  const todayCitas=citas.filter(c=>c.fecha===todayStr);
  const days=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const pac=id=>patients.find(p=>p.id==id);
  const nameOf=c=>{const p=pac(c.pacienteId);return c.origen==="calendly"||!p?(c.nombreExterno||"Primera llamada"):`${p.nombre} ${p.apellidos}`;};
  const activos=patients.filter(p=>p.estado==="activo");
  const eur=n=>`${Math.round(n).toLocaleString("es-ES")} €`;
  const yaPaso=c=>c.fecha<todayStr||(c.fecha===todayStr&&timeToMins(c.hora)+(c.duracion||0)<=ahoraMin);

  // ── Ocupación de la semana actual (lunes a viernes en tu horario)
  const ws0=startOfWeek(ahora);const claves=Array.from({length:7},(_,i)=>toYMD(addDays(ws0,i)));
  const capacidad=5*Math.max(1,(horario?.end??WORK_END)-(horario?.start??WORK_START))*60;
  const reservado=citas.filter(c=>claves.includes(c.fecha)).reduce((a,c)=>a+(Number(c.duracion)||0),0);
  const ocupacion=Math.min(100,Math.round(reservado/capacidad*100));

  // ── Cobros
  const mes=todayStr.slice(0,7);
  const todasSes=patients.flatMap(p=>p.sesiones||[]);
  const cobradoMes=todasSes.filter(s=>s.pagado&&(s.fecha||"").startsWith(mes)).reduce((a,s)=>a+(Number(s.pago)||0),0);
  const pendiente=todasSes.filter(s=>!s.pagado).reduce((a,s)=>a+(Number(s.pago)||0),0);

  // ── Siguiente cita
  const proxima=[...citas].filter(c=>!yaPaso(c)&&(c.fecha>todayStr||timeToMins(c.hora)>=ahoraMin-((c.duracion||0)-1)))
    .sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora))[0];
  const cuando=c=>{
    if(c.fecha===todayStr){const m=timeToMins(c.hora)-ahoraMin;if(m<=0)return"En curso";if(m<60)return`En ${m} min`;return`Hoy en ${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`;}
    return`${etiquetaDia(fechaDe(c.fecha))} · ${c.hora}`;
  };
  const pProx=proxima&&proxima.origen!=="calendly"?pac(proxima.pacienteId):null;
  const ultSes=pProx?[...(pProx.sesiones||[])].sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""))[0]:null;
  const ultPrueba=pProx?[...(pProx.pruebasRealizadas||[])].sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""))[0]:null;

  // ── Pacientes activos sin próxima cita
  const conCita=new Set(citas.filter(c=>c.fecha>=todayStr&&c.pacienteId).map(c=>String(c.pacienteId)));
  const sinCita=activos.filter(p=>!conCita.has(String(p.id))).map(p=>{
    const fechas=[...(p.sesiones||[]).map(s=>s.fecha),...citas.filter(c=>c.pacienteId==p.id&&c.fecha<todayStr).map(c=>c.fecha)].filter(Boolean).sort();
    const ult=fechas[fechas.length-1];
    return{p,dias:ult?diasEntre(fechaDe(ult),ahora):null};
  }).sort((a,b)=>(b.dias??-1)-(a.dias??-1));

  const Stat=({val,label,color,children})=>(
    <div style={st.statCard}>
      <div style={{fontSize:30,fontWeight:700,color,lineHeight:1}}>{val}</div>
      <div style={{fontSize:13,color:C.muted,marginTop:8}}>{label}</div>
      {children}
    </div>
  );
  const Fila=({onClick,icono,color,texto,detalle,accion})=>(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:`1px solid ${C.border}`,cursor:onClick?"pointer":"default"}}>
      {icono&&<span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>}
      <div style={{flex:1,minWidth:0,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{texto}</div>
      {detalle&&<div style={{fontSize:12,color:C.muted,flexShrink:0}}>{detalle}</div>}
      {accion}
    </div>
  );
  const Titulo=({children,n})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>{children}</div>
      {n!=null&&<span style={st.badge(n?C.accent:C.green,n?C.sand:C.gD)}>{n}</span>}
    </div>
  );

  return(
    <div style={{maxWidth:1280,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:12,flexWrap:"wrap"}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Dashboard</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={st.btn("sm")} onClick={onNuevoPaciente}>+ Nuevo paciente</button>
          <button style={st.btn("sm")} onClick={onNuevaCita}>+ Nueva cita</button>
          <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={onInforme}>📊 Informe mensual</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:14}}>
        <Stat val={activos.length} label="Pacientes activos" color={C.accent}/>
        <Stat val={todayCitas.length} label="Citas hoy" color={C.accent}/>
        <Stat val={`${ocupacion} %`} label="Ocupación esta semana" color={C.accent}>
          <div style={{height:5,background:C.sand,borderRadius:3,marginTop:10}}><div style={{width:`${ocupacion}%`,height:5,background:C.accent,borderRadius:3}}/></div>
        </Stat>
        <Stat val={eur(cobradoMes)} label={`Cobrado en ${MONTHS_ES[ahora.getMonth()].toLowerCase()}`} color={C.green}>
          {pendiente>0&&<div style={{fontSize:12,color:C.amber,marginTop:6,fontWeight:500}}>{eur(pendiente)} pendientes de cobro</div>}
        </Stat>
      </div>

      {proxima&&(
        <div style={{...st.card,padding:"16px 20px",marginBottom:14,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",borderLeft:`3px solid ${C.accent}`,borderRadius:"0 18px 18px 0"}}>
          <Avatar nombre={nameOf(proxima)} apellidos="" size={44}/>
          <div style={{flex:1,minWidth:220}}>
            <div style={{fontSize:12,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Siguiente cita · {cuando(proxima)}</div>
            <div style={{fontSize:17,fontWeight:700,color:C.ink,marginTop:3}}>{nameOf(proxima)} <span style={{fontWeight:400,color:C.walnut,fontSize:14}}>· {proxima.hora} · {pProx?`sesión ${(pProx.sesiones||[]).length+1}`:(proxima.tipo||"Cita")}</span></div>
            {pProx&&(ultSes||ultPrueba)&&<div style={{fontSize:12.5,color:C.muted,marginTop:4,lineHeight:1.5}}>
              {ultSes&&<>Última sesión: {ultSes.trabajado||"sin resumen"}</>}{ultSes&&ultPrueba&&" · "}{ultPrueba&&<>{ultPrueba.prueba}: {ultPrueba.resultado}</>}
            </div>}
          </div>
          <div style={{display:"flex",gap:8}}>
            {pProx&&<button style={st.btn("sm")} onClick={()=>onAbrirPaciente(pProx.id)}>Abrir ficha</button>}
            <button style={{...st.btn("sm"),background:C.bone,color:C.muted}} onClick={()=>onEditCita(proxima)}>Ver cita</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:14,marginBottom:14,alignItems:"start"}}>
        <div style={{...st.card,padding:"16px 20px"}}>
          <Titulo n={sinCita.length}>Sin próxima cita</Titulo>
          {sinCita.length===0&&<div style={{fontSize:13,color:C.green,padding:"6px 0"}}>Todos tus pacientes activos tienen cita.</div>}
          {sinCita.slice(0,6).map(({p,dias})=>(
            <Fila key={p.id} onClick={()=>onAbrirPaciente(p.id)}
              texto={<b>{p.nombre} {p.apellidos}</b>}
              detalle={dias==null?"sin sesiones":dias===0?"última hoy":`última hace ${dias} ${dias===1?"día":"días"}`}
              accion={<button style={st.btn("sm")} onClick={e=>{e.stopPropagation();onAgendar(p.id);}}>Agendar</button>}/>
          ))}
          {sinCita.length>6&&<div style={{fontSize:12,color:C.muted,paddingTop:8,borderTop:`1px solid ${C.border}`}}>Y {sinCita.length-6} más.</div>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:14,alignItems:"start"}}>
        <div style={{...st.card,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
           <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button style={st.btn("sm")} onClick={()=>setWeekStart(d=>addDays(d,-7))}>‹</button>
            <button title="Volver a esta semana" style={{...st.btn("sm"),background:C.bone,color:C.muted,minWidth:96}} onClick={()=>setWeekStart(startOfWeek(today()))}>{etiquetaSemana(weekStart)}</button>
            <button style={st.btn("sm")} onClick={()=>setWeekStart(d=>addDays(d,7))}>›</button>
           </div>
            <span style={{fontSize:14,fontWeight:600,color:C.text,textAlign:"center",whiteSpace:"nowrap"}}>
              {weekStart.getDate()} {MONTHS_ES[weekStart.getMonth()].slice(0,3)} – {addDays(weekStart,6).getDate()} {MONTHS_ES[addDays(weekStart,6).getMonth()].slice(0,3)}
            </span>
            <button style={{...st.btn("sm"),background:C.bone,color:C.muted,justifySelf:"end"}} onClick={onVerCalendario}>Ver calendario →</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",minHeight:260}}>
            {days.map((d,i)=>{
              const ds=toYMD(d);const isT=ds===todayStr;
              const dc=[...citas.filter(c=>c.fecha===ds)].sort((a,b)=>a.hora.localeCompare(b.hora));
              const dt=tareas.filter(t=>t.fecha===ds&&!t.hecho);
              return(
                <div key={i} style={{borderLeft:i?`1px solid ${C.border}`:"none",minWidth:0}}>
                  <div style={{padding:"10px 6px",textAlign:"center",borderBottom:`1px solid ${C.border}`,background:isT?C.sand:"transparent"}}>
                    <div style={{fontSize:12,color:isT?C.accent:C.walnut,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>{DAYS_ES[i]}</div>
                    <div style={{fontSize:16,fontWeight:isT?700:400,color:isT?C.accent:C.text,marginTop:2}}>{d.getDate()}</div>
                  </div>
                  {dc.length===0&&dt.length===0&&<div style={{padding:"12px 6px",fontSize:12,color:C.dim,textAlign:"center",fontStyle:"italic"}}>—</div>}
                  {dc.map(c=>(
                    <div key={c.id} onClick={()=>onEditCita(c)} style={{margin:6,padding:"8px 9px",background:CITA_BG,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,borderRadius:6,cursor:"pointer",opacity:yaPaso(c)?0.55:1}}>
                      <div style={{fontSize:12,color:C.muted,fontWeight:600}}>{c.hora}</div>
                      <div style={{fontSize:13,fontWeight:700,color:C.ink,lineHeight:1.3,marginTop:2,overflow:"hidden",textOverflow:"ellipsis"}}>{nameOf(c)}</div>
                      <div style={{fontSize:12,color:C.walnut,marginTop:2}}>{c.tipo||"Cita"} · {c.duracion}min</div>
                    </div>
                  ))}
                  {dt.map(t=>(
                    <div key={t.id} onClick={()=>onEditTarea(t)} style={{margin:6,padding:"6px 9px",borderRadius:6,borderLeft:`3px solid ${PRIORIDAD_T[t.prioridad]?.color||C.muted}`,background:`${PRIORIDAD_T[t.prioridad]?.bg||C.bone}`,cursor:"pointer"}}>
                      <div style={{fontSize:11,color:PRIORIDAD_T[t.prioridad]?.color,fontWeight:600}}>{t.hora}</div>
                      <div style={{fontSize:12,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis"}}>{t.titulo||t.texto}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <AgendaPersonalPanel tareas={tareas} setTareas={setTareas} onEditTarea={onEditTarea}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
const DEMO_USER={...INITIAL_PROFESIONALES[0],id:"demo",nombre:"Profesional demo",especialidad:"Psicología clínica",rol:"admin"};
const DEMO_MIEMBROS=INITIAL_PROFESIONALES.map(p=>({...p,id:p.id==="u1"?"demo":p.id}));

// Estado que avisa de cada cambio (prev → next) para guardarlo en Supabase
function useEstadoSincronizado(inicial){
  const[valor,setValor]=useState(inicial);
  const ref=useRef(inicial);
  const alCambiar=useRef(null);
  const set=useCallback(upd=>{
    const prev=ref.current;
    const next=typeof upd==="function"?upd(prev):upd;
    if(next===prev)return;
    ref.current=next;setValor(next);
    alCambiar.current&&alCambiar.current(prev,next);
  },[]);
  const cargar=useCallback(v=>{ref.current=v;setValor(v);},[]);
  return[valor,set,cargar,alCambiar,ref];
}

export default function App({demo=false}){
  const[demoToast,setDemoToast]=useState(false);
  const[aviso,setAviso]=useState("");
  useEffect(()=>{if(!demoToast)return;const t=setTimeout(()=>setDemoToast(false),2600);return()=>clearTimeout(t);},[demoToast]);
  useEffect(()=>{if(!aviso)return;const t=setTimeout(()=>setAviso(""),5000);return()=>clearTimeout(t);},[aviso]);
  // En la demo pública ningún cambio se guarda: los setters de datos no hacen nada y avisan
  const ro=setter=>demo?(()=>setDemoToast(true)):setter;

  // ── Sesión y clínica ──
  const[session,setSession]=useState(null);
  const[authListo,setAuthListo]=useState(demo);
  const[recuperando,setRecuperando]=useState(false);
  const[estado,setEstado]=useState(demo?"listo":"cargando");
  const[currentUser,setCurrentUser]=useState(demo?DEMO_USER:null);
  const[currentClinica,setCurrentClinica]=useState(demo?CLINICA_STORE:null);
  const[profesionales,setProfesionales]=useState(demo?DEMO_MIEMBROS:[]);
  const[pendientes,setPendientes]=useState(0);

  // ── Datos ──
  const[patients,setPatientsSync,cargarPatients,cambioPatients,patientsRef]=useEstadoSincronizado(demo?demoPacientes():[]);
  const[citas,setCitasSync,cargarCitas,cambioCitas]=useEstadoSincronizado(demo?SAMPLE_CITAS.filter(c=>![7,10,12].includes(c.pacienteId)):[]);
  const[tareas,setTareasSync,cargarTareas,cambioTareas]=useEstadoSincronizado([]);
  const[tipos,setTiposSync,cargarTipos,cambioTipos,tiposRef]=useEstadoSincronizado(DEFAULT_TIPOS_CITA);
  const[horario,setHorarioSync,cargarHorario,cambioHorario,horarioRef]=useEstadoSincronizado({start:WORK_START,end:WORK_END});
  const setPatients=ro(setPatientsSync);
  const setCitas=ro(setCitasSync);
  const setTareas=ro(setTareasSync);
  const setTipos=ro(setTiposSync);
  const setHorario=ro(setHorarioSync);
  const[config,_setConfig]=useState({makeOut:""});const setConfig=ro(_setConfig);

  const uid=session?.user?.id;
  const cid=currentClinica?.id;
  const esAdmin=currentUser?.rol==="admin";
  const miId=currentUser?.id;

  useEffect(()=>{
    if(demo)return;
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthListo(true);});
    const{data:sub}=supabase.auth.onAuthStateChange((ev,s)=>{if(ev==="PASSWORD_RECOVERY")setRecuperando(true);setSession(s);});
    return()=>sub.subscription.unsubscribe();
  },[demo]);

  const cargarTodo=useCallback(async()=>{
    if(demo||!uid)return;
    try{
      const{data:mis,error}=await supabase.from("miembros").select("*").eq("user_id",uid);
      if(error)throw error;
      if(!mis.length){setEstado("sin-clinica");return;}
      const yo=mis[0];
      if(!yo.activo){setEstado("desactivado");return;}
      const c=yo.clinica_id;
      const[{data:cl,error:e1},{data:ms,error:e2},ps,cs,ts]=await Promise.all([
        supabase.from("clinicas").select("*").eq("id",c).single(),
        supabase.from("miembros").select("*").eq("clinica_id",c).order("creado_en"),
        leerTodo("pacientes",c),leerTodo("citas",c),leerTodo("tareas",c),
      ]);
      if(e1||e2)throw(e1||e2);
      setCurrentUser(yo);setCurrentClinica(cl);setProfesionales(ms);
      cargarPatients(ps.map(r=>({...mkPatient(),...r.datos,id:Number(r.id),profesionalId:r.profesional_id})));
      cargarCitas(cs.map(r=>({...r.datos,id:Number(r.id),profesionalId:r.profesional_id})));
      cargarTareas(ts.map(r=>({...r.datos,id:Number(r.id)})));
      cargarTipos(cl.config?.tipos||DEFAULT_TIPOS_CITA);
      cargarHorario(cl.config?.horario||{start:WORK_START,end:WORK_END});
      setEstado("listo");
    }catch(e){console.error(e);setEstado("error");}
  },[demo,uid]);

  useEffect(()=>{
    if(demo)return;
    if(uid){setEstado("cargando");cargarTodo();}
    else{setCurrentUser(null);setCurrentClinica(null);setProfesionales([]);cargarPatients([]);cargarCitas([]);cargarTareas([]);setEstado("cargando");}
  },[uid]);

  // Guardado automático de cada cambio
  const guardar=async fn=>{
    setPendientes(n=>n+1);
    try{await fn();}
    catch(e){
      console.error(e);
      const permiso=e?.code==="42501"||/permiso|row-level/i.test(e?.message||"");
      setAviso(permiso?"No tienes permiso para hacer ese cambio. Se ha deshecho.":"No se ha podido guardar. Revisa tu conexión: se han recargado los datos.");
      cargarTodo();
    }finally{setPendientes(n=>n-1);}
  };
  if(!demo&&cid){
    const ahora=()=>new Date().toISOString();
    cambioPatients.current=(prev,next)=>guardar(()=>sincronizar("pacientes",cid,prev,next,p=>({clinica_id:cid,id:p.id,profesional_id:p.profesionalId||miId,datos:p,actualizado_en:ahora()})));
    cambioCitas.current=(prev,next)=>guardar(()=>sincronizar("citas",cid,prev,next,ci=>{
      const pac=patientsRef.current.find(p=>p.id==ci.pacienteId);
      return{clinica_id:cid,id:ci.id,profesional_id:pac?.profesionalId||ci.profesionalId||miId,fecha:ci.fecha,datos:ci,actualizado_en:ahora()};
    }));
    cambioTareas.current=(prev,next)=>guardar(()=>sincronizar("tareas",cid,prev,next,t=>({clinica_id:cid,id:t.id,datos:t})));
    const guardarConfig=()=>guardar(async()=>{
      const nueva={...(currentClinica.config||{}),tipos:tiposRef.current,horario:horarioRef.current};
      const{data,error}=await supabase.from("clinicas").update({config:nueva}).eq("id",cid).select("id");
      if(error)throw error;
      if(!data.length)throw new Error("Sin permiso");
      setCurrentClinica(c=>({...c,config:nueva}));
    });
    const soloAdmin=(cargar)=>(prev)=>{if(!esAdmin){cargar(prev);setAviso("Solo el administrador puede cambiar la configuración de la clínica.");return;}guardarConfig();};
    cambioTipos.current=soloAdmin(cargarTipos);
    cambioHorario.current=soloAdmin(cargarHorario);
  }
  useEffect(()=>{
    const h=e=>{if(pendientes>0){e.preventDefault();e.returnValue="";}};
    window.addEventListener("beforeunload",h);return()=>window.removeEventListener("beforeunload",h);
  },[pendientes]);
  // Registro de accesos: cada vez que se abre una ficha (lo comprueba la base de datos)
  const registrarVista=useCallback(id=>{if(!demo&&cid)supabase.rpc("registrar_vista",{p_clinica:cid,p_paciente:id}).then(()=>{},()=>{});},[demo,cid]);
  const cerrarSesion=async()=>{if(demo){window.location.href="/";return;}await supabase.auth.signOut();};
  const[page,setPage]=useState("dashboard");
  const[selectedId,setSelectedId]=useState(null);
  const[showInforme,setShowInforme]=useState(false);
  const[editCitaDash,setEditCitaDash]=useState(null);
  const[editTareaDash,setEditTareaDash]=useState(null);
  const[newCitaDash,setNewCitaDash]=useState(false);
  const[showVideo,setShowVideo]=useState(false);
  const[autoNewPaciente,setAutoNewPaciente]=useState(false);
  const[globalSearch,setGlobalSearch]=useState("");
  const[showNotifs,setShowNotifs]=useState(false);
  const[dismissedNotifs,setDismissedNotifs]=useState(new Set());
  const dismissNotif=id=>setDismissedNotifs(s=>new Set([...s,id]));
  const dismissAll=()=>setDismissedNotifs(new Set(notifs.map(n=>n.id)));

  const[reminders,setReminders]=useReminders(citas,patients);
  const selectedPatient=patients.find(p=>p.id===selectedId);
  const selectPatient=id=>{setSelectedId(id);setPage("ficha");};
  const goBack=()=>{setSelectedId(null);setPage("pacientes");};

  // Notificaciones — calculadas después de todos los estados
  const hoyStr=toYMD(today());
  const notifs=[
    ...tareas.filter(t=>!t.hecho&&t.fecha<hoyStr).map(t=>({id:`t-${t.id}`,tipo:"tarea",color:C.red,bg:C.rD,msg:`Tarea vencida: "${t.titulo||t.texto}"`})),
    ...patients.filter(p=>p.estado==="activo"&&!p.consentimiento).map(p=>({id:`c-${p.id}`,tipo:"consentimiento",color:C.amber,bg:C.amD,msg:`${p.nombre} ${p.apellidos} — consentimiento pendiente`})),
  ];
  if(!demo){
    if(!authListo)return <PantallaEstado titulo="Cargando…"/>;
    if(recuperando&&session)return <Acceso recuperando onPasswordCambiada={()=>setRecuperando(false)}/>;
    if(!session)return <Acceso/>;
    if(estado==="sin-clinica")return <Onboarding session={session} onListo={()=>{setEstado("cargando");cargarTodo();}}/>;
    if(estado==="desactivado")return <PantallaEstado titulo="Cuenta desactivada" texto="El administrador de tu clínica ha desactivado tu acceso. Si crees que es un error, contacta con él." accion={<Enlace onClick={cerrarSesion}>Cerrar sesión</Enlace>}/>;
    if(estado==="error")return <PantallaEstado titulo="No se han podido cargar los datos" texto="Puede ser un problema de conexión o que la base de datos todavía no esté configurada." accion={<><button style={st.btn()} onClick={()=>{setEstado("cargando");cargarTodo();}}>Reintentar</button><div style={{marginTop:14}}><Enlace onClick={cerrarSesion}>Cerrar sesión</Enlace></div></>}/>;
    if(estado!=="listo"||!currentUser)return <PantallaEstado titulo="Cargando tu clínica…"/>;
  }
  return(
    <DemoCtx.Provider value={demo}>
    <EquipoCtx.Provider value={{esAdmin:currentUser.rol==="admin",miembros:profesionales,miId:currentUser.id,registrarVista}}>
    <div style={st.app}>
      {aviso&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:400,background:C.red,color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,boxShadow:"0 8px 24px rgba(34,22,16,0.25)",maxWidth:"90vw"}}>{aviso}</div>}
      {pendientes>0&&<div style={{position:"fixed",bottom:16,left:16,zIndex:300,background:C.bone,border:`1px solid ${C.border}`,color:C.muted,padding:"6px 12px",borderRadius:8,fontSize:12}}>Guardando…</div>}
      {demoToast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:400,background:C.ink,color:C.bone,padding:"10px 18px",borderRadius:10,fontSize:13,boxShadow:"0 8px 24px rgba(34,22,16,0.25)"}}>Estás en la demo: los cambios no se guardan</div>}
      {reminders.length>0&&<div style={{position:"fixed",bottom:16,right:16,zIndex:200,display:"flex",flexDirection:"column",gap:8}}>{reminders.map(r=><div key={r.id} style={{background:r.type==="soon"?C.rD:C.amD,border:`1px solid ${r.type==="soon"?C.red:C.amber}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:r.type==="soon"?C.red:C.amber,display:"flex",gap:10,alignItems:"center",maxWidth:340,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}><span style={{flex:1}}>{r.msg}</span><button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:14}}>✕</button></div>)}</div>}

      {/* Panel de notificaciones — fixed dentro del área principal */}
      {showNotifs&&(
        <div style={{position:"fixed",top:0,left:220,right:0,bottom:0,zIndex:250}} onClick={()=>setShowNotifs(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:16,left:16,width:360,background:C.bone,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 8px 32px rgba(59,42,30,0.16)",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.sand}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>
                Notificaciones {notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0&&`(${notifs.filter(n=>!dismissedNotifs.has(n.id)).length})`}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {notifs.some(n=>!dismissedNotifs.has(n.id))&&(
                  <button onClick={dismissAll} style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Borrar todas</button>
                )}
                <button onClick={()=>setShowNotifs(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
              </div>
            </div>
            {notifs.filter(n=>!dismissedNotifs.has(n.id)).length===0&&(
              <div style={{padding:"24px 16px",fontSize:13,color:C.muted,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>✓</div>
                Sin notificaciones pendientes
              </div>
            )}
            {notifs.filter(n=>!dismissedNotifs.has(n.id)).map(n=>(
              <div key={n.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{n.tipo==="tarea"?"⏰":"⚠"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:n.color,lineHeight:1.5}}>{n.msg}</div>
                </div>
                <button onClick={()=>dismissNotif(n.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.dim,flexShrink:0,marginTop:1}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={st.sidebar}>
        <div style={{...st.sidebarBrand,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <img src={PRAXI_LOGO} alt="praXi" style={{height:38,display:"block"}}/>
          </div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowNotifs(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0?C.amber:C.muted,position:"relative"}}>
              🔔
              {notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0&&<span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.red,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifs.filter(n=>!dismissedNotifs.has(n.id)).length}</span>}
            </button>
          </div>
        </div>

        {/* Búsqueda global spotlight */}
        <div style={{padding:"0 14px 12px",position:"relative"}}>
          <input
            style={{...st.input,fontSize:12,background:C.card}}
            placeholder="Buscar..."
            value={globalSearch}
            onChange={e=>setGlobalSearch(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Escape"){setGlobalSearch("");}
            }}
          />
          {globalSearch&&(()=>{
            const q=globalSearch.toLowerCase();
            const results=[];

            // Pacientes
            patients.filter(p=>`${p.nombre} ${p.apellidos}`.toLowerCase().includes(q)||p.telefono?.includes(q)||p.email?.toLowerCase().includes(q)).slice(0,5).forEach(p=>
              results.push({id:`p-${p.id}`,tipo:"Paciente",icon:"👤",label:`${p.nombre} ${p.apellidos}`,sub:`${p.sesiones.length} sesiones · ${p.estado}`,action:()=>{selectPatient(p.id);setGlobalSearch("");}})
            );

            // Páginas
            [["dashboard","Dashboard","📊"],["calendario","Calendario","📅"],["pacientes","Pacientes","👥"],["facturas","Facturas","🧾"],["recursos","Recursos","📚"],["admin","Administración","⚙"]].filter(([,label])=>label.toLowerCase().includes(q)).forEach(([id,label,icon])=>
              results.push({id:`nav-${id}`,tipo:"Sección",icon,label,sub:"Ir a "+label,action:()=>{setPage(id);setSelectedId(null);setGlobalSearch("");}})
            );

            // Facturas
            patients.flatMap(p=>p.sesiones.map(s=>({...s,paciente:`${p.nombre} ${p.apellidos}`,pid:p.id}))).filter(s=>s.factura?.toLowerCase().includes(q)||s.paciente.toLowerCase().includes(q)).slice(0,3).forEach(s=>
              results.push({id:`f-${s.id}`,tipo:"Factura",icon:"🧾",label:s.factura,sub:`${s.paciente} · ${s.pago}€ · ${s.pagado?"Pagada":"Pendiente"}`,action:()=>{setPage("facturas");setGlobalSearch("");}})
            );

            // Citas
            citas.filter(c=>{const p=patients.find(p=>p.id==c.pacienteId);const name=c.origen==="calendly"?(c.nombreExterno||""):(p?`${p.nombre} ${p.apellidos}`:"");return name.toLowerCase().includes(q)||c.fecha?.includes(q)||c.tipo?.toLowerCase().includes(q);}).slice(0,3).forEach(c=>{
              const p=patients.find(p=>p.id==c.pacienteId);
              const name=c.origen==="calendly"?(c.nombreExterno||"Calendly"):(p?`${p.nombre} ${p.apellidos}`:"?");
              results.push({id:`c-${c.id}`,tipo:"Cita",icon:"📅",label:name,sub:`${c.fecha} · ${c.hora} · ${c.tipo||"Cita"}`,action:()=>{setPage("calendario");setGlobalSearch("");}});
            });

            if(results.length===0) return(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bone,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(59,42,30,0.12)",zIndex:200,padding:"14px",fontSize:12,color:C.muted,textAlign:"center"}}>Sin resultados</div>
            );

            // Group by tipo
            const grupos={};
            results.forEach(r=>{if(!grupos[r.tipo])grupos[r.tipo]=[];grupos[r.tipo].push(r);});

            return(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bone,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(59,42,30,0.12)",zIndex:200,maxHeight:340,overflowY:"auto"}}>
                {Object.entries(grupos).map(([tipo,items])=>(
                  <div key={tipo}>
                    <div style={{padding:"6px 12px 2px",fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{tipo}</div>
                    {items.map(r=>(
                      <div key={r.id} onClick={r.action} style={{padding:"8px 12px",cursor:"pointer",display:"flex",gap:10,alignItems:"center",borderRadius:6,margin:"1px 4px"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.sand}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <span style={{fontSize:14,flexShrink:0}}>{r.icon}</span>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                          <div style={{fontSize:11,color:C.muted}}>{r.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {[["dashboard","Dashboard"],["calendario","Calendario"],["pacientes","Pacientes"],["facturas","Facturas"],["recursos","Recursos"]].map(([id,label])=>{
          const badge=id==="pacientes"?patients.filter(p=>!p.consentimiento&&p.estado==="activo").length:0;
          return(
            <div key={id} style={{...st.navItem(page===id||(id==="pacientes"&&page==="ficha")),justifyContent:"space-between"}} onClick={()=>{setPage(id);setSelectedId(null);}}>
              <span>▪ {label}</span>
              {badge>0&&<span style={{...st.badge(C.amber,C.amD),fontSize:9}}>{badge}</span>}
            </div>
          );
        })}
        {currentUser.rol==="admin"&&(
          <div style={st.navItem(page==="admin")} onClick={()=>setPage("admin")}>▪ Equipo</div>
        )}
        
        {currentUser.rol==="admin"&&<div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <div style={st.navItem(page==="configuracion")} onClick={()=>setPage("configuracion")}>▪ Configuración</div>
        </div>}
        <div style={{flex:1}}/>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:currentUser.color||C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>{currentUser.nombre[0]}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.nombre}</div>
              <div style={{fontSize:10,color:C.muted}}>{currentUser.especialidad||currentUser.rol}</div>
            </div>
          </div>
          <div style={{fontSize:11,color:C.dim,marginBottom:6,padding:"4px 8px",background:C.sand,borderRadius:6}}>{currentClinica?.nombre}</div>
          <button style={{...st.btn("ghost"),fontSize:11,color:currentUser.enlace_videollamada?C.muted:C.accent,textAlign:"left",padding:"4px 0"}} onClick={()=>setShowVideo(true)}>🎥 Mi videollamada{currentUser.enlace_videollamada?"":" · sin configurar"}</button>
          <button style={{...st.btn("ghost"),marginTop:4,fontSize:11,color:C.muted,textAlign:"left",padding:"4px 0"}} onClick={cerrarSesion}>🔒 {demo?"Salir de la demo":"Cerrar sesión"}</button>
        </div>
      </div>
      <div style={st.main}>
        {demo&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",background:C.sand,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",marginBottom:20,fontSize:13,color:C.walnut}}>
          <span><strong style={{color:C.accent}}>Modo demo</strong> · Navega por todas las secciones con pacientes de ejemplo. Los cambios no se guardan.</span>
          <a href="/" style={{...st.btn("sm"),textDecoration:"none"}}>Solicitar acceso</a>
        </div>}
        {page==="dashboard"&&<Dashboard patients={patients} citas={citas} setCitas={setCitas} tareas={tareas} setTareas={setTareas} onInforme={()=>setShowInforme(true)} onEditCita={c=>setEditCitaDash(c)} onEditTarea={t=>setEditTareaDash(t)} onNuevaCita={()=>setNewCitaDash(true)} onAgendar={id=>setNewCitaDash({pacienteId:id})} onAbrirPaciente={selectPatient} horario={horario} onNuevoPaciente={()=>{setAutoNewPaciente(true);setPage("pacientes");}} onVerCalendario={()=>setPage("calendario")}/>}
        {page==="calendario"&&<Calendario patients={patients} citas={citas} setCitas={setCitas} config={config} setConfig={setConfig} tipos={tipos} horario={horario} tareas={tareas} setTareas={setTareas}/>}
        {page==="pacientes"&&<Pacientes patients={patients} setPatients={setPatients} onSelect={selectPatient} autoNew={autoNewPaciente} onAutoNewDone={()=>setAutoNewPaciente(false)}/>}
        {page==="ficha"&&selectedPatient&&<FichaPaciente patient={selectedPatient} setPatients={setPatients} onBack={goBack} citas={citas} setCitas={setCitas} profesionales={profesionales} tipos={tipos}/>}
        {page==="facturas"&&<Facturas patients={patients} setPatients={setPatients}/>}
        {page==="recursos"&&<Recursos/>}
        {page==="admin"&&currentUser.rol==="admin"&&<EquipoPanel clinica={currentClinica} miembros={profesionales} yo={currentUser} patients={patients} citas={citas} demo={demo} onCambio={cargarTodo} bloquearDemo={()=>setDemoToast(true)} setAviso={setAviso} onBorrada={cerrarSesion}/>}
        {page==="configuracion"&&currentUser.rol==="admin"&&<Configuracion horario={horario} setHorario={setHorario} tipos={tipos} setTipos={setTipos}/>}
      </div>
      {showInforme&&<InformeMensual patients={patients} citas={citas} onClose={()=>setShowInforme(false)}/>}
      {editCitaDash&&<CitaModal cita={editCitaDash} patients={patients} tipos={tipos} defaultFecha={editCitaDash.fecha} defaultHora={editCitaDash.hora} defaultTipoId={editCitaDash.tipoId} makeUrl={config.makeOut} onClose={()=>setEditCitaDash(null)} onSave={form=>{setCitas(cs=>cs.map(c=>c.id===form.id?{...c,...form}:c));setEditCitaDash(null);}} onDelete={id=>{setCitas(cs=>cs.filter(c=>c.id!==id));setEditCitaDash(null);}}/>}
      {showVideo&&<MiVideollamadaModal yo={currentUser} demo={demo} onClose={()=>setShowVideo(false)} onDemo={()=>{setShowVideo(false);setDemoToast(true);}}
        onGuardado={e=>{setCurrentUser(u=>({...u,enlace_videollamada:e}));setProfesionales(ms=>ms.map(m=>m.id===currentUser.id?{...m,enlace_videollamada:e}:m));setShowVideo(false);}}/>}
      {newCitaDash&&<CitaModal cita={null} defaultPacienteId={newCitaDash?.pacienteId} patients={patients} tipos={tipos} defaultFecha={toYMD(today())} defaultHora="09:00" defaultTipoId={tipos[0]?.id} makeUrl={config.makeOut} onClose={()=>setNewCitaDash(false)} onSave={form=>{setCitas(cs=>[...cs,{...form,id:Date.now(),pacienteId:form.pacienteId?Number(form.pacienteId):null}]);setNewCitaDash(false);}} onDelete={()=>setNewCitaDash(false)}/>}
      {editTareaDash&&<TareaModal tarea={editTareaDash} onClose={()=>setEditTareaDash(null)} onSave={t=>{setTareas(ts=>ts.map(x=>x.id===t.id?t:x));setEditTareaDash(null);}} onDelete={id=>{setTareas(ts=>ts.filter(t=>t.id!==id));setEditTareaDash(null);}}/>}
    </div>
    </EquipoCtx.Provider>
    </DemoCtx.Provider>
  );
}
