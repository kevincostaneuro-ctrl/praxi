import { useContext, useEffect, useState } from "react";
import { CitaModal } from "./citas.jsx";
import { DEFAULT_CONSENT, EquipoCtx, IA_VISIBLE } from "./constantes.js";
import { C, st } from "./estilos.js";
import { TabDatos, TabEvolucion, TabFormulacionCaso, TabHistoriaClinica, TabInformes, TabObjetivos, TabPruebas, TabSesiones } from "./fichaPestanas.jsx";
import { anadirNota, NORA, NoraMarca, NoraPanel } from "./nora.jsx";
import { Avatar, Empty, Field, MFooter, Modal } from "./ui.jsx";
import { toYMD, today } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT — real printable layout
// ══════════════════════════════════════════════════════════════════════════════
export function exportPatientPDF(patient){
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
export function ConsentModal({patient,onClose,onSave}){
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
export function AltaModal({patient,onClose,onSave}){
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
// FICHA PACIENTE
// ══════════════════════════════════════════════════════════════════════════════
// ── TAB CITAS EN LA CLÍNICA ───────────────────────────────────────────────────
export function TabCitasClinica({patient,citas,profesionales}){
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

export function FichaPaciente({patient,setPatients,onBack,citas,setCitas,profesionales,tipos}){
  const isNew=!patient.motivoConsulta&&patient.sesiones.length===0&&!patient.historiaClinica?.texto&&!(patient.historiaClinica?.entradas||[]).length;
  const[tab,setTab]=useState("evolucion");
  const[showConsent,setShowConsent]=useState(false);
  const[showAlta,setShowAlta]=useState(false);
  const[editMotivo,setEditMotivo]=useState(false);
  const[motivoTxt,setMotivoTxt]=useState(patient.motivoConsulta||"");
  const[showIA,setShowIA]=useState(false);
  const[showNuevaCita,setShowNuevaCita]=useState(false);
  const update=fn=>setPatients(ps=>ps.map(p=>p.id===patient.id?fn(p):p));
  const guardarNota=(texto,sesionId)=>update(p=>anadirNota(p,texto,sesionId));
  const{registrarVista}=useContext(EquipoCtx);
  useEffect(()=>{registrarVista(patient.id);},[patient.id]);

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,flexWrap:"wrap"}}>
        <button style={{...st.btn("ghost"),paddingLeft:0,fontSize:18}} onClick={onBack}>←</button>
        <Avatar nombre={patient.nombre} apellidos={patient.apellidos} size={48}/>
        <div style={{flex:"1 1 220px",minWidth:0}}>
          <div style={{fontSize:22,fontWeight:800}}>{patient.nombre} {patient.apellidos}</div>
          <div style={{fontSize:13,color:C.muted}}>{patient.telefono} · {patient.email}</div>
          {/* Contador de sesiones y progreso */}
          <div style={{display:"flex",gap:12,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
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
          {IA_VISIBLE&&<button style={{...st.btn("sm"),background:NORA.fondo,color:NORA.texto,display:"inline-flex",alignItems:"center",gap:6}} onClick={()=>setShowIA(v=>!v)}><NoraMarca size={18}/>Nora</button>}
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
      {IA_VISIBLE&&showIA&&<NoraPanel patient={patient} citas={citas} onClose={()=>setShowIA(false)} onGuardarNota={guardarNota}/>}
      {showNuevaCita&&<CitaModal soloEstePaciente cita={null} patients={[patient]} tipos={tipos||[]} defaultFecha={toYMD(today())} defaultHora="09:00" makeUrl="" onClose={()=>setShowNuevaCita(false)} onSave={form=>{setCitas&&setCitas(cs=>[...cs,{...form,id:Date.now(),pacienteId:patient.id,origen:"interno"}]);setShowNuevaCita(false);}} onDelete={()=>{}}/>}
    </div>
  );
}
