// Plantilla visual de los recursos de Praxi (HTML → PDF con Chromium).
// Cada recurso es un objeto con cabecera + bloques; aquí están los componentes y el estilo común.
const path = require("path");
const fs = require("fs");

const FUENTES = path.join(__dirname, "fuentes");
const f64 = n => `url(data:font/woff2;base64,${fs.readFileSync(path.join(FUENTES, n)).toString("base64")}) format("woff2")`;

// Color por tema: tinta (fuerte), fondo (suave), medio
const TEMAS = {
  ansiedad:     { c: "#5E7F4E", bg: "#E7EEDF", m: "#B9CCA9", nombre: "Ansiedad" },
  animo:        { c: "#A87F2E", bg: "#F5ECD6", m: "#E2C98F", nombre: "Estado de ánimo" },
  sueno:        { c: "#4F6E80", bg: "#E1E9EE", m: "#A9BFCC", nombre: "Sueño" },
  estres:       { c: "#9A5E3A", bg: "#F4E5D8", m: "#E0BB9C", nombre: "Estrés" },
  crisis:       { c: "#8C4F5F", bg: "#F1E1E5", m: "#D7AEB8", nombre: "Crisis y seguridad" },
  emociones:    { c: "#8C5A6E", bg: "#F0E2E8", m: "#D4B0BF", nombre: "Emociones" },
  relaciones:   { c: "#6E6496", bg: "#E8E5F1", m: "#C2BAD9", nombre: "Relaciones" },
  pensamientos: { c: "#4E6A8F", bg: "#E2E8F0", m: "#AFC0D6", nombre: "Pensamientos" },
  calma:        { c: "#4E8077", bg: "#DFEDEA", m: "#A6CBC4", nombre: "Relajación y mindfulness" },
  crecimiento:  { c: "#86803A", bg: "#F0EEDA", m: "#D3CE97", nombre: "Crecimiento personal" },
  nutricion:    { c: "#6B7D35", bg: "#ECF0DC", m: "#C8D29E", nombre: "Nutrición" },
  neuro:        { c: "#4A6C96", bg: "#E1E8F2", m: "#ABBFDA", nombre: "Neuropsicología" },
  profesional:  { c: "#6B4A30", bg: "#EFE6DA", m: "#D2BFA6", nombre: "Para el profesional" },
};

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Texto con **negrita** y saltos de línea
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/\n/g, "<br/>");

