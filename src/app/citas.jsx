import { useContext, useEffect, useState } from "react";
import { EquipoCtx, HALF_HOURS, MONTHS_ES } from "./constantes.js";
import { C, PRIORIDAD_T, st } from "./estilos.js";
import { Field, MFooter, Modal, TimePicker } from "./ui.jsx";
import { addDays, hourLabel, mensajeCita, minsToTime, postMake, telWhatsApp, timeToMins, toYMD, today } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════════════════════════════
export function useReminders(citas,patients){
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

export function TiposCitaModal({tipos,setTipos,onClose}){
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
export function CitaModal({cita,patients,tipos,onClose,onSave,onDelete,defaultFecha,defaultHora,defaultTipoId,defaultPacienteId,makeUrl,soloEstePaciente}){
  const{miembros,miId}=useContext(EquipoCtx);
  // Citas antiguas sin paciente (primeras llamadas / Calendly): se muestran sus datos de contacto
  const[modoPac]=useState(cita&&!cita.pacienteId&&cita.nombreExterno?"nuevo":"actual");
  const[errCita,setErrCita]=useState("");
  // Enlace por defecto: el del profesional que lleva al paciente (o el tuyo)
  const enlaceDe=pid=>{const pa=patients.find(x=>x.id==pid);const prof=miembros.find(m=>m.id===(pa?.profesionalId||miId))||miembros.find(m=>m.id===miId);return prof?.enlace_videollamada||miembros.find(m=>m.id===miId)?.enlace_videollamada||"";};
  const[enlaceTocado,setEnlaceTocado]=useState(!!cita);
  const tipoInicial=tipos.find(t=>t.id===defaultTipoId)||tipos[0];
  const init=cita?{...cita,tipoId:cita.tipoId||tipos.find(t=>t.nombre===cita.tipo)?.id||tipos[0]?.id}:{pacienteId:defaultPacienteId||"",nombreExterno:"",telefonoExterno:"",emailExterno:"",fecha:defaultFecha||toYMD(today()),hora:defaultHora||"09:00",duracion:tipoInicial?.duracion||60,precio:tipoInicial?.precio||0,tipoId:tipoInicial?.id||tipos[0]?.id,notas:"",zoomLink:enlaceDe(defaultPacienteId),origen:"interno"};
  const[form,setForm]=useState(init);const[saving,setSaving]=useState(false);const[sendStatus,setSendStatus]=useState(null);
  useEffect(()=>{setErrCita("");},[form.pacienteId,form.nombreExterno]);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const tipoActual=tipos.find(t=>t.id===form.tipoId)||tipos[0];
  const esPL=tipoActual?.nombre==="Primera llamada";
  const save=async()=>{
    setErrCita("");
    if(!form.fecha||!form.hora){setErrCita("Indica la fecha y la hora.");return;}
    let pacienteId=form.pacienteId;
    if(modoPac==="nuevo"){if(!(form.nombreExterno||"").trim()){setErrCita("Escribe el nombre del contacto.");return;}pacienteId="";}
    if(modoPac==="actual"&&!pacienteId){setErrCita(patients.length?"Elige un paciente.":"Primero registra al paciente en Pacientes.");return;}
    const zoomLink=(form.zoomLink||"").trim();const ff={...form,pacienteId,zoomLink,tipo:tipoActual?.nombre||""};
    if(makeUrl){
      setSaving(true);
      const p=patients.find(p=>p.id==pacienteId);
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
        <div>
          {modoPac==="actual"?<Field label="Paciente"><select style={st.input} value={form.pacienteId} onChange={e=>{const v=e.target.value;setForm(p=>({...p,pacienteId:v,zoomLink:enlaceTocado?p.zoomLink:enlaceDe(v)}));}}><option value="">{patients.length?"Seleccionar...":"No hay pacientes registrados"}</option>{[...patients].sort((a,b)=>`${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`,"es")).map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>)}</select></Field>:<div style={{padding:"12px 14px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.teal}`}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Field label="Nombre"><input style={st.input} value={form.nombreExterno||""} onChange={f("nombreExterno")} autoFocus={!cita}/></Field><Field label="Teléfono"><input style={st.input} value={form.telefonoExterno||""} onChange={f("telefonoExterno")}/></Field><div style={{gridColumn:"1/-1"}}><Field label="Email"><input style={st.input} value={form.emailExterno||""} onChange={f("emailExterno")}/></Field></div></div><div style={{fontSize:12,color:C.muted,marginTop:8}}>Cita antigua de un contacto sin ficha de paciente.</div></div>}
        </div>
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
        {(()=>{const pa=patients.find(x=>x.id==form.pacienteId);if(!pa)return null;const tel=telWhatsApp(pa.telefono);
          return tel.length>=8
            ?<a href={`https://wa.me/${tel}?text=${encodeURIComponent(mensajeCita(pa.nombre,form.fecha,form.hora,(form.zoomLink||"").trim()))}`} target="_blank" rel="noreferrer"
                style={{...st.btn("sm"),background:"#E3EEDC",color:"#3F6B34",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"9px 14px",fontSize:13}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>
                Enviar por WhatsApp a {pa.nombre}</a>
            :<div style={{fontSize:12,color:C.muted}}>Añade el teléfono de {pa.nombre} en su ficha para poder enviarle la cita por WhatsApp.</div>;
        })()}
        {errCita&&<div style={{padding:"8px 12px",background:C.rD,borderRadius:8,fontSize:12.5,color:C.red}}>{errCita}</div>}
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
export function HorarioModal({horario,setHorario,onClose}){
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
export function TareaModal({tarea,onClose,onSave,onDelete}){
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
export function HuecosModal({fecha,citas,horario,onClose}){
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
export function AgendaPersonalPanel({tareas,setTareas,onEditTarea,fechaDefault}){
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
