import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import { Aviso } from "./acceso.jsx";
import { DatosClinica } from "./configuracion.jsx";
import { C, st } from "./estilos.js";
import { Field, MFooter, Modal } from "./ui.jsx";
import { traducirError } from "./utilidades.js";
import { TuPlan } from "./planUI.jsx";

// ── Mi videollamada: cada profesional guarda su enlace fijo ───────────────────
export function MiVideollamadaModal({yo,demo,onClose,onGuardado,onDemo}){
  const[enlace,setEnlace]=useState(yo.enlace_videollamada||"");
  const[err,setErr]=useState("");const[guardando,setGuardando]=useState(false);
  const guardar=async()=>{
    if(demo){onDemo();return;}
    const e=enlace.trim();
    if(e&&!/^https:\/\/\S+$/i.test(e)){setErr("El enlace debe empezar por https://");return;}
    setGuardando(true);setErr("");
    const{error}=await supabase.rpc("guardar_mi_enlace",{p_enlace:e});
    setGuardando(false);
    if(error){setErr(traducirError(error));return;}
    onGuardado(e||null);
  };
  const ej=[["Zoom","Tu sala personal: en Zoom › Perfil › «ID de reunión personal», copia el enlace (zoom.us/j/…)."],
            ["Google Meet","Crea una reunión desde Google Calendar o meet.google.com › «Crear una reunión para más tarde» y copia el enlace (meet.google.com/…)."],
            ["Teams, Doxy.me u otra","Copia el enlace fijo de tu sala."]];
  return(
    <Modal onClose={onClose} title="Mi videollamada" width={520}>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:14}}>Pega el enlace fijo de tu sala de videollamada. Se pondrá solo en cada cita nueva de tus pacientes y podrás cambiarlo en una cita concreta.</div>
      <Field label="Enlace"><input style={st.input} value={enlace} onChange={e=>{setEnlace(e.target.value);setErr("");}} placeholder="https://zoom.us/j/… o https://meet.google.com/…" autoFocus/></Field>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
        {ej.map(([t,d])=><div key={t} style={{fontSize:12,color:C.text,lineHeight:1.5}}><b>{t}:</b> <span style={{color:C.muted}}>{d}</span></div>)}
      </div>
      <div style={{fontSize:12,color:C.walnut,background:C.sand,borderRadius:8,padding:"8px 12px",marginTop:14,lineHeight:1.5}}>Usa una cuenta profesional con acuerdo de protección de datos (por ejemplo Zoom de pago o Google Workspace): en la sesión se tratan datos de salud.</div>
      <Aviso>{err}</Aviso>
      <MFooter onCancel={onClose} onSave={guardar} saving={guardando}/>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANEL DE ADMINISTRACIÓN
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// EQUIPO — miembros, roles e invitaciones (solo administrador)
// ══════════════════════════════════════════════════════════════════════════════
export function EquipoPanel({plan,suscripcion,abrirPlanes,clinica,miembros,yo,patients,citas,demo,onCambio,bloquearDemo,setAviso,onBorrada}){
  const[invs,setInvs]=useState([]);
  const[email,setEmail]=useState("");
  const[rol,setRol]=useState("profesional");
  const[nuevo,setNuevo]=useState(null);
  const[copiado,setCopiado]=useState(null);
  const[err,setErr]=useState("");
  const[enviando,setEnviando]=useState(false);
  const enlace=t=>`${window.location.origin}/app?inv=${t}`;
  const cargarInvs=useCallback(async()=>{
    if(demo||!clinica?.id)return;
    const{data}=await supabase.from("invitaciones").select("*").eq("clinica_id",clinica.id).eq("aceptada",false).order("creado_en",{ascending:false});
    setInvs(data||[]);
  },[demo,clinica?.id]);
  useEffect(()=>{cargarInvs();},[cargarInvs]);

  const invitar=async()=>{
    if(demo)return bloquearDemo();
    setErr("");
    const e=email.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(e)){setErr("Escribe un email válido.");return;}
    if(miembros.some(m=>m.email===e)){setErr("Esa persona ya forma parte de la clínica.");return;}
    const ocupados=miembros.filter(m=>m.activo).length+invs.length;
    if(plan?.maxProfesionales&&ocupados>=plan.maxProfesionales){setErr(plan.plan==="clinica"?`Tu plan Clínica incluye ${plan.maxProfesionales} profesionales. Para añadir más (19 €/mes cada uno), contacta con Praxi.`:"Tu plan es para un solo profesional. Pasa al plan Clínica para trabajar en equipo.");return;}
    setEnviando(true);
    const{data,error}=await supabase.from("invitaciones").insert({clinica_id:clinica.id,email:e,rol}).select().single();
    setEnviando(false);
    if(error){setErr(traducirError(error));return;}
    setNuevo({email:e,url:enlace(data.token)});setEmail("");cargarInvs();
  };
  const copiar=async url=>{try{await navigator.clipboard.writeText(url);setCopiado(url);setTimeout(()=>setCopiado(null),2000);}catch{window.prompt("Copia este enlace:",url);}};
  const anular=async id=>{if(demo)return bloquearDemo();await supabase.from("invitaciones").delete().eq("id",id);cargarInvs();};
  const actualizar=async(m,cambios)=>{
    if(demo)return bloquearDemo();
    const{error}=await supabase.from("miembros").update(cambios).eq("id",m.id);
    if(error)setAviso(/administrador activo/.test(error.message)?"La clínica debe tener al menos un administrador activo.":traducirError(error));
    onCambio();
  };
  const mailto=(to,url)=>`mailto:${to}?subject=${encodeURIComponent(`Invitación a ${clinica.nombre} en Praxi`)}&body=${encodeURIComponent(`Hola,\n\nTe invito a unirte a ${clinica.nombre} en Praxi.\n\nEntra en este enlace y crea tu contraseña usando este mismo email (${to}):\n${url}\n\nEl enlace caduca en 7 días.`)}`;
  const nPac=id=>patients.filter(p=>p.profesionalId===id).length;
  const seccion={fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500};

  return(
    <div style={{maxWidth:900}}>
      <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Equipo</div>
      <div style={{color:C.muted,fontSize:13,marginTop:2,marginBottom:20}}>{clinica?.nombre} · {miembros.filter(m=>m.activo).length} miembros activos</div>

      <div style={{marginBottom:16}}><TuPlan key={abrirPlanes?"abierto":"cerrado"} plan={plan} suscripcion={suscripcion} abrir={abrirPlanes} patients={patients} citas={citas} demo={demo}/></div>

      <div style={{...st.card,padding:"18px 20px",marginBottom:16}}>
        <div style={{...seccion,marginBottom:12}}>Invitar a un profesional</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input style={{...st.input,flex:"1 1 240px",width:"auto"}} type="email" placeholder="email@ejemplo.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&invitar()}/>
          <select style={{...st.input,width:160}} value={rol} onChange={e=>setRol(e.target.value)}>
            <option value="profesional">Profesional</option>
            <option value="admin">Administrador</option>
          </select>
          <button style={{...st.btn(),opacity:enviando?0.6:1}} disabled={enviando} onClick={invitar}>Crear invitación</button>
        </div>
        <div style={{fontSize:12,color:C.muted,marginTop:8,lineHeight:1.5}}>Un <strong>profesional</strong> solo ve sus pacientes. Un <strong>administrador</strong> ve todos, gestiona el equipo y la configuración.</div>
        {err&&<div style={{fontSize:12,color:C.red,marginTop:10}}>{err}</div>}
        {nuevo&&(
          <div style={{marginTop:14,padding:"12px 14px",background:C.gD,borderRadius:10}}>
            <div style={{fontSize:13,color:C.green,fontWeight:600,marginBottom:6}}>Invitación creada para {nuevo.email}</div>
            <div style={{fontSize:12,color:C.walnut,marginBottom:8}}>Envíale este enlace. Tendrá que registrarse con ese mismo email. Caduca en 7 días.</div>
            <div style={{fontSize:12,background:C.bone,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",wordBreak:"break-all",marginBottom:8}}>{nuevo.url}</div>
            <div style={{display:"flex",gap:8}}>
              <button style={st.btn("sm")} onClick={()=>copiar(nuevo.url)}>{copiado===nuevo.url?"✓ Copiado":"Copiar enlace"}</button>
              <a href={mailto(nuevo.email,nuevo.url)} style={{...st.btn("sm"),textDecoration:"none",background:C.bone,color:C.accent,border:`1px solid ${C.accent}`}}>Enviar por email</a>
            </div>
          </div>
        )}
      </div>

      <div style={{...st.card,marginBottom:16,overflow:"hidden"}}>
        <div style={{...seccion,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>Miembros</div>
        {miembros.map(m=>{
          const soyYo=m.id===yo?.id;
          return(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:`1px solid ${C.border}`,opacity:m.activo?1:0.55,flexWrap:"wrap"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:m.color||C.accent,color:C.bone,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>{(m.nombre||"?")[0].toUpperCase()}</div>
              <div style={{flex:"1 1 200px",minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{m.nombre}{soyYo&&<span style={{color:C.muted,fontWeight:400}}> (tú)</span>}</div>
                <div style={{fontSize:12,color:C.muted}}>{m.email}{m.especialidad?` · ${m.especialidad}`:""} · {nPac(m.id)} pacientes</div>
              </div>
              <span style={st.badge(m.rol==="admin"?C.accent:C.walnut,m.rol==="admin"?C.sand:C.card)}>{m.rol==="admin"?"Administrador":"Profesional"}</span>
              {!m.activo&&<span style={st.badge(C.red,C.rD)}>Desactivado</span>}
              {!soyYo&&(
                <div style={{display:"flex",gap:6}}>
                  {m.activo&&<button style={st.btn("sm")} onClick={()=>actualizar(m,{rol:m.rol==="admin"?"profesional":"admin"})}>{m.rol==="admin"?"Quitar admin":"Hacer admin"}</button>}
                  <button style={{...st.btn("sm"),background:m.activo?C.rD:C.gD,color:m.activo?C.red:C.green}} onClick={()=>{if(!m.activo||confirm(`¿Desactivar a ${m.nombre}?\n\nPerderá el acceso al momento. Sus pacientes siguen en la clínica y puedes reasignarlos desde Pacientes → Editar.`))actualizar(m,{activo:!m.activo});}}>{m.activo?"Desactivar":"Reactivar"}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {invs.length>0&&(
        <div style={{...st.card,overflow:"hidden"}}>
          <div style={{...seccion,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>Invitaciones pendientes</div>
          {invs.map(i=>{
            const caducada=new Date(i.expira_en)<new Date();
            return(
              <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap"}}>
                <div style={{flex:"1 1 200px",fontSize:13}}>{i.email} <span style={{color:C.muted}}>· {i.rol==="admin"?"Administrador":"Profesional"} · {caducada?"caducada":`caduca el ${new Date(i.expira_en).toLocaleDateString("es-ES")}`}</span></div>
                {!caducada&&<button style={st.btn("sm")} onClick={()=>copiar(enlace(i.token))}>{copiado===enlace(i.token)?"✓ Copiado":"Copiar enlace"}</button>}
                <button style={{...st.btn("sm"),background:C.rD,color:C.red}} onClick={()=>anular(i.id)}>Anular</button>
              </div>
            );
          })}
        </div>
      )}
      <RegistroAccesos clinica={clinica} miembros={miembros} patients={patients} demo={demo}/>
      <DatosClinica clinica={clinica} miembros={miembros} patients={patients} citas={citas} demo={demo} bloquearDemo={bloquearDemo} onBorrada={onBorrada}/>
    </div>
  );
}

// ── Registro de accesos (solo admin) ──────────────────────────────────────────
export function RegistroAccesos({clinica,miembros,patients,demo}){
  const[filas,setFilas]=useState(null);
  const[error,setError]=useState("");
  const[filtro,setFiltro]=useState("");
  const cargar=useCallback(async()=>{
    if(demo){setFilas([]);return;}
    setError("");
    const{data,error}=await supabase.from("auditoria").select("*").eq("clinica_id",clinica.id).order("creado_en",{ascending:false}).limit(300);
    if(error){setError("El registro de accesos aún no está activado (falta ejecutar el archivo 04_cumplimiento.sql).");setFilas([]);return;}
    setFilas(data);
  },[demo,clinica?.id]);
  useEffect(()=>{cargar();},[cargar]);
  const quien=id=>miembros.find(m=>m.id===id)?.nombre||"—";
  const paciente=id=>{const p=patients.find(x=>x.id===Number(id));return p?`${p.nombre} ${p.apellidos||""}`.trim():`Ficha ${id} (ya no existe)`;};
  const ACC={ver:["Consultó",C.walnut,C.card],crear:["Creó",C.green,C.gD],modificar:["Modificó",C.amber,C.amD],borrar:["Borró",C.red,C.rD]};
  const lista=(filas||[]).filter(f=>!filtro||(f.tabla==="pacientes"&&String(f.registro_id)===filtro));
  const seccion={fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500};
  return(
    <div style={{...st.card,marginTop:16,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={seccion}>Registro de accesos</span>
        <div style={{display:"flex",gap:8}}>
          <select style={{...st.input,width:220,fontSize:12,padding:"6px 10px"}} value={filtro} onChange={e=>setFiltro(e.target.value)}>
            <option value="">Todas las fichas</option>
            {patients.map(p=><option key={p.id} value={String(p.id)}>{p.nombre} {p.apellidos}</option>)}
          </select>
          <button style={st.btn("sm")} onClick={cargar}>Actualizar</button>
        </div>
      </div>
      <div style={{fontSize:12,color:C.muted,padding:"10px 20px",borderBottom:`1px solid ${C.border}`}}>Quién ha consultado, creado, modificado o borrado cada ficha y cita. Nadie puede editar ni borrar este registro. Se muestran los 300 movimientos más recientes.</div>
      {error&&<div style={{fontSize:13,color:C.amber,padding:"12px 20px"}}>{error}</div>}
      {demo&&<div style={{fontSize:13,color:C.muted,padding:"12px 20px",fontStyle:"italic"}}>En la demo no se registran accesos.</div>}
      {filas&&!error&&!demo&&lista.length===0&&<div style={{fontSize:13,color:C.muted,padding:"12px 20px",fontStyle:"italic"}}>Sin movimientos todavía.</div>}
      <div style={{maxHeight:360,overflowY:"auto"}}>
        {lista.map(f=>{const[t,col,bg]=ACC[f.accion]||[f.accion,C.muted,C.card];return(
          <div key={f.id} style={{display:"flex",gap:12,alignItems:"center",padding:"8px 20px",borderBottom:`1px solid ${C.border}`,fontSize:13,flexWrap:"wrap"}}>
            <span style={{color:C.muted,fontSize:12,width:120,flexShrink:0}}>{new Date(f.creado_en).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
            <span style={{fontWeight:600,width:150,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{quien(f.miembro_id)}</span>
            <span style={st.badge(col,bg)}>{t}</span>
            <span style={{color:C.text}}>{f.tabla==="pacientes"?paciente(f.registro_id):`una cita`}</span>
          </div>
        );})}
      </div>
    </div>
  );
}