// ── Componentes ──────────────────────────────────────────────────────────────
const B = {
  h: (t, num) => `<h2 class="h">${num ? `<span class="num">${num}</span>` : ""}${md(t)}</h2>`,
  p: t => `<p>${md(t)}</p>`,
  pequeno: t => `<p class="pequeno">${md(t)}</p>`,
  lista: items => `<ul class="lista">${items.map(i => `<li>${md(i)}</li>`).join("")}</ul>`,
  pasos: items => `<ol class="pasos">${items.map((i, k) => `<li><span class="paso-n">${k + 1}</span><div>${md(i)}</div></li>`).join("")}</ol>`,
  tarjeta: (titulo, cuerpo, tipo = "") => `<div class="tarjeta ${tipo}">${titulo ? `<div class="tarjeta-t">${md(titulo)}</div>` : ""}<div>${cuerpo.startsWith("<") ? cuerpo : md(cuerpo)}</div></div>`,
  uso: (texto, profesional) => `<div class="uso"><div class="uso-t">${profesional ? "Cómo usarla en consulta" : "Cómo usar esta ficha"}</div><div>${md(texto)}</div></div>`,
  columnas: (...cols) => `<div class="columnas" style="grid-template-columns:repeat(${cols.length},minmax(0,1fr))">${cols.map(c => `<div>${c}</div>`).join("")}</div>`,
  rejilla: (items, n = 3) => `<div class="rejilla" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${items.map(([t, d, ico]) => `<div class="celda">${ico ? `<div class="celda-ico">${ico}</div>` : ""}<div class="celda-t">${md(t)}</div><div class="celda-d">${md(d)}</div></div>`).join("")}</div>`,
  lineas: (n = 4, etiqueta) => `<div class="lineas">${etiqueta ? `<div class="lineas-e">${md(etiqueta)}</div>` : ""}${"<div class='linea'></div>".repeat(n)}</div>`,
  // Tabla: cabeceras, filas (array de arrays) y n filas vacías para rellenar
  tabla: (cab, filas = [], vacias = 0, opts = {}) => {
    const w = opts.anchos ? `<colgroup>${opts.anchos.map(a => `<col style="width:${a}%"/>`).join("")}</colgroup>` : "";
    const fila = (r, ej) => `<tr class="${ej ? "ejemplo" : ""}"${!ej && opts.altoFilas ? ` style="height:calc(${opts.altoFilas}mm * var(--fila, 1))"` : ""}>${r.map((c, i) => `<td${i === 0 && opts.negrita0 ? ' class="b"' : ""}>${md(c)}</td>`).join("")}</tr>`;
    const ej = opts.ejemplo ? fila(opts.ejemplo, true) : "";
    const vac = Array.from({ length: vacias }, () => `<tr class="vacia" style="height:calc(${opts.alto || 11}mm * var(--fila, 1))">${cab.map(() => "<td></td>").join("")}</tr>`).join("");
    return `<table class="tabla">${w}<thead><tr>${cab.map(c => `<th>${md(c)}</th>`).join("")}</tr></thead><tbody>${ej}${filas.map(r => fila(r)).join("")}${vac}</tbody></table>${opts.ejemplo ? `<div class="ej-nota">La primera fila es un ejemplo.</div>` : ""}`;
  },
  // Escala de intensidad 0–10 coloreada
  // Escala 0–10 coloreada; invertir = el 0 es lo peor (ánimo, energía, calidad)
  escala: (izq = "Nada", der = "La peor imaginable", max = 10, invertir = false) => `<div class="escala">${Array.from({ length: max + 1 }, (_, i) => { const k = invertir ? max - i : i; return `<div class="esc-c" style="background:hsl(${110 - k * 11},${30 + k * 3}%,${82 - k * 3}%)">${i}</div>`; }).join("")}</div><div class="escala-ext"><span>${esc(izq)}</span><span>${esc(der)}</span></div>`,
  chips: items => `<div class="chips">${items.map(i => `<span class="chip">${md(i)}</span>`).join("")}</div>`,
  svg: (s, pie) => `<figure class="figura">${s}${pie ? `<figcaption>${md(pie)}</figcaption>` : ""}</figure>`,
  salto: () => `<div class="salto"></div>`,
  // Salto que el generador nunca anula (p. ej. una hoja que se entrega aparte al paciente)
  saltoFijo: () => `<div class="salto fijo"></div>`,
  // Escala tipo Likert: opciones [[etiqueta, valor], …], ítems en texto; total = rótulo de la casilla de puntuación
  items: (opciones, items, { total, inicio = 1, ancho = 11 } = {}) => `<table class="tabla items"><colgroup><col style="width:${100 - opciones.length * ancho}%"/>${opciones.map(() => `<col style="width:${ancho}%"/>`).join("")}</colgroup><thead><tr><th>Ítem</th>${opciones.map(([e, v]) => `<th class="c">${md(e)}<span class="v">${v}</span></th>`).join("")}</tr></thead><tbody>${items.map((it, i) => `<tr><td><span class="it-n">${inicio + i}</span>${md(it)}</td>${opciones.map(([, v]) => `<td class="c"><span class="op">${v}</span></td>`).join("")}</tr>`).join("")}${total ? `<tr class="suma"><td class="b">Suma por columnas</td>${opciones.map(() => "<td></td>").join("")}</tr>` : ""}</tbody></table>${total ? `<div class="total"><span>${md(total)}</span><span class="caja-total"></span></div>` : ""}`,
  // Casillas de firma
  firmas: (...quien) => `<div class="firmas">${quien.map(q => `<div class="firma"><div class="firma-e">${md(q)}</div><div class="firma-l"></div><div class="firma-f">Firma y fecha</div></div>`).join("")}</div>`,
  // Casillas para marcar
  checks: items => `<div class="checks">${items.map(i => `<div class="check"><span class="check-c"></span><span>${md(i)}</span></div>`).join("")}</div>`,
  junto: (...bloques) => `<div class="junto">${bloques.join("")}</div>`,
  datos: campos => `<div class="datos">${campos.map(c => `<div class="dato"><span>${esc(c)}</span><div class="dato-l"></div></div>`).join("")}</div>`,
  referencias: refs => `<div class="refs"><div class="refs-t">Referencias</div>${refs.map(r => `<div>${md(r)}</div>`).join("")}</div>`,
};

