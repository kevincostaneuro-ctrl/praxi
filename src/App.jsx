import { useState, useMemo, useEffect, useRef } from "react";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
// ── CLINICA + PROFESIONALES STORE ─────────────────────────────────────────────
// En producción esto va en Supabase. Por ahora en memoria.
const INITIAL_CLINICA={
  id:"c1",
  nombre:"Clínica Praxi",
  email:"admin@praxi.com",
  password:"praxi2026",
  creadoEn:new Date().toISOString(),
};

const INITIAL_PROFESIONALES=[
  {id:"u1",nombre:"Kevin Costa",email:"kevin@praxi.com",password:"psico2026",
   especialidad:"Neuropsicología",color:"#A66B3F",rol:"admin",
   clinicaId:"c1",activo:true,creadoEn:new Date().toISOString()},
  {id:"u2",nombre:"María López",email:"maria@praxi.com",password:"psico2026",
   especialidad:"Psicología Clínica",color:"#6B8C5A",rol:"profesional",
   clinicaId:"c1",activo:true,creadoEn:new Date().toISOString()},
];

let CLINICA_STORE={...INITIAL_CLINICA};
let PROF_STORE=[...INITIAL_PROFESIONALES];
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
const toYMD = d=>d.toISOString().split("T")[0];
const today = ()=>new Date();
const addDays = (d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
const startOfWeek = d=>{const r=new Date(d);const day=r.getDay();r.setDate(r.getDate()+(day===0?-6:1-day));return r;};
const timeToMins = t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
const minsToTime = m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const generateZoom = ()=>`https://zoom.us/j/${Math.floor(Math.random()*9e9+1e9)}?pwd=${Math.random().toString(36).slice(2,10)}`;
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
    fontSize:13,fontWeight:a?500:400,transition:"all 150ms"}),
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
  {id:1,pacienteId:1,fecha:toYMD(today()),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:2,pacienteId:2,fecha:toYMD(today()),hora:"11:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:3,pacienteId:null,fecha:toYMD(today()),hora:"10:00",duracion:30,tipoId:"t1",tipo:"Primera llamada",notas:"",zoomLink:generateZoom(),origen:"calendly",nombreExterno:"Ana Martín",telefonoExterno:"666 111 222",emailExterno:"ana@email.com",precio:0},
  {id:4,pacienteId:5,fecha:toYMD(today()),hora:"12:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:90},
  {id:5,pacienteId:8,fecha:toYMD(today()),hora:"16:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:6,pacienteId:3,fecha:toYMD(addDays(today(),1)),hora:"09:30",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:7,pacienteId:6,fecha:toYMD(addDays(today(),1)),hora:"11:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:8,pacienteId:9,fecha:toYMD(addDays(today(),2)),hora:"10:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:9,pacienteId:4,fecha:toYMD(addDays(today(),2)),hora:"12:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:90},
  {id:10,pacienteId:10,fecha:toYMD(addDays(today(),3)),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:11,pacienteId:11,fecha:toYMD(addDays(today(),3)),hora:"11:30",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:90},
  {id:12,pacienteId:7,fecha:toYMD(addDays(today(),4)),hora:"10:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:13,pacienteId:12,fecha:toYMD(addDays(today(),4)),hora:"12:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:80},
  {id:14,pacienteId:14,fecha:toYMD(addDays(today(),5)),hora:"09:00",duracion:60,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:70},
  {id:15,pacienteId:15,fecha:toYMD(addDays(today(),5)),hora:"11:00",duracion:90,tipoId:"t2",tipo:"Seguimiento",notas:"",zoomLink:generateZoom(),origen:"interno",precio:90},
  {id:16,pacienteId:null,fecha:toYMD(addDays(today(),6)),hora:"09:30",duracion:30,tipoId:"t1",tipo:"Primera llamada",notas:"",zoomLink:generateZoom(),origen:"calendly",nombreExterno:"Pablo Suárez",telefonoExterno:"688 001 234",emailExterno:"pablo@email.com",precio:0},
];
// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function Login({onLogin}){
  // Paso 1: login de clínica. Paso 2: login/registro de profesional
  const[step,setStep]=useState("clinica"); // "clinica" | "profesional"
  const[clinica,setClinica]=useState(null);
  const[mode,setMode]=useState("login"); // "login" | "register"
  const[show,setShow]=useState(false);
  const[err,setErr]=useState("");
  const[ok,setOk]=useState("");

  const[cForm,setCForm]=useState({email:"",password:""});
  const[pForm,setPForm]=useState({nombre:"",especialidad:"",email:"",password:"",confirm:""});
  const fc=k=>e=>setCForm(p=>({...p,[k]:e.target.value}));
  const fp=k=>e=>setPForm(p=>({...p,[k]:e.target.value}));

  // PASO 1 — Acceso a la clínica
  const loginClinica=()=>{
    setErr("");
    if(CLINICA_STORE.email.toLowerCase()===cForm.email.trim().toLowerCase()&&CLINICA_STORE.password===cForm.password){
      setClinica(CLINICA_STORE);
      setStep("profesional");
    } else {
      setErr("Email o contraseña de clínica incorrectos.");
    }
  };

  // PASO 2 — Login profesional
  const loginProf=()=>{
    setErr("");
    const prof=PROF_STORE.find(p=>p.clinicaId===clinica.id&&p.email.toLowerCase()===pForm.email.trim().toLowerCase());
    if(!prof){setErr("No existe ningún profesional con ese email en esta clínica.");return;}
    if(!prof.activo){setErr("Esta cuenta está desactivada. Contacta con el administrador.");return;}
    if(prof.password!==pForm.password){setErr("Contraseña incorrecta.");return;}
    onLogin(prof,clinica);
  };

  // PASO 2 — Registro profesional
  const registerProf=()=>{
    setErr("");
    if(!pForm.nombre.trim()){setErr("El nombre es obligatorio.");return;}
    if(!pForm.especialidad.trim()){setErr("La especialidad es obligatoria.");return;}
    if(!pForm.email.trim()||!pForm.email.includes("@")){setErr("Email no válido.");return;}
    if(pForm.password.length<6){setErr("La contraseña debe tener al menos 6 caracteres.");return;}
    if(pForm.password!==pForm.confirm){setErr("Las contraseñas no coinciden.");return;}
    if(PROF_STORE.find(p=>p.email.toLowerCase()===pForm.email.trim().toLowerCase())){setErr("Ya existe una cuenta con ese email.");return;}
    const colors=["#A66B3F","#6B8C5A","#C48C2A","#7B6B8C","#8C4A3A","#4A7B6B"];
    const newProf={
      id:"u"+Date.now(),nombre:pForm.nombre.trim(),especialidad:pForm.especialidad.trim(),
      email:pForm.email.trim().toLowerCase(),password:pForm.password,
      rol:"profesional",clinicaId:clinica.id,activo:true,
      color:colors[PROF_STORE.length%colors.length],
      creadoEn:new Date().toISOString(),
    };
    PROF_STORE=[...PROF_STORE,newProf];
    setOk(`Cuenta creada para ${newProf.nombre}. Ya puedes iniciar sesión.`);
    setMode("login");
    setPForm({nombre:"",especialidad:"",email:"",password:"",confirm:""});
  };

  const cardStyle={width:420,background:C.bone,border:`1px solid ${C.border}`,borderRadius:18,padding:44,boxShadow:"0 1px 2px rgba(59,42,30,0.06),0 8px 24px -12px rgba(59,42,30,0.14)"};
  const wrapStyle={minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',sans-serif"};

  const Logo=()=>(
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{fontSize:32,fontWeight:300,color:C.accent,letterSpacing:"-1px",fontFamily:"'Manrope',sans-serif"}}>praxi</div>
      <div style={{fontSize:11,color:C.muted,letterSpacing:"0.18em",textTransform:"uppercase",marginTop:4}}>gestión clínica</div>
    </div>
  );

  // ── PASO 1: Login clínica ──────────────────────────────────────────────────
  if(step==="clinica") return(
    <div style={wrapStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;700&display=swap" rel="stylesheet"/>
      <div style={cardStyle}>
        <Logo/>
        <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:24}}>Accede con las credenciales de tu clínica</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={st.label}>Email de la clínica</label>
            <input style={st.input} type="email" value={cForm.email} onChange={fc("email")} placeholder="clinica@email.com" autoFocus onKeyDown={e=>e.key==="Enter"&&loginClinica()}/>
          </div>
          <div><label style={st.label}>Contraseña</label>
            <div style={{position:"relative"}}>
              <input style={{...st.input,paddingRight:40}} type={show?"text":"password"} value={cForm.password} onChange={fc("password")} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&loginClinica()}/>
              <button onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>{show?"🙈":"👁"}</button>
            </div>
          </div>
        </div>
        {err&&<div style={{fontSize:12,color:C.red,marginTop:14,padding:"8px 12px",background:C.rD,borderRadius:8}}>{err}</div>}
        <button style={{...st.btn(),width:"100%",padding:"12px 0",fontSize:14,marginTop:20,background:C.accent,color:C.bone}} onClick={loginClinica}>
          Acceder a la clínica
        </button>
        <div style={{fontSize:11,color:C.dim,textAlign:"center",marginTop:14}}>Demo: admin@praxi.com / praxi2026</div>
      </div>
    </div>
  );

  // ── PASO 2: Login/registro profesional ────────────────────────────────────
  return(
    <div style={wrapStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;700&display=swap" rel="stylesheet"/>
      <div style={cardStyle}>
        <Logo/>
        {/* Badge clínica */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.sand,borderRadius:10,marginBottom:24,justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Clínica</div>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{clinica.nombre}</div>
          </div>
          <button onClick={()=>{setStep("clinica");setErr("");}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,textDecoration:"underline"}}>Cambiar</button>
        </div>

        {/* Toggle login/registro */}
        <div style={{display:"flex",background:C.card,borderRadius:10,padding:3,marginBottom:24}}>
          {[["login","Soy profesional"],["register","Registrarme"]].map(([m,label])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");setOk("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:mode===m?600:400,background:mode===m?C.bone:"transparent",color:mode===m?C.accent:C.muted,transition:"all 150ms"}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="register"&&<>
            <div><label style={st.label}>Nombre completo</label>
              <input style={st.input} value={pForm.nombre} onChange={fp("nombre")} placeholder="Ej: María García" autoFocus/>
            </div>
            <div><label style={st.label}>Especialidad</label>
              <input style={st.input} value={pForm.especialidad} onChange={fp("especialidad")} placeholder="Ej: Psicología clínica, Fisioterapia..."/>
            </div>
          </>}
          <div><label style={st.label}>Email profesional</label>
            <input style={st.input} type="email" value={pForm.email} onChange={fp("email")} placeholder="tu@email.com" autoFocus={mode==="login"} onKeyDown={e=>mode==="login"&&e.key==="Enter"&&loginProf()}/>
          </div>
          <div><label style={st.label}>Contraseña</label>
            <div style={{position:"relative"}}>
              <input style={{...st.input,paddingRight:40}} type={show?"text":"password"} value={pForm.password} onChange={fp("password")} placeholder="••••••••" onKeyDown={e=>mode==="login"&&e.key==="Enter"&&loginProf()}/>
              <button onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>{show?"🙈":"👁"}</button>
            </div>
          </div>
          {mode==="register"&&<div><label style={st.label}>Confirmar contraseña</label>
            <input style={st.input} type="password" value={pForm.confirm} onChange={fp("confirm")} placeholder="••••••••"/>
          </div>}
        </div>

        {err&&<div style={{fontSize:12,color:C.red,marginTop:12,padding:"8px 12px",background:C.rD,borderRadius:8}}>{err}</div>}
        {ok&&<div style={{fontSize:12,color:C.green,marginTop:12,padding:"8px 12px",background:C.gD,borderRadius:8}}>{ok}</div>}

        <button style={{...st.btn(),width:"100%",padding:"12px 0",fontSize:14,marginTop:20,background:C.accent,color:C.bone}} onClick={mode==="login"?loginProf:registerProf}>
          {mode==="login"?"Entrar":"Crear cuenta"}
        </button>
        {mode==="login"&&<div style={{fontSize:11,color:C.dim,textAlign:"center",marginTop:12}}>Demo: kevin@praxi.com / psico2026</div>}
      </div>
    </div>
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
  const isNew=!patient.motivoConsulta&&patient.sesiones.length===0&&!patient.historiaClinica?.texto;
  const[tab,setTab]=useState("evolucion");
  const[showConsent,setShowConsent]=useState(false);
  const[showAlta,setShowAlta]=useState(false);
  const[editMotivo,setEditMotivo]=useState(false);
  const[motivoTxt,setMotivoTxt]=useState(patient.motivoConsulta||"");
  const[showIA,setShowIA]=useState(false);
  const[showNuevaCita,setShowNuevaCita]=useState(false);
  const update=fn=>setPatients(ps=>ps.map(p=>p.id===patient.id?fn(p):p));

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
          <button style={{...st.btn("sm"),background:C.accent,color:C.bone}} onClick={()=>setShowIA(v=>!v)}>✦ IA</button>
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
      {showIA&&<IAPanel patient={patient} onClose={()=>setShowIA(false)}/>}
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
const mkSesion=()=>({id:null,fecha:"",pago:"",pagado:false,trabajado:"",observaciones:""});
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
        </div>
      ))}
      {show&&<Modal onClose={()=>setShow(false)} title={form.id?`Editar sesión ${form.numero}`:`Sesión ${nextNum}`} width={520}><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field><Field label="Importe €"><input type="number" style={st.input} value={form.pago} onChange={f("pago")}/></Field></div><Field label="Estado"><select style={st.input} value={form.pagado} onChange={e=>setForm(p=>({...p,pagado:e.target.value==="true"}))}><option value="false">Pendiente</option><option value="true">Pagado</option></select></Field><Field label="Lo trabajado en esta sesión"><textarea style={{...st.textarea,minHeight:100}} value={form.trabajado} onChange={f("trabajado")}/></Field></div><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}
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
  const[editing,setEditing]=useState(false);
  const[txt,setTxt]=useState(patient.historiaClinica?.texto||"");

  const save=()=>{update(p=>({...p,historiaClinica:{texto:txt}}));setEditing(false);};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}>
        {editing
          ?<><button style={st.btn("ghost")} onClick={()=>{setTxt(patient.historiaClinica?.texto||"");setEditing(false);}}>Cancelar</button>
            <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={save}>Guardar</button></>
          :<button style={st.btn()} onClick={()=>setEditing(true)}>Editar</button>
        }
      </div>
      {editing
        ?<textarea
            autoFocus
            style={{...st.textarea,minHeight:"60vh",fontSize:14,lineHeight:1.9,fontFamily:"'Instrument Serif',serif",padding:"24px 28px",borderRadius:12,resize:"vertical"}}
            value={txt}
            onChange={e=>setTxt(e.target.value)}
            placeholder="Escribe aquí la historia clínica del paciente..."/>
        :<div
            onClick={()=>setEditing(true)}
            style={{...st.card,padding:"28px 32px",fontSize:14,lineHeight:1.9,fontFamily:"'Instrument Serif',serif",whiteSpace:"pre-wrap",minHeight:"50vh",color:patient.historiaClinica?.texto?C.text:C.dim,fontStyle:patient.historiaClinica?.texto?"normal":"italic",cursor:"pointer"}}>
            {patient.historiaClinica?.texto||"Haz clic para empezar a escribir..."}
          </div>
      }
    </div>
  );
}

