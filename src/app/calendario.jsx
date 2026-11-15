import { useState } from "react";
import { AgendaPersonalPanel, CitaModal, TareaModal } from "./citas.jsx";
import { DAYS_ES, MONTHS_ES, SLOT_H, pad } from "./constantes.js";
import { C, st } from "./estilos.js";
import { addDays, etiquetaDia, etiquetaMes, etiquetaSemana, startOfWeek, timeToMins, toYMD, today } from "./utilidades.js";

// Colores por tipo de cita (en el orden de los tipos configurados)
export const PALETA_TIPOS=[
  {c:"#6B8C5A",bg:"#E6EDDF"}, // salvia
  {c:"#A66B3F",bg:"#F4E6D8"}, // terracota
  {c:"#5C7A8C",bg:"#E1E9EE"}, // pizarra
  {c:"#8C5A6E",bg:"#F0E2E8"}, // ciruela
  {c:"#B08A3E",bg:"#F4EBD6"}, // ocre
  {c:"#7D6E62",bg:"#ECE6E0"}, // topo
];
export const colorTipo=(c,tipos=[])=>{
  let i=tipos.findIndex(t=>t.id===c.tipoId);
  if(i<0)i=tipos.findIndex(t=>t.nombre===c.tipo);
  return PALETA_TIPOS[(i<0?1:i)%PALETA_TIPOS.length];
};
export function LeyendaTipos({tipos}){
  return(
    <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:C.muted}}>
      {tipos.map((t,i)=>{const col=PALETA_TIPOS[i%PALETA_TIPOS.length];return(
        <span key={t.id} style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:3,background:col.bg,border:`2px solid ${col.c}`}}/>{t.nombre}</span>
      );})}
    </div>
  );
}

const FONDO_REJILLA="#FBF8F2";
const LINEA_HORA="#E3D6BF";
const LINEA_MEDIA="#EFE6D6";
const finDe=(c)=>{const m=timeToMins(c.hora)+(Number(c.duracion)||60);return`${pad(Math.floor(m/60))}:${pad(m%60)}`;};

