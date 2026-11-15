import { useMemo, useState } from "react";
import { MONTHS_ES } from "./constantes.js";
import { C, st } from "./estilos.js";
import { Empty, Field, Modal, SecLabel, StatCard } from "./ui.jsx";
import { toYMD, today } from "./utilidades.js";

// ══════════════════════════════════════════════════════════════════════════════
// INFORME MENSUAL
// ══════════════════════════════════════════════════════════════════════════════
export function InformeMensual({patients,citas,onClose}){
  const[mes,setMes]=useState(()=>toYMD(today()).slice(0,7));

  const data=useMemo(()=>{
    // Sesiones de pacientes ese mes
    const sesiones=patients.flatMap(p=>p.sesiones.filter(s=>s.fecha.startsWith(mes)).map(s=>({...s,paciente:`${p.nombre} ${p.apellidos}`})));
    const cobrado=sesiones.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0);
    const pendiente=sesiones.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0);
    const porPaciente=patients.map(p=>{
      const ss=p.sesiones.filter(s=>s.fecha.startsWith(mes));
      return{nombre:`${p.nombre} ${p.apellidos}`,sesiones:ss.length,cobrado:ss.filter(s=>s.pagado).reduce((a,s)=>a+s.pago,0),pendiente:ss.filter(s=>!s.pagado).reduce((a,s)=>a+s.pago,0)};
    }).filter(p=>p.sesiones>0);
    // Citas del calendario ese mes
    const citasMes=citas.filter(c=>c.fecha.startsWith(mes)).map(c=>{
      const p=patients.find(pt=>pt.id==c.pacienteId);
      return{...c,nombrePaciente:c.origen==="calendly"?(c.nombreExterno||"Primera llamada"):(p?`${p.nombre} ${p.apellidos}`:"Sin asignar")};
    }).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.hora.localeCompare(b.hora));
    return{sesiones,cobrado,pendiente,porPaciente,citasMes,totalCitas:citasMes.length};
  },[mes,patients,citas]);

  const maxBar=Math.max(...data.porPaciente.map(p=>p.cobrado+p.pendiente),1);
  const mesLabel=`${MONTHS_ES[parseInt(mes.split("-")[1])-1]} ${mes.split("-")[0]}`;

  const exportPDF=()=>{
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe ${mesLabel}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#3B2A1E;background:#F5EFE4;padding:32px;max-width:820px;margin:0 auto;}
      h1{font-size:22px;color:#A66B3F;border-bottom:2px solid #A66B3F;padding-bottom:10px;margin-bottom:6px;}
      h2{font-size:13px;background:#EBE3D2;padding:7px 12px;border-left:4px solid #A66B3F;margin-top:28px;color:#3B2A1E;text-transform:uppercase;letter-spacing:0.05em;}
      .sub{font-size:11px;color:#9A7E68;margin-bottom:20px;}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0;}
      .stat{background:#FBF8F1;border:1px solid #D9C9A8;border-radius:8px;padding:12px 16px;}
      .stat .val{font-size:22px;font-weight:700;color:#A66B3F;}
      .stat .lbl{font-size:10px;color:#9A7E68;text-transform:uppercase;letter-spacing:0.05em;margin-top:3px;}
      table{width:100%;border-collapse:collapse;margin-top:10px;}
      th{background:#EBE3D2;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;border:1px solid #D9C9A8;color:#6B4A30;}
      td{padding:8px 10px;border:1px solid #D9C9A8;font-size:11px;vertical-align:top;}
      tr:nth-child(even) td{background:#FBF8F1;}
      .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;}
      .pagado{background:#E8EFE2;color:#4A6438;}
      .pendiente{background:#FDF3DC;color:#8A5F1B;}
      .bar-wrap{background:#EBE3D2;border-radius:4px;height:8px;overflow:hidden;margin-top:4px;}
      .bar-cob{height:100%;background:#6B8C5A;display:inline-block;}
      .bar-pen{height:100%;background:#C48C2A;display:inline-block;}
      footer{margin-top:40px;padding-top:10px;border-top:1px solid #D9C9A8;font-size:10px;color:#B89271;}
      @media print{body{padding:10px;background:white;}}
    </style></head><body>
    <h1>Informe mensual — ${mesLabel}</h1>
    <div class="sub">Generado el ${toYMD(today())} · Praxi Gestión Clínica</div>

    <div class="stats">
      <div class="stat"><div class="val">${data.cobrado}€</div><div class="lbl">Cobrado</div></div>
      <div class="stat"><div class="val">${data.pendiente}€</div><div class="lbl">Pendiente</div></div>
      <div class="stat"><div class="val">${data.sesiones.length}</div><div class="lbl">Sesiones</div></div>
      <div class="stat"><div class="val">${data.totalCitas}</div><div class="lbl">Citas totales</div></div>
    </div>

    <h2>Ingresos por paciente</h2>
    ${data.porPaciente.length===0?"<p>Sin sesiones este mes.</p>":`
    <table>
      <thead><tr><th>Paciente</th><th>Sesiones</th><th>Cobrado</th><th>Pendiente</th><th>Total</th></tr></thead>
      <tbody>${data.porPaciente.map(p=>`
        <tr>
          <td>${p.nombre}</td>
          <td style="text-align:center">${p.sesiones}</td>
          <td><span class="badge pagado">${p.cobrado}€</span></td>
          <td>${p.pendiente>0?`<span class="badge pendiente">${p.pendiente}€</span>`:"-"}</td>
          <td><strong>${p.cobrado+p.pendiente}€</strong></td>
        </tr>`).join("")}
        <tr style="background:#EBE3D2;font-weight:700">
          <td>TOTAL</td><td style="text-align:center">${data.sesiones.length}</td>
          <td>${data.cobrado}€</td><td>${data.pendiente}€</td>
          <td>${data.cobrado+data.pendiente}€</td>
        </tr>
      </tbody>
    </table>`}

    <h2>Detalle de sesiones facturadas</h2>
    ${data.sesiones.length===0?"<p>Sin sesiones.</p>":`
    <table>
      <thead><tr><th>Paciente</th><th>Fecha</th><th>Factura</th><th>Importe</th><th>Estado</th></tr></thead>
      <tbody>${[...data.sesiones].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(s=>`
        <tr><td>${s.paciente}</td><td>${s.fecha}</td><td>${s.factura}</td>
        <td><strong>${s.pago}€</strong></td>
        <td><span class="badge ${s.pagado?"pagado":"pendiente"}">${s.pagado?"Pagado":"Pendiente"}</span></td></tr>`).join("")}
      </tbody>
    </table>`}

    <h2>Todas las citas del mes</h2>
    ${data.citasMes.length===0?"<p>Sin citas registradas.</p>":`
    <table>
      <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Tipo de cita</th><th>Duración</th><th>Origen</th></tr></thead>
      <tbody>${data.citasMes.map(c=>`
        <tr><td>${c.fecha}</td><td>${c.hora}</td><td>${c.nombrePaciente}</td>
        <td>${c.tipo||"-"}</td><td>${c.duracion} min</td>
        <td>${c.origen==="calendly"?"Calendly":"Interno"}</td></tr>`).join("")}
      </tbody>
    </table>`}

    <footer>Praxi · Gestión Clínica · Informe ${mesLabel} · Total cobrado: ${data.cobrado}€ · Total pendiente: ${data.pendiente}€</footer>
    </body></html>`;

    const win=window.open("","_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(()=>win.print(),400);
  };

  return(
    <Modal onClose={onClose} title={`Informe mensual — ${mesLabel}`} width={660}>
      <div style={{display:"flex",gap:12,alignItems:"flex-end",marginBottom:20}}>
        <Field label="Mes"><input type="month" style={{...st.input,width:160}} value={mes} onChange={e=>setMes(e.target.value)}/></Field>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        <StatCard val={`${data.cobrado}€`} label="Cobrado" color={C.green}/>
        <StatCard val={`${data.pendiente}€`} label="Pendiente" color={C.amber}/>
        <StatCard val={data.sesiones.length} label="Sesiones" color={C.aL}/>
        <StatCard val={data.totalCitas} label="Citas totales" color={C.text}/>
      </div>

      {/* Barras por paciente */}
      {data.porPaciente.length===0&&<Empty text="Sin sesiones este mes"/>}
      {data.porPaciente.map((p,i)=>(
        <div key={i} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
            <span style={{fontWeight:600}}>{p.nombre}</span>
            <span style={{color:C.muted}}>{p.sesiones} ses · <span style={{color:C.green}}>{p.cobrado}€</span>{p.pendiente>0&&<span style={{color:C.amber}}> +{p.pendiente}€ pend.</span>}</span>
          </div>
          <div style={{height:8,background:C.sand,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",display:"flex"}}>
              <div style={{width:`${(p.cobrado/maxBar)*100}%`,background:C.green,transition:"width 0.4s"}}/>
              <div style={{width:`${(p.pendiente/maxBar)*100}%`,background:C.amber}}/>
            </div>
          </div>
        </div>
      ))}

      {/* Citas del mes */}
      {data.citasMes.length>0&&(
        <div style={{marginTop:20}}>
          <SecLabel text={`Citas del mes (${data.citasMes.length})`}/>
          <div style={{background:C.bone,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                <th style={st.th}>Fecha</th>
                <th style={st.th}>Hora</th>
                <th style={st.th}>Paciente</th>
                <th style={st.th}>Tipo</th>
                <th style={st.th}>Origen</th>
              </tr></thead>
              <tbody>{data.citasMes.map((c,i)=>(
                <tr key={i}>
                  <td style={st.td}>{c.fecha}</td>
                  <td style={st.td}>{c.hora}</td>
                  <td style={st.td}>{c.nombrePaciente}</td>
                  <td style={st.td}>{c.tipo||"—"}</td>
                  <td style={st.td}><span style={st.badge(c.origen==="calendly"?C.teal:C.walnut,c.origen==="calendly"?C.tD:C.sand)}>{c.origen==="calendly"?"Calendly":"Interno"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"space-between"}}>
        <button style={st.btn("ghost")} onClick={onClose}>Cerrar</button>
        <button style={{...st.btn(),background:C.accent,color:C.bone}} onClick={exportPDF}>🖨 Exportar PDF</button>
      </div>
    </Modal>
  );
}