// ── TAB FORMULACIÓN DE CASO ───────────────────────────────────────────────────
function TabFormulacionCaso({patient,update}){
  const fc=patient.formulacionCaso||{};
  const[editingKey,setEditingKey]=useState(null);
  const[txt,setTxt]=useState("");

  const open=key=>{setEditingKey(key);setTxt(fc[key]||"");};
  const save=()=>{update(p=>({...p,formulacionCaso:{...p.formulacionCaso,[editingKey]:txt}}));setEditingKey(null);};
  const cancel=()=>setEditingKey(null);

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

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {SECCIONES.map(([key,label,icon])=>{
        const isEditing=editingKey===key;
        const hasContent=!!fc[key];
        return(
          <div key={key} style={{...st.card,overflow:"hidden",gridColumn:key==="otrosFactores"?"1 / -1":"auto"}}>
            <div style={{padding:"10px 14px",background:C.sand,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:14}}>{icon}</span>
                <span style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>{label}</span>
              </div>
              {!isEditing&&(
                <button style={{...st.btn("sm"),fontSize:11}} onClick={()=>open(key)}>
                  {hasContent?"Editar":"+ Añadir"}
                </button>
              )}
            </div>

            {isEditing?(
              <div style={{padding:"12px 14px"}}>
                <textarea
                  autoFocus
                  style={{...st.textarea,minHeight:120,fontSize:13,lineHeight:1.7}}
                  value={txt}
                  onChange={e=>setTxt(e.target.value)}
                  placeholder={`Escribe aquí sobre ${label.toLowerCase()}...`}
                />
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
                  <button style={st.btn("ghost")} onClick={cancel}>Cancelar</button>
                  <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={save}>Guardar</button>
                </div>
              </div>
            ):(
              <div style={{padding:"12px 14px",fontSize:13,color:hasContent?C.text:C.dim,fontStyle:hasContent?"normal":"italic",lineHeight:1.7,minHeight:60,whiteSpace:"pre-wrap",cursor:"pointer"}} onClick={()=>open(key)}>
                {fc[key]||"Sin registrar. Haz clic para añadir."}
              </div>
            )}
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
function CitaModal({cita,patients,tipos,onClose,onSave,onDelete,defaultFecha,defaultHora,defaultTipoId,makeUrl}){
  const tipoInicial=tipos.find(t=>t.id===defaultTipoId)||tipos[0];
  const init=cita?{...cita,tipoId:cita.tipoId||tipos.find(t=>t.nombre===cita.tipo)?.id||tipos[0]?.id}:{pacienteId:"",nombreExterno:"",telefonoExterno:"",emailExterno:"",fecha:defaultFecha||toYMD(today()),hora:defaultHora||"09:00",duracion:tipoInicial?.duracion||60,precio:tipoInicial?.precio||0,tipoId:tipoInicial?.id||tipos[0]?.id,notas:"",zoomLink:"",origen:"interno"};
  const[form,setForm]=useState(init);const[saving,setSaving]=useState(false);const[sendStatus,setSendStatus]=useState(null);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const tipoActual=tipos.find(t=>t.id===form.tipoId)||tipos[0];
  const esPL=tipoActual?.nombre==="Primera llamada";
  const save=async()=>{
    if(!form.fecha||!form.hora)return;if(!esPL&&!form.pacienteId)return;
    const zoomLink=form.zoomLink||generateZoom();const ff={...form,zoomLink,tipo:tipoActual?.nombre||""};
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
        postMake(makeUrl,{...payload,recordatorio:"24h",minutos_aviso:1440,canal:"whatsapp",mensaje:`Hola ${payload.paciente.split(" ")[0]}, te recordamos tu sesión de mañana a las ${form.hora}. Tu enlace: ${zoomLink}`}),
        postMake(makeUrl,{...payload,recordatorio:"1h",minutos_aviso:60,canal:"email_whatsapp",mensaje:`Hola ${payload.paciente.split(" ")[0]}, tu sesión empieza en 1 hora (${form.hora}). Únete aquí: ${zoomLink}`}),
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
            {tipos.map(t=><option key={t.id} value={t.id}>{t.nombre} — {t.duracion} min · {t.precio||0}€</option>)}
          </select>
        </Field>
        {esPL?(<div style={{padding:"12px 14px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.teal}`}}><div style={{fontSize:11,color:C.teal,fontWeight:700,marginBottom:10,textTransform:"uppercase"}}>Datos del contacto</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Nombre"><input style={st.input} value={form.nombreExterno||""} onChange={f("nombreExterno")}/></Field><Field label="Teléfono"><input style={st.input} value={form.telefonoExterno||""} onChange={f("telefonoExterno")}/></Field><div style={{gridColumn:"1/-1"}}><Field label="Email"><input style={st.input} value={form.emailExterno||""} onChange={f("emailExterno")}/></Field></div></div></div>):(<Field label="Paciente"><select style={st.input} value={form.pacienteId} onChange={f("pacienteId")}><option value="">Seleccionar...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>)}</select></Field>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          <Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field>
          <Field label="Hora"><select style={st.input} value={form.hora} onChange={f("hora")}>{HALF_HOURS.map(t=><option key={t}>{t}</option>)}</select></Field>
          <Field label="Duración"><select style={st.input} value={form.duracion} onChange={e=>setForm(p=>({...p,duracion:Number(e.target.value)}))}>{[15,30,45,60,75,90,120].map(d=><option key={d} value={d}>{d} min</option>)}</select></Field>
          <Field label="Precio (€)"><input type="number" min={0} style={st.input} value={form.precio||0} onChange={e=>setForm(p=>({...p,precio:Number(e.target.value)}))}/></Field>
        </div>
        <Field label="Notas"><textarea style={st.textarea} value={form.notas} onChange={f("notas")}/></Field>
        {form.zoomLink&&<div style={{background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,padding:"10px 14px",borderLeft:`3px solid ${C.accent}`}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:4}}>Enlace Zoom</div><a href={form.zoomLink} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.aL,wordBreak:"break-all",textDecoration:"none"}}>{form.zoomLink}</a></div>}
        <div style={{fontSize:12,color:C.muted,display:"flex",gap:8,alignItems:"center"}}><span style={{width:7,height:7,borderRadius:"50%",background:makeUrl?C.green:C.amber,display:"inline-block"}}/>{makeUrl?"Make activo — Google Calendar + Zoom + WhatsApp":"Make no configurado"}</div>
        {sendStatus==="ok"&&<div style={{padding:"8px 12px",background:C.gD,borderRadius:8,fontSize:12,color:C.green,fontWeight:600}}>✓ Enviado a Make</div>}
        {sendStatus==="error"&&<div style={{padding:"8px 12px",background:C.rD,borderRadius:8,fontSize:12,color:C.red}}>✗ Error Make — <button style={{...st.btn("sm"),color:C.red}} onClick={()=>onSave({...form,zoomLink:form.zoomLink||generateZoom(),tipo:tipoActual?.nombre||""})}>Guardar sin Make</button></div>}
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

function Calendario({patients,citas,setCitas,config,setConfig,tipos,horario,tareas,setTareas}){
  const[view,setView]=useState("day");
  const[date,setDate]=useState(today());
  const[citaM,setCitaM]=useState(null);
  const[showCfg,setShowCfg]=useState(false);
  const[makeUrl,setMakeUrl]=useState(config.makeOut||"");
  const[hoverSlot,setHoverSlot]=useState(null);
  const[editTarea,setEditTarea]=useState(null);

  const PRIORIDAD_C={baja:C.green,media:C.amber,alta:C.red};

  const HOURS_LOCAL=Array.from({length:horario.end-horario.start},(_,i)=>horario.start+i);
  const SLOTS_LOCAL=HOURS_LOCAL.flatMap(h=>[`${pad(h)}:00`,`${pad(h)}:30`]);

  const openNew=(d,h,tipoId)=>setCitaM({cita:null,defaultFecha:toYMD(d),defaultHora:typeof h==="number"?`${pad(h)}:00`:h||"09:00",defaultTipoId:tipoId||tipos[0]?.id});
  const openEdit=c=>setCitaM({cita:c,defaultFecha:c.fecha,defaultHora:c.hora,defaultTipoId:c.tipoId});
  const saveCita=form=>{if(form.id)setCitas(cs=>cs.map(c=>c.id===form.id?{...c,...form}:c));else setCitas(cs=>[...cs,{...form,id:Date.now(),pacienteId:form.pacienteId?Number(form.pacienteId):null}]);setCitaM(null);};
  const delCita=id=>{if(confirm("¿Eliminar?"))setCitas(cs=>cs.filter(c=>c.id!==id));setCitaM(null);};
  const nav=dir=>{const d=new Date(date);if(view==="week")d.setDate(d.getDate()+dir*7);else d.setDate(d.getDate()+dir);setDate(d);};
  const todayStr=toYMD(today());
  const navLabel=()=>{
    if(view==="week"){const ws=startOfWeek(date);const we=addDays(ws,6);return`${ws.getDate()} ${MONTHS_ES[ws.getMonth()]} – ${we.getDate()} ${MONTHS_ES[we.getMonth()]} ${we.getFullYear()}`;}
    return date.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  };

  const getFreeSlotsLocal=(dateStr,citasArr)=>{
    const occ=citasArr.filter(c=>c.fecha===dateStr).map(c=>({s:timeToMins(c.hora),e:timeToMins(c.hora)+c.duracion}));
    const free=[];
    for(let t=horario.start*60;t+30<=horario.end*60;t+=30){if(!occ.some(o=>t<o.e&&t+30>o.s))free.push(minsToTime(t));}
    return free;
  };

  // Vista semanal
  const WeekV=()=>{
    const ws=startOfWeek(date);
    const days=Array.from({length:7},(_,i)=>addDays(ws,i));
    return(
      <div>
        {/* Header días */}
        <div style={{display:"grid",gridTemplateColumns:"54px repeat(7,1fr)",borderBottom:`1px solid ${C.border}`}}>
          <div/>
          {days.map((d,i)=>{const isT=toYMD(d)===todayStr;const hasCitas=citas.some(c=>c.fecha===toYMD(d));return(
            <div key={i} onClick={()=>{setDate(d);setView("day");}} style={{padding:"10px 6px",textAlign:"center",cursor:"pointer",background:isT?"rgba(166,107,63,0.09)":hasCitas?"rgba(166,107,63,0.03)":"transparent",borderLeft:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,color:isT?C.accent:hasCitas?C.walnut:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:hasCitas||isT?600:400}}>{DAYS_ES[i]}</div>
              <div style={{fontSize:16,fontWeight:isT?700:400,color:isT?C.accent:C.text,width:28,height:28,borderRadius:"50%",background:isT?C.sand:"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"4px auto 0"}}>{d.getDate()}</div>
              {hasCitas&&!isT&&<div style={{width:4,height:4,borderRadius:"50%",background:C.accent,margin:"2px auto 0"}}/>}
            </div>
          );})}
        </div>
        {/* Franjas horarias */}
        <div style={{overflowY:"auto",maxHeight:"60vh"}}>
          {SLOTS_LOCAL.map(time=>(
            <div key={time} style={{display:"grid",gridTemplateColumns:"54px repeat(7,1fr)",borderBottom:`1px solid ${C.border}`,minHeight:44}}>
              <div style={{fontSize:10,color:time.endsWith(":00")?C.walnut:C.dim,padding:"6px 8px",textAlign:"right",flexShrink:0,paddingTop:8,fontWeight:time.endsWith(":00")?600:400}}>{time.endsWith(":00")?time:"·"}</div>
              {days.map((d,i)=>{
                const ds=toYMD(d);
                const cita=citas.find(c=>c.fecha===ds&&c.hora===time);
                const isT=ds===todayStr;
                const covered=citas.some(c=>c.fecha===ds&&timeToMins(c.hora)<timeToMins(time)&&timeToMins(time)<timeToMins(c.hora)+c.duracion);
                if(covered)return <div key={i} style={{borderLeft:`1px solid ${C.border}`,background:isT?"rgba(166,107,63,0.03)":"transparent"}}/>;
                if(cita){
                  const p=patients.find(p=>p.id==cita.pacienteId);
                  const isC=cita.origen==="calendly";
                  const name=isC?(cita.nombreExterno||"Cal"):(p?p.nombre:"?");
                  const rowH=44*(cita.duracion/30);
                  return(
                    <div key={i} onClick={()=>openEdit(cita)} style={{borderLeft:`1px solid ${C.border}`,padding:2,cursor:"pointer",minHeight:rowH}}>
                      <div style={{background:isC?C.teal:C.accent,borderRadius:5,padding:"3px 6px",height:"calc(100% - 2px)",overflow:"hidden"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#fff",lineHeight:1.3}}>{name}</div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,0.8)"}}>{cita.hora}</div>
                      </div>
                    </div>
                  );
                }
                return(
                  <div key={i} onClick={()=>openNew(d,time)} style={{borderLeft:`1px solid ${C.border}`,background:isT?"rgba(166,107,63,0.03)":"transparent",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(166,107,63,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background=isT?"rgba(166,107,63,0.03)":"transparent"}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Día — hover-to-edit
  const DayV=()=>{
    const dateStr=toYMD(date);
    const dc=citas.filter(c=>c.fecha===dateStr);
    const free=getFreeSlotsLocal(dateStr,citas);
    const covered=time=>{const tM=timeToMins(time);return dc.some(c=>{const cs=timeToMins(c.hora);return cs<tM&&tM<cs+c.duracion;});};
    const rendered=new Set();
    return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:14}}>
        <div style={st.card}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:14,fontWeight:700}}>{date.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          {SLOTS_LOCAL.map(time=>{
            if(rendered.has(time)||covered(time))return null;
            const cita=dc.find(c=>c.hora===time);
            if(cita){
              rendered.add(time);
              const rowH=68*(cita.duracion/30);
              const p=patients.find(p=>p.id==cita.pacienteId);
              const isC=cita.origen==="calendly";
              const bg=isC?C.teal:C.accent;
              const name=isC?(cita.nombreExterno||"Calendly"):(p?`${p.nombre} ${p.apellidos}`:"Paciente");
              return(
                <div key={time} onMouseEnter={()=>setHoverSlot(time)} onMouseLeave={()=>setHoverSlot(null)} onClick={()=>openEdit(cita)} style={{display:"flex",borderBottom:`1px solid ${C.border}`,minHeight:rowH,cursor:"pointer"}}>
                  <div style={{width:54,fontSize:10,color:C.dim,padding:"10px 8px",textAlign:"right",flexShrink:0}}>{time}</div>
                  <div style={{flex:1,padding:5}}>
                    <div style={{background:bg,borderRadius:8,padding:"8px 12px",height:"calc(100% - 4px)",boxSizing:"border-box",transition:"filter 150ms",filter:hoverSlot===time?"brightness(0.94)":"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{name}</div>
                          <div style={{fontSize:11,color:"rgba(255,255,255,0.75)"}}>{cita.hora} · {cita.tipo} · {cita.duracion}min</div>
                        </div>
                        {isC&&<span style={{fontSize:9,background:"rgba(255,255,255,0.2)",color:"#fff",padding:"2px 6px",borderRadius:8}}>Calendly</span>}
                      </div>
                      {cita.zoomLink&&<a href={cita.zoomLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:11,color:"rgba(255,255,255,0.85)",display:"inline-flex",gap:4,textDecoration:"none",background:"rgba(166,107,63,0.12)",borderRadius:5,padding:"3px 8px",marginTop:5}}>🎥 Unirse a Zoom</a>}
                    </div>
                  </div>
                </div>
              );
            }
            const isHover=hoverSlot===time;
            return(
              <div key={time} onMouseEnter={()=>setHoverSlot(time)} onMouseLeave={()=>setHoverSlot(null)} onClick={()=>openNew(date,time)} style={{display:"flex",borderBottom:`1px solid ${C.border}`,minHeight:68,cursor:"pointer"}}>
                <div style={{width:54,fontSize:10,color:C.dim,padding:"10px 8px",textAlign:"right",flexShrink:0}}>{time}</div>
                <div style={{flex:1,padding:5}}>
                  <div style={{height:"100%",borderRadius:7,border:isHover?`1px solid ${C.accent}`:`1px dashed ${C.clay}`,background:isHover?"rgba(166,107,63,0.06)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:isHover?C.accent:C.dim,fontSize:11,transition:"all 150ms"}}>
                    {isHover?"+ Añadir cita":"Libre"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <StatCard val={dc.length} label="Citas" color={C.aL}/>
          <StatCard val={free.length} label="Slots libres" color={C.green}/>
          <div style={{...st.card,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:10}}>Agenda</div>
            {dc.length===0&&<div style={{fontSize:13,color:C.muted}}>Sin citas</div>}
            {[...dc].sort((a,b)=>a.hora.localeCompare(b.hora)).map(c=>{const p=patients.find(p=>p.id==c.pacienteId);const isC=c.origen==="calendly";const name=isC?(c.nombreExterno||"Calendly"):(p?`${p.nombre} ${p.apellidos}`:"?");return(<div key={c.id} onClick={()=>openEdit(c)} style={{marginBottom:10,cursor:"pointer"}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}><div style={{width:26,height:26,borderRadius:"50%",background:isC?C.tD:C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:isC?C.teal:C.walnut,flexShrink:0}}>{name[0]}</div><div><div style={{fontSize:12,fontWeight:600}}>{name}</div><div style={{fontSize:10,color:C.muted}}>{c.hora} · {c.duracion}min</div></div></div>{c.zoomLink&&<a href={c.zoomLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:11,color:isC?C.teal:C.accent,display:"inline-flex",gap:4,textDecoration:"none",background:isC?C.tD:C.sand,borderRadius:5,padding:"3px 8px",marginLeft:34}}>🎥 Zoom</a>}</div>);})}
          </div>
          {/* Tareas del día */}
          {(()=>{const tareasDia=tareas.filter(t=>t.fecha===dateStr).sort((a,b)=>a.hora.localeCompare(b.hora));return tareasDia.length>0&&(
            <div style={{...st.card,padding:"14px 16px"}}>
              <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:8}}>Tareas del día</div>
              {tareasDia.map(t=>(
                <div key={t.id} onClick={()=>setEditTarea(t)} style={{marginBottom:8,cursor:"pointer",padding:"8px 10px",borderRadius:8,background:t.hecho?C.card:C.bone,border:`1px solid ${C.border}`,borderLeft:`3px solid ${PRIORIDAD_C[t.prioridad]||C.muted}`,opacity:t.hecho?0.55:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,textDecoration:t.hecho?"line-through":"none"}}>{t.titulo||t.texto}</div>
                    <span style={{fontSize:10,color:PRIORIDAD_C[t.prioridad],fontWeight:600}}>{t.hora}</span>
                  </div>
                  {t.titulo&&t.texto&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.texto}</div>}
                </div>
              ))}
            </div>
          );})()}
          <div style={{...st.card,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,marginBottom:6}}>Libres (Calendly)</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{free.length===0?<div style={{fontSize:12,color:C.muted}}>Agenda completa</div>:free.map(t=><span key={t} onClick={()=>openNew(date,t,tipos.find(x=>x.nombre==="Primera llamada")?.id)} style={{...st.badge(C.green,C.gD),cursor:"pointer",fontSize:11}}>{t}</span>)}</div>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Calendario</div>
          <div style={{color:C.muted,fontSize:13,marginTop:2}}>{hourLabel(horario.start)}–{hourLabel(horario.end)} · {tipos.map(t=>t.nombre).join(" · ")}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{...st.btn("sm"),background:config.makeOut?C.gD:C.rD,color:config.makeOut?C.green:C.red}} onClick={()=>setShowCfg(true)}>{config.makeOut?"● Integraciones":"○ Configurar Make"}</button>
          <button style={st.btn()} onClick={()=>openNew(date,"09:00",tipos[0]?.id)}>+ Añadir</button>
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <button style={st.btn("sm")} onClick={()=>nav(-1)}>‹</button>
        <button style={{...st.btn("sm"),background:C.bone,color:C.muted}} onClick={()=>setDate(today())}>Hoy</button>
        <button style={st.btn("sm")} onClick={()=>nav(1)}>›</button>
        <div style={{fontSize:15,fontWeight:700,flex:1,textAlign:"center"}}>{navLabel()}</div>
        <div style={{display:"flex",gap:3,background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,padding:3}}>
          {[["week","Semanal"],["day","Diario"]].map(([v,l])=><button key={v} style={{...st.btn("sm"),background:view===v?C.aD:"transparent",color:view===v?C.bone:C.muted,border:"none"}} onClick={()=>setView(v)}>{l}</button>)}
        </div>
      </div>
      <div style={st.card}>{view==="week"?<WeekV/>:<DayV/>}</div>
      {citaM&&<CitaModal cita={citaM.cita} patients={patients} tipos={tipos} defaultFecha={citaM.defaultFecha} defaultHora={citaM.defaultHora} defaultTipoId={citaM.defaultTipoId} makeUrl={config.makeOut} onClose={()=>setCitaM(null)} onSave={saveCita} onDelete={delCita}/>}
      {editTarea&&<TareaModal tarea={editTarea} onClose={()=>setEditTarea(null)} onSave={t=>{setTareas(ts=>ts.map(x=>x.id===t.id?t:x));setEditTarea(null);}} onDelete={id=>{setTareas(ts=>ts.filter(t=>t.id!==id));setEditTarea(null);}}/>}
      {showCfg&&<Modal onClose={()=>setShowCfg(false)} title="⚙ Configurar integraciones Make" width={540}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{padding:"14px 16px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.accent,marginBottom:4}}>Webhook saliente — URL de Make</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>La app envía <strong>dos llamadas simultáneas</strong> al crear cada cita: una para el recordatorio de 24h y otra para el de 1h.</div>
            <Field label="URL Make (misma para los dos)"><input style={st.input} value={makeUrl} onChange={e=>setMakeUrl(e.target.value)} placeholder="https://hook.eu1.make.com/xxx"/></Field>
          </div>
          <div style={{padding:"14px 16px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>📱 Recordatorio 24h antes — WhatsApp</div>
            <pre style={{fontSize:11,color:C.muted,background:C.bg,borderRadius:7,padding:"10px 12px",margin:0,overflow:"auto"}}>{`{
  "recordatorio": "24h",
  "minutos_aviso": 1440,
  "canal": "whatsapp",
  "paciente": "María González",
  "telefono": "+34 612 345 678",
  "fecha": "2026-07-10",
  "hora": "09:00",
  "zoom_link": "https://zoom.us/j/...",
  "mensaje": "Hola María, te recordamos tu sesión..."
}`}</pre>
          </div>
          <div style={{padding:"14px 16px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>📧 Recordatorio 1h antes — Email + WhatsApp</div>
            <pre style={{fontSize:11,color:C.muted,background:C.bg,borderRadius:7,padding:"10px 12px",margin:0,overflow:"auto"}}>{`{
  "recordatorio": "1h",
  "minutos_aviso": 60,
  "canal": "email_whatsapp",
  "paciente": "María González",
  "email": "maria@email.com",
  "telefono": "+34 612 345 678",
  "zoom_link": "https://zoom.us/j/...",
  "mensaje": "Hola María, tu sesión empieza en 1 hora..."
}`}</pre>
          </div>
          <div style={{padding:"10px 14px",background:C.amD,borderRadius:8,fontSize:12,color:C.amber}}>
            💡 En Make: Webhook → Router → rama 24h (Sleep 1440min → WhatsApp) · rama 1h (Sleep 60min → Gmail + WhatsApp)
          </div>
        </div>
        <MFooter onCancel={()=>setShowCfg(false)} onSave={()=>{setConfig(c=>({...c,makeOut:makeUrl}));setShowCfg(false);}} saveLabel="Guardar URL"/>
      </Modal>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PACIENTES
// ══════════════════════════════════════════════════════════════════════════════
function Pacientes({patients,setPatients,onSelect}){
  const[editP,setEditP]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[showM,setShowM]=useState(false);const[form,setForm]=useState(mkPatient());const[editId,setEditId]=useState(null);const[filtro,setFiltro]=useState("todos");
  const openNew=()=>{setForm(mkPatient());setEditId(null);setShowM(true);};
  const openEdit=(p,e)=>{e.stopPropagation();setForm({...p});setEditId(p.id);setShowM(true);};
  const save=()=>{if(!form.nombre)return;if(editId)setPatients(ps=>ps.map(p=>p.id===editId?{...p,...form}:p));else setPatients(ps=>[...ps,{...mkPatient(),...form,id:Date.now()}]);setShowM(false);};
  const del=(id,e)=>{e.stopPropagation();if(confirm("¿Eliminar este paciente?\n\nSe eliminarán todas las sesiones, evolución clínica y facturas. No se puede deshacer."))setPatients(ps=>ps.filter(p=>p.id!==id));};
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const lista=filtro==="todos"?patients:patients.filter(p=>p.estado===filtro);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.5px"}}>Pacientes</div><div style={{color:C.muted,fontSize:13}}>{patients.length} registrados</div></div><div style={{display:"flex",gap:8}}><select style={{...st.input,width:130}} value={filtro} onChange={e=>setFiltro(e.target.value)}><option value="todos">Todos</option><option value="activo">Activos</option><option value="alta">Con alta</option><option value="inactivo">Inactivos</option></select><button style={st.btn()} onClick={openNew}>+ Nuevo paciente</button></div></div><div style={st.card}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={st.th}>Paciente</th><th style={st.th}>Teléfono</th><th style={st.th}>Sesiones</th><th style={st.th}>Estado</th><th style={st.th}>Consentimiento</th><th style={st.th}>Docs</th><th style={st.th}>Acciones</th></tr></thead><tbody>{lista.map(p=>(<tr key={p.id} onClick={()=>onSelect(p.id)} style={{cursor:"pointer"}}><td style={st.td}><div style={{display:"flex",gap:10,alignItems:"center"}}><Avatar nombre={p.nombre} apellidos={p.apellidos} size={34}/><div><div style={{fontWeight:600}}>{p.nombre} {p.apellidos}</div><div style={{fontSize:11,color:C.muted}}>{p.email}</div></div></div></td><td style={st.td}>{p.telefono}</td><td style={st.td}><span style={st.badge(C.accent,C.sand)}>{p.sesiones.length}</span></td><td style={st.td}><span style={st.badge(p.estado==="activo"?C.green:p.estado==="alta"?C.walnut:C.muted,p.estado==="activo"?C.gD:p.estado==="alta"?C.sand:C.card)}>{p.estado}</span></td><td style={st.td}><span style={st.badge(p.consentimiento?C.green:C.amber,p.consentimiento?C.gD:C.amD)}>{p.consentimiento?"✓":"Pendiente"}</span></td><td style={st.td}><span style={st.badge(C.muted,C.card)}>{(p.documentos||[]).length}</span></td><td style={st.td}><div style={st.rowActions}><button style={st.btn("sm")} onClick={e=>{e.stopPropagation();onSelect(p.id);}}>Ver ficha</button><button style={st.btn("sm")} onClick={e=>openEdit(p,e)}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={e=>del(p.id,e)}>Eliminar</button></div></td></tr>))}</tbody></table></div>{showM&&<Modal onClose={()=>setShowM(false)} title={editId?"Editar paciente":"Nuevo paciente"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Field label="Nombre"><input style={st.input} value={form.nombre} onChange={f("nombre")}/></Field><Field label="Apellidos"><input style={st.input} value={form.apellidos} onChange={f("apellidos")}/></Field><Field label="Teléfono"><input style={st.input} value={form.telefono} onChange={f("telefono")}/></Field><Field label="Email"><input style={st.input} value={form.email} onChange={f("email")}/></Field><Field label="Fecha nacimiento"><input type="date" style={st.input} value={form.fechaNacimiento} onChange={f("fechaNacimiento")}/></Field><Field label="Estado"><select style={st.input} value={form.estado} onChange={f("estado")}><option value="activo">Activo</option><option value="alta">Alta</option><option value="inactivo">Inactivo</option></select></Field></div><MFooter onCancel={()=>setShowM(false)} onSave={save}/></Modal>}</div>);
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
        <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Configuración</div>
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
      <div><div class="brand">praxi</div><div class="brand-sub">Gestión Clínica</div></div>
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
          <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Facturas</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>{todasFacturas.length} facturas emitidas</div>
        </div>
        <button style={{...st.btn("sm"),background:C.accent,color:C.bone}} onClick={()=>setShowIA(v=>!v)}>✦ IA</button>
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
                <div style={{fontSize:22,fontWeight:300,color:C.accent,letterSpacing:"-0.5px",fontFamily:"'Manrope',sans-serif"}}>praxi</div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:"0.15em",textTransform:"uppercase"}}>gestión clínica</div>
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
      {showIA&&<IAFacturasPanel patients={patients} onClose={()=>setShowIA(false)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AGENDA GLOBAL — todos los profesionales
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// RECURSOS — placeholder (contenido se añade en fase final)
// ══════════════════════════════════════════════════════════════════════════════
function Recursos({currentUser}){
  const CATEGORIAS=[
    {id:"paciente",label:"Para el paciente",icon:"👤",desc:"Autorregistros, psicoeducación, hojas de trabajo y ejercicios para dar a tus pacientes."},
    {id:"profesional",label:"Para el profesional",icon:"🧠",desc:"Protocolos de intervención, escalas estandarizadas, guías clínicas y plantillas de informes."},
  ];
  const PLANES={basico:"Básico",pro:"Pro",clinica:"Clínica"};
  return(
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Recursos</div>
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

// ══════════════════════════════════════════════════════════════════════════════
// PANEL DE IA — asistente clínico contextual
// ══════════════════════════════════════════════════════════════════════════════
function IAPanel({patient,onClose}){
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
- Fecha nacimiento: ${patient.fechaNacimiento||"No registrada"}
- Estado: ${patient.estado}

MOTIVO DE CONSULTA:
${patient.motivoConsulta||"No registrado"}

HISTORIA CLÍNICA:
${patient.historiaClinica?.texto||"No registrada"}

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
    const newMessages=[...messages,{role:"user",content:userMsg}];
    setMessages(newMessages);
    setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system:contexto,
          messages:newMessages,
        }),
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||"Sin respuesta.";
      setMessages(m=>[...m,{role:"assistant",content:reply}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:"Error al conectar con la IA. Inténtalo de nuevo."}]);
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
          <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Agenda global</div>
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
function AdminPanel({profesionales,setProfesionales,clinica}){
  const[editP,setEditP]=useState(null);
  const[form,setForm]=useState({});
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));

  const toggleActivo=id=>setProfesionales(ps=>ps.map(p=>p.id===id?{...p,activo:!p.activo}:p));
  const save=()=>{setProfesionales(ps=>ps.map(p=>p.id===editP?{...p,...form}:p));setEditP(null);};

  return(
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Administración</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>{clinica?.nombre}</div>
      </div>

      <div style={{...st.card,padding:"20px 24px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:600}}>Profesionales</div>
          <span style={st.badge(C.aL,C.sand)}>{profesionales.filter(p=>p.activo).length} activos</span>
        </div>
        {profesionales.map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:p.color||C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{p.nombre[0]}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{p.nombre}
                {p.rol==="admin"&&<span style={{...st.badge(C.accent,C.sand),fontSize:10,marginLeft:6}}>Admin</span>}
              </div>
              <div style={{fontSize:12,color:C.muted}}>{p.especialidad} · {p.email}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={st.badge(p.activo?C.green:C.muted,p.activo?C.gD:C.card)}>{p.activo?"Activo":"Inactivo"}</span>
              <button style={st.btn("sm")} onClick={()=>{setEditP(p.id);setForm({nombre:p.nombre,especialidad:p.especialidad,color:p.color||C.accent});}}>Editar</button>
              {p.rol!=="admin"&&<button style={{...st.btn("sm"),background:p.activo?C.rD:C.gD,color:p.activo?C.red:C.green}} onClick={()=>toggleActivo(p.id)}>{p.activo?"Desactivar":"Activar"}</button>}
            </div>
          </div>
        ))}
      </div>

      {editP&&(
        <Modal onClose={()=>setEditP(null)} title="Editar profesional" width={440}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="Nombre"><input style={st.input} value={form.nombre||""} onChange={f("nombre")}/></Field>
            <Field label="Especialidad"><input style={st.input} value={form.especialidad||""} onChange={f("especialidad")}/></Field>
            <Field label="Color identificativo">
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["#A66B3F","#6B8C5A","#C48C2A","#7B6B8C","#8C4A3A","#4A7B6B","#6B8CAA","#AA6B6B"].map(col=>(
                  <div key={col} onClick={()=>setForm(p=>({...p,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,cursor:"pointer",border:form.color===col?`3px solid ${C.ink}`:"3px solid transparent"}}/>
                ))}
              </div>
            </Field>
          </div>
          <MFooter onCancel={()=>setEditP(null)} onSave={save}/>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// IA PANEL — FACTURACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function IAFacturasPanel({patients,onClose}){
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
    const newMessages=[...messages,{role:"user",content:userMsg}];
    setMessages(newMessages);
    setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system:contexto,
          messages:newMessages,
        }),
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||"Sin respuesta.";
      setMessages(m=>[...m,{role:"assistant",content:reply}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:"Error al conectar con la IA. Inténtalo de nuevo."}]);
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

function Dashboard({patients,citas,setCitas,tareas,setTareas,onInforme,onEditCita,onEditTarea}){
  const pend=patients.flatMap(p=>p.sesiones).filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0);
  const mes=toYMD(today()).slice(0,7);
  const mesCob=patients.flatMap(p=>p.sesiones.filter(s=>s.fecha.startsWith(mes)&&s.pagado)).reduce((a,s)=>a+s.pago,0);
  const sinConsent=patients.filter(p=>p.estado==="activo"&&!p.consentimiento);
  const[dias,setDias]=useState(1);
  const[startDate,setStartDate]=useState(today());
  const[expanded,setExpanded]=useState(null);
  const[prepNotes,setPrepNotes]=useState({});
  const[showAddTarea,setShowAddTarea]=useState(false);
  const[tareaForm,setTareaForm]=useState({titulo:"",texto:"",hora:"",prioridad:"media",fecha:toYMD(today())});

  const toggle=id=>setExpanded(v=>v===id?null:id);
  const cancelar=id=>{if(confirm("¿Cancelar esta cita?"))setCitas(cs=>cs.filter(c=>c.id!==id));};
  const navDash=dir=>setStartDate(d=>{const n=new Date(d);n.setDate(n.getDate()+dir*dias);return n;});

  // Build array of days to show
  const dayRange=Array.from({length:dias},(_,i)=>addDays(startDate,i));

  const PRIORIDAD={
    baja: {color:C.green,bg:C.gD,label:"Baja"},
    media:{color:C.amber,bg:C.amD,label:"Media"},
    alta: {color:C.red,  bg:C.rD, label:"Alta"},
  };

  const addTarea=()=>{
    if(!tareaForm.titulo.trim()||!tareaForm.hora)return;
    setTareas(ts=>[...ts,{id:Date.now(),...tareaForm,hecho:false}]);
    setTareaForm({titulo:"",texto:"",hora:"",prioridad:"media",fecha:toYMD(today())});
    setShowAddTarea(false);
  };
  const toggleTarea=id=>setTareas(ts=>ts.map(t=>t.id===id?{...t,hecho:!t.hecho}:t));
  const delTarea=id=>{if(confirm("¿Eliminar tarea?"))setTareas(ts=>ts.filter(t=>t.id!==id));};

  const todayStr=toYMD(today());
  const todayCitas=citas.filter(c=>c.fecha===todayStr);

  const renderDayCol=(date,idx)=>{
    const ds=toYMD(date);
    const dc=[...citas.filter(c=>c.fecha===ds)].sort((a,b)=>a.hora.localeCompare(b.hora));
    const isToday=ds===todayStr;
    const dayLabel=date.toLocaleDateString("es-ES",{weekday:dias===1?"long":"short",day:"numeric",month:dias===1?"long":"short"});
    return(
      <div key={idx} style={{flex:1,minWidth:0}}>
        <div style={{padding:"10px 12px",textAlign:"center",borderBottom:`1px solid ${C.border}`,background:isToday?C.sand:"transparent"}}>
          <div style={{fontSize:12,fontWeight:isToday?700:500,color:isToday?C.accent:C.walnut,textTransform:"capitalize"}}>{dayLabel}</div>
          {isToday&&<div style={{fontSize:10,color:C.accent,fontWeight:600,marginTop:1}}>Hoy</div>}
        </div>
        {dc.length===0&&tareas.filter(t=>t.fecha===ds&&!t.hecho).length===0&&<div style={{padding:"12px",fontSize:12,color:C.dim,textAlign:"center",fontStyle:"italic"}}>Sin eventos</div>}
        {dc.map(c=>{
          const p=patients.find(p=>p.id==c.pacienteId);
          const isC=c.origen==="calendly";
          const name=isC?(c.nombreExterno||"Primera llamada"):(p?`${p.nombre} ${p.apellidos}`:"?");
          const isOpen=expanded===c.id&&isToday;
          return(
            <div key={c.id} style={{borderBottom:`1px solid ${C.border}`}}>
              <div onClick={()=>toggle(c.id)} style={{padding:"10px 12px",cursor:"pointer",background:isOpen?"rgba(166,107,63,0.05)":"transparent",display:"flex",flexDirection:"column",gap:4}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:isC?C.teal:C.accent,flexShrink:0}}/>
                  <span style={{fontSize:11,color:C.muted,fontWeight:500}}>{c.hora}</span>
                  {c.zoomLink&&<a href={c.zoomLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{marginLeft:"auto",fontSize:10,color:C.accent,textDecoration:"none",background:C.sand,borderRadius:4,padding:"1px 6px"}}>Zoom</a>}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:C.text,lineHeight:1.3}}>{name}</div>
                <div style={{fontSize:11,color:C.muted}}>{c.tipo||"Cita"} · {c.duracion}min{c.precio?` · ${c.precio}€`:""}</div>
              </div>
              {isOpen&&(
                <div style={{padding:"0 12px 12px",background:"rgba(166,107,63,0.03)"}}>
                  <label style={{...st.label,marginTop:8}}>Objetivos de sesión</label>
                  <textarea style={{...st.textarea,minHeight:60,fontSize:11}} placeholder="Objetivos para esta sesión..." value={prepNotes[c.id]||""} onChange={e=>setPrepNotes(n=>({...n,[c.id]:e.target.value}))} onClick={e=>e.stopPropagation()}/>
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <button style={{...st.btn("sm"),flex:1,background:C.accent,color:C.bone,fontSize:11}} onClick={e=>{e.stopPropagation();onEditCita(c);}}>✏ Modificar</button>
                    <button style={{...st.btn("sm"),flex:1,background:C.rD,color:C.red,fontSize:11}} onClick={e=>{e.stopPropagation();cancelar(c.id);}}>✕ Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {tareas.filter(t=>t.fecha===ds&&!t.hecho).map(t=>(
          <div key={t.id} style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`,borderLeft:`3px solid ${PRIORIDAD[t.prioridad]?.color||C.muted}`,background:`${PRIORIDAD[t.prioridad]?.bg}44`}}>
            <div style={{fontSize:10,color:PRIORIDAD[t.prioridad]?.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t.hora} · {PRIORIDAD[t.prioridad]?.label}</div>
            <div style={{fontSize:12,color:C.text,marginTop:2,fontWeight:600}}>{t.titulo||t.texto}</div>
            {t.titulo&&t.texto&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{t.texto}</div>}
          </div>
        ))}
      </div>
    );
  };

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:26,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Dashboard</div>
        <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={onInforme}>📊 Informe mensual</button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <StatCard val={patients.filter(p=>p.estado==="activo").length} label="Pacientes activos" color={C.aL}/>
        <StatCard val={todayCitas.length} label="Citas hoy" color={C.text}/>
        <StatCard val={`${mesCob}€`} label="Cobrado este mes" color={C.green}/>
        <StatCard val={`${pend}€`} label="Total pendiente" color={C.amber}/>
      </div>

      {/* Resumen financiero del mes */}
      {(()=>{
        const objetivo=mesCob+pend||1;
        const pct=Math.min(100,Math.round((mesCob/objetivo)*100));
        const semana=toYMD(today());
        const finSemana=toYMD(addDays(today(),7));
        const pendSemana=patients.flatMap(p=>p.sesiones.filter(s=>!s.pagado&&s.fecha>=semana&&s.fecha<=finSemana)).reduce((a,s)=>a+s.pago,0);
        return(
          <div style={{...st.card,padding:"16px 20px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>Ingresos — {MONTHS_ES[today().getMonth()]}</div>
              <div style={{fontSize:12,color:C.muted}}>{mesCob}€ cobrado · {pend}€ pendiente total</div>
            </div>
            {/* Barra de progreso cobrado vs total */}
            <div style={{height:10,background:C.sand,borderRadius:999,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:`${pct}%`,background:C.green,borderRadius:999,transition:"width 0.5s cubic-bezier(0.2,0.7,0.2,1)"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
              <span style={{color:C.green,fontWeight:600}}>{pct}% cobrado</span>
              {pendSemana>0&&<span style={{color:C.amber}}>⏳ {pendSemana}€ pendiente esta semana</span>}
              <span>{mesCob+pend}€ total generado</span>
            </div>
          </div>
        );
      })()}

      {/* Próximas citas — solo hoy */}
      {(()=>{
        const citasHoy=[...citas.filter(c=>c.fecha===todayStr)].sort((a,b)=>a.hora.localeCompare(b.hora));
        if(citasHoy.length===0)return(
          <div style={{...st.card,padding:"16px 20px",marginBottom:16,textAlign:"center",color:C.muted,fontSize:13,fontStyle:"italic"}}>
            Sin citas hoy
          </div>
        );
        return(
          <div style={{...st.card,marginBottom:16}}>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Citas de hoy</span>
              <span style={st.badge(C.aL,C.sand)}>{citasHoy.length} citas</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
              {citasHoy.map((c,i)=>{
                const p=patients.find(p=>p.id==c.pacienteId);
                const isC=c.origen==="calendly";
                const name=isC?(c.nombreExterno||"Calendly"):(p?`${p.nombre} ${p.apellidos}`:"?");
                return(
                  <div key={c.id} onClick={()=>onEditCita(c)} style={{padding:"10px 14px",borderLeft:i%3!==0?`1px solid ${C.border}`:"none",borderTop:i>=3?`1px solid ${C.border}`:"none",cursor:"pointer",display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,fontWeight:600,color:C.muted,flexShrink:0,minWidth:36}}>{c.hora.slice(0,5)}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                      <div style={{fontSize:11,color:C.muted}}>{c.tipo||"Cita"} · {c.duracion}min</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {sinConsent.length>0&&(
        <div style={{background:C.amD,border:`1px solid ${C.amber}`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
          <span>⚠</span><div><div style={{fontSize:13,fontWeight:600,color:C.amber}}>Consentimientos pendientes</div><div style={{fontSize:12,color:C.amber,opacity:0.8}}>{sinConsent.map(p=>`${p.nombre} ${p.apellidos}`).join(", ")}</div></div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:14}}>

        {/* AGENDA MULTI-DÍA */}
        <div style={st.card}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
            <button style={st.btn("sm")} onClick={()=>navDash(-1)}>‹</button>
            <button style={{...st.btn("sm"),background:C.bone,color:C.muted}} onClick={()=>setStartDate(today())}>Hoy</button>
            <button style={st.btn("sm")} onClick={()=>navDash(1)}>›</button>
            <span style={{flex:1,fontSize:13,fontWeight:600,color:C.text,textAlign:"center"}}>
              {dias===1?startDate.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}):
               `${startDate.toLocaleDateString("es-ES",{day:"numeric",month:"short"})} – ${addDays(startDate,dias-1).toLocaleDateString("es-ES",{day:"numeric",month:"short"})}`}
            </span>
            <div style={{display:"flex",gap:3,background:C.bone,borderRadius:8,border:`1px solid ${C.border}`,padding:3}}>
              {[[1,"1 día"],[5,"5 días"],[7,"7 días"]].map(([n,l])=>(
                <button key={n} style={{...st.btn("sm"),background:dias===n?C.accent:"transparent",color:dias===n?C.bone:C.muted,border:"none",padding:"4px 10px",fontSize:11}} onClick={()=>{setDias(n);setStartDate(today());}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,minHeight:200}}>
            {dayRange.map((d,i)=>(
              <div key={i} style={{flex:1,borderLeft:i>0?`1px solid ${C.border}`:"none"}}>
                {renderDayCol(d,i)}
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: solo Tareas */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={st.card}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500}}>Agenda personal</span>
              <button style={{...st.btn("sm"),background:C.accent,color:C.bone,fontSize:11}} onClick={()=>setShowAddTarea(v=>!v)}>+ Tarea</button>
            </div>
            {showAddTarea&&(
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:C.bone,display:"flex",flexDirection:"column",gap:8}}>
                <div><label style={st.label}>Título</label>
                  <input style={{...st.input,fontSize:12}} placeholder="Título de la tarea..." value={tareaForm.titulo} onChange={e=>setTareaForm(f=>({...f,titulo:e.target.value}))}/>
                </div>
                <div><label style={st.label}>Descripción</label>
                  <textarea style={{...st.textarea,minHeight:60,fontSize:12}} placeholder="Descripción detallada..." value={tareaForm.texto} onChange={e=>setTareaForm(f=>({...f,texto:e.target.value}))}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  <div><label style={st.label}>Fecha</label><input type="date" style={{...st.input,fontSize:11}} value={tareaForm.fecha} onChange={e=>setTareaForm(f=>({...f,fecha:e.target.value}))}/></div>
                  <div><label style={st.label}>Hora</label><TimePicker value={tareaForm.hora} onChange={v=>setTareaForm(f=>({...f,hora:v}))}/></div>
                </div>
                <div><label style={st.label}>Prioridad</label>
                  <div style={{display:"flex",gap:5}}>
                    {Object.entries(PRIORIDAD).map(([k,v])=>(
                      <button key={k} onClick={()=>setTareaForm(f=>({...f,prioridad:k}))} style={{flex:1,padding:"5px 0",borderRadius:8,border:`1px solid ${tareaForm.prioridad===k?v.color:C.border}`,background:tareaForm.prioridad===k?v.bg:"transparent",color:tareaForm.prioridad===k?v.color:C.muted,fontSize:11,cursor:"pointer",fontWeight:tareaForm.prioridad===k?600:400}}>{v.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{...st.btn("ghost"),flex:1,fontSize:11}} onClick={()=>setShowAddTarea(false)}>Cancelar</button>
                  <button style={{...st.btn(),flex:1,fontSize:11,background:C.accent,color:C.bone}} onClick={addTarea}>Añadir</button>
                </div>
              </div>
            )}
            {tareas.length===0&&!showAddTarea&&<div style={{padding:"14px",fontSize:12,color:C.dim,textAlign:"center",fontStyle:"italic"}}>Sin tareas pendientes</div>}
            {[...tareas].sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora)).map(t=>(
              <div key={t.id} onClick={()=>onEditTarea(t)} style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-start",opacity:t.hecho?0.5:1,cursor:"pointer"}}>
                <div onClick={e=>{e.stopPropagation();toggleTarea(t.id);}} style={{width:16,height:16,borderRadius:4,border:`2px solid ${t.hecho?PRIORIDAD[t.prioridad]?.color:C.border}`,background:t.hecho?PRIORIDAD[t.prioridad]?.bg:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:PRIORIDAD[t.prioridad]?.color}}>{t.hecho?"✓":""}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:t.hecho?C.muted:C.text,textDecoration:t.hecho?"line-through":"none",lineHeight:1.4}}>{t.titulo||t.texto}</div>
                  {t.titulo&&t.texto&&<div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.4}}>{t.texto}</div>}
                  <div style={{fontSize:10,color:C.dim,marginTop:2}}>{t.fecha} · {t.hora}</div>
                </div>
                <div style={{width:6,height:6,borderRadius:"50%",background:PRIORIDAD[t.prioridad]?.color,flexShrink:0,marginTop:4}}/>
                <button onClick={e=>{e.stopPropagation();delTarea(t.id);}} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:12,padding:"0 2px"}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const[currentUser,setCurrentUser]=useState(INITIAL_PROFESIONALES[0]);
  const[currentClinica,setCurrentClinica]=useState(CLINICA_STORE);
  const[profesionales,setProfesionales]=useState(INITIAL_PROFESIONALES);
  const[page,setPage]=useState("dashboard");
  const[patients,setPatients]=useState(SAMPLE_PATIENTS);
  const[citas,setCitas]=useState(SAMPLE_CITAS);
  const[selectedId,setSelectedId]=useState(null);
  const[config,setConfig]=useState({makeOut:""});
  const[tipos,setTipos]=useState(DEFAULT_TIPOS_CITA);
  const[horario,setHorario]=useState({start:WORK_START,end:WORK_END});
  const[showInforme,setShowInforme]=useState(false);
  const[editCitaDash,setEditCitaDash]=useState(null);
  const[editTareaDash,setEditTareaDash]=useState(null);
  const[globalSearch,setGlobalSearch]=useState("");
  const[showNotifs,setShowNotifs]=useState(false);
  const[dismissedNotifs,setDismissedNotifs]=useState(new Set());
  const dismissNotif=id=>setDismissedNotifs(s=>new Set([...s,id]));
  const dismissAll=()=>setDismissedNotifs(new Set(notifs.map(n=>n.id)));

  const[tareas,setTareas]=useState([]);
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
  if(!currentUser)return <Login onLogin={(prof,clinica)=>{setCurrentUser(prof);setCurrentClinica(clinica);}}/>;
  return(
    <div style={st.app}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;700&display=swap" rel="stylesheet"/>
      {reminders.length>0&&<div style={{position:"fixed",top:16,right:16,zIndex:200,display:"flex",flexDirection:"column",gap:8}}>{reminders.map(r=><div key={r.id} style={{background:r.type==="soon"?C.rD:C.amD,border:`1px solid ${r.type==="soon"?C.red:C.amber}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:r.type==="soon"?C.red:C.amber,display:"flex",gap:10,alignItems:"center",maxWidth:340,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}><span style={{flex:1}}>{r.msg}</span><button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:14}}>✕</button></div>)}</div>}

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
            <div style={{fontSize:20,fontWeight:300,color:C.accent,letterSpacing:"-0.5px",fontFamily:"'Manrope',sans-serif",lineHeight:1}}>praxi</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:3}}>gestión clínica</div>
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
          <div style={st.navItem(page==="admin")} onClick={()=>setPage("admin")}>▪ Administración</div>
        )}
        
        <div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <div style={st.navItem(page==="configuracion")} onClick={()=>setPage("configuracion")}>▪ Configuración</div>
        </div>
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
          <div style={{display:"flex",gap:6,alignItems:"center",fontSize:11,color:config.makeOut?C.green:C.dim}}><div style={{width:6,height:6,borderRadius:"50%",background:config.makeOut?C.green:C.dim}}/> Make {config.makeOut?"conectado":"sin configurar"}</div>
          <button style={{...st.btn("ghost"),marginTop:4,fontSize:11,color:C.muted,textAlign:"left",padding:"4px 0"}} onClick={()=>{setCurrentUser(null);setCurrentClinica(null);}}>🔒 Cerrar sesión</button>
        </div>
      </div>
      <div style={st.main}>
        {page==="dashboard"&&<Dashboard patients={patients} citas={citas} setCitas={setCitas} tareas={tareas} setTareas={setTareas} onInforme={()=>setShowInforme(true)} onEditCita={c=>setEditCitaDash(c)} onEditTarea={t=>setEditTareaDash(t)}/>}
        {page==="calendario"&&<Calendario patients={patients} citas={citas} setCitas={setCitas} config={config} setConfig={setConfig} tipos={tipos} horario={horario} tareas={tareas} setTareas={setTareas}/>}
        {page==="pacientes"&&<Pacientes patients={patients} setPatients={setPatients} onSelect={selectPatient}/>}
        {page==="ficha"&&selectedPatient&&<FichaPaciente patient={selectedPatient} setPatients={setPatients} onBack={goBack} citas={citas} setCitas={setCitas} profesionales={profesionales} tipos={tipos}/>}
        {page==="facturas"&&<Facturas patients={patients} setPatients={setPatients}/>}
        {page==="recursos"&&<Recursos currentUser={currentUser}/>}
        {page==="admin"&&currentUser.rol==="admin"&&<AdminPanel profesionales={profesionales} setProfesionales={setProfesionales} clinica={currentClinica}/>}
        {page==="configuracion"&&<Configuracion horario={horario} setHorario={setHorario} tipos={tipos} setTipos={setTipos}/>}
      </div>
      {showInforme&&<InformeMensual patients={patients} citas={citas} onClose={()=>setShowInforme(false)}/>}
      {editCitaDash&&<CitaModal cita={editCitaDash} patients={patients} tipos={tipos} defaultFecha={editCitaDash.fecha} defaultHora={editCitaDash.hora} defaultTipoId={editCitaDash.tipoId} makeUrl={config.makeOut} onClose={()=>setEditCitaDash(null)} onSave={form=>{setCitas(cs=>cs.map(c=>c.id===form.id?{...c,...form}:c));setEditCitaDash(null);}} onDelete={id=>{if(confirm("¿Eliminar?"))setCitas(cs=>cs.filter(c=>c.id!==id));setEditCitaDash(null);}}/>}
      {editTareaDash&&<TareaModal tarea={editTareaDash} onClose={()=>setEditTareaDash(null)} onSave={t=>{setTareas(ts=>ts.map(x=>x.id===t.id?t:x));setEditTareaDash(null);}} onDelete={id=>{setTareas(ts=>ts.filter(t=>t.id!==id));setEditTareaDash(null);}}/>}
    </div>
  );
}
