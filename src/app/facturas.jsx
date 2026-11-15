import { useContext, useMemo, useState } from "react";
import { supabase } from "../supabase.js";
import { Aviso } from "./acceso.jsx";
import { DATOS_FACT_VACIOS, DemoCtx, EXENCION_IVA, EquipoCtx, IA_VISIBLE } from "./constantes.js";
import { C, st } from "./estilos.js";
import { IAFacturasPanel } from "./ia.jsx";
import { Field, MFooter, Modal, StatCard } from "./ui.jsx";
import { eur2, fechaES, toYMD, today, traducirError } from "./utilidades.js";

export async function descargarFacturaPDF(d){
  const{jsPDF}=await import("jspdf");
  const doc=new jsPDF({unit:"mm",format:"a4"});
  doc.setProperties({title:`Factura ${d.numero}`,author:d.emisor.nombre,creator:d.emisor.nombre});
  const M=20,W=210;let y=24;
  const tinta=[34,22,16],gris=[110,96,86],linea=[205,195,180];
  const txt=(t,x,yy,o={})=>{doc.setFont("helvetica",o.b?"bold":"normal");doc.setFontSize(o.s||10);doc.setTextColor(...(o.c||tinta));doc.text(String(t),x,yy,o.align?{align:o.align}:undefined);};
  const lineas=(arr,x,yy,o={})=>{arr.filter(Boolean).forEach((l,i)=>txt(l,x,yy+i*(o.lh||5),o));return yy+arr.filter(Boolean).length*(o.lh||5);};
  // Emisor
  txt(d.emisor.nombre||"",M,y,{b:true,s:13});
  const yEm=lineas([d.emisor.nif&&`NIF: ${d.emisor.nif}`,d.emisor.direccion,[d.emisor.cp,d.emisor.ciudad].filter(Boolean).join(" "),
    d.emisor.colegiado&&`Nº de colegiado/a: ${d.emisor.colegiado}`,[d.emisor.telefono,d.emisor.email].filter(Boolean).join(" · ")],M,y+6,{c:gris,s:9.5});
  // Título y número
  txt("FACTURA",W-M,y,{b:true,s:20,align:"right"});
  txt(`Nº ${d.numero}`,W-M,y+8,{s:10.5,align:"right"});
  txt(`Fecha: ${fechaES(d.fecha)}`,W-M,y+13.5,{s:10,c:gris,align:"right"});
  y=Math.max(yEm,y+18)+8;
  doc.setDrawColor(...linea);doc.setLineWidth(0.3);doc.line(M,y,W-M,y);y+=8;
  // Cliente
  txt("CLIENTE",M,y,{b:true,s:8.5,c:gris});y+=5.5;
  txt(d.cliente.nombre||"",M,y,{b:true,s:11});
  y=lineas([d.cliente.nif&&`NIF: ${d.cliente.nif}`,d.cliente.direccion,[d.cliente.cp,d.cliente.ciudad].filter(Boolean).join(" ")],M,y+5.5,{c:gris,s:9.5})+8;
  // Tabla de conceptos
  doc.setFillColor(240,234,224);doc.rect(M,y,W-2*M,8,"F");
  txt("CONCEPTO",M+3,y+5.4,{b:true,s:8.5,c:gris});txt("IMPORTE",W-M-3,y+5.4,{b:true,s:8.5,c:gris,align:"right"});y+=8;
  const concepto=doc.splitTextToSize(d.concepto||"",W-2*M-45);
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(...tinta);
  doc.text(concepto,M+3,y+6.5);txt(eur2(d.base),W-M-3,y+6.5,{align:"right"});
  y+=Math.max(10,concepto.length*5+5);doc.line(M,y,W-M,y);y+=7;
  // Totales
  const tot=(l,v,b)=>{txt(l,W-M-55,y,{s:b?11:10,b,c:b?tinta:gris});txt(v,W-M-3,y,{s:b?11:10,b,align:"right"});y+=b?0:6;};
  tot("Base imponible",eur2(d.base));
  if(d.ivaPct>0)tot(`IVA (${d.ivaPct} %)`,eur2(d.cuotaIva));else tot("IVA","Exento");
  if(d.irpfPct>0)tot(`Retención IRPF (${d.irpfPct} %)`,`- ${eur2(d.cuotaIrpf)}`);
  doc.line(W-M-58,y-2,W-M,y-2);y+=4;tot("TOTAL",eur2(d.total),true);y+=12;
  // Notas
  const notas=[d.ivaPct>0?"":d.exencion,d.notas].filter(Boolean);
  if(notas.length){doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(...gris);
    notas.forEach(n=>{const l=doc.splitTextToSize(n,W-2*M);doc.text(l,M,y);y+=l.length*4.2+2;});}
  doc.save(`Factura ${d.numero.replace(/[\\/:*?"<>|]/g,"-")}.pdf`);
}

