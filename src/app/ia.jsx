import { supabase } from "../supabase.js";
import { escRe } from "./utilidades.js";

export function crearSeudonimos(pares){
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
  // «el Paciente 3» → «Lucía Martín» (sin artículo delante del nombre real)
  const sinArticulo=(s,al)=>s.replace(new RegExp(`\\b(el|la|al|del)\\s+(?=${escRe(al)}(?![0-9]))`,"giu"),m=>({al:"a ",del:"de "}[m.trim().toLowerCase()]||""));
  const desenmascarar=txt=>vuelta.reduce((s,[al,n])=>sinArticulo(s,al).split(al).join(n),txt||"");
  return{enmascarar,desenmascarar};
}
export async function enviarIA({system,messages,seud}){
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
  // Texto plano: fuera los asteriscos y almohadillas de Markdown
  const limpio=String(j.texto||"").replace(/\*\*(.+?)\*\*/gs,"$1").replace(/^#{1,6}\s+/gm,"");
  return seud.desenmascarar(limpio);
}