// ── Hoja de estilo ───────────────────────────────────────────────────────────
function css(t) {
  return `
@font-face{font-family:Manrope;font-weight:400;src:${f64("manrope-latin-400-normal.woff2")};}
@font-face{font-family:Manrope;font-weight:400;src:${f64("manrope-latin-ext-400-normal.woff2")};unicode-range:U+0100-024F,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF;}
@font-face{font-family:Manrope;font-weight:500;src:${f64("manrope-latin-500-normal.woff2")};}
@font-face{font-family:Manrope;font-weight:600;src:${f64("manrope-latin-600-normal.woff2")};}
@font-face{font-family:Manrope;font-weight:700;src:${f64("manrope-latin-700-normal.woff2")};}
@font-face{font-family:Manrope;font-weight:800;src:${f64("manrope-latin-800-normal.woff2")};}
@font-face{font-family:Serif;font-weight:400;src:${f64("instrument-serif-latin-400-normal.woff2")};}
@font-face{font-family:Serif;font-style:italic;font-weight:400;src:${f64("instrument-serif-latin-400-italic.woff2")};}
@font-face{font-family:Logo;font-style:italic;src:${f64("playfair-display-latin-400-italic.woff2")};}
@page{size:A4;margin:16mm 0 18mm 0;}
@page :first{margin-top:0;}
*{box-sizing:border-box;}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{margin:0;padding:0 15mm;font-family:Manrope,sans-serif;font-size:10pt;line-height:1.5;color:#3B2A1E;}
b{font-weight:700;color:#221610;}
.hero{position:relative;margin:0 -15mm;min-height:62mm;padding-bottom:7mm !important;background:${t.bg};overflow:hidden;padding:13mm 15mm 0;}
.hero-ilus{position:absolute;right:0;top:0;height:62mm;width:80mm;}
.hero-sup{display:flex;align-items:center;gap:3mm;margin-bottom:6mm;position:relative;}
.logo{font-family:Logo;font-style:italic;font-size:15pt;color:#221610;letter-spacing:-0.3px;}
.logo i{font-style:italic;color:#A66B3F;font-size:17.5pt;}
.pill{font-size:7pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${t.c};background:#fff8;border:1px solid ${t.m};border-radius:99px;padding:1mm 3mm;}
.titulo{position:relative;font-family:Serif;font-size:31pt;line-height:1.02;color:#221610;max-width:122mm;letter-spacing:-0.3px;}
.subtitulo{position:relative;margin-top:3mm;font-size:10pt;color:#5d4636;max-width:108mm;line-height:1.45;}
.perso{display:grid;grid-template-columns:1.25fr 1fr 1fr .6fr;gap:4mm;margin:0 -15mm 7mm;padding:3.2mm 15mm;background:#FBF8F2;border-bottom:1px solid ${t.m};}
.perso-c{font-size:6.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${t.c};}
.perso-v{height:6mm;border-bottom:1px solid #D9C9A8;margin-top:1mm;}
h2.h{font-family:Serif;font-weight:400;font-size:17pt;color:#221610;margin:7mm 0 2.5mm;display:flex;align-items:center;gap:3mm;break-after:avoid;line-height:1.1;}
h2.h .num{font-family:Manrope;font-size:8.5pt;font-weight:800;width:6.5mm;height:6.5mm;border-radius:50%;background:${t.c};color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
p{margin:0 0 2.5mm;}
.pequeno{font-size:8.5pt;color:#7d6553;}
.lista{margin:0 0 2.5mm;padding:0;list-style:none;}
.lista li{position:relative;padding-left:5.5mm;margin-bottom:1.6mm;}
.lista li::before{content:"";position:absolute;left:1mm;top:2.1mm;width:2mm;height:2mm;border-radius:50%;background:${t.c};}
.pasos{margin:0 0 2.5mm;padding:0;list-style:none;}
.pasos li{display:flex;gap:3mm;margin-bottom:2.2mm;align-items:flex-start;break-inside:avoid;}
.paso-n{flex-shrink:0;width:6mm;height:6mm;border-radius:50%;border:1.5px solid ${t.c};color:${t.c};font-weight:800;font-size:8.5pt;display:flex;align-items:center;justify-content:center;margin-top:.3mm;}
.tarjeta{background:${t.bg};border-radius:3.5mm;padding:4mm 5mm;margin:2mm 0 3mm;break-inside:avoid;}
.tarjeta.borde{background:#fff;border:1px solid ${t.m};}
.tarjeta.aviso{background:#F6E7E2;color:#6E3326;}
.tarjeta.aviso b{color:#6E3326;}
.tarjeta-t{font-weight:800;font-size:9pt;color:${t.c};margin-bottom:1mm;letter-spacing:.02em;}
.tarjeta.aviso .tarjeta-t{color:#9C3F2A;}
.uso{border-left:3px solid ${t.c};background:#FBF8F2;padding:3mm 4.5mm;margin:0 0 4mm;font-size:9pt;break-inside:avoid;border-radius:0 2.5mm 2.5mm 0;}
.uso-t{font-size:7pt;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${t.c};margin-bottom:1mm;}
.columnas{display:grid;gap:5mm;}
.rejilla{display:grid;gap:3mm;margin:2mm 0 3mm;}
.celda{background:#FBF8F2;border:1px solid #EADFCB;border-radius:3mm;padding:3.5mm;break-inside:avoid;}
.celda-ico{height:9mm;margin-bottom:1.5mm;}
.celda-t{font-weight:800;color:#221610;font-size:9.5pt;margin-bottom:.8mm;}
.celda-d{font-size:8.6pt;color:#5d4636;line-height:1.45;}
.lineas{margin:1mm 0 3mm;break-inside:avoid;}
.lineas-e{font-size:8pt;font-weight:700;color:${t.c};margin-bottom:1mm;}
.linea{height:calc(8mm * var(--fila, 1));border-bottom:1px solid #D9C9A8;}
.tabla{width:100%;border-collapse:separate;border-spacing:0;margin:1.5mm 0 1mm;font-size:8.6pt;}
.tabla th{background:${t.c};color:#fff;font-weight:700;text-align:left;padding:2mm 2.5mm;font-size:7.6pt;letter-spacing:.03em;vertical-align:bottom;}
.tabla th:first-child{border-top-left-radius:2.5mm;}
.tabla th:last-child{border-top-right-radius:2.5mm;}
.tabla td{border-bottom:1px solid #E6DAC6;border-right:1px solid #F0E7D8;padding:2mm 2.5mm;vertical-align:top;}
.tabla td:last-child{border-right:none;}
.tabla td.b{font-weight:700;color:#221610;}
.tabla tr{break-inside:avoid;}
.tabla tbody tr:nth-child(even) td{background:#FDFBF7;}
.tabla tr.ejemplo td{background:${t.bg} !important;font-style:italic;color:#5d4636;font-size:8pt;}
.ej-nota{font-size:7.2pt;color:#9A7E68;margin-bottom:3mm;}
.escala{display:grid;grid-template-columns:repeat(11,1fr);gap:1mm;margin-top:1.5mm;}
.esc-c{height:7.5mm;border-radius:1.5mm;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:9pt;color:#221610cc;}
.escala-ext{display:flex;justify-content:space-between;font-size:7.5pt;color:#7d6553;margin:1mm 0 3mm;}
.figura{margin:2mm 0 3mm;break-inside:avoid;text-align:center;}
.figura svg{max-width:100%;height:auto;}
.figura figcaption{font-size:7.8pt;color:#7d6553;margin-top:1mm;}
.salto{break-after:page;}
.junto{break-inside:avoid;}
.datos{display:flex;gap:5mm;margin:1mm 0 4mm;}
.dato{flex:1;font-size:7.5pt;font-weight:700;color:${t.c};text-transform:uppercase;letter-spacing:.08em;}
.dato-l{border-bottom:1px solid #D9C9A8;height:6mm;}
.chips{display:flex;flex-wrap:wrap;gap:1.6mm;margin:1mm 0 3mm;}
.chip{font-size:8.2pt;background:${t.bg};color:#3B2A1E;border-radius:99px;padding:.8mm 3mm;}
.refs{margin-top:6mm;padding-top:2mm;border-top:1px solid #EADFCB;font-size:7.2pt;color:#9A7E68;line-height:1.45;break-inside:avoid;}
/* Versiones compactas: el generador las prueba si la última página queda casi vacía */
body.c1{--fila:.9;} body.c1 h2.h{margin-top:5mm;} body.c1 .refs{margin-top:3mm;} body.c1 .figura{margin:1mm 0 2mm;}
body.c2{--fila:.8;} body.c2 h2.h{margin-top:4mm;} body.c2 .refs{margin-top:2.5mm;} body.c2 .figura{margin:0 0 1.5mm;} body.c2 .tarjeta{padding:3mm 4.5mm;}
.items td{vertical-align:middle;}
.items th.c{text-align:center;font-size:7pt;line-height:1.25;}
.items th.c .v{display:block;font-size:9pt;font-weight:800;margin-top:.6mm;opacity:.85;}
.items td.c{text-align:center;padding:1.6mm 0;}
.it-n{display:inline-block;min-width:5.5mm;font-weight:800;color:${t.c};}
.op{display:inline-flex;width:6.2mm;height:6.2mm;border:1.2px solid ${t.m};border-radius:50%;align-items:center;justify-content:center;font-size:7.8pt;color:#9A7E68;}
.items tr.suma td{background:${t.bg} !important;height:8mm;}
.total{display:flex;justify-content:flex-end;align-items:center;gap:4mm;margin:2.5mm 0 4mm;font-weight:800;color:#221610;font-size:9.5pt;}
.caja-total{width:24mm;height:10mm;border:1.6px solid ${t.c};border-radius:2.5mm;background:#fff;}
.firmas{display:flex;gap:10mm;margin:6mm 0 3mm;break-inside:avoid;}
.firma{flex:1;}
.firma-e{font-size:7.5pt;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:${t.c};}
.firma-l{height:18mm;border-bottom:1px solid #B9A687;}
.firma-f{font-size:7.5pt;color:#9A7E68;margin-top:1mm;}
.checks{display:grid;grid-template-columns:1fr 1fr;gap:2mm 6mm;margin:1.5mm 0 3mm;}
.check{display:flex;gap:2.5mm;align-items:flex-start;font-size:9pt;break-inside:avoid;}
.check-c{flex:none;width:4mm;height:4mm;border:1.4px solid ${t.c};border-radius:1mm;margin-top:.6mm;}
.refs-t{font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:6.5pt;margin-bottom:.8mm;}
`;
}