// Datos de facturación del propio profesional
export function MisDatosFacturacionModal({yo,demo,onClose,onGuardado,onDemo}){
  const[form,setForm]=useState({...DATOS_FACT_VACIOS,...(yo.datos_facturacion||{})});
  const[err,setErr]=useState("");const[guardando,setGuardando]=useState(false);
  const f=k=>e=>{setForm(p=>({...p,[k]:e.target.value}));setErr("");};
  const guardar=async()=>{
    if(demo){onDemo();return;}
    if(!form.nombre.trim()||!form.nif.trim()){setErr("El nombre fiscal y el NIF son obligatorios en una factura.");return;}
    setGuardando(true);
    const limpio=Object.fromEntries(Object.entries(form).map(([k,v])=>[k,String(v||"").trim()]));
    const{error}=await supabase.rpc("guardar_mis_datos_facturacion",{p_datos:limpio});
    setGuardando(false);
    if(error){setErr(traducirError(error));return;}
    onGuardado(limpio);
  };
  return(
    <Modal onClose={onClose} title="Mis datos de facturación" width={560}>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:14}}>Son los datos que aparecerán como emisor en tus facturas. Praxi no aparece en ellas.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{gridColumn:"1/-1"}}><Field label="Nombre y apellidos o razón social *"><input style={st.input} value={form.nombre} onChange={f("nombre")}/></Field></div>
        <Field label="NIF *"><input style={st.input} value={form.nif} onChange={f("nif")}/></Field>
        <Field label="Nº de colegiado/a"><input style={st.input} value={form.colegiado} onChange={f("colegiado")}/></Field>
        <div style={{gridColumn:"1/-1"}}><Field label="Dirección"><input style={st.input} value={form.direccion} onChange={f("direccion")}/></Field></div>
        <Field label="Código postal"><input style={st.input} value={form.cp} onChange={f("cp")}/></Field>
        <Field label="Ciudad"><input style={st.input} value={form.ciudad} onChange={f("ciudad")}/></Field>
        <Field label="Teléfono"><input style={st.input} value={form.telefono} onChange={f("telefono")}/></Field>
        <Field label="Email"><input style={st.input} value={form.email} onChange={f("email")}/></Field>
      </div>
      <Aviso>{err}</Aviso>
      <MFooter onCancel={onClose} onSave={guardar} saving={guardando}/>
    </Modal>
  );
}

