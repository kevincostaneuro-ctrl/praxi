import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, st } from "./estilos.js";
import { Field } from "./ui.jsx";
import { hourLabel, traducirError } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ══════════════════════════════════════════════════════════════════════════════
export function Configuracion({horario,setHorario,tipos,setTipos}){
  const[editTipo,setEditTipo]=useState(null);
  const[tipoForm,setTipoForm]=useState({nombre:"",duracion:60});
  const[horarioForm,setHorarioForm]=useState({start:horario.start,end:horario.end});

  const saveHorario=()=>{
    if(Number(horarioForm.start)>=Number(horarioForm.end)){alert("La hora de inicio debe ser anterior a la de fin.");return;}
    setHorario({start:Number(horarioForm.start),end:Number(horarioForm.end)});
  };
  const openNewTipo=()=>{setTipoForm({nombre:"",duracion:60});setEditTipo("new");};
  const openEditTipo=t=>{setTipoForm({nombre:t.nombre,duracion:t.duracion});setEditTipo(t.id);};
  const saveTipo=()=>{
    if(!tipoForm.nombre.trim())return;
    if(editTipo==="new")setTipos(ts=>[...ts,{id:"t"+Date.now(),nombre:tipoForm.nombre,duracion:Number(tipoForm.duracion)}]);
    else setTipos(ts=>ts.map(t=>t.id===editTipo?{...t,nombre:tipoForm.nombre,duracion:Number(tipoForm.duracion)}:t));
    setEditTipo(null);
  };
  const delTipo=id=>{if(tipos.length<=1){alert("Debe quedar al menos un tipo de cita.");return;}if(confirm("¿Eliminar?"))setTipos(ts=>ts.filter(t=>t.id!==id));};

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:36,fontWeight:400,fontFamily:"'Instrument Serif',serif",letterSpacing:"-0.02em"}}>Configuración</div>
        <div style={{color:C.muted,fontSize:13,marginTop:2}}>Horario y tipos de cita del consultorio</div>
      </div>

      {/* Horario */}
      <div style={{...st.card,padding:"22px 26px",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>Horario del calendario</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Define la franja horaria visible en el calendario. Más adelante cada profesional podrá tener la suya.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:14,alignItems:"flex-end"}}>
          <Field label="Hora de inicio">
            <select style={st.input} value={horarioForm.start} onChange={e=>setHorarioForm(h=>({...h,start:Number(e.target.value)}))}>
              {Array.from({length:24},(_,h)=>h).map(h=><option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
          </Field>
          <Field label="Hora de fin">
            <select style={st.input} value={horarioForm.end} onChange={e=>setHorarioForm(h=>({...h,end:Number(e.target.value)}))}>
              {Array.from({length:24},(_,h)=>h+1).map(h=><option key={h} value={h}>{hourLabel(h)}</option>)}
            </select>
          </Field>
          <button style={{...st.btn(),marginBottom:1}} onClick={saveHorario}>Guardar</button>
        </div>
        <div style={{marginTop:14,fontSize:12,color:C.muted,padding:"8px 12px",background:C.bone,borderRadius:8,border:`1px solid ${C.border}`,display:"inline-block"}}>
          Horario actual: <strong style={{color:C.text}}>{hourLabel(horario.start)} – {hourLabel(horario.end)}</strong> ({(horario.end-horario.start)*2} franjas de 30 min)
        </div>
      </div>

      {/* Tipos de cita */}
      <div style={{...st.card,padding:"22px 26px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontSize:15,fontWeight:600}}>Tipos de cita</div>
          <button style={st.btn()} onClick={openNewTipo}>+ Nuevo tipo</button>
        </div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Cada tipo tiene nombre y duración. Se pueden añadir o eliminar en cualquier momento. Más adelante cada profesional tendrá los suyos.</div>

        {tipos.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text}}>{t.nombre}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{t.duracion} min</div>
            </div>
            <button style={st.btn("sm")} onClick={()=>openEditTipo(t)}>Editar</button>
            <button style={{...st.btn("sm"),color:C.red,background:C.rD}} onClick={()=>delTipo(t.id)}>Eliminar</button>
          </div>
        ))}

        {editTipo&&(
          <div style={{marginTop:16,padding:"18px 20px",background:C.card,borderRadius:14,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:C.walnut}}>{editTipo==="new"?"Nuevo tipo de cita":"Editar tipo de cita"}</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:14}}>
              <Field label="Nombre"><input style={st.input} value={tipoForm.nombre} onChange={e=>setTipoForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Revisión, Pareja, Grupo..."/></Field>
              <Field label="Duración (min)"><input type="number" step={5} min={5} style={st.input} value={tipoForm.duracion} onChange={e=>setTipoForm(f=>({...f,duracion:e.target.value}))}/></Field>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={st.btn("ghost")} onClick={()=>setEditTipo(null)}>Cancelar</button>
              <button style={st.btn()} onClick={saveTipo}>Guardar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exportar y borrar la clínica (solo admin) ─────────────────────────────────
export function DatosClinica({clinica,miembros,patients,citas,demo,bloquearDemo,onBorrada}){
  const[confirmar,setConfirmar]=useState("");
  const[borrando,setBorrando]=useState(false);
  const[err,setErr]=useState("");
  const exportar=()=>{
    const datos={
      exportado_en:new Date().toISOString(),
      formato:"Praxi · exportación completa de la clínica (JSON)",
      clinica:{nombre:clinica.nombre,creada:clinica.creado_en},
      equipo:miembros.map(({nombre,email,especialidad,rol,activo})=>({nombre,email,especialidad,rol,activo})),
      pacientes:patients,
      citas,
    };
    const blob=new Blob([JSON.stringify(datos,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`praxi-${(clinica.nombre||"clinica").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();URL.revokeObjectURL(a.href);
  };
  const borrar=async()=>{
    if(demo)return bloquearDemo();
    setErr("");
    if(confirmar.trim()!==clinica.nombre){setErr("Escribe el nombre exacto de la clínica para confirmar.");return;}
    if(!confirm(`Última confirmación: se borrarán para siempre ${patients.length} pacientes, ${citas.length} citas, el equipo y el registro de accesos de "${clinica.nombre}". No se puede deshacer.`))return;
    setBorrando(true);
    const{error}=await supabase.rpc("eliminar_clinica",{p_clinica:clinica.id,p_confirmacion:confirmar.trim()});
    setBorrando(false);
    if(error){setErr(/no coincide/.test(error.message)?"El nombre no coincide con el de la clínica.":traducirError(error));return;}
    onBorrada();
  };
  const seccion={fontSize:12,color:C.walnut,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:500};
  return(
    <>
      <div style={{...st.card,marginTop:16,padding:"16px 20px"}}>
        <div style={{...seccion,marginBottom:8}}>Exportar los datos de la clínica</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>Descarga en un archivo todos los pacientes (con su historia, sesiones, evolución y documentos), las citas y el equipo. Úsalo como copia propia, para conservar la historia clínica o para llevarte tus datos a otro sistema.</div>
        <button style={st.btn()} onClick={exportar}>Descargar todo (JSON)</button>
      </div>
      <div style={{...st.card,marginTop:16,padding:"16px 20px",border:`1px solid ${C.red}`}}>
        <div style={{...seccion,color:C.red,marginBottom:8}}>Borrar la clínica</div>
        <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:12}}>Borra de forma <strong>inmediata y definitiva</strong> la clínica y todos sus datos: pacientes, historias clínicas, citas, equipo y registro de accesos. Antes, <strong>exporta los datos</strong> que estés obligado a conservar (la historia clínica, al menos 5 años según la Ley 41/2002).</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input style={{...st.input,flex:"1 1 240px",width:"auto"}} value={confirmar} onChange={e=>setConfirmar(e.target.value)} placeholder={`Escribe: ${clinica.nombre}`}/>
          <button disabled={borrando} style={{...st.btn("danger"),opacity:borrando?0.6:1}} onClick={borrar}>{borrando?"Borrando…":"Borrar la clínica"}</button>
        </div>
        {err&&<div style={{fontSize:12,color:C.red,marginTop:10}}>{err}</div>}
      </div>
    </>
  );
}
