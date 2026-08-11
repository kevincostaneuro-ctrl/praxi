import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#F5EFE4", bone: "#FBF8F1", sand: "#E2D9C8",
  border: "#D9C9A8", accent: "#A66B3F", walnut: "#6B4A30",
  ink: "#221610", text: "#3B2A1E", muted: "#9A7E68",
  dim: "#B8A898", green: "#4A6438", gD: "#E8EFE2",
};

const FEATURES = [
  { icon: "🧠", title: "IA clínica contextual", desc: "El asistente conoce la historia, evolución y formulación de cada paciente. Redacta notas, genera informes de derivación y analiza el caso en segundos." },
  { icon: "📋", title: "Ficha clínica estructurada", desc: "Historia clínica, formulación de caso por áreas (sueño, familia, trabajo, hábitos), evolución sesión a sesión y seguimiento de objetivos terapéuticos." },
  { icon: "📅", title: "Agenda con videollamada", desc: "Calendario semanal y diario con videollamada integrada. Recordatorios automáticos por WhatsApp. Sin aplicaciones externas." },
  { icon: "🧾", title: "Facturación automática", desc: "Genera facturas PDF con un clic, controla pagos pendientes y obtén informes financieros mensuales listos para tu gestor." },
  { icon: "💬", title: "WhatsApp automático", desc: "Recordatorios de cita enviados automáticamente desde una cuenta de Praxi. Sin configuración, sin costes extra por mensaje." },
  { icon: "👥", title: "Gestión multi-profesional", desc: "Agenda compartida entre profesionales, pacientes asignados por especialista y panel de administración para el coordinador de la clínica." },
  { icon: "🔒", title: "Cumplimiento RGPD", desc: "Datos sanitarios cifrados, hosting en Europa y acuerdos de procesamiento de datos con todos los proveedores. Conforme a la normativa española." },
  { icon: "📊", title: "Informe mensual", desc: "Resumen automático de actividad clínica y financiera cada mes. Listo para revisar en un minuto y compartir con tu asesoría." },
  { icon: "📱", title: "Acceso desde cualquier dispositivo", desc: "Funciona en ordenador, tablet y móvil desde el navegador. Sin instalaciones, siempre actualizado, siempre disponible." },
  { icon: "📆", title: "Agenda pública de reservas", desc: "Tus pacientes pueden reservar cita directamente desde tu enlace público. Sin llamadas, sin gestión manual. Tú confirmas con un clic." },
];

const PLANES = [
  { nombre: "Básico", precio: "9,99€", desc: "Para empezar", destacado: false, features: ["Hasta 15 pacientes", "Agenda y calendario", "Historia clínica", "Facturación PDF"] },
  { nombre: "Pro", precio: "29,99€", desc: "Para consultas activas", destacado: true, features: ["Pacientes ilimitados", "Asistente IA", "WhatsApp automático", "Videollamada integrada", "Informes con IA"] },
  { nombre: "Clínica", precio: "60€", desc: "Para equipos", destacado: false, features: ["Hasta 3 profesionales", "Todo lo del plan Pro", "Agenda multi-profesional", "Panel de administración"] },
];



const Logo = ({ size = 22, textColor = C.ink }) => (
  <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1, gap: 0 }}>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size, color: textColor, letterSpacing: "-0.5px" }}>pra</span>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size * 1.18, color: C.accent, letterSpacing: "-0.5px", lineHeight: 0.9, marginLeft: 2 }}>X</span>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size, color: textColor, letterSpacing: "-0.5px" }}>i</span>
    <span style={{ display: "inline-block", width: size * 0.27, height: size * 0.27, borderRadius: "50%", background: C.accent, marginLeft: size * 0.45, marginBottom: size * 0.13, flexShrink: 0 }} />
  </div>
);


