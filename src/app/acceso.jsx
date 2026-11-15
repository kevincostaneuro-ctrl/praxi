import { useEffect, useState } from "react";
import { VERSION_TERMINOS } from "../legal.js";
import { supabase } from "../supabase.js";
import { PRAXI_LOGO } from "./constantes.js";
import { C, st } from "./estilos.js";
import { leerInvitacion, olvidarInvitacion, traducirError } from "./utilidades.js";

export function CajaAcceso({children,ancho=420}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',sans-serif",padding:16,boxSizing:"border-box"}}>
      <div style={{width:"100%",maxWidth:ancho,background:C.bone,border:`1px solid ${C.border}`,borderRadius:18,padding:"40px 34px",boxSizing:"border-box",boxShadow:"0 1px 2px rgba(59,42,30,0.06),0 8px 24px -12px rgba(59,42,30,0.14)"}}>
        <a href="/"><img src={PRAXI_LOGO} alt="praXi" style={{height:52,display:"block",margin:"0 auto 28px"}}/></a>
        {children}
      </div>
    </div>
  );
}
export const Aviso=({tipo="error",children})=>children?<div style={{fontSize:13,marginTop:14,padding:"9px 12px",borderRadius:8,lineHeight:1.5,color:tipo==="ok"?C.green:C.red,background:tipo==="ok"?C.gD:C.rD}}>{children}</div>:null;
export const Enlace=({onClick,children})=><button type="button" onClick={onClick} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,padding:0,fontFamily:"'Manrope',sans-serif",textDecoration:"underline"}}>{children}</button>;