export function TimeGrid({days,citas,patients,horario,onNew,onEdit,showHeader,tipos=[]}){
  const ahora=today();
  const todayStr=toYMD(ahora);
  const ahoraMin=ahora.getHours()*60+ahora.getMinutes();
  const slots=[];
  for(let h=horario.start;h<horario.end;h++){slots.push(`${pad(h)}:00`);slots.push(`${pad(h)}:30`);}
  const totalH=slots.length*SLOT_H;
  const varios=days.length>1;
  const cols=`60px repeat(${days.length},minmax(0,1fr))`;
  const nameOf=c=>{const p=patients.find(p=>p.id==c.pacienteId);return c.origen==="calendly"||!p?(c.nombreExterno||"Primera llamada"):`${p.nombre} ${p.apellidos}`;};
  const yaPaso=c=>c.fecha<todayStr||(c.fecha===todayStr&&timeToMins(c.hora)+(Number(c.duracion)||60)<=ahoraMin);
  const topAhora=(ahoraMin-horario.start*60)/30*SLOT_H;
  return(
    <div style={{background:FONDO_REJILLA}}>
      {showHeader&&(
        <div style={{display:"grid",gridTemplateColumns:cols,borderBottom:`1px solid ${LINEA_HORA}`,position:"sticky",top:0,zIndex:4,background:C.card}}>
          <div/>
          {days.map((d,i)=>{const ds=toYMD(d);const isT=ds===todayStr;const finde=d.getDay()===0||d.getDay()===6;const n=citas.filter(c=>c.fecha===ds).length;return(
            <div key={i} style={{padding:"10px 6px 9px",textAlign:"center",borderLeft:`1px solid ${LINEA_HORA}`,opacity:finde&&!isT?0.75:1}}>
              <div style={{fontSize:11,color:isT?C.accent:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{DAYS_ES[(d.getDay()+6)%7]}</div>
              <div style={{margin:"4px auto 0",width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:isT?700:500,
                background:isT?C.accent:"transparent",color:isT?"#fff":C.ink}}>{d.getDate()}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:3,height:14}}>{n?`${n} ${n===1?"cita":"citas"}`:""}</div>
            </div>
          );})}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:cols,position:"relative"}}>
        {/* Horas: etiqueta pegada a la línea de cada hora */}
        <div style={{position:"relative",height:totalH}}>
          {slots.map((t,k)=>t.endsWith(":00")&&(
            <div key={t} style={{position:"absolute",top:k*SLOT_H-7,right:10,fontSize:11.5,fontWeight:600,color:C.walnut,background:FONDO_REJILLA,padding:"0 2px",display:k===0?"none":"block"}}>{t}</div>
          ))}
          <div style={{position:"absolute",top:5,right:12,fontSize:11.5,fontWeight:600,color:C.walnut}}>{slots[0]}</div>
        </div>
        {days.map((d,i)=>{
          const ds=toYMD(d);const isT=ds===todayStr;const finde=d.getDay()===0||d.getDay()===6;
          const dc=citas.filter(c=>c.fecha===ds);
          return(
            <div key={i} style={{position:"relative",height:totalH,borderLeft:`1px solid ${LINEA_HORA}`,background:isT&&varios?"rgba(166,107,63,0.045)":finde&&varios?"rgba(125,110,98,0.05)":"transparent"}}>
              {slots.map(t=>(
                <div key={t} onClick={()=>onNew(d,t)} className="praxi-hueco" style={{height:SLOT_H,boxSizing:"border-box",cursor:"pointer",
                  borderBottom:t.endsWith(":00")?`1px dashed ${LINEA_MEDIA}`:`1px solid ${LINEA_HORA}`}}/>
              ))}
              {isT&&topAhora>=0&&topAhora<=totalH&&(
                <div style={{position:"absolute",left:0,right:0,top:topAhora,zIndex:3,pointerEvents:"none"}}>
                  <div style={{height:2,background:"#C0503A"}}/>
                  <div style={{position:"absolute",left:-5,top:-4,width:10,height:10,borderRadius:"50%",background:"#C0503A"}}/>
                </div>
              )}
              {dc.map(c=>{
                const top=(timeToMins(c.hora)-horario.start*60)/30*SLOT_H;
                const h=Math.max(SLOT_H,(Number(c.duracion)||60)/30*SLOT_H);
                if(top<0||top>=totalH)return null;
                const col=colorTipo(c,tipos);
                const pasada=yaPaso(c);
                const compacta=h<SLOT_H*2;
                const video=!!(c.zoomLink||"").trim();
                return(
                  <div key={c.id} title={`${c.hora}–${finDe(c)} · ${nameOf(c)} · ${c.tipo||"Cita"}`} onClick={e=>{e.stopPropagation();onEdit(c);}}
                    style={{position:"absolute",top:top+2,left:4,right:6,height:h-4,zIndex:2,boxSizing:"border-box",overflow:"hidden",cursor:"pointer",
                      background:col.bg,borderLeft:`4px solid ${col.c}`,borderRadius:8,padding:compacta?"0 10px":"7px 10px",
                      opacity:pasada?0.55:1,boxShadow:"0 1px 3px rgba(59,42,30,0.08)",
                      display:"flex",flexDirection:compacta?"row":"column",alignItems:compacta?"center":"stretch",gap:compacta?8:1,whiteSpace:compacta?"nowrap":"normal"}}>
                    {compacta?<>
                      <span style={{fontSize:11.5,fontWeight:700,color:col.c,flexShrink:0}}>{c.hora}</span>
                      <span style={{fontSize:13,fontWeight:700,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{nameOf(c)}</span>
                      {!varios&&<span style={{fontSize:12.5,color:C.walnut,flexShrink:0}}>· {c.tipo||"Cita"}</span>}
                    </>:<>
                      <div style={{fontSize:11.5,fontWeight:700,color:col.c,display:"flex",justifyContent:"space-between",gap:4}}><span>{varios?c.hora:`${c.hora} – ${finDe(c)}`}</span>{video&&<span title="Videollamada">🎥</span>}</div>
                      <div style={{fontSize:13.5,fontWeight:700,color:C.ink,lineHeight:1.25,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:varios?2:1,WebkitBoxOrient:"vertical",wordBreak:"break-word"}}>{nameOf(c)}</div>
                      <div style={{fontSize:12,color:C.walnut,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.tipo||"Cita"}</div>
                    </>}
                  </div>
                );
              })}
            </div>
          );
        })}
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
          <span style={{width:4,alignSelf:"stretch",borderRadius:2,background:colorTipo(c,tipos).c,flexShrink:0}}/>
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
        <div style={{...st.card,overflow:"clip"}}>
          <TimeGrid days={[date]} citas={citas} patients={patients} horario={horario} onNew={openNew} onEdit={openEdit} tipos={tipos}/>
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
        <div style={{...st.card,overflow:"clip"}}>
          <TimeGrid days={days} citas={citas} patients={patients} horario={horario} onNew={openNew} onEdit={openEdit} showHeader tipos={tipos}/>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",background:FONDO_REJILLA}}>
            {cells.map((d,i)=>{
              const ds=toYMD(d);const inMonth=d.getMonth()===date.getMonth();const isT=ds===todayStr;
              const dc=citas.filter(c=>c.fecha===ds).sort((a,b)=>a.hora.localeCompare(b.hora));
              const finde=d.getDay()===0||d.getDay()===6;
              const fondo=finde?"rgba(125,110,98,0.05)":"transparent";
              return(
                <div key={i} onClick={()=>{setDate(d);setView("day");}}
                  style={{minHeight:108,padding:"6px 6px 8px",borderLeft:i%7?`1px solid ${C.border}`:"none",borderTop:i>=7?`1px solid ${C.border}`:"none",cursor:"pointer",background:fondo,opacity:inMonth?1:0.45,minWidth:0}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(166,107,63,0.06)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=fondo;}}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:isT?700:500,background:isT?C.accent:"transparent",color:isT?"#fff":C.text,marginBottom:4}}>{d.getDate()}</div>
                  {dc.slice(0,3).map(c=>{const col=colorTipo(c,tipos);return(
                    <div key={c.id} onClick={e=>{e.stopPropagation();openEdit(c);}} title={`${c.hora} · ${nameOf(c)}`}
                      style={{fontSize:11.5,lineHeight:"18px",padding:"0 6px",marginBottom:3,borderRadius:5,background:col.bg,borderLeft:`3px solid ${col.c}`,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:C.ink}}>
                      <b style={{color:col.c,fontWeight:700}}>{c.hora}</b> {nameOf(c).split(" ")[0]}
                    </div>
                  );})}
                  {dc.length>3&&<div style={{fontSize:11,color:C.muted,paddingLeft:6}}>+{dc.length-3} más</div>}
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
    <div style={{maxWidth:1280}}>{/* ancho máximo: en pantallas grandes la vista día quedaba demasiado ancha */}
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
      <div style={{marginBottom:12}}><LeyendaTipos tipos={tipos}/></div>
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
