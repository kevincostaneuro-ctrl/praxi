import { useContext, useState } from "react";
import { PROFESIONES, RECURSOS } from "../recursos.js";
import { DemoCtx } from "./constantes.js";
import { C, st } from "./estilos.js";

// ══════════════════════════════════════════════════════════════════════════════
// AGENDA GLOBAL — todos los profesionales
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// RECURSOS — biblioteca de PDF (todos disponibles para cualquier cuenta)
// ══════════════════════════════════════════════════════════════════════════════
// En la demo pública la biblioteca no está disponible: se muestra la vista de planes
export function RecursosDemo(){
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

export function Recursos(){
  const demo=useContext(DemoCtx);
  if(demo)return <RecursosDemo/>;
  return <BibliotecaRecursos/>;
}
export function BibliotecaRecursos(){
  const[prof,setProf]=useState("psicologia");
  const[cat,setCat]=useState("paciente");
  const[q,setQ]=useState("");
  const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const deProf=RECURSOS.filter(r=>r.prof===prof);
  const lista=deProf.filter(r=>r.cat===cat&&(!q.trim()||norm(`${r.titulo} ${r.desc} ${r.tipo} ${r.categoria}`).includes(norm(q.trim()))));
  // Agrupar por categoría, en el orden en que aparecen
  const grupos=[];lista.forEach(r=>{let g=grupos.find(x=>x.nombre===r.categoria);if(!g){g={nombre:r.categoria,items:[]};grupos.push(g);}g.items.push(r);});
  const n=(pr,c)=>RECURSOS.filter(r=>r.prof===pr&&(!c||r.cat===c)).length;
  return(
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Recursos</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>{new Set(RECURSOS.map(r=>r.url)).size} materiales clínicos en PDF, listos para imprimir o enviar</div>
      </div>
      <div style={{display:"flex",gap:3,background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,padding:3,marginBottom:14,width:"fit-content"}}>
        {PROFESIONES.map(pr=>(
          <button key={pr.id} onClick={()=>{setProf(pr.id);setQ("");}} style={{...st.btn("sm"),padding:"7px 18px",background:prof===pr.id?C.aD:"transparent",color:prof===pr.id?C.bone:C.muted,border:"none"}}>
            {pr.label} <span style={{opacity:0.7}}>· {n(pr.id)}</span>
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:12,borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        <div style={{display:"flex"}}>
          {[["paciente","Para el paciente"],["profesional","Para el profesional"]].map(([id,l])=>(
            <button key={id} onClick={()=>setCat(id)} style={st.tab(cat===id)}>{l} <span style={{color:C.muted,fontWeight:400}}>· {n(prof,id)}</span></button>
          ))}
        </div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar recurso…" aria-label="Buscar recurso"
          style={{...st.input,width:240,maxWidth:"100%",marginBottom:8,borderRadius:10}}/>
      </div>
      {grupos.length===0
        ?<div style={{...st.card,padding:32,textAlign:"center",color:C.muted,fontSize:13}}>No hay recursos que coincidan con «{q}».</div>
        :grupos.map(g=>(
          <div key={g.nombre} style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
              <div style={{fontSize:20,fontFamily:"'Instrument Serif',serif",color:C.ink}}>{g.nombre}</div>
              <div style={{fontSize:12,color:C.muted}}>{g.items.length}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
              {g.items.map(r=>(
                <div key={r.url} style={{...st.card,padding:"18px 20px",display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <span style={{...st.badge(C.walnut,C.sand)}}>{r.tipo}</span>
                    <span style={{fontSize:11,color:C.muted,letterSpacing:"0.05em"}}>{r.codigo}</span>
                  </div>
                  <div style={{fontSize:15,fontWeight:600,lineHeight:1.35,color:C.text}}>{r.titulo}</div>
                  <div style={{fontSize:12.5,color:C.muted,lineHeight:1.55,flex:1}}>{r.desc}</div>
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <a href={r.url} target="_blank" rel="noopener" style={{...st.btn("sm"),textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Abrir PDF</a>
                    <a href={r.url} download style={{...st.btn("teal"),padding:"5px 14px",fontSize:12,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Descargar</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
