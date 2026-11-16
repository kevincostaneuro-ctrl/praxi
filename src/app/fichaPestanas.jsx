import { useContext, useMemo, useRef, useState } from "react";
import { DemoCtx, IA_VISIBLE, NOTE_TEMPLATES } from "./constantes.js";
import { C, st } from "./estilos.js";
import { GenerarFacturaModal } from "./facturas.jsx";
import { NORA, NoraMarca, notaSOAP } from "./nora.jsx";
import { Empty, Field, MFooter, Modal, SecLabel, StatCard } from "./ui.jsx";
import { toYMD, today } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// TAB DOCUMENTOS — upload + view PDFs
// ══════════════════════════════════════════════════════════════════════════════
export function TabDocumentos({patient,update}){
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

// ── TAB INFORMES ───────────────────────────────────────────────────────────────
export const mkInforme=()=>({id:null,fecha:"",titulo:"",medico:"",descripcion:""});
export function TabInformes({patient,update}){
  const[show,setShow]=useState(false);const[form,setForm]=useState(mkInforme());
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const save=()=>{if(!form.titulo)return;if(form.id)update(p=>({...p,informesMedicos:p.informesMedicos.map(i=>i.id===form.id?{...form}:i)}));else update(p=>({...p,informesMedicos:[...p.informesMedicos,{...form,id:Date.now()}]}));setShow(false);};
  const del=id=>{if(confirm("¿Eliminar?"))update(p=>({...p,informesMedicos:p.informesMedicos.filter(i=>i.id!==id)}));};
  return(<div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button style={st.btn()} onClick={()=>{setForm(mkInforme());setShow(true);}}>+ Añadir informe</button></div>{patient.informesMedicos.length===0&&<Empty text="Sin informes médicos"/>}{patient.informesMedicos.map(inf=>(<div key={inf.id} style={{...st.card,marginBottom:12,padding:"14px 18px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontWeight:700,fontSize:15}}>{inf.titulo}</div><div style={{fontSize:12,color:C.muted}}>{inf.medico} · {inf.fecha}</div></div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setForm({...inf});setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(inf.id)}>Eliminar</button></div></div><div style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{inf.descripcion}</div></div>))}{show&&<Modal onClose={()=>setShow(false)} title={form.id?"Editar informe":"Añadir informe"}><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Título"><input style={st.input} value={form.titulo} onChange={f("titulo")}/></Field><Field label="Médico"><input style={st.input} value={form.medico} onChange={f("medico")}/></Field><Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field></div><Field label="Descripción"><textarea style={{...st.textarea,minHeight:110}} value={form.descripcion} onChange={f("descripcion")}/></Field></div><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}</div>);
}

// ── TAB PRUEBAS ────────────────────────────────────────────────────────────────
export const mkPrueba=()=>({id:null,fecha:"",prueba:"",resultado:"",observaciones:""});
export function TabPruebas({patient,update}){
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
export const mkSesion=()=>({id:null,fecha:"",pago:"",pagado:false,trabajado:"",observaciones:"",estadoEmocional:5,alianza:5,observacionesAdicionales:""});
export function TabSesiones({patient,update}){
  const[show,setShow]=useState(false);const[form,setForm]=useState(mkSesion());const[viewF,setViewF]=useState(null);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const nextNum=patient.sesiones.length+1;
  const demo=useContext(DemoCtx);
  const[ordenando,setOrdenando]=useState(false);const[errNora,setErrNora]=useState("");
  const ordenar=async()=>{setErrNora("");if(demo){setErrNora("Nora no está activa en la demo.");return;}setOrdenando(true);try{const t=await notaSOAP(patient,form.trabajado);setForm(p=>({...p,trabajado:t}));}catch(e){setErrNora(e.message||"Nora no ha podido responder.");}setOrdenando(false);};
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
      {show&&<Modal onClose={()=>setShow(false)} title={form.id?`Editar sesión ${form.numero}`:`Sesión ${nextNum}`} width={520}><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field><Field label="Importe €"><input type="number" style={st.input} value={form.pago} onChange={f("pago")}/></Field></div><Field label="Estado"><select style={st.input} value={form.pagado} onChange={e=>setForm(p=>({...p,pagado:e.target.value==="true"}))}><option value="false">Pendiente</option><option value="true">Pagado</option></select></Field><Field label="Lo trabajado en esta sesión"><textarea style={{...st.textarea,minHeight:100}} value={form.trabajado} onChange={f("trabajado")} placeholder="Escribe tus notas como te salgan; Nora puede ordenarlas en formato SOAP."/>{IA_VISIBLE&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}><button type="button" style={{...st.btn("sm"),background:NORA.tinte,color:NORA.tinteTexto,display:"inline-flex",alignItems:"center",gap:6}} disabled={ordenando||!form.trabajado?.trim()} onClick={ordenar}><NoraMarca size={16}/>{ordenando?"Nora está ordenando…":"Ordenar con Nora (SOAP)"}</button>{errNora&&<span style={{fontSize:12,color:C.red}}>{errNora}</span>}</div>}</Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label={`Estado emocional: ${form.estadoEmocional??5}/10`}><input type="range" min="0" max="10" step="1" style={{width:"100%",accentColor:C.accent}} value={form.estadoEmocional??5} onChange={e=>setForm(p=>({...p,estadoEmocional:Number(e.target.value)}))}/></Field><Field label={`Alianza terapéutica: ${form.alianza??5}/10`}><input type="range" min="0" max="10" step="1" style={{width:"100%",accentColor:C.accent}} value={form.alianza??5} onChange={e=>setForm(p=>({...p,alianza:Number(e.target.value)}))}/></Field></div><Field label="Observaciones adicionales"><textarea style={{...st.textarea,minHeight:70}} value={form.observacionesAdicionales||""} onChange={f("observacionesAdicionales")}/></Field></div><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}
      {viewF&&<GenerarFacturaModal patient={patient} sesion={viewF} onClose={()=>setViewF(null)} onGuardarNumero={n=>update(p=>({...p,sesiones:p.sesiones.map(s=>s.id===viewF.id?{...s,factura:n}:s)}))}/>}
    </div>
  );
}

// ── TAB OBJETIVOS ──────────────────────────────────────────────────────────────
export function TabObjetivos({patient,update}){
  const[show,setShow]=useState(false);const[editO,setEditO]=useState(null);const[txt,setTxt]=useState("");
  const save=()=>{if(!txt.trim())return;if(editO)update(p=>({...p,objetivos:p.objetivos.map(o=>o.id===editO.id?{...o,objetivo:txt}:o)}));else update(p=>({...p,objetivos:[...p.objetivos,{id:Date.now(),objetivo:txt,logrado:false}]}));setShow(false);};
  const tog=id=>update(p=>({...p,objetivos:p.objetivos.map(o=>o.id===id?{...o,logrado:!o.logrado}:o)}));
  const del=id=>{if(confirm("¿Eliminar?"))update(p=>({...p,objetivos:p.objetivos.filter(o=>o.id!==id)}));};
  const act=patient.objetivos.filter(o=>!o.logrado);const log=patient.objetivos.filter(o=>o.logrado);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:13,color:C.muted}}>{log.length}/{patient.objetivos.length} logrados</div><button style={st.btn()} onClick={()=>{setEditO(null);setTxt("");setShow(true);}}>+ Añadir</button></div>{patient.objetivos.length===0&&<Empty text="Sin objetivos"/>}{act.length>0&&<SecLabel text="En progreso"/>}{act.map(o=><div key={o.id} style={{...st.card,marginBottom:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}><div style={{width:20,height:20,borderRadius:4,border:`2px solid ${C.border}`,cursor:"pointer",flexShrink:0}} onClick={()=>tog(o.id)}/><div style={{flex:1,fontSize:14}}>{o.objetivo}</div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setEditO(o);setTxt(o.objetivo);setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(o.id)}>✕</button></div></div>)}{log.length>0&&<SecLabel text="Logrados"/>}{log.map(o=><div key={o.id} style={{...st.card,marginBottom:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:0.6}}><div style={{width:20,height:20,borderRadius:4,background:C.sand,border:`2px solid ${C.accent}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,fontSize:12,flexShrink:0}} onClick={()=>tog(o.id)}>✓</div><div style={{flex:1,fontSize:14,textDecoration:"line-through",color:C.muted}}>{o.objetivo}</div><div style={st.rowActions}><button style={st.btn("sm")} onClick={()=>{setEditO(o);setTxt(o.objetivo);setShow(true);}}>Editar</button><button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>del(o.id)}>✕</button></div></div>)}{show&&<Modal onClose={()=>setShow(false)} title={editO?"Editar objetivo":"Nuevo objetivo"}><Field label="Objetivo"><textarea style={st.textarea} value={txt} onChange={e=>setTxt(e.target.value)}/></Field><MFooter onCancel={()=>setShow(false)} onSave={save}/></Modal>}</div>);
}

// ── TAB DATOS ADMINISTRATIVOS ─────────────────────────────────────────────────
export function TabDatos({patient,update}){
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
export function TabHistoriaClinica({patient,update}){
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

export function TabFormulacionCaso({patient,update}){
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

export function TabEvolucion({patient,update}){
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
