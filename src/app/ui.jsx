import { useEffect, useRef, useState } from "react";
import { C, st } from "./estilos.js";

// ── TIME PICKER ────────────────────────────────────────────────────────────────
export function TimePicker({value,onChange}){
  const[open,setOpen]=useState(false);
  const[step,setStep]=useState("hour");
  const[selH,setSelH]=useState(()=>value?Number(value.split(":")[0]):9);
  const[pos,setPos]=useState({top:0,left:0});
  const triggerRef=useRef();
  const dropRef=useRef();
  const skipClose=useRef(false);

  // Calcular posición fixed al abrir
  const calcPos=()=>{
    if(!triggerRef.current)return;
    const r=triggerRef.current.getBoundingClientRect();
    const dropH=300;
    const top=window.innerHeight-r.bottom>dropH?r.bottom+4:r.top-dropH-4;
    const left=Math.min(r.left,window.innerWidth-240);
    setPos({top:Math.max(8,top),left:Math.max(8,left)});
  };

  // Cerrar al hacer click fuera
  useEffect(()=>{
    if(!open)return;
    const handler=()=>{
      if(skipClose.current){skipClose.current=false;return;}
      setOpen(false);setStep("hour");
    };
    document.addEventListener("click",handler);
    return()=>document.removeEventListener("click",handler);
  },[open]);

  const HOURS=Array.from({length:24},(_,i)=>i);
  const MINS=[0,5,10,15,20,25,30,35,40,45,50,55];

  const toggle=()=>{
    if(!open)calcPos();
    skipClose.current=true;
    setOpen(v=>!v);
    setStep("hour");
  };

  const pickHour=h=>{
    skipClose.current=true;
    setSelH(h);
    setStep("min");
  };

  const pickMin=m=>{
    const result=`${String(selH).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    onChange(result);
    setOpen(false);
    setStep("hour");
  };

  const goBack=()=>{skipClose.current=true;setStep("hour");};

  return(
    <div style={{position:"relative"}}>
      <div
        ref={triggerRef}
        onClick={toggle}
        style={{...st.input,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}
      >
        <span style={{fontSize:13,fontWeight:value?600:400,color:value?C.text:C.dim,fontFamily:"'Manrope',sans-serif"}}>{value||"--:--"}</span>
        <span style={{fontSize:13,color:C.muted}}>🕐</span>
      </div>

      {open&&(
        <div
          ref={dropRef}
          onClick={e=>{e.stopPropagation();skipClose.current=true;}}
          style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:C.bone,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 8px 32px rgba(59,42,30,0.22)",padding:16,width:232}}
        >
          {/* Cabecera */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:C.walnut,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em"}}>
              {step==="hour"?"Selecciona hora":"Selecciona minutos"}
            </span>
            {step==="min"&&(
              <button onClick={goBack} style={{background:"none",border:"none",color:C.accent,fontSize:12,cursor:"pointer",fontWeight:600,padding:"2px 8px",borderRadius:6}}>
                ← {String(selH).padStart(2,"0")}h
              </button>
            )}
          </div>

          {/* Display hora actual */}
          <div style={{textAlign:"center",fontSize:28,fontWeight:300,letterSpacing:"0.1em",marginBottom:14,fontFamily:"'Manrope',sans-serif"}}>
            <span style={{color:step==="hour"?C.accent:C.text,borderBottom:step==="hour"?`2px solid ${C.accent}`:"2px solid transparent",paddingBottom:2,transition:"color 150ms"}}>{String(selH).padStart(2,"0")}</span>
            <span style={{color:C.dim,margin:"0 3px"}}>:</span>
            <span style={{color:step==="min"?C.accent:C.dim,borderBottom:step==="min"?`2px solid ${C.accent}`:"2px solid transparent",paddingBottom:2,transition:"color 150ms"}}>
              {value&&Number(value.split(":")[0])===selH?value.split(":")[1]:"--"}
            </span>
          </div>

          {/* Grid horas */}
          {step==="hour"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:3}}>
              {HOURS.map(h=>(
                <button key={h} onClick={()=>pickHour(h)} style={{padding:"6px 2px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:h===selH?700:400,background:h===selH?C.accent:"transparent",color:h===selH?C.bone:C.text,transition:"background 100ms"}}>
                  {String(h).padStart(2,"0")}
                </button>
              ))}
            </div>
          )}

          {/* Grid minutos */}
          {step==="min"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
              {MINS.map(m=>{
                const cur=value?Number(value.split(":")[1]):null;
                const isSel=cur===m&&value&&Number(value.split(":")[0])===selH;
                return(
                  <button key={m} onClick={()=>pickMin(m)} style={{padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:isSel?700:400,background:isSel?C.accent:"transparent",color:isSel?C.bone:C.text,transition:"background 100ms"}}>
                    {String(m).padStart(2,"0")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const Avatar=({nombre,apellidos,size=40})=>{
  const i=((nombre?.[0]||"")+(apellidos?.[0]||"")).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,color:C.aL,flexShrink:0}}>{i}</div>;
};
export const Modal=({onClose,title,children,width})=>(
  <div style={st.modal} onClick={onClose}>
    <div style={st.modalBox(width)} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontSize:17,fontWeight:700}}>{title}</span>
        <button style={st.btn("ghost")} onClick={onClose}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
export const Field=({label,children})=><div><label style={st.label}>{label}</label>{children}</div>;
export const MFooter=({onCancel,onSave,saveLabel="Guardar",saving=false})=>(
  <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
    <button style={st.btn("ghost")} onClick={onCancel}>Cancelar</button>
    <button style={st.btn()} onClick={onSave} disabled={saving}>{saving?"Guardando...":saveLabel}</button>
  </div>
);
export const Empty=({text})=><div style={{color:C.muted,fontSize:14,padding:"28px 20px",textAlign:"center",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`}}>{text}</div>;
export const SecLabel=({text})=><div style={{fontSize:11,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500,margin:"12px 0 8px"}}>{text}</div>;
export const StatCard=({val,label,color})=><div style={st.statCard}><div style={{fontSize:28,fontWeight:700,color:color||C.accent,letterSpacing:"-1px"}}>{val}</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>{label}</div></div>;
