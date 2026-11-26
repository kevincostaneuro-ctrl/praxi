// ── Mapa de la app ──────────────────────────────────────────────────────────
// Este archivo solo monta la app (sesión, datos y menú). Cada pantalla vive en src/app/:
//   dashboard.jsx      Dashboard              calendario.jsx  Calendario y agenda del equipo
//   pacientes.jsx      Lista de pacientes     ficha.jsx       Ficha del paciente (+ fichaPestanas.jsx)
//   citas.jsx          Formularios de cita, tareas, horario y huecos
//   facturas.jsx       Facturas y PDF         recursos.jsx    Biblioteca de recursos
//   equipo.jsx         Equipo, accesos y videollamada         configuracion.jsx  Configuración
//   informe.jsx        Informe mensual        ia.jsx          Conexión con la IA · nora.jsx Nora
//   acceso.jsx         Login, alta y crear clínica
//   ui.jsx             Piezas comunes (Modal, Field, Avatar…)  estilos.js  Colores y estilos
//   utilidades.js      Fechas, WhatsApp, errores…             constantes.js  Valores fijos
//   demo.js            Datos de ejemplo de /demo
// Antes de subir cambios: npm test (lo repite GitHub en cada envío).

import { useCallback, useEffect, useRef, useState } from "react";
import { Acceso, Enlace, Onboarding, PantallaEstado } from "./app/acceso.jsx";
import { Calendario } from "./app/calendario.jsx";
import { CitaModal, TareaModal, useReminders } from "./app/citas.jsx";
import { Configuracion } from "./app/configuracion.jsx";
import { estadoPlan, superaLimitePacientes } from "./app/plan.js";
import { AvisoPlan, BannerPlan } from "./app/planUI.jsx";
import { NuevosTerminos, PasoDos } from "./app/seguridad.jsx";
import { AvisoCopia } from "./app/proteccionDatos.jsx";
import { VERSION_TERMINOS } from "./legal.js";
import { CLINICA_STORE, DEFAULT_TIPOS_CITA, DemoCtx, EquipoCtx, IA_VISIBLE, PRAXI_LOGO, WORK_END, WORK_START } from "./app/constantes.js";
import { Dashboard } from "./app/dashboard.jsx";
import { DEMO_MIEMBROS, DEMO_USER, SAMPLE_CITAS, demoPacientes, mkPatient } from "./app/demo.js";
import { EquipoPanel, MiVideollamadaModal } from "./app/equipo.jsx";
import { C, st } from "./app/estilos.js";
import { Facturas } from "./app/facturas.jsx";
import { FichaPaciente } from "./app/ficha.jsx";
import { InformeMensual } from "./app/informe.jsx";
import { Pacientes } from "./app/pacientes.jsx";
import { Recursos } from "./app/recursos.jsx";
import { NoraGlobal } from "./app/noraGlobal.jsx";
import { toYMD, today } from "./app/utilidades.js";
import { leerTodo, sincronizar, supabase } from "./supabase.js";

// Estado que avisa de cada cambio (prev → next) para guardarlo en Supabase
function useEstadoSincronizado(inicial){
  const[valor,setValor]=useState(inicial);
  const ref=useRef(inicial);
  const alCambiar=useRef(null);
  const set=useCallback(upd=>{
    const prev=ref.current;
    const next=typeof upd==="function"?upd(prev):upd;
    if(next===prev)return;
    ref.current=next;setValor(next);
    alCambiar.current&&alCambiar.current(prev,next);
  },[]);
  const cargar=useCallback(v=>{ref.current=v;setValor(v);},[]);
  return[valor,set,cargar,alCambiar,ref];
}

