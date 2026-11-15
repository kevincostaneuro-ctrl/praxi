import { useState } from "react";
import { AgendaPersonalPanel } from "./citas.jsx";
import { CITA_BG, DAYS_ES, MONTHS_ES, WORK_END, WORK_START } from "./constantes.js";
import { C, PRIORIDAD_T, st } from "./estilos.js";
import { Avatar } from "./ui.jsx";
import { CitasHoy, CobrosPendientes, PrimerosPasos, TuPlan } from "./dashboardBloques.jsx";
import { addDays, diasEntre, etiquetaDia, etiquetaSemana, fechaDe, startOfWeek, timeToMins, toYMD, today } from "./utilidades.js";

export function Dashboard({patients,setPatients,citas,setCitas,tareas,setTareas,horario,onInforme,onEditCita,onEditTarea,onNuevaCita,onAgendar,onAbrirPaciente,onNuevoPaciente,onVerCalendario,clinica,yo,esAdmin,demo,onIr,onVideo}){
  const[weekStart,setWeekStart]=useState(startOfWeek(today()));
  const ahora=today();
  const todayStr=toYMD(ahora);
  const ahoraMin=ahora.getHours()*60+ahora.getMinutes();
  const todayCitas=citas.filter(c=>c.fecha===todayStr);
  const days=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const pac=id=>patients.find(p=>p.id==id);
  const nameOf=c=>{const p=pac(c.pacienteId);return c.origen==="calendly"||!p?(c.nombreExterno||"Primera llamada"):`${p.nombre} ${p.apellidos}`;};
  const activos=patients.filter(p=>p.estado==="activo");
  const eur=n=>`${Math.round(n).toLocaleString("es-ES")} €`;
  const yaPaso=c=>c.fecha<todayStr||(c.fecha===todayStr&&timeToMins(c.hora)+(c.duracion||0)<=ahoraMin);

  // ── Ocupación de la semana actual (lunes a viernes en tu horario)
  const ws0=startOfWeek(ahora);const claves=Array.from({length:7},(_,i)=>toYMD(addDays(ws0,i)));
  const capacidad=5*Math.max(1,(horario?.end??WORK_END)-(horario?.start??WORK_START))*60;
  const reservado=citas.filter(c=>claves.includes(c.fecha)).reduce((a,c)=>a+(Number(c.duracion)||0),0);
  const ocupacion=Math.min(100,Math.round(reservado/capacidad*100));

  // ── Cobros
  const mes=todayStr.slice(0,7);
  const todasSes=patients.flatMap(p=>p.sesiones||[]);
  const cobradoMes=todasSes.filter(s=>s.pagado&&(s.fecha||"").startsWith(mes)).reduce((a,s)=>a+(Number(s.pago)||0),0);
  const pendiente=todasSes.filter(s=>!s.pagado).reduce((a,s)=>a+(Number(s.pago)||0),0);

  // ── Siguiente cita
  const proxima=[...citas].filter(c=>!yaPaso(c)&&(c.fecha>todayStr||timeToMins(c.hora)>=ahoraMin-((c.duracion||0)-1)))
    .sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora))[0];
  const cuando=c=>{
    if(c.fecha===todayStr){const m=timeToMins(c.hora)-ahoraMin;if(m<=0)return"En curso";if(m<60)return`En ${m} min`;return`Hoy en ${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`;}
    return`${etiquetaDia(fechaDe(c.fecha))} · ${c.hora}`;
  };
  const pProx=proxima&&proxima.origen!=="calendly"?pac(proxima.pacienteId):null;
  const ultSes=pProx?[...(pProx.sesiones||[])].sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""))[0]:null;
  const ultPrueba=pProx?[...(pProx.pruebasRealizadas||[])].sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""))[0]:null;

  // ── Pacientes activos sin próxima cita
  const conCita=new Set(citas.filter(c=>c.fecha>=todayStr&&c.pacienteId).map(c=>String(c.pacienteId)));
  const sinCita=activos.filter(p=>!conCita.has(String(p.id))).map(p=>{
    const fechas=[...(p.sesiones||[]).map(s=>s.fecha),...citas.filter(c=>c.pacienteId==p.id&&c.fecha<todayStr).map(c=>c.fecha)].filter(Boolean).sort();
    const ult=fechas[fechas.length-1];
    return{p,dias:ult?diasEntre(fechaDe(ult),ahora):null};
  }).sort((a,b)=>(b.dias??-1)-(a.dias??-1));

  const Stat=({val,label,color,children})=>(
    <div style={st.statCard}>
      <div style={{fontSize:30,fontWeight:700,color,lineHeight:1}}>{val}</div>
      <div style={{fontSize:13,color:C.muted,marginTop:8}}>{label}</div>
      {children}
    </div>
  );
  const Fila=({onClick,icono,color,texto,detalle,accion})=>(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:`1px solid ${C.border}`,cursor:onClick?"pointer":"default"}}>
      {icono&&<span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>}
      <div style={{flex:1,minWidth:0,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{texto}</div>
      {detalle&&<div style={{fontSize:12,color:C.muted,flexShrink:0}}>{detalle}</div>}
      {accion}
    </div>
  );
  const Titulo=({children,n})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>{children}</div>
      {n!=null&&<span style={st.badge(n?C.accent:C.green,n?C.sand:C.gD)}>{n}</span>}
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:12,flexWrap:"wrap"}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Dashboard</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={st.btn("sm")} onClick={onNuevoPaciente}>+ Nuevo paciente</button>
          <button style={st.btn("sm")} onClick={onNuevaCita}>+ Nueva cita</button>
          <button style={{...st.btn("sm"),background:C.gD,color:C.green}} onClick={onInforme}>📊 Informe mensual</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:14}}>
        <Stat val={activos.length} label="Pacientes activos" color={C.accent}/>
        <Stat val={todayCitas.length} label="Citas hoy" color={C.accent}/>
        <Stat val={`${ocupacion} %`} label="Ocupación esta semana" color={C.accent}>
          <div style={{height:5,background:C.sand,borderRadius:3,marginTop:10}}><div style={{width:`${ocupacion}%`,height:5,background:C.accent,borderRadius:3}}/></div>
        </Stat>
        <Stat val={eur(cobradoMes)} label={`Cobrado en ${MONTHS_ES[ahora.getMonth()].toLowerCase()}`} color={C.green}>
          {pendiente>0&&<div style={{fontSize:12,color:C.amber,marginTop:6,fontWeight:500}}>{eur(pendiente)} pendientes de cobro</div>}
        </Stat>
      </div>

      <PrimerosPasos clinica={clinica} yo={yo} esAdmin={esAdmin} demo={demo} patients={patients} citas={citas} onIr={onIr} onVideo={onVideo} onNuevoPaciente={onNuevoPaciente} onNuevaCita={onNuevaCita}/>

      {proxima&&(
        <div style={{...st.card,padding:"16px 20px",marginBottom:14,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",borderLeft:`3px solid ${C.accent}`,borderRadius:"0 18px 18px 0"}}>
          <Avatar nombre={nameOf(proxima)} apellidos="" size={44}/>
          <div style={{flex:1,minWidth:220}}>
            <div style={{fontSize:12,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Siguiente cita · {cuando(proxima)}</div>
            <div style={{fontSize:17,fontWeight:700,color:C.ink,marginTop:3}}>{nameOf(proxima)} <span style={{fontWeight:400,color:C.walnut,fontSize:14}}>· {proxima.hora} · {pProx?`sesión ${(pProx.sesiones||[]).length+1}`:(proxima.tipo||"Cita")}</span></div>
            {pProx&&(ultSes||ultPrueba)&&<div style={{fontSize:12.5,color:C.muted,marginTop:4,lineHeight:1.5}}>
              {ultSes&&<>Última sesión: {ultSes.trabajado||"sin resumen"}</>}{ultSes&&ultPrueba&&" · "}{ultPrueba&&<>{ultPrueba.prueba}: {ultPrueba.resultado}</>}
            </div>}
          </div>
          <div style={{display:"flex",gap:8}}>
            {pProx&&<button style={st.btn("sm")} onClick={()=>onAbrirPaciente(pProx.id)}>Abrir ficha</button>}
            <button style={{...st.btn("sm"),background:C.bone,color:C.muted}} onClick={()=>onEditCita(proxima)}>Ver cita</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:14,marginBottom:14,alignItems:"start"}}>
        <CitasHoy citas={citas} patients={patients} onAbrirPaciente={onAbrirPaciente} onEditCita={onEditCita} onNuevaCita={onNuevaCita}/>
        <CobrosPendientes patients={patients} setPatients={setPatients} onIr={onIr}/>
        <div style={{...st.card,padding:"16px 20px"}}>
          <Titulo n={sinCita.length}>Sin próxima cita</Titulo>
          {sinCita.length===0&&<div style={{fontSize:13,color:C.green,padding:"6px 0"}}>Todos tus pacientes activos tienen cita.</div>}
          {sinCita.slice(0,6).map(({p,dias})=>(
            <Fila key={p.id} onClick={()=>onAbrirPaciente(p.id)}
              texto={<b>{p.nombre} {p.apellidos}</b>}
              detalle={dias==null?"sin sesiones":dias===0?"última hoy":`última hace ${dias} ${dias===1?"día":"días"}`}
              accion={<button style={st.btn("sm")} onClick={e=>{e.stopPropagation();onAgendar(p.id);}}>Agendar</button>}/>
          ))}
          {sinCita.length>6&&<div style={{fontSize:12,color:C.muted,paddingTop:8,borderTop:`1px solid ${C.border}`}}>Y {sinCita.length-6} más.</div>}
        </div>
        <TuPlan clinica={clinica} patients={patients} citas={citas} demo={demo}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:14,alignItems:"start"}}>
        <div style={{...st.card,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
           <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button style={st.btn("sm")} onClick={()=>setWeekStart(d=>addDays(d,-7))}>‹</button>
            <button title="Volver a esta semana" style={{...st.btn("sm"),background:C.bone,color:C.muted,minWidth:96}} onClick={()=>setWeekStart(startOfWeek(today()))}>{etiquetaSemana(weekStart)}</button>
            <button style={st.btn("sm")} onClick={()=>setWeekStart(d=>addDays(d,7))}>›</button>
           </div>
            <span style={{fontSize:14,fontWeight:600,color:C.text,textAlign:"center",whiteSpace:"nowrap"}}>
              {weekStart.getDate()} {MONTHS_ES[weekStart.getMonth()].slice(0,3)} – {addDays(weekStart,6).getDate()} {MONTHS_ES[addDays(weekStart,6).getMonth()].slice(0,3)}
            </span>
            <button style={{...st.btn("sm"),background:C.bone,color:C.muted,justifySelf:"end"}} onClick={onVerCalendario}>Ver calendario →</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",minHeight:260}}>
            {days.map((d,i)=>{
              const ds=toYMD(d);const isT=ds===todayStr;
              const dc=[...citas.filter(c=>c.fecha===ds)].sort((a,b)=>a.hora.localeCompare(b.hora));
              const dt=tareas.filter(t=>t.fecha===ds&&!t.hecho);
              return(
                <div key={i} style={{borderLeft:i?`1px solid ${C.border}`:"none",minWidth:0}}>
                  <div style={{padding:"10px 6px",textAlign:"center",borderBottom:`1px solid ${C.border}`,background:isT?C.sand:"transparent"}}>
                    <div style={{fontSize:12,color:isT?C.accent:C.walnut,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>{DAYS_ES[i]}</div>
                    <div style={{fontSize:16,fontWeight:isT?700:400,color:isT?C.accent:C.text,marginTop:2}}>{d.getDate()}</div>
                  </div>
                  {dc.length===0&&dt.length===0&&<div style={{padding:"12px 6px",fontSize:12,color:C.dim,textAlign:"center",fontStyle:"italic"}}>—</div>}
                  {dc.map(c=>(
                    <div key={c.id} onClick={()=>onEditCita(c)} style={{margin:6,padding:"8px 9px",background:CITA_BG,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.accent}`,borderRadius:6,cursor:"pointer",opacity:yaPaso(c)?0.55:1}}>
                      <div style={{fontSize:12,color:C.muted,fontWeight:600}}>{c.hora}</div>
                      <div style={{fontSize:13,fontWeight:700,color:C.ink,lineHeight:1.3,marginTop:2,overflow:"hidden",textOverflow:"ellipsis"}}>{nameOf(c)}</div>
                      <div style={{fontSize:12,color:C.walnut,marginTop:2}}>{c.tipo||"Cita"} · {c.duracion}min</div>
                    </div>
                  ))}
                  {dt.map(t=>(
                    <div key={t.id} onClick={()=>onEditTarea(t)} style={{margin:6,padding:"6px 9px",borderRadius:6,borderLeft:`3px solid ${PRIORIDAD_T[t.prioridad]?.color||C.muted}`,background:`${PRIORIDAD_T[t.prioridad]?.bg||C.bone}`,cursor:"pointer"}}>
                      <div style={{fontSize:11,color:PRIORIDAD_T[t.prioridad]?.color,fontWeight:600}}>{t.hora}</div>
                      <div style={{fontSize:12,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis"}}>{t.titulo||t.texto}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <AgendaPersonalPanel tareas={tareas} setTareas={setTareas} onEditTarea={onEditTarea}/>
      </div>
    </div>
  );
}