export function Acceso({recuperando,onPasswordCambiada}){
  const inv=leerInvitacion();
  const[modo,setModo]=useState(recuperando?"nueva":inv?"alta":"login");
  const[invInfo,setInvInfo]=useState(null);
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[show,setShow]=useState(false);
  const[err,setErr]=useState("");
  const[ok,setOk]=useState("");
  const[cargando,setCargando]=useState(false);

  useEffect(()=>{if(recuperando)setModo("nueva");},[recuperando]);
  useEffect(()=>{
    if(!inv)return;
    supabase.rpc("ver_invitacion",{p_token:inv}).then(({data})=>{
      const i=data?.[0];
      if(i){setInvInfo(i);setEmail(i.email);}else{setErr("La invitación no es válida o ha caducado. Pide una nueva al administrador.");olvidarInvitacion();}
    });
  },[inv]);

  const volver=window.location.origin+"/app"+(inv?`?inv=${inv}`:"");
  const ir=m=>{setModo(m);setErr("");setOk("");};
  const ejecutar=async fn=>{setErr("");setOk("");setCargando(true);try{await fn();}catch(e){setErr(traducirError(e));}setCargando(false);};

  const entrar=()=>ejecutar(async()=>{
    const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
  });
  const crearCuenta=()=>ejecutar(async()=>{
    if(password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const{data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:volver}});
    if(error)throw error;
    if(!data.session)setOk(`Te hemos enviado un email a ${email.trim()}. Ábrelo y pulsa el enlace para confirmar tu cuenta.`);
  });
  const recuperar=()=>ejecutar(async()=>{
    const{error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/app"});
    if(error)throw error;
    setOk("Si existe una cuenta con ese email, te llegará un enlace para crear una contraseña nueva.");
  });
  const nuevaPassword=()=>ejecutar(async()=>{
    if(password.length<8)throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const{error}=await supabase.auth.updateUser({password});
    if(error)throw error;
    onPasswordCambiada&&onPasswordCambiada();
  });

  const accion={login:entrar,alta:crearCuenta,recuperar,nueva:nuevaPassword}[modo];
  const titulo={login:"Iniciar sesión",alta:invInfo?"Únete a tu clínica":"Crear cuenta",recuperar:"Recuperar contraseña",nueva:"Nueva contraseña"}[modo];
  const boton={login:"Entrar",alta:"Crear cuenta",recuperar:"Enviar enlace",nueva:"Guardar contraseña"}[modo];
  const enter=e=>e.key==="Enter"&&!cargando&&accion();

  return(
    <CajaAcceso>
      <div style={{fontSize:22,fontFamily:"'Instrument Serif',serif",textAlign:"center",color:C.ink,marginBottom:invInfo&&modo==="alta"?8:22}}>{titulo}</div>
      {invInfo&&modo==="alta"&&<div style={{fontSize:13,color:C.walnut,textAlign:"center",marginBottom:22,lineHeight:1.5}}>Te han invitado a <strong>{invInfo.clinica}</strong>. Crea tu contraseña para entrar.</div>}
      {!invInfo&&!inv&&modo==="alta"&&<div style={{fontSize:12,color:C.walnut,background:C.sand,borderRadius:8,padding:"9px 12px",marginBottom:18,lineHeight:1.5}}>Praxi está en acceso anticipado: para crear tu clínica necesitarás un <strong>código de acceso</strong>. Si no lo tienes, <a href="/" style={{color:C.accent}}>apúntate a la lista de espera</a>. Si te ha invitado tu clínica, usa el enlace de la invitación.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {modo!=="nueva"&&<div><label style={st.label}>Email</label>
          <input style={st.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" autoFocus={!invInfo} readOnly={!!invInfo&&modo==="alta"} onKeyDown={enter}/>
        </div>}
        {modo!=="recuperar"&&<div><label style={st.label}>{modo==="login"?"Contraseña":"Contraseña (mínimo 8 caracteres)"}</label>
          <div style={{position:"relative"}}>
            <input style={{...st.input,paddingRight:40}} type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={modo==="login"?"current-password":"new-password"} onKeyDown={enter} autoFocus={modo==="nueva"||(!!invInfo&&modo==="alta")}/>
            <button type="button" onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>{show?"🙈":"👁"}</button>
          </div>
        </div>}
      </div>
      <Aviso>{err}</Aviso>
      <Aviso tipo="ok">{ok}</Aviso>
      {modo==="alta"&&<div style={{fontSize:11.5,color:C.muted,marginTop:14,lineHeight:1.5}}>Al crear tu cuenta, tus datos se tratan según la <a href="/privacidad" target="_blank" rel="noreferrer" style={{color:C.accent}}>política de privacidad</a>.</div>}
      <button disabled={cargando} style={{...st.btn(),width:"100%",padding:"12px 0",fontSize:14,marginTop:20,opacity:cargando?0.6:1}} onClick={accion}>{cargando?"Un momento…":boton}</button>
      <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap",marginTop:18}}>
        {modo==="login"&&<Enlace onClick={()=>ir("recuperar")}>¿Has olvidado tu contraseña?</Enlace>}
        {modo==="login"&&<Enlace onClick={()=>ir("alta")}>Crear cuenta</Enlace>}
        {(modo==="alta"||modo==="recuperar")&&<Enlace onClick={()=>ir("login")}>Ya tengo cuenta</Enlace>}
      </div>
    </CajaAcceso>
  );
}

// Después de entrar, si el usuario aún no pertenece a ninguna clínica
export function Onboarding({session,onListo}){
  const inv=leerInvitacion();
  const[invInfo,setInvInfo]=useState(null);
  const[form,setForm]=useState({clinica:"",nombre:"",especialidad:"",codigo:""});
  const[aceptaTerminos,setAceptaTerminos]=useState(false);
  const[err,setErr]=useState("");
  const[cargando,setCargando]=useState(false);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  useEffect(()=>{if(inv)supabase.rpc("ver_invitacion",{p_token:inv}).then(({data})=>{const i=data?.[0];if(i)setInvInfo(i);else olvidarInvitacion();});},[inv]);
  const enviar=async()=>{
    setErr("");
    if(!form.nombre.trim()){setErr("Escribe tu nombre.");return;}
    if(!invInfo&&!form.clinica.trim()){setErr("Escribe el nombre de la clínica o consulta.");return;}
    if(!invInfo&&!form.codigo.trim()){setErr("Escribe tu código de acceso.");return;}
    if(!invInfo&&!aceptaTerminos){setErr("Para crear la clínica tienes que aceptar los Términos y el Contrato de encargo.");return;}
    setCargando(true);
    const{error}=invInfo
      ?await supabase.rpc("aceptar_invitacion",{p_token:inv,p_nombre:form.nombre.trim(),p_especialidad:form.especialidad.trim()||null})
      :await supabase.rpc("crear_clinica",{p_nombre:form.clinica.trim(),p_mi_nombre:form.nombre.trim(),p_especialidad:form.especialidad.trim()||null,p_codigo:form.codigo.trim(),p_terminos_version:VERSION_TERMINOS});
    setCargando(false);
    if(error){setErr(traducirError(error));return;}
    olvidarInvitacion();
    onListo();
  };
  return(
    <CajaAcceso ancho={460}>
      <div style={{fontSize:22,fontFamily:"'Instrument Serif',serif",textAlign:"center",color:C.ink,marginBottom:8}}>{invInfo?`Únete a ${invInfo.clinica}`:"Crea tu clínica"}</div>
      <div style={{fontSize:13,color:C.muted,textAlign:"center",marginBottom:22,lineHeight:1.5}}>{invInfo?"Completa tu perfil para empezar.":<>Has iniciado sesión como <b style={{color:C.text}}>{session.user.email}</b>, pero esta cuenta aún no pertenece a ninguna clínica. Crea la tuya (serás el administrador) o pide una invitación a tu clínica.</>}</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {!invInfo&&<div><label style={st.label}>Nombre de la clínica o consulta</label><input style={st.input} value={form.clinica} onChange={f("clinica")} autoFocus/></div>}
        <div><label style={st.label}>Tu nombre y apellidos</label><input style={st.input} value={form.nombre} onChange={f("nombre")} autoFocus={!!invInfo}/></div>
        <div><label style={st.label}>Especialidad (opcional)</label><input style={st.input} value={form.especialidad} onChange={f("especialidad")}/></div>
        {!invInfo&&<div><label style={st.label}>Código de acceso</label><input style={{...st.input,textTransform:"uppercase"}} value={form.codigo} onChange={f("codigo")} onKeyDown={e=>e.key==="Enter"&&!cargando&&enviar()}/>
          <div style={{fontSize:12,color:C.muted,marginTop:6,lineHeight:1.5}}>Praxi está en acceso anticipado. ¿No tienes código? <a href="/" style={{color:C.accent}}>Apúntate a la lista de espera</a>.</div></div>}
        {!invInfo&&<label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:12.5,color:C.text,lineHeight:1.5,cursor:"pointer"}}>
          <input type="checkbox" checked={aceptaTerminos} onChange={e=>setAceptaTerminos(e.target.checked)} style={{marginTop:2,accentColor:C.accent,width:16,height:16,flexShrink:0}}/>
          <span>Acepto los <a href="/terminos" target="_blank" rel="noreferrer" style={{color:C.accent}}>Términos del servicio</a> y el <a href="/terminos#encargo" target="_blank" rel="noreferrer" style={{color:C.accent}}>Contrato de encargo del tratamiento</a>, en nombre propio o de la clínica que represento.</span>
        </label>}
      </div>
      <Aviso>{err}</Aviso>
      <button disabled={cargando} style={{...st.btn(),width:"100%",padding:"12px 0",fontSize:14,marginTop:20,opacity:cargando?0.6:1}} onClick={enviar}>{cargando?"Un momento…":invInfo?"Entrar en la clínica":"Crear clínica"}</button>
      <div style={{textAlign:"center",marginTop:16,fontSize:12,color:C.muted}}>¿No es tu cuenta? <Enlace onClick={()=>supabase.auth.signOut()}>Cerrar sesión y entrar con otra</Enlace></div>
    </CajaAcceso>
  );
}

export function PantallaEstado({titulo,texto,accion}){
  return(
    <CajaAcceso>
      <div style={{fontSize:20,fontFamily:"'Instrument Serif',serif",textAlign:"center",color:C.ink,marginBottom:10}}>{titulo}</div>
      {texto&&<div style={{fontSize:13,color:C.muted,textAlign:"center",lineHeight:1.6}}>{texto}</div>}
      {accion&&<div style={{textAlign:"center",marginTop:20}}>{accion}</div>}
    </CajaAcceso>
  );
}
