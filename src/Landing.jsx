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


const DEMO_HTML = `<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Instrument+Serif:ital@1&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Manrope',sans-serif}
body{background:#F5EFE4;display:flex;height:560px;overflow:hidden}
.nav-item{padding:7px 16px;font-size:11px;cursor:pointer;color:#9A7E68;font-weight:400;transition:all 0.15s}
.nav-item:hover{background:rgba(166,107,63,0.05);color:#A66B3F}
.nav-item.active{background:rgba(166,107,63,0.1);color:#A66B3F;font-weight:600}
.nav-sub{padding:5px 16px 5px 28px;font-size:10px;cursor:pointer;color:#9A7E68}
.nav-sub:hover{color:#A66B3F}
.nav-sub.active{color:#A66B3F;font-weight:600}
.section{display:none;padding:20px;overflow-y:auto;height:100%}
.section.active{display:block}
.card{background:#FBF8F1;border-radius:10px;border:1px solid #D9C9A8}
.badge-green{background:#E8EFE2;color:#4A6438;font-size:9px;font-weight:600;padding:2px 8px;border-radius:20px;display:inline-block}
.badge-amber{background:#FDF3DC;color:#C48C2A;font-size:9px;font-weight:600;padding:2px 8px;border-radius:20px;display:inline-block}
.badge-terra{background:rgba(166,107,63,0.1);color:#A66B3F;font-size:9px;font-weight:600;padding:2px 8px;border-radius:20px;display:inline-block}
.tab{padding:5px 11px;border-radius:8px;font-size:10px;border:1px solid #D9C9A8;cursor:pointer;background:#FBF8F1;color:#9A7E68;white-space:nowrap}
.tab.active{background:#A66B3F;color:#FBF8F1;border-color:#A66B3F}
.row-item{padding:9px 14px;border-bottom:1px solid #D9C9A8;display:flex;align-items:center;gap:10px;cursor:pointer}
.row-item:hover{background:rgba(166,107,63,0.04)}
.avatar{width:30px;height:30px;border-radius:50%;background:#A66B3F;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#FBF8F1;flex-shrink:0}
.slabel{font-size:9px;color:#6B4A30;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;margin-bottom:8px}
</style></head><body>
<div style="width:185px;background:#F5EFE4;border-right:1px solid #D9C9A8;flex-shrink:0;display:flex;flex-direction:column">
  <div style="padding:14px 16px 10px;border-bottom:1px solid #D9C9A8;margin-bottom:6px">
    <div style="display:flex;align-items:flex-end;line-height:1">
      <span style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;color:#A66B3F">pra</span>
      <span style="font-family:'Playfair Display',serif;font-style:italic;font-size:18px;color:#A66B3F;line-height:0.9;margin-left:1px">X</span>
      <span style="font-family:'Playfair Display',serif;font-style:italic;font-size:15px;color:#A66B3F">i</span>
      <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#A66B3F;margin-left:6px;margin-bottom:2px"></span>
    </div>
    <div style="font-size:7px;color:#9A7E68;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px">gestión clínica</div>
  </div>
  <div class="nav-item active" onclick="show('dashboard')">▪ Dashboard</div>
  <div class="nav-item" onclick="show('calendario')">▪ Calendario</div>
  <div class="nav-item" onclick="show('pacientes')">▪ Pacientes</div>
  <div class="nav-sub" onclick="show('ficha')">↳ Ficha paciente</div>
  <div class="nav-item" onclick="show('facturas')">▪ Facturas</div>
  <div class="nav-item" onclick="show('recursos')">▪ Recursos</div>
  <div style="margin-top:auto;padding:10px 16px;border-top:1px solid #D9C9A8;display:flex;align-items:center;gap:8px">
    <div style="width:24px;height:24px;border-radius:50%;background:#A66B3F;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#FBF8F1">K</div>
    <div><div style="font-size:10px;font-weight:600;color:#3B2A1E">Kevin Costa</div><div style="font-size:8px;color:#9A7E68">Neuropsicólogo</div></div>
  </div>
</div>
<div style="flex:1;overflow:hidden">

<div id="s-dashboard" class="section active">
  <div style="font-family:'Instrument Serif',serif;font-size:19px;color:#221610;font-style:italic;margin-bottom:4px">Dashboard</div>
  <div style="font-size:10px;color:#9A7E68;margin-bottom:14px">Lunes, 11 de agosto de 2026</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px">
    <div class="card" style="padding:10px"><div style="font-size:19px;font-weight:700;color:#A66B3F">15</div><div style="font-size:9px;color:#9A7E68;margin-top:1px">Pacientes activos</div></div>
    <div class="card" style="padding:10px"><div style="font-size:19px;font-weight:700;color:#A66B3F">5</div><div style="font-size:9px;color:#9A7E68;margin-top:1px">Citas hoy</div></div>
    <div class="card" style="padding:10px"><div style="font-size:19px;font-weight:700;color:#A66B3F">830€</div><div style="font-size:9px;color:#9A7E68;margin-top:1px">Cobrado mes</div></div>
    <div class="card" style="padding:10px"><div style="font-size:19px;font-weight:700;color:#A66B3F">320€</div><div style="font-size:9px;color:#9A7E68;margin-top:1px">Pendiente</div></div>
  </div>
  <div class="card" style="padding:12px;margin-bottom:10px">
    <div class="slabel">Citas de hoy</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">
      <div style="padding:7px;background:#F5EFE4;border-radius:8px;border:1px solid #D9C9A8"><div style="font-size:9px;color:#9A7E68">09:00</div><div style="font-size:10px;font-weight:600;color:#221610">María González</div><div style="font-size:9px;color:#9A7E68">60min</div></div>
      <div style="padding:7px;background:#F5EFE4;border-radius:8px;border:1px solid #D9C9A8"><div style="font-size:9px;color:#4A7B6B">10:00 · Calendly</div><div style="font-size:10px;font-weight:600;color:#221610">Primera llamada</div><div style="font-size:9px;color:#9A7E68">30min</div></div>
      <div style="padding:7px;background:#F5EFE4;border-radius:8px;border:1px solid #D9C9A8"><div style="font-size:9px;color:#9A7E68">11:00</div><div style="font-size:10px;font-weight:600;color:#221610">Carlos Ruiz</div><div style="font-size:9px;color:#9A7E68">60min</div></div>
      <div style="padding:7px;background:#F5EFE4;border-radius:8px;border:1px solid #D9C9A8"><div style="font-size:9px;color:#9A7E68">12:00</div><div style="font-size:10px;font-weight:600;color:#221610">Laura Sánchez</div><div style="font-size:9px;color:#9A7E68">90min</div></div>
      <div style="padding:7px;background:#F5EFE4;border-radius:8px;border:1px solid #D9C9A8"><div style="font-size:9px;color:#9A7E68">16:00</div><div style="font-size:10px;font-weight:600;color:#221610">Miguel García</div><div style="font-size:9px;color:#9A7E68">60min</div></div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 200px;gap:10px">
    <div class="card" style="padding:12px">
      <div class="slabel">Agenda personal</div>
      <div style="display:flex;flex-direction:column;gap:7px">
        <div style="display:flex;gap:7px;align-items:center"><div style="width:7px;height:7px;border-radius:50%;background:#B85040;flex-shrink:0"></div><div style="font-size:10px;color:#3B2A1E;flex:1">Supervisión clínica</div><div style="font-size:9px;color:#9A7E68">15:00</div></div>
        <div style="display:flex;gap:7px;align-items:center"><div style="width:7px;height:7px;border-radius:50%;background:#C48C2A;flex-shrink:0"></div><div style="font-size:10px;color:#3B2A1E;flex:1">Enviar informe derivación</div><div style="font-size:9px;color:#9A7E68">Mañana</div></div>
        <div style="display:flex;gap:7px;align-items:center"><div style="width:7px;height:7px;border-radius:50%;background:#4A6438;flex-shrink:0"></div><div style="font-size:10px;color:#3B2A1E;flex:1">Formación EMDR</div><div style="font-size:9px;color:#9A7E68">Viernes</div></div>
      </div>
    </div>
    <div class="card" style="padding:12px">
      <div class="slabel">✦ Asistente IA</div>
      <div style="font-size:10px;color:#9A7E68;line-height:1.5;font-style:italic">"Laura lleva 5 sesiones — considera revisar objetivos en la próxima."</div>
    </div>
  </div>
</div>

<div id="s-calendario" class="section">
  <div style="font-family:'Instrument Serif',serif;font-size:19px;color:#221610;font-style:italic;margin-bottom:12px">Calendario semanal</div>
  <div class="card" style="overflow:hidden">
    <div style="display:grid;grid-template-columns:40px repeat(7,1fr);border-bottom:1px solid #D9C9A8">
      <div style="background:#F5EFE4"></div>
      <div style="padding:7px 3px;text-align:center;background:rgba(166,107,63,0.08);border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#A66B3F;text-transform:uppercase;font-weight:600">Lun</div><div style="font-size:14px;font-weight:700;color:#A66B3F">11</div><div style="width:4px;height:4px;border-radius:50%;background:#A66B3F;margin:2px auto 0"></div></div>
      <div style="padding:7px 3px;text-align:center;border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#9A7E68;text-transform:uppercase">Mar</div><div style="font-size:14px;color:#221610">12</div><div style="width:4px;height:4px;border-radius:50%;background:#A66B3F;margin:2px auto 0"></div></div>
      <div style="padding:7px 3px;text-align:center;border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#9A7E68;text-transform:uppercase">Mié</div><div style="font-size:14px;color:#221610">13</div></div>
      <div style="padding:7px 3px;text-align:center;border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#9A7E68;text-transform:uppercase">Jue</div><div style="font-size:14px;color:#221610">14</div><div style="width:4px;height:4px;border-radius:50%;background:#A66B3F;margin:2px auto 0"></div></div>
      <div style="padding:7px 3px;text-align:center;border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#9A7E68;text-transform:uppercase">Vie</div><div style="font-size:14px;color:#221610">15</div><div style="width:4px;height:4px;border-radius:50%;background:#A66B3F;margin:2px auto 0"></div></div>
      <div style="padding:7px 3px;text-align:center;border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#9A7E68;text-transform:uppercase">Sáb</div><div style="font-size:14px;color:#221610">16</div></div>
      <div style="padding:7px 3px;text-align:center;border-left:1px solid #D9C9A8"><div style="font-size:8px;color:#9A7E68;text-transform:uppercase">Dom</div><div style="font-size:14px;color:#221610">17</div></div>
    </div>
    <div style="display:grid;grid-template-columns:40px repeat(7,1fr);height:320px">
      <div style="display:flex;flex-direction:column">
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">09:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">10:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">11:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">12:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">13:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">14:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;border-bottom:1px solid #E2D9C8;text-align:right">15:00</div>
        <div style="flex:1;padding:3px 5px;font-size:8px;color:#9A7E68;text-align:right">16:00</div>
      </div>
      <div style="border-left:1px solid #D9C9A8;position:relative;background:rgba(166,107,63,0.02)">
        <div style="position:absolute;top:2px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">09:00 María G.</div></div>
        <div style="position:absolute;top:42px;left:2px;right:2px;background:rgba(74,123,107,0.12);border:1px solid #4A7B6B;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#4A7B6B">10:00 Calendly</div></div>
        <div style="position:absolute;top:82px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">11:00 Carlos R.</div></div>
        <div style="position:absolute;top:122px;left:2px;right:2px;height:58px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">12:00 Laura S. 90min</div></div>
        <div style="position:absolute;top:282px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">16:00 Miguel G.</div></div>
      </div>
      <div style="border-left:1px solid #D9C9A8;position:relative">
        <div style="position:absolute;top:22px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">09:30 Ana M.</div></div>
        <div style="position:absolute;top:82px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">11:00 Pedro L.</div></div>
      </div>
      <div style="border-left:1px solid #D9C9A8"></div>
      <div style="border-left:1px solid #D9C9A8;position:relative">
        <div style="position:absolute;top:2px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">09:00 Elena V.</div></div>
        <div style="position:absolute;top:90px;left:2px;right:2px;height:58px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">11:30 Isabel M. 90min</div></div>
      </div>
      <div style="border-left:1px solid #D9C9A8;position:relative">
        <div style="position:absolute;top:42px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">10:00 Sofía R.</div></div>
        <div style="position:absolute;top:82px;left:2px;right:2px;background:rgba(166,107,63,0.15);border:1px solid #A66B3F;border-radius:4px;padding:2px 4px"><div style="font-size:8px;font-weight:600;color:#A66B3F">11:00 Antonio P.</div></div>
      </div>
      <div style="border-left:1px solid #D9C9A8"></div>
      <div style="border-left:1px solid #D9C9A8"></div>
    </div>
  </div>
</div>

<div id="s-pacientes" class="section">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <div style="font-family:'Instrument Serif',serif;font-size:19px;color:#221610;font-style:italic">Pacientes</div>
    <input placeholder="Buscar..." style="border:1px solid #D9C9A8;border-radius:8px;padding:5px 10px;font-size:10px;background:#FBF8F1;color:#9A7E68;outline:none;width:140px"/>
  </div>
  <div class="card" style="overflow:hidden">
    <div class="row-item" onclick="show('ficha')"><div class="avatar">M</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">María González López</div><div style="font-size:9px;color:#9A7E68">Ansiedad generalizada · 4 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar">C</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Carlos Ruiz Martínez</div><div style="font-size:9px;color:#9A7E68">Depresión mayor · 3 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar">A</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Ana Martínez Vega</div><div style="font-size:9px;color:#9A7E68">Fobia social · 3 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar">J</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Javier Fernández Mora</div><div style="font-size:9px;color:#9A7E68">Trastorno adaptativo · 3 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar">L</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Laura Sánchez Díaz</div><div style="font-size:9px;color:#9A7E68">TCA restricción · 5 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar">P</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Pedro López Castillo</div><div style="font-size:9px;color:#9A7E68">TOC · 3 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar">S</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Sofía Ramírez Torres</div><div style="font-size:9px;color:#9A7E68">Duelo complicado · 2 sesiones</div></div><span class="badge-terra">Activo</span></div>
    <div class="row-item" onclick="show('ficha')"><div class="avatar" style="background:#4A6438">C</div><div style="flex:1"><div style="font-size:11px;font-weight:600;color:#221610">Carmen Herrera Blanco</div><div style="font-size:9px;color:#9A7E68">Fobia a agujas · 4 sesiones</div></div><span class="badge-green">Alta</span></div>
  </div>
  <div style="padding:7px 0;font-size:9px;color:#9A7E68;text-align:center">Haz clic en un paciente para ver su ficha →</div>
</div>

<div id="s-ficha" class="section">
  <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:12px">
    <div class="avatar" style="width:38px;height:38px;font-size:14px">M</div>
    <div style="flex:1">
      <div style="font-size:17px;font-weight:700;color:#221610">María González López</div>
      <div style="font-size:10px;color:#9A7E68;margin-top:2px">612 345 678 · maria@email.com</div>
      <div style="display:flex;gap:8px;margin-top:4px;align-items:center">
        <span style="font-size:10px;color:#6B4A30;font-weight:500">4 sesiones</span>
        <span style="color:#D9C9A8">·</span>
        <span style="font-size:10px;color:#9A7E68">1/2 objetivos</span>
        <div style="height:4px;width:50px;background:#E2D9C8;border-radius:99px;overflow:hidden"><div style="height:100%;width:50%;background:#4A6438;border-radius:99px"></div></div>
      </div>
    </div>
    <span class="badge-terra">Activo</span>
  </div>
  <div class="card" style="padding:10px 12px;border-left:3px solid #A66B3F;margin-bottom:10px">
    <div style="font-size:9px;color:#9A7E68;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">Motivo de consulta</div>
    <div style="font-size:11px;color:#3B2A1E;line-height:1.5">Ansiedad generalizada con episodios frecuentes de preocupación excesiva, insomnio y tensión muscular.</div>
  </div>
  <div style="display:flex;gap:5px;margin-bottom:10px;overflow-x:auto;padding-bottom:2px">
    <div class="tab">Historia clínica</div>
    <div class="tab">Formulación</div>
    <div class="tab active">Evolución</div>
    <div class="tab">Objetivos</div>
    <div class="tab">Pruebas</div>
    <div class="tab">Sesiones</div>
  </div>
  <div class="card" style="overflow:hidden">
    <div style="padding:8px 12px;border-bottom:1px solid #D9C9A8;background:#F5EFE4"><div class="slabel" style="margin:0">Evolución clínica</div></div>
    <div style="padding:9px 12px;border-bottom:1px solid #D9C9A8"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;font-weight:600;color:#A66B3F">Sesión 4</span><span style="font-size:9px;color:#9A7E68">2026-03-01</span></div><div style="font-size:10px;color:#3B2A1E;line-height:1.5">Reestructuración cognitiva. Distorsiones identificadas. Buena adherencia al autorregistro.</div></div>
    <div style="padding:9px 12px;border-bottom:1px solid #D9C9A8"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;font-weight:600;color:#A66B3F">Sesión 3</span><span style="font-size:9px;color:#9A7E68">2026-02-15</span></div><div style="font-size:10px;color:#3B2A1E;line-height:1.5">Respiración diafragmática. Técnica 4-7-8. La paciente la practica diariamente.</div></div>
    <div style="padding:9px 12px;border-bottom:1px solid #D9C9A8"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;font-weight:600;color:#A66B3F">Sesión 2</span><span style="font-size:9px;color:#9A7E68">2026-02-01</span></div><div style="font-size:10px;color:#3B2A1E;line-height:1.5">Psicoeducación sobre ansiedad. Registro de pensamientos automáticos iniciado.</div></div>
    <div style="padding:9px 12px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;font-weight:600;color:#A66B3F">Sesión 1</span><span style="font-size:9px;color:#9A7E68">2026-01-15</span></div><div style="font-size:10px;color:#3B2A1E;line-height:1.5">Evaluación inicial. Historia clínica completa. Rapport establecido.</div></div>
  </div>
</div>

<div id="s-facturas" class="section">
  <div style="font-family:'Instrument Serif',serif;font-size:19px;color:#221610;font-style:italic;margin-bottom:12px">Facturas</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px">
    <div class="card" style="padding:10px"><div style="font-size:9px;color:#9A7E68;margin-bottom:3px">Total cobrado</div><div style="font-size:18px;font-weight:700;color:#4A6438">3.440€</div></div>
    <div class="card" style="padding:10px"><div style="font-size:9px;color:#9A7E68;margin-bottom:3px">Pendiente</div><div style="font-size:18px;font-weight:700;color:#C48C2A">320€</div></div>
    <div class="card" style="padding:10px"><div style="font-size:9px;color:#9A7E68;margin-bottom:3px">Este mes</div><div style="font-size:18px;font-weight:700;color:#A66B3F">830€</div></div>
  </div>
  <div class="card" style="overflow:hidden">
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:7px 12px;border-bottom:1px solid #D9C9A8;font-size:8px;color:#9A7E68;text-transform:uppercase;letter-spacing:0.07em;font-weight:600">
      <div>Paciente</div><div>Factura</div><div>Importe</div><div>Estado</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:8px 12px;border-bottom:1px solid #D9C9A8;align-items:center"><div style="font-size:10px;font-weight:500;color:#221610">María González</div><div style="font-size:9px;color:#9A7E68">FAC-104</div><div style="font-size:10px;font-weight:600">80€</div><span class="badge-amber">Pendiente</span></div>
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:8px 12px;border-bottom:1px solid #D9C9A8;align-items:center"><div style="font-size:10px;font-weight:500;color:#221610">Carlos Ruiz</div><div style="font-size:9px;color:#9A7E68">FAC-203</div><div style="font-size:10px;font-weight:600">80€</div><span class="badge-amber">Pendiente</span></div>
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:8px 12px;border-bottom:1px solid #D9C9A8;align-items:center"><div style="font-size:10px;font-weight:500;color:#221610">Laura Sánchez</div><div style="font-size:9px;color:#9A7E68">FAC-505</div><div style="font-size:10px;font-weight:600">90€</div><span class="badge-amber">Pendiente</span></div>
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:8px 12px;border-bottom:1px solid #D9C9A8;align-items:center"><div style="font-size:10px;font-weight:500;color:#221610">Ana Martínez</div><div style="font-size:9px;color:#9A7E68">FAC-303</div><div style="font-size:10px;font-weight:600">80€</div><span class="badge-green">Pagada</span></div>
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:8px 12px;border-bottom:1px solid #D9C9A8;align-items:center"><div style="font-size:10px;font-weight:500;color:#221610">Miguel García</div><div style="font-size:9px;color:#9A7E68">FAC-804</div><div style="font-size:10px;font-weight:600">80€</div><span class="badge-green">Pagada</span></div>
    <div style="display:grid;grid-template-columns:1fr 90px 60px 75px;padding:8px 12px;align-items:center"><div style="font-size:10px;font-weight:500;color:#221610">Javier Fernández</div><div style="font-size:9px;color:#9A7E68">FAC-403</div><div style="font-size:10px;font-weight:600">90€</div><span class="badge-green">Pagada</span></div>
  </div>
</div>

<div id="s-recursos" class="section">
  <div style="font-family:'Instrument Serif',serif;font-size:19px;color:#221610;font-style:italic;margin-bottom:6px">Recursos</div>
  <div style="font-size:11px;color:#9A7E68;margin-bottom:16px">Biblioteca de materiales clínicos según tu plan</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;opacity:0.55">
    <div class="card" style="padding:20px;text-align:center"><div style="font-size:28px;margin-bottom:8px">👤</div><div style="font-size:12px;font-weight:600;color:#221610;margin-bottom:4px">Para el paciente</div><div style="font-size:10px;color:#9A7E68;line-height:1.5">Autorregistros, psicoeducación y hojas de trabajo.</div></div>
    <div class="card" style="padding:20px;text-align:center"><div style="font-size:28px;margin-bottom:8px">🧠</div><div style="font-size:12px;font-weight:600;color:#221610;margin-bottom:4px">Para el profesional</div><div style="font-size:10px;color:#9A7E68;line-height:1.5">Protocolos, escalas y guías clínicas.</div></div>
  </div>
  <div style="background:#E2D9C8;border-radius:10px;padding:14px 18px;text-align:center;border:1px solid #D9C9A8">
    <div style="font-size:12px;font-weight:600;color:#6B4A30;margin-bottom:3px">Próximamente</div>
    <div style="font-size:11px;color:#9A7E68">Disponible en el lanzamiento.</div>
  </div>
</div>

</div>
<script>
function show(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item,.nav-sub').forEach(n=>n.classList.remove('active'));
  document.getElementById('s-'+id).classList.add('active');
  var nav=document.querySelector('[onclick="show(\''+id+'\')"]');
  if(nav)nav.classList.add('active');
}
</script>
</body></html>`;