// Generar la factura de una sesión
export function GenerarFacturaModal({patient,sesion,onClose,onGuardarNumero}){
  const demo=useContext(DemoCtx);
  const{miembros,miId,guardarMisDatosFact}=useContext(EquipoCtx);
  const prof=miembros.find(m=>m.id===(patient.profesionalId||miId))||miembros.find(m=>m.id===miId)||{};
  const yo=miembros.find(m=>m.id===miId)||{};
  const esMio=prof.id===miId;
  const[emisor,setEmisor]=useState({...DATOS_FACT_VACIOS,...(prof.datos_facturacion||{})});
  const[editarDatos,setEditarDatos]=useState(false);
  const esp=(prof.especialidad||"").toLowerCase().includes("nutri")?"nutrición":"psicología";
  const[form,setForm]=useState({
    numero:sesion.factura||"",fecha:sesion.fecha||toYMD(today()),
    clienteNombre:`${patient.nombre||""} ${patient.apellidos||""}`.trim(),clienteNif:patient.dni||"",
    clienteDireccion:patient.direccion||"",clienteCp:patient.codigoPostal||"",clienteCiudad:patient.ciudad||"",
    concepto:`Sesión de ${esp} (${fechaES(sesion.fecha)})`,importe:String(sesion.pago??""),
    conIva:false,ivaPct:"21",irpfPct:"0",exencion:EXENCION_IVA,notas:"",
  });
  const[err,setErr]=useState("");const[generando,setGenerando]=useState(false);
  const f=k=>e=>{setForm(p=>({...p,[k]:e.type==="change"&&e.target.type==="checkbox"?e.target.checked:e.target.value}));setErr("");};
  const base=Number(String(form.importe).replace(",","."))||0;
  const ivaPct=form.conIva?(Number(form.ivaPct)||0):0;const irpfPct=Number(form.irpfPct)||0;
  const cuotaIva=base*ivaPct/100,cuotaIrpf=base*irpfPct/100,total=base+cuotaIva-cuotaIrpf;
  const faltan=!emisor.nombre||!emisor.nif;
  const generar=async()=>{
    if(faltan){setErr("Faltan tus datos de facturación (nombre fiscal y NIF).");return;}
    if(!form.numero.trim()){setErr("Indica el número de factura.");return;}
    if(!form.clienteNombre.trim()){setErr("Indica el nombre del cliente.");return;}
    setGenerando(true);
    try{
      await descargarFacturaPDF({emisor,numero:form.numero.trim(),fecha:form.fecha,
        cliente:{nombre:form.clienteNombre.trim(),nif:form.clienteNif.trim(),direccion:form.clienteDireccion.trim(),cp:form.clienteCp.trim(),ciudad:form.clienteCiudad.trim()},
        concepto:form.concepto,base,ivaPct,cuotaIva,irpfPct,cuotaIrpf,total,exencion:form.exencion,notas:form.notas.trim()});
      if(!demo&&form.numero.trim()!==sesion.factura)onGuardarNumero(form.numero.trim());
    }catch(e){setErr("No se ha podido generar el PDF. Inténtalo de nuevo.");}
    setGenerando(false);
  };
  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:12};
  const sub={fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,margin:"16px 0 8px"};
  return(
    <Modal onClose={onClose} title="Generar factura en PDF" width={620}>
      <div style={{...sub,marginTop:0}}>Emisor</div>
      {faltan
        ?<div style={{padding:"10px 14px",background:C.amD,borderRadius:10,fontSize:13,color:C.text,lineHeight:1.5}}>
            {esMio?<>Aún no has guardado tus datos de facturación. <button style={{...st.btn("sm"),marginLeft:6}} onClick={()=>setEditarDatos(true)}>Añadir mis datos</button></>
              :<>{prof.nombre||"El profesional"} aún no ha guardado sus datos de facturación. Debe hacerlo desde Facturas › «Mis datos de facturación».</>}
          </div>
        :<div style={{padding:"10px 14px",background:C.bone,border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,lineHeight:1.55,display:"flex",justifyContent:"space-between",gap:10}}>
            <div><b>{emisor.nombre}</b> · NIF {emisor.nif}<div style={{color:C.muted}}>{[emisor.direccion,emisor.cp,emisor.ciudad].filter(Boolean).join(", ")}</div></div>
            {esMio&&<button style={{...st.btn("sm"),alignSelf:"flex-start"}} onClick={()=>setEditarDatos(true)}>Editar</button>}
          </div>}
      <div style={sub}>Factura</div>
      <div style={g2}>
        <Field label="Número de factura"><input style={st.input} value={form.numero} onChange={f("numero")}/></Field>
        <Field label="Fecha"><input type="date" style={st.input} value={form.fecha} onChange={f("fecha")}/></Field>
      </div>
      <div style={sub}>Cliente</div>
      <div style={g2}>
        <Field label="Nombre"><input style={st.input} value={form.clienteNombre} onChange={f("clienteNombre")}/></Field>
        <Field label="NIF (opcional)"><input style={st.input} value={form.clienteNif} onChange={f("clienteNif")}/></Field>
        <div style={{gridColumn:"1/-1"}}><Field label="Dirección (opcional)"><input style={st.input} value={form.clienteDireccion} onChange={f("clienteDireccion")}/></Field></div>
        <Field label="Código postal"><input style={st.input} value={form.clienteCp} onChange={f("clienteCp")}/></Field>
        <Field label="Ciudad"><input style={st.input} value={form.clienteCiudad} onChange={f("clienteCiudad")}/></Field>
      </div>
      <div style={sub}>Importe</div>
      <Field label="Concepto"><input style={st.input} value={form.concepto} onChange={f("concepto")}/></Field>
      <div style={{...g2,gridTemplateColumns:"1fr 1fr 1fr",marginTop:12,alignItems:"end"}}>
        <Field label="Importe (€)"><input style={st.input} inputMode="decimal" value={form.importe} onChange={f("importe")}/></Field>
        <Field label="Retención IRPF (%)"><input style={st.input} inputMode="decimal" value={form.irpfPct} onChange={f("irpfPct")}/></Field>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.text,paddingBottom:10}}>
          <input type="checkbox" checked={form.conIva} onChange={f("conIva")}/> Aplicar IVA
          {form.conIva&&<input style={{...st.input,width:60,padding:"5px 8px"}} value={form.ivaPct} onChange={f("ivaPct")}/>}{form.conIva&&"%"}
        </label>
      </div>
      {!form.conIva&&<div style={{marginTop:12}}><Field label="Texto de exención de IVA"><textarea style={{...st.input,minHeight:52,fontSize:12}} value={form.exencion} onChange={f("exencion")}/></Field></div>}
      <div style={{marginTop:12}}><Field label="Notas (opcional; p. ej., forma de pago)"><input style={st.input} value={form.notas} onChange={f("notas")}/></Field></div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:18,fontSize:14,marginTop:14,color:C.text}}>
        <span>Base {eur2(base)}</span>{form.conIva&&<span>IVA {eur2(cuotaIva)}</span>}{irpfPct>0&&<span>IRPF −{eur2(cuotaIrpf)}</span>}<b>Total {eur2(total)}</b>
      </div>
      <div style={{fontSize:11.5,color:C.muted,marginTop:12,lineHeight:1.5}}>La factura se genera con los datos que indicas. Comprueba la numeración, el tratamiento del IVA y tus obligaciones fiscales con tu asesor.</div>
      <Aviso>{err}</Aviso>
      <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
        <button style={st.btn("ghost")} onClick={onClose}>Cerrar</button>
        <button style={{...st.btn(),background:C.accent,color:C.bone,opacity:generando?0.6:1}} disabled={generando} onClick={generar}>{generando?"Generando…":"Descargar PDF"}</button>
      </div>
      {editarDatos&&<MisDatosFacturacionModal yo={yo} demo={demo} onClose={()=>setEditarDatos(false)}
        onDemo={()=>{setEditarDatos(false);setErr("En la demo no se guardan datos.");}}
        onGuardado={d=>{guardarMisDatosFact(d);setEmisor({...DATOS_FACT_VACIOS,...d});setEditarDatos(false);}}/>}
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FACTURAS
// ══════════════════════════════════════════════════════════════════════════════
export function Facturas({patients,setPatients}){
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

  const[genF,setGenF]=useState(null);
  const[misDatos,setMisDatos]=useState(false);
  const demo=useContext(DemoCtx);
  const{miembros,miId,guardarMisDatosFact}=useContext(EquipoCtx);
  const yo=miembros.find(m=>m.id===miId)||{};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Facturas</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>{todasFacturas.length} facturas emitidas</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{...st.btn("sm"),background:C.bone,color:C.walnut}} onClick={()=>setMisDatos(true)}>{yo.datos_facturacion?.nif?"Mis datos de facturación":"⚠ Añadir mis datos de facturación"}</button>
          {IA_VISIBLE&&<button style={{...st.btn("sm"),background:C.accent,color:C.bone}} onClick={()=>setShowIA(v=>!v)}>✦ IA</button>}
        </div>
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
                    <button style={st.btn("sm")} onClick={()=>setGenF(f)}>Factura PDF</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal vista previa factura */}
      {genF&&(()=>{const pa=patients.find(x=>x.id===genF.pacienteId);return pa&&<GenerarFacturaModal patient={pa} sesion={genF} onClose={()=>setGenF(null)}
        onGuardarNumero={n=>setPatients(ps=>ps.map(x=>x.id===pa.id?{...x,sesiones:x.sesiones.map(s=>s.id===genF.id?{...s,factura:n}:s)}:x))}/>;})()}
      {misDatos&&<MisDatosFacturacionModal yo={yo} demo={demo} onClose={()=>setMisDatos(false)} onDemo={()=>setMisDatos(false)}
        onGuardado={d=>{guardarMisDatosFact(d);setMisDatos(false);}}/>}
      {IA_VISIBLE&&showIA&&<IAFacturasPanel patients={patients} onClose={()=>setShowIA(false)}/>}
    </div>
  );
}