export default function App({demo=false}){
  const[demoToast,setDemoToast]=useState(false);
  const[aviso,setAviso]=useState("");
  useEffect(()=>{if(!demoToast)return;const t=setTimeout(()=>setDemoToast(false),2600);return()=>clearTimeout(t);},[demoToast]);
  useEffect(()=>{if(!aviso)return;const t=setTimeout(()=>setAviso(""),5000);return()=>clearTimeout(t);},[aviso]);
  // En la demo pública ningún cambio se guarda: los setters de datos no hacen nada y avisan
  const ro=setter=>demo?(()=>setDemoToast(true)):setter;

  // ── Sesión y clínica ──
  const[session,setSession]=useState(null);
  const[authListo,setAuthListo]=useState(demo);
  const[recuperando,setRecuperando]=useState(false);
  const[estado,setEstado]=useState(demo?"listo":"cargando");
  const[currentUser,setCurrentUser]=useState(demo?DEMO_USER:null);
  const[currentClinica,setCurrentClinica]=useState(demo?CLINICA_STORE:null);
  const[profesionales,setProfesionales]=useState(demo?DEMO_MIEMBROS:[]);
  const[pendientes,setPendientes]=useState(0);

  // ── Datos ──
  const[patients,setPatientsSync,cargarPatients,cambioPatients,patientsRef]=useEstadoSincronizado(demo?demoPacientes():[]);
  const[citas,setCitasSync,cargarCitas,cambioCitas,citasRef]=useEstadoSincronizado(demo?SAMPLE_CITAS.filter(c=>![7,10,12].includes(c.pacienteId)):[]);
  const[tareas,setTareasSync,cargarTareas,cambioTareas]=useEstadoSincronizado([]);
  const[tipos,setTiposSync,cargarTipos,cambioTipos,tiposRef]=useEstadoSincronizado(DEFAULT_TIPOS_CITA);
  const[horario,setHorarioSync,cargarHorario,cambioHorario,horarioRef]=useEstadoSincronizado({start:WORK_START,end:WORK_END});
  // Plan: en solo lectura no se crea ni se modifica; en Básico, máximo 10 pacientes activos
  const[suscripcion,setSuscripcion]=useState(null);
  const[avisoPlan,setAvisoPlan]=useState(null);
  const[abrirPlanes,setAbrirPlanes]=useState(false);
  const[terminosLuego,setTerminosLuego]=useState(false);
  const[copiaLuego,setCopiaLuego]=useState(false);
  const planRef=useRef(null);
  const conPlan=(setSync,tipo)=>upd=>{
    const p=planRef.current;
    if(!p)return setSync(upd);
    if(p.soloLectura){setAvisoPlan("lectura");return;}
    if(!p.limitePacientes)return setSync(upd);
    const antesC=citasRef.current,antesP=patientsRef.current;
    const next=typeof upd==="function"?upd(tipo==="citas"?antesC:antesP):upd;
    if(superaLimitePacientes({limite:p.limitePacientes,citasAntes:antesC,citasDespues:tipo==="citas"?next:antesC,pacientesAntes:antesP,pacientesDespues:tipo==="pacientes"?next:antesP})){setAvisoPlan("limite");return;}
    setSync(next);
  };
  const setPatients=ro(conPlan(setPatientsSync,"pacientes"));
  const setCitas=ro(conPlan(setCitasSync,"citas"));
  const setTareas=ro(setTareasSync);
  const setTipos=ro(setTiposSync);
  const setHorario=ro(setHorarioSync);
  const[config,_setConfig]=useState({makeOut:""});const setConfig=ro(_setConfig);

  const uid=session?.user?.id;
  const cid=currentClinica?.id;
  const esAdmin=currentUser?.rol==="admin";
  const miId=currentUser?.id;

  useEffect(()=>{
    if(demo)return;
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthListo(true);});
    const{data:sub}=supabase.auth.onAuthStateChange((ev,s)=>{if(ev==="PASSWORD_RECOVERY")setRecuperando(true);setSession(s);});
    return()=>sub.subscription.unsubscribe();
  },[demo]);

  const cargarTodo=useCallback(async()=>{
    if(demo||!uid)return;
    try{
      const{data:mis,error}=await supabase.from("miembros").select("*").eq("user_id",uid);
      if(error)throw error;
      if(!mis.length){setEstado("sin-clinica");return;}
      const yo=mis[0];
      if(!yo.activo){setEstado("desactivado");return;}
      const c=yo.clinica_id;
      const[{data:cl,error:e1},{data:ms,error:e2},ps,cs,ts]=await Promise.all([
        supabase.from("clinicas").select("*").eq("id",c).single(),
        supabase.from("miembros").select("*").eq("clinica_id",c).order("creado_en"),
        leerTodo("pacientes",c),leerTodo("citas",c),leerTodo("tareas",c),
      ]);
      if(e1||e2)throw(e1||e2);
      // Suscripción (si la tabla aún no existe, se sigue como prueba)
      const{data:sus}=await supabase.from("suscripciones").select("*").eq("clinica_id",c).maybeSingle().then(r=>r,()=>({data:null}));
      setSuscripcion(sus||null);
      setCurrentUser(yo);setCurrentClinica(cl);setProfesionales(ms);
      cargarPatients(ps.map(r=>({...mkPatient(),...r.datos,id:Number(r.id),profesionalId:r.profesional_id})));
      cargarCitas(cs.map(r=>({...r.datos,id:Number(r.id),profesionalId:r.profesional_id})));
      cargarTareas(ts.map(r=>({...r.datos,id:Number(r.id)})));
      cargarTipos(cl.config?.tipos||DEFAULT_TIPOS_CITA);
      cargarHorario(cl.config?.horario||{start:WORK_START,end:WORK_END});
      setEstado("listo");
    }catch(e){console.error(e);setEstado("error");}
  },[demo,uid]);

  useEffect(()=>{
    if(demo)return;
    if(uid){
      setEstado("cargando");
      // Con verificación en dos pasos activada, primero se pide el código
      supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        .then(({data})=>{if(data?.nextLevel==="aal2"&&data.currentLevel!=="aal2")setEstado("mfa");else cargarTodo();},()=>cargarTodo());
    }
    else{setCurrentUser(null);setCurrentClinica(null);setProfesionales([]);cargarPatients([]);cargarCitas([]);cargarTareas([]);setEstado("cargando");}
  },[uid]);

  // Guardado automático de cada cambio
  const guardar=async fn=>{
    setPendientes(n=>n+1);
    try{await fn();}
    catch(e){
      console.error(e);
      const permiso=e?.code==="42501"||/permiso|row-level/i.test(e?.message||"");
      setAviso(permiso?"No tienes permiso para hacer ese cambio. Se ha deshecho.":"No se ha podido guardar. Revisa tu conexión: se han recargado los datos.");
      cargarTodo();
    }finally{setPendientes(n=>n-1);}
  };
  if(!demo&&cid){
    const ahora=()=>new Date().toISOString();
    cambioPatients.current=(prev,next)=>guardar(()=>sincronizar("pacientes",cid,prev,next,p=>({clinica_id:cid,id:p.id,profesional_id:p.profesionalId||miId,datos:p,actualizado_en:ahora()})));
    cambioCitas.current=(prev,next)=>guardar(()=>sincronizar("citas",cid,prev,next,ci=>{
      const pac=patientsRef.current.find(p=>p.id==ci.pacienteId);
      return{clinica_id:cid,id:ci.id,profesional_id:pac?.profesionalId||ci.profesionalId||miId,fecha:ci.fecha,datos:ci,actualizado_en:ahora()};
    }));
    cambioTareas.current=(prev,next)=>guardar(()=>sincronizar("tareas",cid,prev,next,t=>({clinica_id:cid,id:t.id,datos:t})));
    const guardarConfig=()=>guardar(async()=>{
      const nueva={...(currentClinica.config||{}),tipos:tiposRef.current,horario:horarioRef.current};
      const{data,error}=await supabase.from("clinicas").update({config:nueva}).eq("id",cid).select("id");
      if(error)throw error;
      if(!data.length)throw new Error("Sin permiso");
      setCurrentClinica(c=>({...c,config:nueva}));
    });
    const soloAdmin=(cargar)=>(prev)=>{if(!esAdmin){cargar(prev);setAviso("Solo el administrador puede cambiar la configuración de la clínica.");return;}guardarConfig();};
    cambioTipos.current=soloAdmin(cargarTipos);
    cambioHorario.current=soloAdmin(cargarHorario);
  }
  useEffect(()=>{
    const h=e=>{if(pendientes>0){e.preventDefault();e.returnValue="";}};
    window.addEventListener("beforeunload",h);return()=>window.removeEventListener("beforeunload",h);
  },[pendientes]);
  // Registro de accesos: cada vez que se abre una ficha (lo comprueba la base de datos)
  const registrarVista=useCallback(id=>{if(!demo&&cid)supabase.rpc("registrar_vista",{p_clinica:cid,p_paciente:id}).then(()=>{},()=>{});},[demo,cid]);
  const cerrarSesion=async()=>{if(demo){window.location.href="/";return;}await supabase.auth.signOut();};
  const[page,setPage]=useState("dashboard");
  const plan=estadoPlan({clinica:currentClinica,suscripcion,demo});
  const noraActiva=IA_VISIBLE&&!currentClinica?.config?.nora_desactivada;
  planRef.current=plan;
  const verPlanes=()=>{setAbrirPlanes(true);setPage("admin");setSelectedId(null);};
  // Vuelta desde la página de pago de Stripe
  useEffect(()=>{
    if(demo)return;
    const q=new URLSearchParams(window.location.search).get("pago");
    if(!q)return;
    window.history.replaceState(null,"",window.location.pathname);
    if(q==="ok"){setAviso("¡Pago recibido! Tu plan se activa en unos segundos.");setTimeout(()=>cargarTodo(),4000);}
  },[demo,cargarTodo]);
  const[menuMovil,setMenuMovil]=useState(false);
  const[selectedId,setSelectedId]=useState(null);
  const[showInforme,setShowInforme]=useState(false);
  const[editCitaDash,setEditCitaDash]=useState(null);
  const[editTareaDash,setEditTareaDash]=useState(null);
  const[newCitaDash,setNewCitaDash]=useState(false);
  const[noraAbierta,setNoraAbierta]=useState(false);
  const[showVideo,setShowVideo]=useState(false);
  const[autoNewPaciente,setAutoNewPaciente]=useState(false);
  const[globalSearch,setGlobalSearch]=useState("");
  const[showNotifs,setShowNotifs]=useState(false);
  const[dismissedNotifs,setDismissedNotifs]=useState(new Set());
  const dismissNotif=id=>setDismissedNotifs(s=>new Set([...s,id]));
  const dismissAll=()=>setDismissedNotifs(new Set(notifs.map(n=>n.id)));

  const[reminders,setReminders]=useReminders(citas,patients);
  const selectedPatient=patients.find(p=>p.id===selectedId);
  const selectPatient=id=>{setSelectedId(id);setPage("ficha");};
  const goBack=()=>{setSelectedId(null);setPage("pacientes");};

  // Notificaciones — calculadas después de todos los estados
  const hoyStr=toYMD(today());
  const notifs=[
    ...tareas.filter(t=>!t.hecho&&t.fecha<hoyStr).map(t=>({id:`t-${t.id}`,tipo:"tarea",color:C.red,bg:C.rD,msg:`Tarea vencida: "${t.titulo||t.texto}"`})),
    ...patients.filter(p=>p.estado==="activo"&&!p.consentimiento).map(p=>({id:`c-${p.id}`,tipo:"consentimiento",color:C.amber,bg:C.amD,msg:`${p.nombre} ${p.apellidos} — consentimiento pendiente`})),
  ];
  if(!demo){
    if(!authListo)return <PantallaEstado titulo="Cargando…"/>;
    if(recuperando&&session)return <Acceso recuperando onPasswordCambiada={()=>setRecuperando(false)}/>;
    if(!session)return <Acceso/>;
    if(estado==="mfa")return <PasoDos onListo={()=>{setEstado("cargando");cargarTodo();}} onSalir={cerrarSesion}/>;
    if(estado==="sin-clinica")return <Onboarding session={session} onListo={()=>{setEstado("cargando");cargarTodo();}}/>;
    if(estado==="desactivado")return <PantallaEstado titulo="Cuenta desactivada" texto="El administrador de tu clínica ha desactivado tu acceso. Si crees que es un error, contacta con él." accion={<Enlace onClick={cerrarSesion}>Cerrar sesión</Enlace>}/>;
    if(estado==="error")return <PantallaEstado titulo="No se han podido cargar los datos" texto="Puede ser un problema de conexión o que la base de datos todavía no esté configurada." accion={<><button style={st.btn()} onClick={()=>{setEstado("cargando");cargarTodo();}}>Reintentar</button><div style={{marginTop:14}}><Enlace onClick={cerrarSesion}>Cerrar sesión</Enlace></div></>}/>;
    if(estado!=="listo"||!currentUser)return <PantallaEstado titulo="Cargando tu clínica…"/>;
  }
  return(
    <DemoCtx.Provider value={demo}>
    <EquipoCtx.Provider value={{noraActiva,abrirNora:noraActiva?()=>setNoraAbierta(true):null,preferenciasNora:currentUser.preferencias_nora,miNombre:currentUser.nombre,clinicaNombre:currentClinica?.nombre,esAdmin:currentUser.rol==="admin",miembros:profesionales,miId:currentUser.id,registrarVista,guardarMisDatosFact:d=>{setCurrentUser(u=>({...u,datos_facturacion:d}));setProfesionales(ms=>ms.map(m=>m.id===currentUser.id?{...m,datos_facturacion:d}:m));}}}>
    <div style={st.app} className="praxi-app">
      {/* Móvil: barra superior con menú (en ordenador no se ve) */}
      <div className="praxi-topbar">
        <button aria-label="Abrir menú" onClick={()=>setMenuMovil(true)} style={{background:"none",border:"none",fontSize:22,color:C.walnut,cursor:"pointer",padding:"4px 8px"}}>☰</button>
        <img src={PRAXI_LOGO} alt="praXi" style={{height:30,display:"block"}}/>
        <button aria-label="Notificaciones" onClick={()=>setShowNotifs(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0?C.amber:C.muted,padding:"4px 8px"}}>🔔</button>
      </div>
      {menuMovil&&<div className="praxi-velo" onClick={()=>setMenuMovil(false)}/>}
      {aviso&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:400,background:C.red,color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,boxShadow:"0 8px 24px rgba(34,22,16,0.25)",maxWidth:"90vw"}}>{aviso}</div>}
      {pendientes>0&&<div style={{position:"fixed",bottom:16,left:16,zIndex:300,background:C.bone,border:`1px solid ${C.border}`,color:C.muted,padding:"6px 12px",borderRadius:8,fontSize:12}}>Guardando…</div>}
      {demoToast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:400,background:C.ink,color:C.bone,padding:"10px 18px",borderRadius:10,fontSize:13,boxShadow:"0 8px 24px rgba(34,22,16,0.25)"}}>Estás en la demo: los cambios no se guardan</div>}
      {reminders.length>0&&<div className="praxi-avisos" style={{position:"fixed",bottom:16,right:16,zIndex:200,display:"flex",flexDirection:"column",gap:8}}>{reminders.map(r=><div key={r.id} style={{background:r.type==="soon"?C.rD:C.amD,border:`1px solid ${r.type==="soon"?C.red:C.amber}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:r.type==="soon"?C.red:C.amber,display:"flex",gap:10,alignItems:"center",maxWidth:340,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}><span style={{flex:1}}>{r.msg}</span><button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:14}}>✕</button></div>)}</div>}

      {/* Panel de notificaciones — fixed dentro del área principal */}
      {showNotifs&&(
        <div className="praxi-notifs" style={{position:"fixed",top:0,left:220,right:0,bottom:0,zIndex:250}} onClick={()=>setShowNotifs(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:16,left:16,width:360,maxWidth:"calc(100vw - 32px)",background:C.bone,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 8px 32px rgba(59,42,30,0.16)",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.sand}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>
                Notificaciones {notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0&&`(${notifs.filter(n=>!dismissedNotifs.has(n.id)).length})`}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {notifs.some(n=>!dismissedNotifs.has(n.id))&&(
                  <button onClick={dismissAll} style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Borrar todas</button>
                )}
                <button onClick={()=>setShowNotifs(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
              </div>
            </div>
            {notifs.filter(n=>!dismissedNotifs.has(n.id)).length===0&&(
              <div style={{padding:"24px 16px",fontSize:13,color:C.muted,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:8}}>✓</div>
                Sin notificaciones pendientes
              </div>
            )}
            {notifs.filter(n=>!dismissedNotifs.has(n.id)).map(n=>(
              <div key={n.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{n.tipo==="tarea"?"⏰":"⚠"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:n.color,lineHeight:1.5}}>{n.msg}</div>
                </div>
                <button onClick={()=>dismissNotif(n.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.dim,flexShrink:0,marginTop:1}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={st.sidebar} className={`praxi-sidebar${menuMovil?" abierto":""}`} onClick={e=>{if(e.target.closest("[data-nav]"))setMenuMovil(false);}}>
        <div style={{...st.sidebarBrand,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <img src={PRAXI_LOGO} alt="praXi" style={{height:38,display:"block"}}/>
          </div>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowNotifs(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0?C.amber:C.muted,position:"relative"}}>
              🔔
              {notifs.filter(n=>!dismissedNotifs.has(n.id)).length>0&&<span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.red,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{notifs.filter(n=>!dismissedNotifs.has(n.id)).length}</span>}
            </button>
          </div>
        </div>

        {/* Búsqueda global spotlight */}
        <div style={{padding:"0 14px 12px",position:"relative"}}>
          <input
            style={{...st.input,fontSize:12,background:C.card}}
            placeholder="Buscar..."
            value={globalSearch}
            onChange={e=>setGlobalSearch(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Escape"){setGlobalSearch("");}
            }}
          />
          {globalSearch&&(()=>{
            const q=globalSearch.toLowerCase();
            const results=[];

            // Pacientes
            patients.filter(p=>`${p.nombre} ${p.apellidos}`.toLowerCase().includes(q)||p.telefono?.includes(q)||p.email?.toLowerCase().includes(q)).slice(0,5).forEach(p=>
              results.push({id:`p-${p.id}`,tipo:"Paciente",icon:"👤",label:`${p.nombre} ${p.apellidos}`,sub:`${p.sesiones.length} sesiones · ${p.estado}`,action:()=>{selectPatient(p.id);setGlobalSearch("");}})
            );

            // Páginas
            [["dashboard","Dashboard","📊"],["calendario","Calendario","📅"],["pacientes","Pacientes","👥"],["facturas","Facturas","🧾"],["recursos","Recursos","📚"],["admin","Administración","⚙"]].filter(([,label])=>label.toLowerCase().includes(q)).forEach(([id,label,icon])=>
              results.push({id:`nav-${id}`,tipo:"Sección",icon,label,sub:"Ir a "+label,action:()=>{setPage(id);setSelectedId(null);setGlobalSearch("");}})
            );

            // Facturas
            patients.flatMap(p=>p.sesiones.map(s=>({...s,paciente:`${p.nombre} ${p.apellidos}`,pid:p.id}))).filter(s=>s.factura?.toLowerCase().includes(q)||s.paciente.toLowerCase().includes(q)).slice(0,3).forEach(s=>
              results.push({id:`f-${s.id}`,tipo:"Factura",icon:"🧾",label:s.factura,sub:`${s.paciente} · ${s.pago}€ · ${s.pagado?"Pagada":"Pendiente"}`,action:()=>{setPage("facturas");setGlobalSearch("");}})
            );

            // Citas
            citas.filter(c=>{const p=patients.find(p=>p.id==c.pacienteId);const name=c.origen==="calendly"?(c.nombreExterno||""):(p?`${p.nombre} ${p.apellidos}`:"");return name.toLowerCase().includes(q)||c.fecha?.includes(q)||c.tipo?.toLowerCase().includes(q);}).slice(0,3).forEach(c=>{
              const p=patients.find(p=>p.id==c.pacienteId);
              const name=c.origen==="calendly"?(c.nombreExterno||"Calendly"):(p?`${p.nombre} ${p.apellidos}`:"?");
              results.push({id:`c-${c.id}`,tipo:"Cita",icon:"📅",label:name,sub:`${c.fecha} · ${c.hora} · ${c.tipo||"Cita"}`,action:()=>{setPage("calendario");setGlobalSearch("");}});
            });

            if(results.length===0) return(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bone,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(59,42,30,0.12)",zIndex:200,padding:"14px",fontSize:12,color:C.muted,textAlign:"center"}}>Sin resultados</div>
            );

            // Group by tipo
            const grupos={};
            results.forEach(r=>{if(!grupos[r.tipo])grupos[r.tipo]=[];grupos[r.tipo].push(r);});

            return(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C.bone,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(59,42,30,0.12)",zIndex:200,maxHeight:340,overflowY:"auto"}}>
                {Object.entries(grupos).map(([tipo,items])=>(
                  <div key={tipo}>
                    <div style={{padding:"6px 12px 2px",fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{tipo}</div>
                    {items.map(r=>(
                      <div key={r.id} onClick={r.action} style={{padding:"8px 12px",cursor:"pointer",display:"flex",gap:10,alignItems:"center",borderRadius:6,margin:"1px 4px"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.sand}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <span style={{fontSize:14,flexShrink:0}}>{r.icon}</span>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                          <div style={{fontSize:11,color:C.muted}}>{r.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {[["dashboard","Dashboard"],["calendario","Calendario"],["pacientes","Pacientes"],["facturas","Facturas"],["recursos","Recursos"]].map(([id,label])=>{
          const badge=id==="pacientes"?patients.filter(p=>!p.consentimiento&&p.estado==="activo").length:0;
          return(
            <div key={id} data-nav style={{...st.navItem(page===id||(id==="pacientes"&&page==="ficha")),justifyContent:"space-between"}} onClick={()=>{setPage(id);setSelectedId(null);}}>
              <span>▪ {label}</span>
              {badge>0&&<span style={{...st.badge(C.amber,C.amD),fontSize:9}}>{badge}</span>}
            </div>
          );
        })}
        {currentUser.rol==="admin"&&(
          <div data-nav style={st.navItem(page==="admin")} onClick={()=>setPage("admin")}>▪ Equipo</div>
        )}
        
        <div style={{marginTop:16,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <div data-nav style={st.navItem(page==="configuracion")} onClick={()=>setPage("configuracion")}>▪ Configuración</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:currentUser.color||C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>{currentUser.nombre[0]}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.nombre}</div>
              <div style={{fontSize:10,color:C.muted}}>{currentUser.especialidad||currentUser.rol}</div>
            </div>
          </div>
          <div style={{fontSize:11,color:C.dim,marginBottom:6,padding:"4px 8px",background:C.sand,borderRadius:6}}>{currentClinica?.nombre}</div>
          <button style={{...st.btn("ghost"),fontSize:11,color:currentUser.enlace_videollamada?C.muted:C.accent,textAlign:"left",padding:"4px 0"}} onClick={()=>setShowVideo(true)}>🎥 Mi videollamada{currentUser.enlace_videollamada?"":" · sin configurar"}</button>
          <button style={{...st.btn("ghost"),marginTop:4,fontSize:11,color:C.muted,textAlign:"left",padding:"4px 0"}} onClick={cerrarSesion}>🔒 {demo?"Salir de la demo":"Cerrar sesión"}</button>
        </div>
      </div>
      <div style={st.main} className="praxi-main">
        {demo&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",background:C.sand,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",marginBottom:20,fontSize:13,color:C.walnut}}>
          <span><strong style={{color:C.accent}}>Modo demo</strong> · Navega por todas las secciones con pacientes de ejemplo. Los cambios no se guardan.</span>
          <a href="/" style={{...st.btn("sm"),textDecoration:"none"}}>Solicitar acceso</a>
        </div>}
        {!demo&&<BannerPlan plan={plan} esAdmin={esAdmin} onVerPlanes={verPlanes}/>}
        {!demo&&esAdmin&&!copiaLuego&&page==="dashboard"&&currentClinica&&<AvisoCopia clinica={currentClinica} onCerrar={()=>setCopiaLuego(true)} onIr={()=>{setPage("admin");setSelectedId(null);setTimeout(()=>document.getElementById("descargar-copia")?.scrollIntoView({behavior:"smooth",block:"center"}),300);}}/>}
        {page==="dashboard"&&<Dashboard tipos={tipos} patients={patients} setPatients={setPatients} clinica={currentClinica} yo={currentUser} esAdmin={esAdmin} demo={demo} onIr={id=>{setPage(id);setSelectedId(null);}} onVideo={()=>setShowVideo(true)} citas={citas} setCitas={setCitas} tareas={tareas} setTareas={setTareas} onInforme={()=>setShowInforme(true)} onEditCita={c=>setEditCitaDash(c)} onEditTarea={t=>setEditTareaDash(t)} onNuevaCita={()=>setNewCitaDash(true)} onAgendar={id=>setNewCitaDash({pacienteId:id})} onAbrirPaciente={selectPatient} horario={horario} onNuevoPaciente={()=>{setAutoNewPaciente(true);setPage("pacientes");}} onVerCalendario={()=>setPage("calendario")}/>}
        {page==="calendario"&&<Calendario patients={patients} citas={citas} setCitas={setCitas} config={config} setConfig={setConfig} tipos={tipos} horario={horario} tareas={tareas} setTareas={setTareas}/>}
        {page==="pacientes"&&<Pacientes patients={patients} setPatients={setPatients} onSelect={selectPatient} autoNew={autoNewPaciente} onAutoNewDone={()=>setAutoNewPaciente(false)}/>}
        {page==="ficha"&&selectedPatient&&<FichaPaciente patient={selectedPatient} setPatients={setPatients} onBack={goBack} citas={citas} setCitas={setCitas} profesionales={profesionales} tipos={tipos}/>}
        {page==="facturas"&&<Facturas patients={patients} setPatients={setPatients}/>}
        {page==="recursos"&&<Recursos patients={patients} citas={citas} clinica={currentClinica} yo={currentUser}/>}
        {page==="admin"&&currentUser.rol==="admin"&&<EquipoPanel onClinica={setCurrentClinica} plan={plan} suscripcion={suscripcion} abrirPlanes={abrirPlanes} clinica={currentClinica} miembros={profesionales} yo={currentUser} patients={patients} citas={citas} demo={demo} onCambio={cargarTodo} bloquearDemo={()=>setDemoToast(true)} setAviso={setAviso} onBorrada={cerrarSesion}/>}
        {page==="configuracion"&&<Configuracion demo={demo} esAdmin={currentUser.rol==="admin"} horario={horario} setHorario={setHorario} tipos={tipos} setTipos={setTipos} preferenciasNora={currentUser.preferencias_nora} onNoraGuardada={p=>setCurrentUser(u=>({...u,preferencias_nora:p}))}/>}
      </div>
      {!demo&&esAdmin&&!terminosLuego&&currentClinica&&currentClinica.terminos_version!==VERSION_TERMINOS&&<NuevosTerminos version={VERSION_TERMINOS} onLuego={()=>setTerminosLuego(true)} onAceptados={v=>setCurrentClinica(c=>({...c,terminos_version:v}))}/>}
      {avisoPlan&&<AvisoPlan tipo={avisoPlan} esAdmin={esAdmin} onVerPlanes={verPlanes} onClose={()=>setAvisoPlan(null)}/>}
      {showInforme&&<InformeMensual patients={patients} citas={citas} onClose={()=>setShowInforme(false)}/>}
      {editCitaDash&&<CitaModal cita={editCitaDash} patients={patients} tipos={tipos} defaultFecha={editCitaDash.fecha} defaultHora={editCitaDash.hora} defaultTipoId={editCitaDash.tipoId} makeUrl={config.makeOut} onClose={()=>setEditCitaDash(null)} onSave={form=>{setCitas(cs=>cs.map(c=>c.id===form.id?{...c,...form}:c));setEditCitaDash(null);}} onDelete={id=>{setCitas(cs=>cs.filter(c=>c.id!==id));setEditCitaDash(null);}}/>}
      {showVideo&&<MiVideollamadaModal yo={currentUser} demo={demo} onClose={()=>setShowVideo(false)} onDemo={()=>{setShowVideo(false);setDemoToast(true);}}
        onGuardado={e=>{setCurrentUser(u=>({...u,enlace_videollamada:e}));setProfesionales(ms=>ms.map(m=>m.id===currentUser.id?{...m,enlace_videollamada:e}:m));setShowVideo(false);}}/>}
      {newCitaDash&&<CitaModal cita={null} defaultPacienteId={newCitaDash?.pacienteId} patients={patients} tipos={tipos} defaultFecha={newCitaDash?.fecha||toYMD(today())} defaultHora={newCitaDash?.hora||"09:00"} defaultTipoId={newCitaDash?.tipoId||tipos[0]?.id} makeUrl={config.makeOut} onClose={()=>setNewCitaDash(false)} onSave={form=>{setCitas(cs=>[...cs,{...form,id:Date.now(),pacienteId:form.pacienteId?Number(form.pacienteId):null}]);setNewCitaDash(false);}} onDelete={()=>setNewCitaDash(false)}/>}
      {noraActiva&&<NoraGlobal abierta={noraAbierta} setAbierta={setNoraAbierta} pagina={page} patients={patients} citas={citas} tareas={tareas} horario={horario} tipos={tipos} setCitas={setCitas} setTareas={setTareas} onNuevaCita={c=>setNewCitaDash(c)} onEditarCita={c=>setEditCitaDash(c)}/>}
      {editTareaDash&&<TareaModal tarea={editTareaDash} onClose={()=>setEditTareaDash(null)} onSave={t=>{setTareas(ts=>ts.map(x=>x.id===t.id?t:x));setEditTareaDash(null);}} onDelete={id=>{setTareas(ts=>ts.filter(t=>t.id!==id));setEditTareaDash(null);}}/>}
    </div>
    </EquipoCtx.Provider>
    </DemoCtx.Provider>
  );
}