function Demo() {
  const [active, setActive] = useState("dashboard");
  const C2 = { bg:"#F5EFE4",bone:"#FBF8F1",border:"#D9C9A8",accent:"#A66B3F",walnut:"#6B4A30",ink:"#221610",muted:"#9A7E68",sand:"#E2D9C8",green:"#4A6438",teal:"#4A7B6B" };
  const navItems = [["dashboard","Dashboard"],["calendario","Calendario"],["pacientes","Pacientes"],["ficha","↳ Ficha paciente"],["facturas","Facturas"],["recursos","Recursos"]];

  return (
    <section style={{maxWidth:1000,margin:"0 auto 90px",padding:"0 48px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",lineHeight:1,marginBottom:6}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:C2.ink,letterSpacing:"-0.5px"}}>Explora las diferentes secciones de pra</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:21,color:C2.accent,letterSpacing:"-0.5px",lineHeight:0.9,marginLeft:2}}>X</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:C2.ink,letterSpacing:"-0.5px"}}>i</span>
          <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:C2.accent,marginLeft:9,marginBottom:3}}/>
        </div>
      </div>
      <div style={{background:C2.ink,borderRadius:20,overflow:"hidden",boxShadow:"0 40px 80px rgba(34,22,16,0.2)"}}>
        <div style={{background:"#1A0E08",padding:"10px 16px",display:"flex",gap:6,alignItems:"center"}}>
          {["#FF5F57","#FFBD2E","#28CA41"].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:"50%",background:c}}/>)}
          <div style={{flex:1,background:"#2A1E18",borderRadius:6,height:22,margin:"0 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:10,color:"#6B4A30"}}>praxi-kevin-8beb.vercel.app/app</span>
          </div>
        </div>
        <div style={{display:"flex",height:540}}>
          {/* Sidebar */}
          <div style={{width:190,background:C2.bg,borderRight:`1px solid ${C2.border}`,flexShrink:0,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C2.border}`,marginBottom:6}}>
              <div style={{display:"flex",alignItems:"flex-end",lineHeight:1}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15,color:C2.accent}}>pra</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:C2.accent,lineHeight:0.9,marginLeft:1}}>X</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15,color:C2.accent}}>i</span>
                <span style={{display:"inline-block",width:4,height:4,borderRadius:"50%",background:C2.accent,marginLeft:6,marginBottom:2}}/>
              </div>
              <div style={{fontSize:7,color:C2.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:2}}>gestión clínica</div>
            </div>
            {navItems.map(([id,label])=>(
              <div key={id} onClick={()=>setActive(id)} style={{padding:id==="ficha"?"5px 16px 5px 28px":"7px 16px",fontSize:id==="ficha"?10:11,cursor:"pointer",color:active===id?C2.accent:C2.muted,fontWeight:active===id?600:400,background:active===id?"rgba(166,107,63,0.1)":"transparent",transition:"all 0.15s"}}>
                {label}
              </div>
            ))}
            <div style={{marginTop:"auto",padding:"10px 16px",borderTop:`1px solid ${C2.border}`,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:C2.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:C2.bone}}>K</div>
              <div><div style={{fontSize:10,fontWeight:600,color:C2.ink}}>Kevin Costa</div><div style={{fontSize:8,color:C2.muted}}>Neuropsicólogo</div></div>
            </div>
          </div>

          {/* Content */}
          <div style={{flex:1,background:C2.bg,overflowY:"auto",padding:20}}>

            {active==="dashboard"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C2.ink,fontStyle:"italic",marginBottom:4}}>Dashboard</div>
              <div style={{fontSize:10,color:C2.muted,marginBottom:14}}>Lunes, 11 de agosto de 2026</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[["15","Pacientes activos"],["5","Citas hoy"],["830€","Cobrado mes"],["320€","Pendiente"]].map(([v,l],i)=>(
                  <div key={i} style={{background:C2.bone,borderRadius:10,padding:"10px 12px",border:`1px solid ${C2.border}`}}>
                    <div style={{fontSize:19,fontWeight:700,color:C2.accent}}>{v}</div>
                    <div style={{fontSize:9,color:C2.muted,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:C2.bone,borderRadius:10,padding:12,border:`1px solid ${C2.border}`,marginBottom:10}}>
                <div style={{fontSize:9,color:C2.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:10}}>Citas de hoy</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
                  {[["09:00","María González","60min",false],["10:00","Primera llamada","30min",true],["11:00","Carlos Ruiz","60min",false],["12:00","Laura Sánchez","90min",false],["16:00","Miguel García","60min",false]].map(([h,n,d,cal],i)=>(
                    <div key={i} style={{padding:7,background:C2.bg,borderRadius:8,border:`1px solid ${C2.border}`}}>
                      <div style={{fontSize:9,color:cal?C2.teal:C2.muted}}>{h}{cal?" · Calendly":""}</div>
                      <div style={{fontSize:10,fontWeight:600,color:C2.ink}}>{n}</div>
                      <div style={{fontSize:9,color:C2.muted}}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:10}}>
                <div style={{background:C2.bone,borderRadius:10,padding:12,border:`1px solid ${C2.border}`}}>
                  <div style={{fontSize:9,color:C2.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:8}}>Agenda personal</div>
                  {[["Supervisión clínica","15:00","#B85040"],["Enviar informe derivación","Mañana","#C48C2A"],["Formación EMDR","Viernes","#4A6438"]].map(([t,h,c],i)=>(
                    <div key={i} style={{display:"flex",gap:7,alignItems:"center",marginBottom:6}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:c,flexShrink:0}}/>
                      <div style={{fontSize:10,color:C2.ink,flex:1}}>{t}</div>
                      <div style={{fontSize:9,color:C2.muted}}>{h}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:C2.bone,borderRadius:10,padding:12,border:`1px solid ${C2.border}`}}>
                  <div style={{fontSize:9,color:C2.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:8}}>✦ Asistente IA</div>
                  <div style={{fontSize:10,color:C2.muted,lineHeight:1.6,fontStyle:"italic"}}>"Laura lleva 5 sesiones — considera revisar objetivos en la próxima."</div>
                </div>
              </div>
            </div>}

            {active==="calendario"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C2.ink,fontStyle:"italic",marginBottom:12}}>Calendario semanal</div>
              <div style={{background:C2.bone,borderRadius:10,border:`1px solid ${C2.border}`,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"40px repeat(7,1fr)",borderBottom:`1px solid ${C2.border}`}}>
                  <div style={{background:C2.bg}}/>
                  {[["Lun","11",true],["Mar","12",true],["Mié","13",false],["Jue","14",true],["Vie","15",true],["Sáb","16",false],["Dom","17",false]].map(([d,n,has],i)=>(
                    <div key={i} style={{padding:"7px 3px",textAlign:"center",background:i===0?"rgba(166,107,63,0.08)":"transparent",borderLeft:`1px solid ${C2.border}`}}>
                      <div style={{fontSize:8,color:i===0?C2.accent:C2.muted,textTransform:"uppercase",fontWeight:i===0?600:400}}>{d}</div>
                      <div style={{fontSize:14,fontWeight:i===0?700:400,color:i===0?C2.accent:C2.ink}}>{n}</div>
                      {has&&<div style={{width:4,height:4,borderRadius:"50%",background:C2.accent,margin:"2px auto 0"}}/>}
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"40px repeat(7,1fr)",height:320}}>
                  <div style={{display:"flex",flexDirection:"column"}}>
                    {["09","10","11","12","13","14","15","16"].map(h=>(
                      <div key={h} style={{flex:1,padding:"3px 5px",fontSize:8,color:C2.muted,borderBottom:`1px solid ${C2.sand}`,textAlign:"right"}}>{h}:00</div>
                    ))}
                  </div>
                  <div style={{borderLeft:`1px solid ${C2.border}`,position:"relative",background:"rgba(166,107,63,0.02)"}}>
                    <div style={{position:"absolute",top:2,left:2,right:2,background:"rgba(166,107,63,0.15)",border:`1px solid ${C2.accent}`,borderRadius:4,padding:"2px 4px"}}><div style={{fontSize:8,fontWeight:600,color:C2.accent}}>09:00 María G.</div></div>
                    <div style={{position:"absolute",top:42,left:2,right:2,background:"rgba(74,123,107,0.12)",border:`1px solid ${C2.teal}`,borderRadius:4,padding:"2px 4px"}}><div style={{fontSize:8,fontWeight:600,color:C2.teal}}>10:00 Calendly</div></div>
                    <div style={{position:"absolute",top:82,left:2,right:2,background:"rgba(166,107,63,0.15)",border:`1px solid ${C2.accent}`,borderRadius:4,padding:"2px 4px"}}><div style={{fontSize:8,fontWeight:600,color:C2.accent}}>11:00 Carlos R.</div></div>
                    <div style={{position:"absolute",top:122,left:2,right:2,height:56,background:"rgba(166,107,63,0.15)",border:`1px solid ${C2.accent}`,borderRadius:4,padding:"2px 4px"}}><div style={{fontSize:8,fontWeight:600,color:C2.accent}}>12:00 Laura S. 90min</div></div>
                    <div style={{position:"absolute",top:282,left:2,right:2,background:"rgba(166,107,63,0.15)",border:`1px solid ${C2.accent}`,borderRadius:4,padding:"2px 4px"}}><div style={{fontSize:8,fontWeight:600,color:C2.accent}}>16:00 Miguel G.</div></div>
                  </div>
                  {[1,2,3,4,5,6].map(i=><div key={i} style={{borderLeft:`1px solid ${C2.border}`,position:"relative"}}/>)}
                </div>
              </div>
            </div>}

            {active==="pacientes"&&<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C2.ink,fontStyle:"italic"}}>Pacientes</div>
                <input placeholder="Buscar..." style={{border:`1px solid ${C2.border}`,borderRadius:8,padding:"5px 10px",fontSize:10,background:C2.bone,color:C2.muted,outline:"none",width:140}}/>
              </div>
              <div style={{background:C2.bone,borderRadius:10,border:`1px solid ${C2.border}`,overflow:"hidden"}}>
                {[["M","María González López","Ansiedad generalizada","4 sesiones",false],["C","Carlos Ruiz Martínez","Depresión mayor","3 sesiones",false],["A","Ana Martínez Vega","Fobia social","3 sesiones",false],["J","Javier Fernández","Trastorno adaptativo","3 sesiones",false],["L","Laura Sánchez","TCA restricción","5 sesiones",false],["P","Pedro López","TOC","3 sesiones",false],["S","Sofía Ramírez","Duelo complicado","2 sesiones",false],["C","Carmen Herrera","Fobia a agujas","4 sesiones",true]].map(([ini,name,mot,ses,alta],i)=>(
                  <div key={i} onClick={()=>setActive("ficha")} style={{padding:"9px 14px",borderBottom:`1px solid ${C2.border}`,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:alta?C2.green:C2.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C2.bone,flexShrink:0}}>{ini}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:C2.ink}}>{name}</div>
                      <div style={{fontSize:9,color:C2.muted}}>{mot} · {ses}</div>
                    </div>
                    <span style={{background:alta?"#E8EFE2":"rgba(166,107,63,0.1)",color:alta?C2.green:C2.accent,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20}}>{alta?"Alta":"Activo"}</span>
                  </div>
                ))}
              </div>
              <div style={{padding:"8px 0",fontSize:9,color:C2.muted,textAlign:"center"}}>Haz clic en un paciente para ver su ficha →</div>
            </div>}

            {active==="ficha"&&<div>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:C2.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:C2.bone,flexShrink:0}}>M</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,fontWeight:700,color:C2.ink}}>María González López</div>
                  <div style={{fontSize:10,color:C2.muted,marginTop:2}}>612 345 678 · maria@email.com</div>
                  <div style={{display:"flex",gap:8,marginTop:4,alignItems:"center"}}>
                    <span style={{fontSize:10,color:C2.walnut,fontWeight:500}}>4 sesiones</span>
                    <span style={{color:C2.border}}>·</span>
                    <span style={{fontSize:10,color:C2.muted}}>1/2 objetivos</span>
                    <div style={{height:4,width:50,background:C2.sand,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:"50%",background:C2.green,borderRadius:99}}/></div>
                  </div>
                </div>
                <span style={{background:"rgba(166,107,63,0.1)",color:C2.accent,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20}}>Activo</span>
              </div>
              <div style={{background:C2.bone,borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${C2.accent}`,border:`1px solid ${C2.border}`,borderLeft:`3px solid ${C2.accent}`,marginBottom:10}}>
                <div style={{fontSize:9,color:C2.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Motivo de consulta</div>
                <div style={{fontSize:11,color:C2.ink,lineHeight:1.5}}>Ansiedad generalizada con episodios frecuentes de preocupación excesiva, insomnio y tensión muscular.</div>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:2}}>
                {["Historia clínica","Formulación","Evolución","Objetivos","Pruebas","Sesiones"].map((t,i)=>(
                  <div key={i} style={{padding:"5px 10px",borderRadius:8,fontSize:10,border:`1px solid ${C2.border}`,cursor:"pointer",background:i===2?C2.accent:"transparent",color:i===2?C2.bone:C2.muted,whiteSpace:"nowrap"}}>{t}</div>
                ))}
              </div>
              <div style={{background:C2.bone,borderRadius:10,border:`1px solid ${C2.border}`,overflow:"hidden"}}>
                <div style={{padding:"8px 12px",borderBottom:`1px solid ${C2.border}`,background:C2.bg,fontSize:9,color:C2.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>Evolución clínica</div>
                {[["4","2026-03-01","Reestructuración cognitiva. Distorsiones identificadas. Buena adherencia al autorregistro."],["3","2026-02-15","Respiración diafragmática. Técnica 4-7-8. La paciente la practica diariamente."],["2","2026-02-01","Psicoeducación sobre ansiedad. Registro de pensamientos automáticos iniciado."],["1","2026-01-15","Evaluación inicial. Historia clínica completa. Rapport establecido."]].map(([n,f,t],i)=>(
                  <div key={i} style={{padding:"9px 12px",borderBottom:i<3?`1px solid ${C2.border}`:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:9,fontWeight:600,color:C2.accent}}>Sesión {n}</span>
                      <span style={{fontSize:9,color:C2.muted}}>{f}</span>
                    </div>
                    <div style={{fontSize:10,color:C2.ink,lineHeight:1.5}}>{t}</div>
                  </div>
                ))}
              </div>
            </div>}

            {active==="facturas"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C2.ink,fontStyle:"italic",marginBottom:12}}>Facturas</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                {[["Total cobrado","3.440€","#4A6438"],["Pendiente","320€","#C48C2A"],["Este mes","830€",C2.accent]].map(([l,v,c],i)=>(
                  <div key={i} style={{background:C2.bone,borderRadius:10,padding:12,border:`1px solid ${C2.border}`}}>
                    <div style={{fontSize:9,color:C2.muted,marginBottom:3}}>{l}</div>
                    <div style={{fontSize:19,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{background:C2.bone,borderRadius:10,border:`1px solid ${C2.border}`,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 90px 60px 75px",padding:"7px 12px",borderBottom:`1px solid ${C2.border}`,fontSize:8,color:C2.muted,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>
                  <div>Paciente</div><div>Factura</div><div>Importe</div><div>Estado</div>
                </div>
                {[["María González","FAC-104","80€",false],["Carlos Ruiz","FAC-203","80€",false],["Laura Sánchez","FAC-505","90€",false],["Ana Martínez","FAC-303","80€",true],["Miguel García","FAC-804","80€",true],["Javier Fernández","FAC-403","90€",true]].map(([n,f,imp,paid],i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 90px 60px 75px",padding:"8px 12px",borderBottom:i<5?`1px solid ${C2.border}`:"none",alignItems:"center"}}>
                    <div style={{fontSize:10,fontWeight:500,color:C2.ink}}>{n}</div>
                    <div style={{fontSize:9,color:C2.muted}}>{f}</div>
                    <div style={{fontSize:10,fontWeight:600,color:C2.ink}}>{imp}</div>
                    <span style={{background:paid?"#E8EFE2":"#FDF3DC",color:paid?C2.green:"#C48C2A",fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{paid?"Pagada":"Pendiente"}</span>
                  </div>
                ))}
              </div>
            </div>}

            {active==="recursos"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C2.ink,fontStyle:"italic",marginBottom:6}}>Recursos</div>
              <div style={{fontSize:11,color:C2.muted,marginBottom:16}}>Biblioteca de materiales clínicos según tu plan</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12,opacity:0.55}}>
                <div style={{background:C2.bone,borderRadius:10,padding:20,border:`1px solid ${C2.border}`,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>👤</div>
                  <div style={{fontSize:12,fontWeight:600,color:C2.ink,marginBottom:4}}>Para el paciente</div>
                  <div style={{fontSize:10,color:C2.muted,lineHeight:1.5}}>Autorregistros, psicoeducación y hojas de trabajo.</div>
                </div>
                <div style={{background:C2.bone,borderRadius:10,padding:20,border:`1px solid ${C2.border}`,textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:8}}>🧠</div>
                  <div style={{fontSize:12,fontWeight:600,color:C2.ink,marginBottom:4}}>Para el profesional</div>
                  <div style={{fontSize:10,color:C2.muted,lineHeight:1.5}}>Protocolos, escalas y guías clínicas.</div>
                </div>
              </div>
              <div style={{background:C2.sand,borderRadius:10,padding:"14px 18px",textAlign:"center",border:`1px solid ${C2.border}`}}>
                <div style={{fontSize:12,fontWeight:600,color:C2.walnut,marginBottom:3}}>Próximamente</div>
                <div style={{fontSize:11,color:C2.muted}}>Disponible en el lanzamiento.</div>
              </div>
            </div>}

          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Instrument+Serif:ital@0;1&family=Manrope:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: `${C.bone}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <Logo size={22} />
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#features" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Funcionalidades</a>
          <a href="#precios" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Precios</a>
          <button onClick={() => navigate("/login")} style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Iniciar sesión</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "100px 48px 80px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", lineHeight: 1, marginBottom: 12 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 96, color: C.ink, letterSpacing: "-3px" }}>pra</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 114, color: C.accent, letterSpacing: "-3px", lineHeight: 0.9, marginLeft: 6 }}>X</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 96, color: C.ink, letterSpacing: "-3px" }}>i</span>
          <span style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", background: C.accent, marginLeft: 22, marginBottom: 14, flexShrink: 0 }} />
        </div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: "5px", textTransform: "uppercase", marginBottom: 28 }}>gestión clínica</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: 24, color: C.ink, marginBottom: 28 }}>Menos papeleo. Más presencia.</div>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 44px" }}>
          Para psicólogos, fisioterapeutas, nutricionistas, logopedas y cualquier profesional sanitario que trabaje con pacientes.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 80 }}>
          <button onClick={() => navigate("/login")} style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Solicitar acceso</button>
          <a href="#features" style={{ background: "transparent", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Ver funcionalidades ↓</a>
        </div>
      </section>

      {/* DEMO INTERACTIVO */}
      <Demo />

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1000, margin: "0 auto 90px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 22, color: C.ink, margin: 0, letterSpacing: "-0.3px" }}>Todo lo que necesitas en un solo sitio</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 48px" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: "28px 0", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "64px 1fr", gap: 24, alignItems: "start" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 48, color: C.accent, lineHeight: 1, letterSpacing: "-2px", userSelect: "none", opacity: 0.4 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 17, color: C.ink, marginBottom: 8, lineHeight: 1.3 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section style={{ background: C.ink, padding: "70px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 28, color: C.bone, lineHeight: 1.5, margin: "0 0 20px" }}>
            "Las herramientas de gestión clínica que existen están pensadas por equipos técnicos. Praxi está pensada por alguien que pasa consulta."
          </p>
          <div style={{ fontSize: 12, color: C.muted }}>Kevin Costa · Neuropsicólogo clínico-funcional</div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ maxWidth: 1000, margin: "0 auto", padding: "90px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Precios</div>
          <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 36, fontWeight: 400, color: C.ink, margin: "0 0 8px" }}>Simple y sin sorpresas</h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>IVA incluido · Cancela cuando quieras</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.gD, border: `1px solid ${C.green}`, borderRadius: 20, padding: "8px 20px", marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green, letterSpacing: "0.02em" }}>3 meses gratis para los primeros · Sin tarjeta de crédito</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {PLANES.map((p, i) => (
            <div key={i} style={{ background: p.destacado ? C.ink : C.bone, borderRadius: 18, padding: "30px 26px", border: p.destacado ? `2px solid ${C.accent}` : `1px solid ${C.border}`, position: "relative" }}>
              {p.destacado && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.bone, fontSize: 10, fontWeight: 700, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>MÁS POPULAR</div>}
              <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{p.nombre}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: p.destacado ? C.bone : C.ink, marginBottom: 4 }}>{p.precio}<span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>/mes</span></div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 22 }}>{p.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
                {p.features.map((f, j) => <div key={j} style={{ fontSize: 12, color: p.destacado ? "#C8A882" : C.muted }}>✓ {f}</div>)}
              </div>
              <button onClick={() => navigate("/login")} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: p.destacado ? "none" : `1px solid ${C.border}`, background: p.destacado ? C.accent : "transparent", color: p.destacado ? C.bone : C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Solicitar acceso →</button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.ink, padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Logo size={18} textColor={C.bone} />
          <div style={{ fontSize: 7, color: C.walnut, letterSpacing: "3px", textTransform: "uppercase", marginTop: 2 }}>gestión clínica</div>
        </div>
        <div style={{ fontSize: 11, color: C.walnut }}>© 2026 Praxi · Hecho en España</div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacidad", "Términos", "Contacto"].map(l => <a key={l} href="#" style={{ fontSize: 11, color: C.walnut, textDecoration: "none" }}>{l}</a>)}
        </div>
      </footer>
    </div>
  );
}
