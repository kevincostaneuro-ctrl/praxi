import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabase.js";
import { DemoCtx } from "./constantes.js";
import { C, st } from "./estilos.js";
import { edadDe, escRe } from "./utilidades.js";

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
  const desenmascarar=txt=>vuelta.reduce((s,[al,n])=>s.split(al).join(n),txt||"");
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
  return seud.desenmascarar(j.texto);
}

// ══════════════════════════════════════════════════════════════════════════════
// PANEL DE IA — asistente clínico contextual
// ══════════════════════════════════════════════════════════════════════════════
export function IAPanel({patient,onClose}){
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

// ══════════════════════════════════════════════════════════════════════════════
// IA PANEL — FACTURACIÓN
// ══════════════════════════════════════════════════════════════════════════════
export function IAFacturasPanel({patients,onClose}){
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
