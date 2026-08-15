import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#F5EFE4", bone: "#FBF8F1", sand: "#E2D9C8",
  border: "#D9C9A8", accent: "#A66B3F", walnut: "#6B4A30",
  ink: "#221610", text: "#3B2A1E", muted: "#9A7E68",
  dim: "#B8A898", green: "#4A6438", gD: "#E8EFE2",
};

const FEATURES = [
  { icon: "🧠", title: "IA clínica contextual", desc: "Redacta notas, genera informes y analiza casos conociendo la historia completa del paciente." },
  { icon: "📋", title: "Ficha clínica estructurada", desc: "Historia clínica, formulación, evolución por sesión y objetivos terapéuticos." },
  { icon: "📅", title: "Agenda con videollamada", desc: "Calendario con videollamada integrada y recordatorios por WhatsApp." },
  { icon: "🧾", title: "Facturación automática", desc: "Facturas PDF, control de pagos e informes financieros mensuales con un clic." },
  { icon: "💬", title: "WhatsApp automático", desc: "Recordatorios de cita enviados automáticamente. Sin configuración ni costes extra." },
  { icon: "👥", title: "Gestión multi-profesional", desc: "Agenda compartida y panel de administración para clínicas con varios profesionales." },
  { icon: "🔒", title: "Cumplimiento RGPD", desc: "Datos cifrados, hosting en Europa y acuerdos de procesamiento con todos los proveedores." },
  { icon: "📊", title: "Informe mensual", desc: "Resumen automático de actividad clínica y financiera listo para tu asesoría." },
  { icon: "📱", title: "Acceso desde cualquier dispositivo", desc: "Ordenador, tablet y móvil. Sin instalaciones, siempre actualizado." },
  { icon: "📆", title: "Agenda pública de reservas", desc: "Tus pacientes reservan cita desde tu enlace. Sin llamadas ni gestión manual." },
];

const PLANES = [
  { nombre: "Básico", precio: "9,99€", desc: "Para empezar", destacado: false, features: ["Hasta 20 pacientes", "Agenda y calendario", "Historia clínica", "Facturación PDF", "IA para seguimientos"] },
  { nombre: "Pro", precio: "19,99€", desc: "Para consultas activas", destacado: true, features: ["Pacientes ilimitados", "Asistente IA", "WhatsApp automático", "Videollamada integrada", "Informes con IA"] },
  { nombre: "Clínica", precio: "50€", desc: "Para equipos", destacado: false, features: ["Hasta 6 profesionales", "Todo lo del plan Pro", "Agenda multi-profesional", "Panel de administración"] },
];



const Logo = ({ size = 22, textColor = C.ink }) => (
  <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1, gap: 0 }}>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size, color: textColor, letterSpacing: "-0.5px" }}>pra</span>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size * 1.18, color: C.accent, letterSpacing: "-0.5px", lineHeight: 0.9, marginLeft: 2 }}>X</span>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size, color: textColor, letterSpacing: "-0.5px" }}>i</span>
    <span style={{ display: "inline-block", width: size * 0.27, height: size * 0.27, borderRadius: "50%", background: C.accent, marginLeft: size * 0.45, marginBottom: size * 0.13, flexShrink: 0 }} />
  </div>
);


function WaitlistModal({ open, onClose }) {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", profesion: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inputStyle = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, background: C.bg, color: C.ink, outline: "none", fontFamily: "'Manrope',sans-serif", boxSizing: "border-box" };
  const labelStyle = { fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 };

  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(34,22,16,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.bone, borderRadius: 24, maxWidth: 480, width: "100%", padding: "40px 44px", border: `1px solid ${C.border}`, boxShadow: "0 24px 60px rgba(34,22,16,0.2)" }}>
        {!enviado ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", lineHeight: 1, marginBottom: 10 }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 32, color: C.ink, letterSpacing: "-1px" }}>pra</span>
                <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 38, color: C.accent, letterSpacing: "-1px", lineHeight: 0.9, marginLeft: 2 }}>X</span>
                <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 32, color: C.ink, letterSpacing: "-1px" }}>i</span>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.accent, marginLeft: 12, marginBottom: 4 }} />
              </div>
              <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: "0 0 6px", fontStyle: "italic" }}>Únete a la lista de espera</h2>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>3 meses gratuitos · Sin tarjeta de crédito</p>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nombre</label>
              <input style={inputStyle} placeholder="María González" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email profesional</label>
              <input style={inputStyle} type="email" placeholder="maria@clinica.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Profesión</label>
              <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} value={form.profesion} onChange={e => set("profesion", e.target.value)}>
                <option value="" disabled>Selecciona tu profesión</option>
                {["Psicólogo/a","Neuropsicólogo/a","Fisioterapeuta","Nutricionista","Logopeda","Terapeuta ocupacional","Médico/a","Otro profesional sanitario"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={() => { if(form.nombre&&form.email&&form.profesion) setEnviado(true); }} style={{ width: "100%", background: C.accent, color: C.bone, border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope',sans-serif", marginBottom: 14 }}>
              Apuntarme a la lista
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: C.muted }}>
              ¿Ya tienes cuenta? <span onClick={onClose} style={{ color: C.accent, fontWeight: 500, cursor: "pointer" }}>Iniciar sesión</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: "0 0 10px", fontStyle: "italic" }}>¡Ya estás en la lista!</h3>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: "0 0 24px" }}>Te avisaremos cuando tu acceso esté listo.<br/>Serás de los primeros en entrar.</p>
            <button onClick={onClose} style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}