function html(r) {
  const t = TEMAS[r.tema] || TEMAS.profesional;
  const etiqueta = r.etiqueta || (r.cat === "paciente" ? "Para el paciente" : "Para el profesional");
  // Campos que Praxi rellena al descargar: [rótulo, clave]
  const campos = r.camposPerso || (r.cat === "paciente" ? [["Paciente", "paciente"], ["Profesional", "profesional"], ["Clínica", "clinica"], ["Fecha", "fecha"]] : [["Paciente / iniciales", "paciente"], ["Profesional", "profesional"], ["Clínica", "clinica"], ["Fecha", "fecha"]]);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css(t)}</style></head><body>
<div class="hero">
  <div class="hero-ilus">${r.ilustracion(t)}</div>
  <div class="hero-sup"><span class="logo">pra<i>X</i>i</span><span class="pill">${r.tema === "profesional" ? etiqueta : `${esc(t.nombre)} · ${etiqueta}`}</span></div>
  <div class="titulo">${esc(r.titulo)}</div>
  <div class="subtitulo">${md(r.subtitulo)}</div>
</div>
<div class="perso">${campos.map(([c, k]) => `<div><div class="perso-c">${c}</div><div class="perso-v" data-campo="${k}"></div></div>`).join("")}</div>
${r.bloques(t).join("\n")}
${r.referencias ? B.referencias(r.referencias) : ""}
</body></html>`;
}

module.exports = { B, TEMAS, html, esc, md, css };
