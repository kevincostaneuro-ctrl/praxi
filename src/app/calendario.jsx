import { useState } from "react";
import { AgendaPersonalPanel, CitaModal, TareaModal } from "./citas.jsx";
import { CITA_BG, DAYS_ES, MONTHS_ES, SLOT_H, pad } from "./constantes.js";
import { C, st } from "./estilos.js";
import { Avatar } from "./ui.jsx";
import { addDays, etiquetaDia, etiquetaMes, etiquetaSemana, startOfWeek, timeToMins, toYMD, today } from "./utilidades.js";

export function TimeGrid({days,citas,patients,horario,onNew,onEdit,showHeader}){
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
export function Calendario({patients,citas,setCitas,config,setConfig,tipos,horario,tareas,setTareas}){
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

export function AgendaGlobal({citas,patients,profesionales}){
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