const Logo = ({ size = 22, textColor = C.ink }) => (
  <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1, gap: 0 }}>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size, color: textColor, letterSpacing: "-0.5px" }}>pra</span>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size * 1.18, color: C.accent, letterSpacing: "-0.5px", lineHeight: 0.9, marginLeft: 2 }}>X</span>
    <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: size, color: textColor, letterSpacing: "-0.5px" }}>i</span>
    <span style={{ display: "inline-block", width: size * 0.27, height: size * 0.27, borderRadius: "50%", background: C.accent, marginLeft: size * 0.45, marginBottom: size * 0.13, flexShrink: 0 }} />
  </div>
);

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
      <section style={{ maxWidth: 1000, margin: "0 auto 90px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", lineHeight: 1, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 18, color: C.ink, letterSpacing: "-0.5px" }}>Explora las diferentes secciones de pra</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 21, color: C.accent, letterSpacing: "-0.5px", lineHeight: 0.9, marginLeft: 2 }}>X</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 18, color: C.ink, letterSpacing: "-0.5px" }}>i</span>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.accent, marginLeft: 9, marginBottom: 3 }} />
          </div>
        </div>
        <div style={{ background: C.ink, borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 80px rgba(34,22,16,0.2)" }}>
          <div style={{ background: "#1A0E08", padding: "10px 16px", display: "flex", gap: 6, alignItems: "center" }}>
            {["#FF5F57","#FFBD2E","#28CA41"].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:"50%",background:c}}/>)}
            <div style={{flex:1,background:"#2A1E18",borderRadius:6,height:22,margin:"0 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:10,color:"#6B4A30"}}>praxi-kevin-8beb.vercel.app/app</span>
            </div>
          </div>
          <iframe
            srcDoc={DEMO_HTML}
            style={{width:"100%",height:560,border:"none",display:"block"}}
            scrolling="no"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1000, margin: "0 auto 90px", padding: "0 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 22, color: C.ink, margin: 0, letterSpacing: "-0.3px" }}>Todo lo que necesitas en un solo sitio</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 48px" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: "28px 0", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "64px 1fr", gap: 24, alignItems: "start" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 400, fontSize: 48, color: C.sand, lineHeight: 1, letterSpacing: "-2px", userSelect: "none" }}>
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.ink, borderRadius: 14, padding: "12px 24px" }}>
            <span style={{ fontSize: 20 }}>🎁</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.bone, letterSpacing: "-0.2px" }}>Los primeros 3 meses son gratuitos</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Para los primeros profesionales que soliciten acceso. Sin tarjeta de crédito.</div>
            </div>
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
