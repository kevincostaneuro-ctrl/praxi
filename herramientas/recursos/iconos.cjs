// Ilustraciones de cabecera (motivo centrado en un círculo suave, a la derecha de la cabecera).
// Todas caben en el recuadro 302 × 234 y se dibujan alrededor de (190, 117).
const W = 302, H = 234, CX = 190, CY = 117;
let n = 0; const id = p => `${p}${++n}`;

const marco = (t, dentro) => `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${CX}" cy="${CY}" r="98" fill="${t.m}" opacity=".28"/>
  <circle cx="${CX}" cy="${CY}" r="76" fill="#fff" opacity=".6"/>
  ${dentro}</svg>`;

const I = {
  luna: t => { const m = id("lm"); return marco(t, `<defs><mask id="${m}"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${CX + 20}" cy="${CY - 14}" r="38" fill="#000"/></mask></defs>
    <circle cx="${CX - 4}" cy="${CY + 4}" r="44" fill="${t.c}" mask="url(#${m})"/>
    ${[[CX + 34, CY - 30, 7], [CX + 48, CY + 8, 4.5], [CX + 18, CY + 30, 3.5]].map(([x, y, r]) => `<path d="M${x} ${y - r * 1.6} Q${x} ${y} ${x + r * 1.6} ${y} Q${x} ${y} ${x} ${y + r * 1.6} Q${x} ${y} ${x - r * 1.6} ${y} Q${x} ${y} ${x} ${y - r * 1.6}Z" fill="${t.c}" opacity=".75"/>`).join("")}`); },
  sol: t => marco(t, `<line x1="${CX - 70}" y1="${CY + 26}" x2="${CX + 70}" y2="${CY + 26}" stroke="${t.c}" stroke-width="3" stroke-linecap="round"/>
    <path d="M${CX - 34} ${CY + 26} A34 34 0 0 1 ${CX + 34} ${CY + 26} Z" fill="${t.c}"/>
    ${[-80, -55, -30, 0, 30, 55, 80].map(a => { const r = Math.PI * (a - 90) / 180; return `<line x1="${CX + Math.cos(r) * 44}" y1="${CY + 26 + Math.sin(r) * 44}" x2="${CX + Math.cos(r) * 60}" y2="${CY + 26 + Math.sin(r) * 60}" stroke="${t.c}" stroke-width="3" stroke-linecap="round"/>`; }).join("")}
    <line x1="${CX - 48}" y1="${CY + 42}" x2="${CX + 48}" y2="${CY + 42}" stroke="${t.c}" stroke-width="2" stroke-linecap="round" opacity=".45"/>`),
  hoja: t => marco(t, `<path d="M${CX - 42} ${CY + 46} C ${CX - 42} ${CY - 14}, ${CX + 2} ${CY - 50}, ${CX + 50} ${CY - 50} C ${CX + 50} ${CY + 2}, ${CX + 14} ${CY + 46}, ${CX - 42} ${CY + 46} Z" fill="${t.m}" stroke="${t.c}" stroke-width="3"/>
    <path d="M${CX - 42} ${CY + 46} Q ${CX} ${CY} ${CX + 44} ${CY - 44}" fill="none" stroke="${t.c}" stroke-width="2.5"/>
    ${[[-16, 18, -2, 30], [0, 2, 18, 12], [14, -14, 32, -6], [-6, 10, -22, 0], [8, -6, -4, -22]].map(([a, b, c, d]) => `<line x1="${CX + a}" y1="${CY + b}" x2="${CX + c}" y2="${CY + d}" stroke="${t.c}" stroke-width="1.6" opacity=".7"/>`).join("")}`),
  nubes: t => marco(t, `<g fill="${t.c}">
      <circle cx="${CX - 22}" cy="${CY - 6}" r="24"/><circle cx="${CX + 8}" cy="${CY - 20}" r="30"/><circle cx="${CX + 36}" cy="${CY - 2}" r="22"/><rect x="${CX - 40}" y="${CY - 6}" width="90" height="26" rx="13"/></g>
    ${[-18, 4, 26].map(x => `<circle cx="${CX + x}" cy="${CY - 2}" r="4.5" fill="#fff"/>`).join("")}
    <circle cx="${CX - 30}" cy="${CY + 36}" r="8" fill="${t.c}" opacity=".7"/><circle cx="${CX - 44}" cy="${CY + 54}" r="5" fill="${t.c}" opacity=".5"/>`),
  escudo: t => marco(t, `<path d="M${CX} ${CY - 54} L${CX + 44} ${CY - 38} L${CX + 44} ${CY + 2} C ${CX + 44} ${CY + 30}, ${CX + 22} ${CY + 46}, ${CX} ${CY + 56} C ${CX - 22} ${CY + 46}, ${CX - 44} ${CY + 30}, ${CX - 44} ${CY + 2} L${CX - 44} ${CY - 38} Z" fill="${t.c}"/>
    <path d="M${CX} ${CY + 22} C ${CX - 30} ${CY + 2}, ${CX - 22} ${CY - 26}, ${CX} ${CY - 12} C ${CX + 22} ${CY - 26}, ${CX + 30} ${CY + 2}, ${CX} ${CY + 22} Z" fill="#fff"/>`),
  dialogo: t => marco(t, `<path d="M${CX - 58} ${CY - 44} h66 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-40 l-16 14 v-14 h-10 a12 12 0 0 1 -12 -12 v-30 a12 12 0 0 1 12 -12 z" fill="${t.c}"/>
    <path d="M${CX - 6} ${CY - 2} h56 a12 12 0 0 1 12 12 v28 a12 12 0 0 1 -12 12 h-8 v14 l-16 -14 h-32 a12 12 0 0 1 -12 -12 v-28 a12 12 0 0 1 12 -12 z" fill="#fff" stroke="${t.c}" stroke-width="3"/>
    ${[-40, -26, -12].map(x => `<circle cx="${CX + x}" cy="${CY - 26}" r="3.5" fill="#fff"/>`).join("")}
    <line x1="${CX + 8}" y1="${CY + 16}" x2="${CX + 46}" y2="${CY + 16}" stroke="${t.c}" stroke-width="3" stroke-linecap="round"/><line x1="${CX + 8}" y1="${CY + 28}" x2="${CX + 34}" y2="${CY + 28}" stroke="${t.c}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`),
  balanza: t => marco(t, `<line x1="${CX}" y1="${CY - 48}" x2="${CX}" y2="${CY + 44}" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${CX - 24} ${CY + 48} h48" stroke="${t.c}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${CX - 56}" y1="${CY - 30}" x2="${CX + 56}" y2="${CY - 38}" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${CX}" cy="${CY - 48}" r="6" fill="${t.c}"/>
    <path d="M${CX - 56} ${CY - 30} l-16 34 h32 z M${CX + 56} ${CY - 38} l-16 34 h32 z" fill="none" stroke="${t.c}" stroke-width="1.8"/>
    <path d="M${CX - 74} ${CY + 4} a18 9 0 0 0 36 0 z" fill="${t.c}"/><path d="M${CX + 38} ${CY - 4} a18 9 0 0 0 36 0 z" fill="${t.m}" stroke="${t.c}" stroke-width="2"/>`),
  reloj: t => marco(t, `<circle cx="${CX}" cy="${CY}" r="50" fill="#fff" stroke="${t.c}" stroke-width="4"/>
    ${Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; const r1 = k % 3 ? 42 : 38; return `<line x1="${CX + Math.sin(a) * r1}" y1="${CY - Math.cos(a) * r1}" x2="${CX + Math.sin(a) * 46}" y2="${CY - Math.cos(a) * 46}" stroke="${t.c}" stroke-width="${k % 3 ? 2 : 3.5}" stroke-linecap="round"/>`; }).join("")}
    <path d="M${CX} ${CY} L${CX} ${CY - 30}" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/><path d="M${CX} ${CY} L${CX + 22} ${CY + 10}" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${CX} ${CY - 50} A50 50 0 0 1 ${CX + 43.3} ${CY - 25}" fill="none" stroke="${t.c}" stroke-width="9" opacity=".35"/>
    <circle cx="${CX}" cy="${CY}" r="5" fill="${t.c}"/>`),
  brujula: t => marco(t, `<circle cx="${CX}" cy="${CY}" r="50" fill="#fff" stroke="${t.c}" stroke-width="4"/><circle cx="${CX}" cy="${CY}" r="40" fill="none" stroke="${t.m}" stroke-width="2"/>
    <path d="M${CX} ${CY - 36} L${CX + 10} ${CY} L${CX} ${CY + 36} L${CX - 10} ${CY} Z" fill="${t.m}"/><path d="M${CX} ${CY - 36} L${CX + 10} ${CY} L${CX - 10} ${CY} Z" fill="${t.c}"/>
    <circle cx="${CX}" cy="${CY}" r="4" fill="#fff" stroke="${t.c}" stroke-width="2"/>
    <text x="${CX}" y="${CY - 54}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="12" fill="${t.c}" dy="-2">N</text>`),
  brote: t => marco(t, `<path d="M${CX - 30} ${CY + 18} h60 l-8 38 h-44 z" fill="${t.c}"/><rect x="${CX - 34}" y="${CY + 12}" width="68" height="10" rx="3" fill="${t.c}"/>
    <path d="M${CX} ${CY + 12} C ${CX} ${CY - 10}, ${CX - 2} ${CY - 26}, ${CX + 2} ${CY - 40}" fill="none" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${CX} ${CY - 14} C ${CX - 10} ${CY - 40}, ${CX - 42} ${CY - 40}, ${CX - 46} ${CY - 22} C ${CX - 30} ${CY - 10}, ${CX - 10} ${CY - 8}, ${CX} ${CY - 14} Z" fill="${t.m}" stroke="${t.c}" stroke-width="2.5"/>
    <path d="M${CX + 2} ${CY - 30} C ${CX + 10} ${CY - 56}, ${CX + 42} ${CY - 58}, ${CX + 48} ${CY - 40} C ${CX + 32} ${CY - 26}, ${CX + 12} ${CY - 24}, ${CX + 2} ${CY - 30} Z" fill="${t.c}"/>`),
  corazon: t => marco(t, `<path d="M${CX} ${CY + 48} C ${CX - 64} ${CY + 6}, ${CX - 52} ${CY - 50}, ${CX} ${CY - 22} C ${CX + 52} ${CY - 50}, ${CX + 64} ${CY + 6}, ${CX} ${CY + 48} Z" fill="${t.m}" stroke="${t.c}" stroke-width="3"/>
    <path d="M${CX} ${CY + 26} C ${CX - 34} ${CY + 4}, ${CX - 28} ${CY - 26}, ${CX} ${CY - 10} C ${CX + 28} ${CY - 26}, ${CX + 34} ${CY + 4}, ${CX} ${CY + 26} Z" fill="${t.c}"/>`),
  vela: t => marco(t, `<circle cx="${CX}" cy="${CY - 30}" r="26" fill="${t.m}" opacity=".55"/>
    <path d="M${CX} ${CY - 52} C ${CX + 12} ${CY - 34}, ${CX + 10} ${CY - 18}, ${CX} ${CY - 14} C ${CX - 10} ${CY - 18}, ${CX - 12} ${CY - 34}, ${CX} ${CY - 52} Z" fill="${t.c}"/>
    <line x1="${CX}" y1="${CY - 14}" x2="${CX}" y2="${CY - 6}" stroke="#221610" stroke-width="2"/>
    <rect x="${CX - 18}" y="${CY - 6}" width="36" height="58" rx="5" fill="#fff" stroke="${t.c}" stroke-width="3"/>
    <path d="M${CX - 18} ${CY + 6} q8 6 12 0" fill="none" stroke="${t.c}" stroke-width="2" opacity=".6"/>`),
  termometro: t => marco(t, `<rect x="${CX - 12}" y="${CY - 56}" width="24" height="86" rx="12" fill="#fff" stroke="${t.c}" stroke-width="3"/>
    <circle cx="${CX}" cy="${CY + 38}" r="20" fill="${t.c}"/>
    <rect x="${CX - 6}" y="${CY - 22}" width="12" height="60" rx="6" fill="${t.c}"/>
    ${[-40, -26, -12, 2, 16].map(y => `<line x1="${CX + 18}" y1="${CY + y}" x2="${CX + 28}" y2="${CY + y}" stroke="${t.c}" stroke-width="2" stroke-linecap="round"/>`).join("")}
    ${[-1, 0, 1].map(k => `<path d="M${CX - 40 + k * 0} ${CY - 34 + k * 22} q-8 -6 0 -12 q8 -6 0 -12" fill="none" stroke="${t.c}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`).join("")}`),
  respira: t => marco(t, `${[52, 38, 24].map((r, k) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="${k === 2 ? t.c : "none"}" stroke="${t.c}" stroke-width="${3 - k * .5}" opacity="${1 - k * .15}" ${k === 0 ? 'stroke-dasharray="4 7"' : ""}/>`).join("")}
    <path d="M${CX - 64} ${CY} q-8 -10 0 -20 M${CX + 64} ${CY} q8 -10 0 -20" fill="none" stroke="${t.c}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`),
  ola: t => marco(t, `<path d="M${CX - 66} ${CY + 30} C ${CX - 40} ${CY + 30}, ${CX - 26} ${CY - 46}, ${CX} ${CY - 46} S ${CX + 40} ${CY + 30}, ${CX + 66} ${CY + 30}" fill="${t.m}" stroke="${t.c}" stroke-width="3.5"/>
    <line x1="${CX - 70}" y1="${CY + 31}" x2="${CX + 70}" y2="${CY + 31}" stroke="${t.c}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${CX}" cy="${CY - 46}" r="6" fill="${t.c}"/>`),
  lupa: t => marco(t, `<circle cx="${CX - 10}" cy="${CY - 10}" r="36" fill="#fff" stroke="${t.c}" stroke-width="5"/>
    <path d="M${CX - 30} ${CY - 18} a22 22 0 0 1 16 -14" fill="none" stroke="${t.m}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${CX + 16}" y1="${CY + 16}" x2="${CX + 46}" y2="${CY + 46}" stroke="${t.c}" stroke-width="11" stroke-linecap="round"/>`),
  bateria: t => marco(t, `<rect x="${CX - 52}" y="${CY - 26}" width="96" height="52" rx="8" fill="#fff" stroke="${t.c}" stroke-width="4"/>
    <rect x="${CX + 46}" y="${CY - 10}" width="8" height="20" rx="2" fill="${t.c}"/>
    ${[0, 1, 2, 3].map(k => `<rect x="${CX - 44 + k * 22}" y="${CY - 18}" width="17" height="36" rx="3" fill="${t.c}" opacity="${k < 2 ? 1 : .18}"/>`).join("")}`),
  familia: t => marco(t, [[-36, 6, 15, 1], [0, -2, 18, .85], [34, 14, 12, .6]].map(([dx, dy, r, o]) => `<circle cx="${CX + dx}" cy="${CY + dy - r * 1.9}" r="${r * .75}" fill="${t.c}" opacity="${o}"/><path d="M${CX + dx - r} ${CY + dy + r * 2.2} v-${r * 1.2} a${r} ${r} 0 0 1 ${r * 2} 0 v${r * 1.2} z" fill="${t.c}" opacity="${o}"/>`).join("")),
  portapapeles: t => marco(t, `<rect x="${CX - 38}" y="${CY - 48}" width="76" height="98" rx="8" fill="#fff" stroke="${t.c}" stroke-width="3.5"/>
    <rect x="${CX - 18}" y="${CY - 56}" width="36" height="16" rx="5" fill="${t.c}"/>
    ${[-22, -2, 18].map((y, k) => `<path d="M${CX - 26} ${CY + y} l5 5 l9 -10" fill="none" stroke="${t.c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="${k === 2 ? .35 : 1}"/><line x1="${CX - 4}" y1="${CY + y}" x2="${CX + 26}" y2="${CY + y}" stroke="${t.c}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`).join("")}`),
  documento: t => marco(t, `<path d="M${CX - 36} ${CY - 52} h50 l22 22 v80 h-72 z" fill="#fff" stroke="${t.c}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M${CX + 14} ${CY - 52} v22 h22" fill="${t.m}" stroke="${t.c}" stroke-width="3" stroke-linejoin="round"/>
    ${[-18, -6, 6, 18].map((y, k) => `<line x1="${CX - 24}" y1="${CY + y}" x2="${CX + (k === 3 ? 4 : 24)}" y2="${CY + y}" stroke="${t.c}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`).join("")}
    <circle cx="${CX + 16}" cy="${CY + 38}" r="9" fill="${t.c}"/>`),
  grafica: t => marco(t, `<path d="M${CX - 52} ${CY + 24} A52 52 0 0 1 ${CX + 52} ${CY + 24}" fill="none" stroke="${t.m}" stroke-width="14"/>
    <path d="M${CX - 52} ${CY + 24} A52 52 0 0 1 ${CX - 15} ${CY - 26}" fill="none" stroke="${t.c}" stroke-width="14" opacity=".55"/>
    <path d="M${CX - 15} ${CY - 26} A52 52 0 0 1 ${CX + 30} ${CY - 18}" fill="none" stroke="${t.c}" stroke-width="14"/>
    <line x1="${CX}" y1="${CY + 24}" x2="${CX + 24}" y2="${CY - 12}" stroke="#221610" stroke-width="4" stroke-linecap="round"/><circle cx="${CX}" cy="${CY + 24}" r="7" fill="#221610"/>`),
  pulso: t => marco(t, `<path d="M${CX - 70} ${CY + 4} h34 l10 -26 l14 52 l12 -64 l12 52 l8 -14 h50" fill="none" stroke="${t.c}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`),
  etiqueta: t => marco(t, `<path d="M${CX - 40} ${CY - 40} h48 l40 40 l-48 48 l-40 -40 z" fill="#fff" stroke="${t.c}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="${CX - 22}" cy="${CY - 22}" r="7" fill="${t.c}"/>
    ${[0, 12, 24].map(k => `<line x1="${CX - 14 + k}" y1="${CY + 6 + k}" x2="${CX + 14 + k}" y2="${CY - 22 + k}" stroke="${t.c}" stroke-width="3" stroke-linecap="round" opacity="${1 - k / 40}"/>`).join("")}`),
  calendario: t => marco(t, `<rect x="${CX - 50}" y="${CY - 40}" width="100" height="90" rx="10" fill="#fff" stroke="${t.c}" stroke-width="3.5"/>
    <path d="M${CX - 50} ${CY - 30} a10 10 0 0 1 10 -10 h80 a10 10 0 0 1 10 10 v14 h-100 z" fill="${t.c}"/>
    <line x1="${CX - 26}" y1="${CY - 50}" x2="${CX - 26}" y2="${CY - 34}" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/><line x1="${CX + 26}" y1="${CY - 50}" x2="${CX + 26}" y2="${CY - 34}" stroke="${t.c}" stroke-width="4" stroke-linecap="round"/>
    ${[0, 1, 2, 3].flatMap(c => [0, 1, 2].map(r => `<rect x="${CX - 38 + c * 21}" y="${CY - 6 + r * 17}" width="13" height="11" rx="2.5" fill="${t.c}" opacity="${c === 2 && r === 1 ? 1 : .2}"/>`)).join("")}`),
  libreta: t => marco(t, `<rect x="${CX - 40}" y="${CY - 50}" width="80" height="100" rx="8" fill="#fff" stroke="${t.c}" stroke-width="3.5"/>
    ${[-34, -16, 2, 20, 38].map(y => `<circle cx="${CX - 40}" cy="${CY + y}" r="5" fill="${t.c}"/>`).join("")}
    ${[-26, -10, 6, 22].map(y => `<line x1="${CX - 24}" y1="${CY + y}" x2="${CX + 26}" y2="${CY + y}" stroke="${t.c}" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`).join("")}
    <path d="M${CX + 30} ${CY + 46} l28 -60 l10 5 l-28 60 l-12 6 z" fill="${t.c}"/>`),
  manzana: t => marco(t, `<path d="M${CX} ${CY - 22} C ${CX - 20} ${CY - 40}, ${CX - 56} ${CY - 26}, ${CX - 48} ${CY + 10} C ${CX - 42} ${CY + 40}, ${CX - 18} ${CY + 56}, ${CX} ${CY + 44} C ${CX + 18} ${CY + 56}, ${CX + 42} ${CY + 40}, ${CX + 48} ${CY + 10} C ${CX + 56} ${CY - 26}, ${CX + 20} ${CY - 40}, ${CX} ${CY - 22} Z" fill="${t.c}"/>
    <path d="M${CX} ${CY - 22} q-2 -18 8 -28" fill="none" stroke="#221610" stroke-width="3" stroke-linecap="round"/>
    <path d="M${CX + 6} ${CY - 40} c 10 -12 26 -12 32 -4 c -8 10 -22 12 -32 4 z" fill="${t.m}" stroke="${t.c}" stroke-width="2"/>
    <path d="M${CX - 30} ${CY - 6} q-4 14 4 26" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`),
  bombilla: t => marco(t, `<path d="M${CX} ${CY - 52} a34 34 0 0 1 20 61 v14 h-40 v-14 a34 34 0 0 1 20 -61 z" fill="${t.m}" stroke="${t.c}" stroke-width="3.5"/>
    <rect x="${CX - 18}" y="${CY + 26}" width="36" height="8" rx="3" fill="${t.c}"/><rect x="${CX - 14}" y="${CY + 38}" width="28" height="8" rx="3" fill="${t.c}"/>
    <path d="M${CX - 10} ${CY + 18} v-18 l10 -10 l10 10 v18" fill="none" stroke="${t.c}" stroke-width="2.5" stroke-linejoin="round"/>`),
  cerebro: t => marco(t, `<path d="M${CX} ${CY - 44} C ${CX - 14} ${CY - 56}, ${CX - 40} ${CY - 50}, ${CX - 42} ${CY - 30} C ${CX - 62} ${CY - 24}, ${CX - 62} ${CY + 2}, ${CX - 48} ${CY + 10} C ${CX - 56} ${CY + 30}, ${CX - 36} ${CY + 48}, ${CX - 16} ${CY + 40} C ${CX - 10} ${CY + 52}, ${CX + 10} ${CY + 52}, ${CX + 16} ${CY + 40} C ${CX + 36} ${CY + 48}, ${CX + 56} ${CY + 30}, ${CX + 48} ${CY + 10} C ${CX + 62} ${CY + 2}, ${CX + 62} ${CY - 24}, ${CX + 42} ${CY - 30} C ${CX + 40} ${CY - 50}, ${CX + 14} ${CY - 56}, ${CX} ${CY - 44} Z" fill="${t.m}" stroke="${t.c}" stroke-width="3.5"/>
    <path d="M${CX} ${CY - 44} V${CY + 46}" stroke="${t.c}" stroke-width="3"/>
    <path d="M${CX - 30} ${CY - 22} q12 4 14 18 M${CX - 38} ${CY + 14} q14 -6 22 6 M${CX + 30} ${CY - 22} q-12 4 -14 18 M${CX + 38} ${CY + 14} q-14 -6 -22 6" fill="none" stroke="${t.c}" stroke-width="2.5" stroke-linecap="round"/>`),
  cubiertos: t => marco(t, `<circle cx="${CX}" cy="${CY}" r="34" fill="#fff" stroke="${t.c}" stroke-width="3.5"/><circle cx="${CX}" cy="${CY}" r="23" fill="none" stroke="${t.m}" stroke-width="2.5"/>
    <g fill="${t.c}"><rect x="${CX - 56}" y="${CY - 12}" width="5" height="56" rx="2.5"/>${[-62, -55, -48].map(x => `<rect x="${CX + x}" y="${CY - 44}" width="2.5" height="28" rx="1.2"/>`).join("")}<rect x="${CX - 62}" y="${CY - 20}" width="16.5" height="10" rx="4"/>
    <path d="M${CX + 56} ${CY - 46} q-11 28 -2 56 v34 h-6 v-90 z"/></g>`),
};

module.exports = I;