function Demo() {
  const [active, setActive] = useState("dashboard");
  const D = {
    bg:"#F5EFE4",bone:"#FBF8F1",card:"#EBE3D2",sand:"#E2D9C8",border:"#D9C9A8",
    accent:"#A66B3F",walnut:"#6B4A30",ink:"#221610",text:"#3B2A1E",muted:"#9A7E68",
    dim:"#B8A898",green:"#4A6438",gD:"#E8EFE2",teal:"#4A7B6B",tD:"rgba(74,123,107,0.12)",
    amber:"#C48C2A",amD:"#FDF3DC",red:"#B85040",rD:"#FAEAE8"
  };
  const nav = [["dashboard","▪ Dashboard"],["calendario","▪ Calendario"],["pacientes","▪ Pacientes"],["facturas","▪ Facturas"],["recursos","▪ Recursos"]];
  const [fichaTab, setFichaTab] = useState("evolucion");

  const Card = ({children, style={}}) => <div style={{background:D.bone,borderRadius:12,border:`1px solid ${D.border}`,...style}}>{children}</div>;
  const SLabel = ({children}) => <div style={{fontSize:10,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:10}}>{children}</div>;
  const Avatar = ({letter, color=D.accent}) => <div style={{width:32,height:32,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:D.bone,flexShrink:0}}>{letter}</div>;

  return (
    <section style={{maxWidth:1100,margin:"0 auto 90px",padding:"0 48px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",lineHeight:1,marginBottom:6}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:D.ink,letterSpacing:"-0.5px"}}>Explora las diferentes secciones de pra</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:21,color:D.accent,letterSpacing:"-0.5px",lineHeight:0.9,marginLeft:2}}>X</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:D.ink,letterSpacing:"-0.5px"}}>i</span>
          <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:D.accent,marginLeft:9,marginBottom:3}}/>
        </div>
      </div>

      {/* App window */}
      <div style={{background:D.ink,borderRadius:20,overflow:"hidden",boxShadow:"0 48px 96px rgba(34,22,16,0.28)"}}>
        {/* Browser bar */}
        <div style={{background:"#1A0E08",padding:"10px 16px",display:"flex",gap:6,alignItems:"center"}}>
          {["#FF5F57","#FFBD2E","#28CA41"].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:"50%",background:c}}/>)}
          <div style={{flex:1,background:"#2A1E18",borderRadius:6,height:22,margin:"0 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:10,color:"#6B4A30"}}>praxi-kevin-8beb.vercel.app/app</span>
          </div>
        </div>

        {/* App layout */}
        <div style={{display:"flex",height:620}}>

          {/* Sidebar */}
          <div style={{width:220,background:D.bg,borderRight:`1px solid ${D.border}`,flexShrink:0,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"16px 20px 14px",borderBottom:`1px solid ${D.border}`,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"flex-end",lineHeight:1}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:D.accent}}>pra</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:21,color:D.accent,lineHeight:0.9,marginLeft:1}}>X</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:18,color:D.accent}}>i</span>
                <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:D.accent,marginLeft:8,marginBottom:2}}/>
              </div>
              <div style={{fontSize:8,color:D.muted,letterSpacing:"0.15em",textTransform:"uppercase",marginTop:2}}>gestión clínica</div>
            </div>
            {nav.map(([id,label])=>(
              <div key={id} onClick={()=>setActive(id)} style={{
                padding:id==="ficha"?"6px 20px 6px 32px":"9px 20px",
                fontSize:12,cursor:"pointer",
                color:(active===id||(id==="pacientes"&&active==="pacientes_ficha"))?D.accent:D.muted,
                fontWeight:(active===id||(id==="pacientes"&&active==="pacientes_ficha"))?600:400,
                background:(active===id||(id==="pacientes"&&active==="pacientes_ficha"))?"rgba(166,107,63,0.08)":"transparent",
                transition:"all 0.15s",
                borderLeft:(active===id||(id==="pacientes"&&active==="pacientes_ficha"))?`3px solid ${D.accent}`:"3px solid transparent"
              }}>{label}</div>
            ))}
            <div style={{marginTop:"auto",padding:"14px 20px",borderTop:`1px solid ${D.border}`,display:"flex",alignItems:"center",gap:10}}>
              <Avatar letter="K"/>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:D.text}}>Kevin Costa</div>
                <div style={{fontSize:10,color:D.muted}}>Neuropsicólogo</div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{flex:1,background:D.bg,overflowY:"auto",padding:"24px 28px"}}>

            {/* ── DASHBOARD ── */}
            {active==="dashboard"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:D.ink,marginBottom:4}}>Dashboard</div>
              <div style={{fontSize:12,color:D.muted,marginBottom:20}}>Lunes, 11 de agosto de 2026</div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                {[["15","Pacientes activos",D.accent],["5","Citas hoy",D.accent],["830€","Cobrado mes",D.green],["320€","Pendiente",D.amber]].map(([v,l,c],i)=>(
                  <Card key={i} style={{padding:"14px 16px"}}>
                    <div style={{fontSize:24,fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:D.muted,marginTop:3}}>{l}</div>
                  </Card>
                ))}
              </div>

              <Card style={{padding:16,marginBottom:14}}>
                <SLabel>Citas de hoy</SLabel>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[["09:00","María González","Seguimiento · 60min",false],["10:00","Primera llamada","Calendly · 30min",true],["11:00","Carlos Ruiz","Seguimiento · 60min",false],["12:00","Laura Sánchez","Seguimiento · 90min",false],["16:00","Miguel García","Seguimiento · 60min",false]].map(([h,n,d,cal],i)=>(
                    <div key={i} style={{padding:"10px 12px",background:D.bg,borderRadius:10,border:`1px solid ${D.border}`}}>
                      <div style={{fontSize:11,color:cal?D.teal:D.muted,fontWeight:cal?600:400}}>{h}{cal?" · Calendly":""}</div>
                      <div style={{fontSize:12,fontWeight:600,color:D.ink,marginTop:2}}>{n}</div>
                      <div style={{fontSize:10,color:D.muted}}>{d.split("·")[1]||d}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:12}}>
                <Card style={{padding:16}}>
                  <SLabel>Agenda personal</SLabel>
                  {[["Supervisión clínica","Hoy · 15:00",D.red],["Enviar informe derivación","Mañana",D.amber],["Formación EMDR","Viernes",D.green]].map(([t,h,c],i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<2?`1px solid ${D.border}`:"none"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/>
                      <div style={{fontSize:12,color:D.text,flex:1}}>{t}</div>
                      <div style={{fontSize:11,color:D.muted}}>{h}</div>
                    </div>
                  ))}
                </Card>
                <Card style={{padding:16}}>
                  <SLabel>✦ Asistente IA</SLabel>
                  <div style={{fontSize:12,color:D.muted,lineHeight:1.7,fontStyle:"italic"}}>"Laura lleva 5 sesiones — considera revisar los objetivos terapéuticos en la próxima cita."</div>
                </Card>
              </div>
            </div>}

            {/* ── CALENDARIO ── */}
            {active==="calendario"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:D.ink,marginBottom:18}}>Calendario semanal</div>
              <Card style={{overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",borderBottom:`1px solid ${D.border}`}}>
                  <div style={{background:D.sand}}/>
                  {[["Lun","11",true,true],["Mar","12",true,false],["Mié","13",false,false],["Jue","14",true,false],["Vie","15",true,false],["Sáb","16",false,false],["Dom","17",false,false]].map(([d,n,has,isT],i)=>(
                    <div key={i} style={{padding:"10px 4px",textAlign:"center",background:isT?"rgba(166,107,63,0.08)":has?"rgba(166,107,63,0.02)":"transparent",borderLeft:`1px solid ${D.border}`}}>
                      <div style={{fontSize:10,color:isT?D.accent:has?D.walnut:D.muted,textTransform:"uppercase",fontWeight:has?600:400}}>{d}</div>
                      <div style={{fontSize:16,fontWeight:isT?700:400,color:isT?D.accent:D.ink}}>{n}</div>
                      {has&&<div style={{width:4,height:4,borderRadius:"50%",background:D.accent,margin:"3px auto 0"}}/>}
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",height:380}}>
                  <div style={{display:"flex",flexDirection:"column",background:D.sand}}>
                    {["09","10","11","12","13","14","15","16"].map(h=>(
                      <div key={h} style={{flex:1,padding:"4px 6px",fontSize:10,color:D.walnut,borderBottom:`1px solid ${D.border}`,textAlign:"right",fontWeight:600}}>{h}:00</div>
                    ))}
                  </div>
                  {/* Lun */}
                  <div style={{borderLeft:`1px solid ${D.border}`,position:"relative",background:"rgba(166,107,63,0.02)"}}>
                    <div style={{position:"absolute",top:3,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>09:00 María G.</div><div style={{fontSize:9,color:D.walnut}}>Seguimiento</div></div>
                    <div style={{position:"absolute",top:51,left:3,right:3,background:D.tD,border:`1px solid ${D.teal}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.teal}}>10:00 Calendly</div></div>
                    <div style={{position:"absolute",top:99,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>11:00 Carlos R.</div></div>
                    <div style={{position:"absolute",top:147,left:3,right:3,height:70,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>12:00 Laura S.</div><div style={{fontSize:9,color:D.walnut}}>90 min</div></div>
                    <div style={{position:"absolute",top:339,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>16:00 Miguel G.</div></div>
                  </div>
                  {/* Mar */}
                  <div style={{borderLeft:`1px solid ${D.border}`,position:"relative"}}>
                    <div style={{position:"absolute",top:27,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>09:30 Ana M.</div></div>
                    <div style={{position:"absolute",top:99,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>11:00 Pedro L.</div></div>
                  </div>
                  <div style={{borderLeft:`1px solid ${D.border}`}}/>
                  {/* Jue */}
                  <div style={{borderLeft:`1px solid ${D.border}`,position:"relative"}}>
                    <div style={{position:"absolute",top:3,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>09:00 Elena V.</div></div>
                    <div style={{position:"absolute",top:108,left:3,right:3,height:70,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>11:30 Isabel M.</div><div style={{fontSize:9,color:D.walnut}}>90 min</div></div>
                  </div>
                  {/* Vie */}
                  <div style={{borderLeft:`1px solid ${D.border}`,position:"relative"}}>
                    <div style={{position:"absolute",top:51,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>10:00 Sofía R.</div></div>
                    <div style={{position:"absolute",top:99,left:3,right:3,background:"rgba(166,107,63,0.15)",border:`1px solid ${D.accent}`,borderRadius:6,padding:"4px 6px"}}><div style={{fontSize:10,fontWeight:600,color:D.accent}}>11:00 Antonio P.</div></div>
                  </div>
                  <div style={{borderLeft:`1px solid ${D.border}`}}/>
                  <div style={{borderLeft:`1px solid ${D.border}`}}/>
                </div>
              </Card>
            </div>}

            {/* ── PACIENTES ── */}
            {active==="pacientes"&&<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:D.ink}}>Pacientes</div>
                <input placeholder="Buscar paciente..." style={{border:`1px solid ${D.border}`,borderRadius:10,padding:"8px 14px",fontSize:12,background:D.bone,color:D.muted,outline:"none",width:200}}/>
              </div>
              <Card style={{overflow:"hidden"}}>
                {[["M","María González López","Ansiedad generalizada · 4 sesiones",false,true],["C","Carlos Ruiz Martínez","Episodio depresivo mayor · 3 sesiones",false,true],["A","Ana Martínez Vega","Fobia social · 3 sesiones",true,true],["J","Javier Fernández Mora","Trastorno adaptativo · 3 sesiones",false,true],["L","Laura Sánchez Díaz","TCA restricción · 5 sesiones",true,true],["P","Pedro López Castillo","TOC comprobación · 3 sesiones",false,true],["S","Sofía Ramírez Torres","Duelo complicado · 2 sesiones",false,true],["M","Miguel García Blanco","Burnout · 4 sesiones",false,true],["E","Elena Vidal Moreno","TDAH adulto · 3 sesiones",false,true],["C","Carmen Herrera","Fobia a agujas · 4 sesiones",false,false]].map(([ini,name,mot,consent,activo],i)=>(
                  <div key={i} onClick={()=>{setActive("pacientes_ficha");setFichaTab("evolucion");}} style={{padding:"11px 16px",borderBottom:`1px solid ${D.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"background 0.1s"}}>
                    <Avatar letter={ini} color={activo?D.accent:D.green}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:D.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                      <div style={{fontSize:11,color:D.muted,marginTop:1}}>{mot}</div>
                    </div>
                    {!consent&&<span style={{background:D.amD,color:D.amber,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20}}>⚠ Consentimiento</span>}
                    <span style={{background:activo?"rgba(166,107,63,0.1)":D.gD,color:activo?D.accent:D.green,fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:20,flexShrink:0}}>{activo?"Activo":"Alta"}</span>
                  </div>
                ))}
              </Card>
              <div style={{padding:"8px 0",fontSize:10,color:D.muted,textAlign:"center"}}>Haz clic en un paciente para ver su ficha →</div>
            </div>}

            {/* ── FICHA PACIENTE ── */}
            {active==="pacientes_ficha"&&<div>
              {/* Header */}
              <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:D.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:D.bone}}>M</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
                    <button onClick={()=>setActive("pacientes")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:D.muted,padding:0}}>← Pacientes</button>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:D.ink}}>María González López</div>
                  <div style={{fontSize:11,color:D.muted,marginTop:2}}>612 345 678 · maria@email.com</div>
                  <div style={{display:"flex",gap:10,marginTop:5,alignItems:"center"}}>
                    <span style={{fontSize:11,color:D.walnut,fontWeight:500}}>4 sesiones</span>
                    <span style={{color:D.border}}>·</span>
                    <span style={{fontSize:11,color:D.muted}}>1/2 objetivos</span>
                    <div style={{height:5,width:70,background:D.sand,borderRadius:999,overflow:"hidden"}}><div style={{height:"100%",width:"50%",background:D.green,borderRadius:999}}/></div>
                  </div>
                </div>
                <span style={{background:"rgba(166,107,63,0.1)",color:D.accent,fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:20}}>Activo</span>
              </div>

              {/* Motivo */}
              <Card style={{padding:"12px 16px",borderLeft:`3px solid ${D.accent}`,marginBottom:12}}>
                <div style={{fontSize:9,color:D.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Motivo de consulta</div>
                <div style={{fontSize:12,color:D.text,lineHeight:1.6}}>Ansiedad generalizada con episodios frecuentes de preocupación excesiva, insomnio y tensión muscular crónica.</div>
              </Card>

              {/* Tabs */}
              <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
                {[["evolucion","Evolución clínica"],["historia","Historia clínica"],["formulacion","Formulación"],["objetivos","Objetivos"],["pruebas","Pruebas"],["sesiones","Sesiones y pagos"]].map(([id,label])=>(
                  <div key={id} onClick={()=>setFichaTab(id)} style={{padding:"6px 11px",borderRadius:8,fontSize:11,border:`1px solid ${fichaTab===id?D.accent:D.border}`,cursor:"pointer",background:fichaTab===id?D.accent:"transparent",color:fichaTab===id?D.bone:D.muted,whiteSpace:"nowrap",flexShrink:0}}>{label}</div>
                ))}
              </div>

              {/* Tab content */}
              {fichaTab==="evolucion"&&<Card style={{overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${D.border}`,background:D.sand,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:9,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>Evolución clínica</span>
                  <span style={{fontSize:10,color:D.muted}}>4 registros</span>
                </div>
                {[["4","2026-03-01","Reestructuración cognitiva. Distorsiones identificadas. Buena adherencia al autorregistro. Paciente refiere mejoría en calidad del sueño."],["3","2026-02-15","Respiración diafragmática. Técnica 4-7-8. La paciente practica con buenos resultados. Se trabaja la tolerancia a la incertidumbre."],["2","2026-02-01","Psicoeducación sobre ansiedad. Registro de pensamientos automáticos iniciado. Se identifican 3 distorsiones principales."],["1","2026-01-15","Evaluación inicial. Historia clínica completa. Rapport establecido. BAI: 28 (ansiedad moderada)."]].map(([n,f,t],i)=>(
                  <div key={i} style={{padding:"11px 14px",borderBottom:i<3?`1px solid ${D.border}`:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:D.accent}}>Sesión {n}</span><span style={{fontSize:10,color:D.muted}}>{f}</span></div>
                    <div style={{fontSize:12,color:D.text,lineHeight:1.6}}>{t}</div>
                  </div>
                ))}
              </Card>}

              {fichaTab==="historia"&&<Card style={{overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${D.border}`,background:D.sand}}><span style={{fontSize:9,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>Historia clínica</span></div>
                <div style={{padding:"18px 16px",fontSize:13,color:D.text,lineHeight:1.9,fontFamily:"'Instrument Serif',serif",minHeight:200}}>
                  Paciente de 35 años, sin antecedentes psiquiátricos familiares relevantes. Refiere primer episodio de ansiedad a los 28 años en contexto de estrés laboral. Sin tratamientos previos. No toma medicación actualmente. Trabaja como diseñadora gráfica en empresa de publicidad. Relación de pareja estable. Duerme entre 5-6 horas por noche. Practica deporte ocasionalmente.
                </div>
              </Card>}

              {fichaTab==="formulacion"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["🌙 Sueño","Dificultad para conciliar. Se despierta 2-3 veces por noche con pensamientos rumiativos."],["🏃 Actividad física","Deporte ocasional, 1 vez/semana. Refiere que cuando hace ejercicio se siente mejor."],["🍽 Alimentación","Irregular. Saltea comidas en días de mucho trabajo. Abuso de cafeína."],["👨‍👩‍👧 Familia","Buena relación con familia de origen. Padres mayores, cierta preocupación por su salud."],["💼 Trabajo","Fuente principal de estrés. Perfeccionismo elevado. Dificultad para delegar."],["⚡ Factores estresantes","Plazos de entrega, conflictos con cliente, sensación de no llegar a todo."],["🛡 Factores protectores","Red social activa, pareja de apoyo, motivación para el cambio alta."]].map(([t,d],i)=>(
                  <Card key={i} style={{overflow:"hidden",gridColumn:i===6?"1 / -1":"auto"}}>
                    <div style={{padding:"7px 12px",background:D.sand,borderBottom:`1px solid ${D.border}`,fontSize:10,color:D.walnut,fontWeight:600}}>{t}</div>
                    <div style={{padding:"10px 12px",fontSize:11,color:D.text,lineHeight:1.6}}>{d}</div>
                  </Card>
                ))}
              </div>}

              {fichaTab==="objetivos"&&<Card style={{overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${D.border}`,background:D.sand}}><span style={{fontSize:9,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>Objetivos terapéuticos</span></div>
                {[["Reducir episodios de ansiedad de 5 a 2 semanales",false],["Aplicar respiración diafragmática de forma autónoma",true],["Mejorar calidad del sueño — dormir más de 7h",false],["Reducir autocrítica y perfeccionismo en el trabajo",false]].map(([obj,done],i)=>(
                  <div key={i} style={{padding:"12px 14px",borderBottom:i<3?`1px solid ${D.border}`:"none",display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${done?D.green:D.border}`,background:done?D.gD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {done&&<span style={{fontSize:10,color:D.green}}>✓</span>}
                    </div>
                    <div style={{fontSize:12,color:done?D.muted:D.text,textDecoration:done?"line-through":"none",flex:1}}>{obj}</div>
                    <span style={{fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,background:done?D.gD:"rgba(166,107,63,0.08)",color:done?D.green:D.accent}}>{done?"Logrado":"En curso"}</span>
                  </div>
                ))}
              </Card>}

              {fichaTab==="pruebas"&&<Card style={{overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${D.border}`,background:D.sand}}><span style={{fontSize:9,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>Pruebas realizadas</span></div>
                {[["2026-01-15","BAI — Inventario de Ansiedad de Beck","Puntuación 28 — Ansiedad moderada",""],["2026-03-15","BAI — Inventario de Ansiedad de Beck","Puntuación 14 — Ansiedad leve","Mejora significativa tras 4 sesiones"]].map(([f,p,r,o],i)=>(
                  <div key={i} style={{padding:"12px 14px",borderBottom:i<1?`1px solid ${D.border}`:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,fontWeight:600,color:D.ink}}>{p}</span><span style={{fontSize:10,color:D.muted}}>{f}</span></div>
                    <div style={{fontSize:12,color:D.accent,fontWeight:500,marginBottom:o?3:0}}>{r}</div>
                    {o&&<div style={{fontSize:11,color:D.muted}}>{o}</div>}
                  </div>
                ))}
              </Card>}

              {fichaTab==="sesiones"&&<Card style={{overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${D.border}`,background:D.sand}}><span style={{fontSize:9,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>Sesiones y pagos</span></div>
                {[["1","2026-01-15",80,true,"FAC-101","Evaluación inicial"],["2","2026-02-01",80,true,"FAC-102","Psicoeducación ansiedad"],["3","2026-02-15",80,true,"FAC-103","Respiración diafragmática"],["4","2026-03-01",80,false,"FAC-104","Reestructuración cognitiva"]].map(([n,f,p,paid,fac,trab],i)=>(
                  <div key={i} style={{padding:"11px 14px",borderBottom:i<3?`1px solid ${D.border}`:"none",display:"grid",gridTemplateColumns:"30px 90px 1fr 70px 80px",gap:10,alignItems:"center"}}>
                    <div style={{fontSize:11,fontWeight:700,color:D.accent}}>{n}</div>
                    <div style={{fontSize:11,color:D.muted}}>{f}</div>
                    <div style={{fontSize:11,color:D.text}}>{trab}</div>
                    <div style={{fontSize:12,fontWeight:600,color:D.ink}}>{p}€</div>
                    <span style={{background:paid?D.gD:D.amD,color:paid?D.green:D.amber,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{paid?"Pagada":"Pendiente"}</span>
                  </div>
                ))}
              </Card>}
            </div>}

            {/* ── FACTURAS ── */}
            {active==="facturas"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:D.ink,marginBottom:18}}>Facturas</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                {[["Total cobrado","3.440€",D.green],["Pendiente de cobro","320€",D.amber],["Cobrado este mes","830€",D.accent]].map(([l,v,c],i)=>(
                  <Card key={i} style={{padding:"14px 18px"}}>
                    <div style={{fontSize:10,color:D.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</div>
                    <div style={{fontSize:26,fontWeight:700,color:c}}>{v}</div>
                  </Card>
                ))}
              </div>
              <Card style={{overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 110px 70px 90px",padding:"10px 16px",borderBottom:`1px solid ${D.border}`,background:D.sand,fontSize:10,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600}}>
                  <div>Paciente</div><div>Factura</div><div>Importe</div><div>Estado</div>
                </div>
                {[["María González López","FAC-104","80€",false],["Carlos Ruiz Martínez","FAC-203","80€",false],["Laura Sánchez Díaz","FAC-505","90€",false],["Ana Martínez Vega","FAC-303","80€",true],["Miguel García Blanco","FAC-804","80€",true],["Javier Fernández Mora","FAC-403","90€",true],["Elena Vidal Moreno","FAC-903","80€",true],["Pedro López Castillo","FAC-603","80€",true]].map(([n,f,imp,paid],i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 110px 70px 90px",padding:"11px 16px",borderBottom:i<7?`1px solid ${D.border}`:"none",alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:500,color:D.ink}}>{n}</div>
                    <div style={{fontSize:11,color:D.muted}}>{f}</div>
                    <div style={{fontSize:12,fontWeight:600,color:D.ink}}>{imp}</div>
                    <span style={{background:paid?D.gD:D.amD,color:paid?D.green:D.amber,fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:20,display:"inline-block"}}>{paid?"Pagada":"Pendiente"}</span>
                  </div>
                ))}
              </Card>
            </div>}

            {/* ── RECURSOS ── */}
            {active==="recursos"&&<div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:D.ink,marginBottom:4}}>Recursos</div>
              <div style={{fontSize:12,color:D.muted,marginBottom:18}}>Biblioteca de materiales clínicos · Acceso según tu plan</div>

              <div style={{fontSize:10,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:10}}>Para el paciente</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                {[["📄","Registro de pensamientos automáticos","Hoja de autorregistro semanal para identificar distorsiones cognitivas","Todos los planes"],["📄","Psicoeducación sobre ansiedad","Guía explicativa para el paciente sobre qué es la ansiedad y cómo funciona","Todos los planes"],["📄","Ejercicios de respiración diafragmática","Instrucciones paso a paso para la técnica 4-7-8 y respiración abdominal","Todos los planes"],["📄","Registro de actividades placenteras","Hoja de seguimiento para activación conductual en depresión","Plan Pro"],["📄","Diario de sueño","Registro semanal de calidad y patrones del sueño","Plan Pro"]].map(([icon,title,desc,plan],i)=>(
                  <div key={i} style={{background:D.bone,borderRadius:10,padding:"10px 14px",border:`1px solid ${D.border}`,display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{fontSize:20,flexShrink:0}}>{icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:D.ink}}>{title}</div>
                      <div style={{fontSize:10,color:D.muted,marginTop:1}}>{desc}</div>
                    </div>
                    <span style={{background:plan==="Todos los planes"?D.gD:"rgba(166,107,63,0.1)",color:plan==="Todos los planes"?D.green:D.accent,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,flexShrink:0}}>{plan}</span>
                    <div style={{width:28,height:28,borderRadius:8,background:D.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",flexShrink:0}}>↓</div>
                  </div>
                ))}
              </div>

              <div style={{fontSize:10,color:D.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:10}}>Para el profesional</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[["📋","Protocolo TCC para trastorno de ansiedad generalizada","Guía estructurada de intervención cognitivo-conductual — 12 sesiones","Plan Pro"],["📋","Protocolo de activación conductual para depresión","Protocolo BA con registro de actividades y programación semanal","Plan Pro"],["📋","Escala BAI — Inventario de Ansiedad de Beck","Versión para uso clínico con instrucciones de corrección e interpretación","Todos los planes"],["📋","Escala PHQ-9 — Depresión","Cuestionario de salud del paciente para cribado de depresión","Todos los planes"],["📋","Plantilla de informe de derivación","Estructura profesional para informes de derivación a psiquiatría u otros especialistas","Plan Pro"]].map(([icon,title,desc,plan],i)=>(
                  <div key={i} style={{background:D.bone,borderRadius:10,padding:"10px 14px",border:`1px solid ${D.border}`,display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{fontSize:20,flexShrink:0}}>{icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:D.ink}}>{title}</div>
                      <div style={{fontSize:10,color:D.muted,marginTop:1}}>{desc}</div>
                    </div>
                    <span style={{background:plan==="Todos los planes"?D.gD:"rgba(166,107,63,0.1)",color:plan==="Todos los planes"?D.green:D.accent,fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,flexShrink:0}}>{plan}</span>
                    <div style={{width:28,height:28,borderRadius:8,background:D.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",flexShrink:0,opacity:0.4}}>🔒</div>
                  </div>
                ))}
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
  const [waitlist, setWaitlist] = useState(false);

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Instrument+Serif:ital@0;1&family=Manrope:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: `${C.bone}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <Logo size={22} />
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#features" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Funcionalidades</a>
          <a href="#precios" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>Precios</a>
          <button onClick={() => setWaitlist(true)} style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Solicitar acceso</button>
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
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          <button onClick={() => setWaitlist(true)} style={{ background: C.accent, color: C.bone, border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Solicitar acceso</button>
          <button onClick={() => navigate("/demo")} style={{ background: "transparent", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "14px 28px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Manrope',sans-serif", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.bone }}>▶</span>
            Ver la app en directo
          </button>
        </div>
      </section>

      {/* DEMO INTERACTIVO */}
      {/* Contador lista de espera */}
      <div style={{ textAlign: "center", marginBottom: 80 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: C.bone, border: `1px solid ${C.border}`, borderRadius: 20, padding: "10px 20px" }}>
          <div style={{ display: "flex" }}>
            {["K","M","A","L","P"].map((l,i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: [C.accent,"#6B4A30","#9A7E68","#4A6438","#B8A898"][i], border: `2px solid ${C.bone}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.bone, marginLeft: i > 0 ? -8 : 0 }}>{l}</div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.ink }}><span style={{ fontWeight: 700 }}>1.247</span> profesionales ya en la lista</div>
        </div>
      </div>

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
          <div style={{ fontSize: 12, color: C.muted }}>Kevin Costa · Neuropsicólogo clínico</div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ maxWidth: 1000, margin: "0 auto", padding: "90px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: 12 }}>Precios</div>
          <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 36, fontWeight: 400, color: C.ink, margin: "0 0 8px" }}>Simple y sin sorpresas</h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>IVA incluido · Cancela cuando quieras</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.gD, border: `1px solid ${C.green}`, borderRadius: 20, padding: "8px 20px", marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green, letterSpacing: "0.02em" }}>3 meses gratis · Sin tarjeta de crédito</span>
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
              <button onClick={() => setWaitlist(true)} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: p.destacado ? "none" : `1px solid ${C.border}`, background: p.destacado ? C.accent : "transparent", color: p.destacado ? C.bone : C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope',sans-serif" }}>Solicitar acceso</button>
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
