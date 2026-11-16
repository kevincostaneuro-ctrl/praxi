export const C = {
  // Canvas & surfaces
  bg:"#F5EFE4",       // --canvas
  card:"#EBE3D2",     // --canvas-2
  bone:"#FBF8F1",     // --bone (modals)
  sand:"#D9C9A8",     // --sand (borders, decorative)
  // Brand
  accent:"#A66B3F",   // --terracotta (CTA, focal)
  aL:"#C4895A",       // terracotta light
  aD:"#7A4E2D",       // terracotta dark (hover)
  clay:"#B89271",     // --clay (secondary buttons, dividers)
  clayD:"#9A7558",    // clay dark
  // Text
  text:"#3B2A1E",     // --espresso (body)
  ink:"#221610",      // --ink (display, max contrast)
  walnut:"#6B4A30",   // --walnut (captions, alt body)
  muted:"#9A7E68",    // muted text on cream
  dim:"#B89271",      // very muted / disabled
  border:"#D9C9A8",   // --sand hairline
  // Status (warm, no pure greens/blues)
  green:"#6B8C5A",    // olive green — paid
  gD:"#E8EFE2",       // green bg tint
  amber:"#C48C2A",    // warm amber — pending
  amD:"#FDF3DC",      // amber bg tint
  red:"#B85040",      // warm red — error/danger
  rD:"#FAEAE8",       // red bg tint
  // Calendly accent (terracotta variant)
  teal:"#8B6B52",     // warm brown as calendly color
  tD:"#EDE6DE",       // calendly bg tint
};

// ── STYLES ─────────────────────────────────────────────────────────────────────
export const st={
  app:{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Manrope',sans-serif",display:"flex"},
  // El menú lateral se queda fijo al deslizar la página; el contenido usa el scroll de la página
  sidebar:{width:240,background:C.bone,borderRight:`1px solid ${C.border}`,padding:"24px 0",display:"flex",flexDirection:"column",gap:2,flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",boxSizing:"border-box"},
  sidebarBrand:{padding:"0 24px 20px",borderBottom:`1px solid ${C.border}`,marginBottom:8},
  main:{flex:1,padding:32,minWidth:0},
  card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:18},
  input:{background:C.bone,border:`1px solid ${C.border}`,borderRadius:4,padding:"9px 12px",color:C.text,fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"'Manrope',sans-serif"},
  textarea:{background:C.bone,border:`1px solid ${C.border}`,borderRadius:4,padding:"9px 12px",color:C.text,fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",fontFamily:"'Manrope',sans-serif",resize:"vertical",minHeight:80},
  label:{fontSize:11,color:C.walnut,marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500},
  modal:{position:"fixed",inset:0,background:"rgba(34,22,16,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,backdropFilter:"blur(6px)"},
  modalBox:(w=500)=>({background:C.bone,border:`1px solid ${C.border}`,borderRadius:18,padding:"clamp(18px,4vw,32px)",width:w,maxWidth:"calc(100vw - 20px)",boxSizing:"border-box",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 1px 2px rgba(59,42,30,0.06),0 8px 24px -12px rgba(59,42,30,0.18)"}),
  btn:(v="primary")=>({padding:v==="sm"?"5px 14px":"10px 22px",borderRadius:10,border:"none",cursor:"pointer",fontSize:v==="sm"?12:13,fontWeight:500,fontFamily:"'Manrope',sans-serif",letterSpacing:"0.01em",transition:"background 200ms cubic-bezier(0.4,0,0.2,1),transform 120ms",
    background:v==="ghost"?"transparent":v==="danger"?C.rD:v==="teal"?C.tD:v==="success"?C.gD:C.accent,
    color:v==="ghost"?C.muted:v==="danger"?C.red:v==="teal"?C.walnut:v==="success"?C.green:C.bone}),
  badge:(col,bg)=>({display:"inline-block",padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:500,letterSpacing:"0.03em",color:col,background:bg}),
  statCard:{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"20px 24px"},
  th:{padding:"10px 16px",textAlign:"left",fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:`1px solid ${C.border}`,fontWeight:500},
  td:{padding:"12px 16px",fontSize:13,borderBottom:`1px solid ${C.border}`,verticalAlign:"middle",color:C.text},
  navItem:(a)=>({display:"flex",alignItems:"center",gap:10,padding:"10px 24px",cursor:"pointer",
    color:a?C.accent:C.walnut,background:a?"rgba(166,107,63,0.08)":"transparent",
    borderLeft:a?`3px solid ${C.accent}`:"3px solid transparent",
    fontSize:15,fontWeight:a?500:400,transition:"all 150ms"}),
  tab:(a)=>({padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:a?500:400,
    color:a?C.accent:C.walnut,borderBottom:a?`2px solid ${C.accent}`:"2px solid transparent",
    marginBottom:-1,background:"transparent",border:"none",fontFamily:"'Manrope',sans-serif",letterSpacing:"0.01em"}),
  tabs:{display:"flex",gap:2,marginBottom:24,borderBottom:`1px solid ${C.border}`},
  rowActions:{display:"flex",gap:6,alignItems:"center"},
};


// ── AGENDA PERSONAL (reutilizable en Dashboard y Calendario) ──────────────────
export const PRIORIDAD_T={
  baja: {color:C.green,bg:C.gD,label:"Baja"},
  media:{color:C.amber,bg:C.amD,label:"Media"},
  alta: {color:C.red,  bg:C.rD, label:"Alta"},
};
