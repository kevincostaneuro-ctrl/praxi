// Ilustraciones SVG propias (línea fina, colores del tema). t = {c, bg, m}
// Las flechas se calculan desde el borde de cada caja, con un pequeño hueco, para que nunca se monten.
const W = 302, H = 234; // 80 × 62 mm a ~96 ppp

// ── Geometría ────────────────────────────────────────────────────────────────
// Punto del borde de una caja {x,y,w,h} (centro y tamaño) en dirección a (tx,ty), separado `hueco`
function borde(b, tx, ty, hueco = 7) {
  const dx = tx - b.x, dy = ty - b.y;
  const k = Math.min(b.w / 2 / Math.abs(dx || 1e-9), b.h / 2 / Math.abs(dy || 1e-9));
  const len = Math.hypot(dx, dy);
  return [b.x + dx * k + (dx / len) * hueco, b.y + dy * k + (dy / len) * hueco];
}
// Punta de flecha en (x,y) apuntando en la dirección (dx,dy)
function punta(x, y, dx, dy, col, tam = 9) {
  const l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const bx = x - ux * tam, by = y - uy * tam;
  return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${(bx - uy * tam * .55).toFixed(1)} ${(by + ux * tam * .55).toFixed(1)} L${(bx + uy * tam * .55).toFixed(1)} ${(by - ux * tam * .55).toFixed(1)} Z" fill="${col}"/>`;
}
// Flecha recta entre dos cajas
function flecha(a, b, col, { discontinua = false, ancho = 2, doble = false } = {}) {
  const [x1, y1] = borde(a, b.x, b.y), [x2, y2] = borde(b, a.x, a.y);
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), tam = 9;
  const ex = x2 - dx / l * (tam - 1), ey = y2 - dy / l * (tam - 1);
  const sx = doble ? x1 + dx / l * (tam - 1) : x1, sy = doble ? y1 + dy / l * (tam - 1) : y1;
  return `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${col}" stroke-width="${ancho}" ${discontinua ? 'stroke-dasharray="6 5"' : ""}/>` +
    punta(x2, y2, dx, dy, col, tam) + (doble ? punta(x1, y1, -dx, -dy, col, tam) : "");
}
// Flecha curva entre dos cajas (curva hacia fuera según `curva`)
function arco(a, b, col, curva = 0.25, ancho = 2) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const cx = mx - dy * curva, cy = my + dx * curva; // control desplazado en perpendicular
  const [x1, y1] = borde(a, cx, cy), [x2, y2] = borde(b, cx, cy);
  const tam = 9, tx = x2 - cx, ty = y2 - cy, tl = Math.hypot(tx, ty);
  const ex = x2 - tx / tl * (tam - 1), ey = y2 - ty / tl * (tam - 1);
  return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${ancho}"/>` + punta(x2, y2, tx, ty, col, tam);
}
// Caja con título y subtítulo (1 o 2 líneas)
function caja(b, titulo, sub, t, fuerte) {
  const lineas = String(sub || "").split("\n");
  const ty = b.y - (lineas.length > 1 ? 9 : 4);
  return `<rect x="${b.x - b.w / 2}" y="${b.y - b.h / 2}" width="${b.w}" height="${b.h}" rx="12" fill="${fuerte ? t.c : "#fff"}" stroke="${t.c}" stroke-width="1.6"/>
  <text x="${b.x}" y="${ty}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="13" fill="${fuerte ? "#fff" : "#221610"}">${titulo}</text>
  ${lineas.map((l, k) => `<text x="${b.x}" y="${ty + 16 + k * 13}" text-anchor="middle" font-family="Manrope" font-size="10.5" fill="${fuerte ? "#fff" : "#6B4A30"}">${l}</text>`).join("")}`;
}
const etiqueta = (x, y, txt, col, anchor = "middle") => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Manrope" font-size="10.5" font-weight="700" fill="${col}" paint-order="stroke" stroke="#fff" stroke-width="4" stroke-linejoin="round">${txt}</text>`;

// ── Cabeceras ────────────────────────────────────────────────────────────────
const hero = {
  // Respiración: ondas dentro de un círculo
  ondas: t => `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="co"><circle cx="190" cy="117" r="82"/></clipPath></defs>
    <circle cx="190" cy="117" r="100" fill="${t.m}" opacity=".25"/>
    <circle cx="190" cy="117" r="82" fill="#fff" opacity=".55"/>
    <g clip-path="url(#co)">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M90 ${67 + i * 20} C 125 ${45 + i * 20}, 155 ${89 + i * 20}, 190 ${67 + i * 20} S 255 ${45 + i * 20}, 290 ${67 + i * 20}" fill="none" stroke="${t.c}" stroke-width="${2.4 - i * .25}" opacity="${.95 - i * .13}"/>`).join("")}</g>
    <circle cx="190" cy="117" r="82" fill="none" stroke="${t.c}" stroke-width="1.5" opacity=".5"/></svg>`,
  // Escalera de exposición con una persona y la bandera arriba
  escalera: t => {
    const x0 = 92, base = 214, paso = 30, alto = 24;
    const pelda = [0, 1, 2, 3, 4, 5].map(i => `<rect x="${x0 + i * paso}" y="${base - (i + 1) * alto}" width="${paso - 3}" height="${(i + 1) * alto}" rx="3" fill="${t.c}" opacity="${i < 3 ? .9 - i * .12 : .3}"/>`).join("");
    const px = x0 + 2 * paso + (paso - 3) / 2, py = base - 3 * alto;
    const fx = x0 + 5 * paso + 8, fy = base - 6 * alto;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="70" y1="${base}" x2="290" y2="${base}" stroke="${t.c}" stroke-width="1.5" opacity=".4"/>
    ${pelda}
    <circle cx="${px}" cy="${py - 22}" r="7" fill="#221610"/><rect x="${px - 4}" y="${py - 14}" width="8" height="14" rx="3" fill="#221610"/>
    <line x1="${fx}" y1="${fy}" x2="${fx}" y2="${fy - 34}" stroke="#221610" stroke-width="2"/>
    <path d="M${fx} ${fy - 34} l18 6 l-18 6 z" fill="${t.c}"/></svg>`;
  },
  // Red de factores alrededor de un núcleo
  red: t => {
    const c = [200, 117], n = [[138, 62], [262, 62], [138, 172], [262, 172]];
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${c[0]}" cy="${c[1]}" r="92" fill="${t.m}" opacity=".3"/>
    ${n.map(([x, y]) => { const d = Math.hypot(x - c[0], y - c[1]); const ux = (x - c[0]) / d, uy = (y - c[1]) / d; return `<line x1="${c[0] + ux * 30}" y1="${c[1] + uy * 30}" x2="${x - ux * 18}" y2="${y - uy * 18}" stroke="${t.c}" stroke-width="2" opacity=".7"/>`; }).join("")}
    ${n.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#fff" stroke="${t.c}" stroke-width="2"/>`).join("")}
    <circle cx="${c[0]}" cy="${c[1]}" r="26" fill="${t.c}"/></svg>`;
  },
  // Plato con cubiertos, todo dentro del recuadro
  plato: t => `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <circle cx="188" cy="117" r="88" fill="#fff" opacity=".75"/>
    <circle cx="188" cy="117" r="72" fill="#fff" stroke="${t.m}" stroke-width="2.5"/>
    <path d="M188 117 L188 45 A72 72 0 0 0 188 189 Z" fill="#9BB06A"/>
    <path d="M188 117 L188 45 A72 72 0 0 1 260 117 Z" fill="#C98B5C"/>
    <path d="M188 117 L260 117 A72 72 0 0 1 188 189 Z" fill="#E2C27A"/>
    <g fill="${t.c}" opacity=".7"><rect x="78" y="70" width="5" height="100" rx="2.5"/><rect x="71" y="52" width="2.5" height="26" rx="1.2"/><rect x="77.2" y="52" width="2.5" height="26" rx="1.2"/><rect x="83.4" y="52" width="2.5" height="26" rx="1.2"/>
    <path d="M292 52 q-10 30 -2 60 v58 h-5 v-118 z"/></g></svg>`,
};

// ── Figuras del cuerpo ───────────────────────────────────────────────────────
// Ciclo situación → pensamiento → emoción → conducta
const circuloAnsiedad = t => {
  const bw = 150, bh = 56;
  const S = { x: 300, y: 42, w: bw, h: bh }, P = { x: 505, y: 150, w: bw, h: bh }, E = { x: 300, y: 258, w: bw, h: bh }, Cn = { x: 95, y: 150, w: bw, h: bh };
  return `<svg viewBox="0 0 600 300" width="112mm" xmlns="http://www.w3.org/2000/svg">
  ${arco(S, P, t.c, -0.28)}${arco(P, E, t.c, -0.28)}${arco(E, Cn, t.c, -0.28)}${arco(Cn, S, t.c, -0.28)}
  ${caja(S, "Situación", "Dónde, con quién, qué pasa", t)}
  ${caja(P, "Pensamiento", "Lo que me digo", t)}
  ${caja(E, "Emoción y cuerpo", "Qué siento y dónde lo noto", t, true)}
  ${caja(Cn, "Conducta", "Qué hago después", t)}
  <text x="300" y="148" text-anchor="middle" font-family="Serif" font-style="italic" font-size="19" fill="${t.c}">el círculo</text>
  <text x="300" y="168" text-anchor="middle" font-family="Serif" font-style="italic" font-size="19" fill="${t.c}">que se repite</text>
  </svg>`;
};

// Exposición: dos paneles, «si escapo» frente a «si me quedo»
const curvaExposicion = t => {
  const ejes = (ox, titulo) => `<text x="${ox + 10}" y="18" font-family="Manrope" font-size="12.5" font-weight="800" fill="#221610">${titulo}</text>
    <line x1="${ox + 10}" y1="196" x2="${ox + 250}" y2="196" stroke="#B8A898" stroke-width="1.5"/><line x1="${ox + 10}" y1="34" x2="${ox + 10}" y2="196" stroke="#B8A898" stroke-width="1.5"/>
    <text x="${ox + 4}" y="115" font-family="Manrope" font-size="10" fill="#7d6553" transform="rotate(-90 ${ox + 4} 115)" text-anchor="middle">Ansiedad</text>
    <text x="${ox + 250}" y="212" text-anchor="end" font-family="Manrope" font-size="10" fill="#7d6553">Tiempo</text>`;
  // Panel izquierdo: sube, escapo, alivio inmediato
  const izq = `${ejes(0, "Si escapo")}
    <path d="M14 192 C 50 192, 70 60, 104 56" fill="none" stroke="${t.c}" stroke-width="3"/>
    <line x1="104" y1="56" x2="104" y2="188" stroke="#A64A3A" stroke-width="2.2" stroke-dasharray="5 4"/>
    ${punta(104, 192, 0, 1, "#A64A3A", 9)}
    ${etiqueta(114, 70, "Me voy", "#A64A3A", "start")}
    ${etiqueta(114, 86, "→ alivio inmediato", "#A64A3A", "start")}
    <text x="130" y="140" font-family="Manrope" font-size="10.5" fill="#5d4636">Mi cerebro aprende</text>
    <text x="130" y="154" font-family="Manrope" font-size="10.5" fill="#5d4636">que era peligroso:</text>
    <text x="130" y="168" font-family="Manrope" font-size="10.5" font-weight="700" fill="#A64A3A">el miedo se mantiene</text>`;
  // Panel derecho: me quedo, baja sola; cada práctica, pico menor
  const ox = 290;
  const curva = (pico, op) => `<path d="M${ox + 14} 192 C ${ox + 50} 192, ${ox + 66} ${192 - pico}, ${ox + 92} ${192 - pico} S ${ox + 160} 188, ${ox + 245} 190" fill="none" stroke="${t.c}" stroke-width="3" opacity="${op}"/>`;
  const der = `${ejes(ox, "Si me quedo")}${curva(136, 1)}${curva(92, .6)}${curva(52, .35)}
    <g font-family="Manrope" font-size="10.5" font-weight="700">
      <line x1="${ox + 160}" y1="44" x2="${ox + 176}" y2="44" stroke="${t.c}" stroke-width="3"/><text x="${ox + 181}" y="48" fill="#221610">1.ª práctica</text>
      <line x1="${ox + 160}" y1="62" x2="${ox + 176}" y2="62" stroke="${t.c}" stroke-width="3" opacity=".6"/><text x="${ox + 181}" y="66" fill="#221610">2.ª práctica</text>
      <line x1="${ox + 160}" y1="80" x2="${ox + 176}" y2="80" stroke="${t.c}" stroke-width="3" opacity=".35"/><text x="${ox + 181}" y="84" fill="#221610">3.ª práctica</text>
    </g>`;
  return `<svg viewBox="-18 0 565 218" width="140mm" xmlns="http://www.w3.org/2000/svg">${izq}<line x1="272" y1="10" x2="272" y2="205" stroke="#E6DAC6" stroke-width="1.5"/>${der}</svg>`;
};

// Modelo de las 5 P con flechas que respetan las cajas
const cincoP = t => {
  const bw = 176, bh = 54;
  const Pr = { x: 300, y: 140, w: 200, h: 62 };
  const Pd = { x: 100, y: 38, w: bw, h: bh }, Pc = { x: 500, y: 38, w: bw, h: bh }, Pe = { x: 100, y: 242, w: bw, h: bh }, Po = { x: 500, y: 242, w: bw, h: bh };
  return `<svg viewBox="0 0 600 280" width="135mm" xmlns="http://www.w3.org/2000/svg">
  ${flecha(Pd, Pr, t.c)}${flecha(Pc, Pr, t.c)}
  ${arco(Pe, Pr, t.c, -0.22)}${arco(Pr, Pe, t.c, -0.22)}
  ${flecha(Po, Pr, t.c, { discontinua: true })}
  ${etiqueta(186, 112, "vulnerabilidad", t.c, "end")}${etiqueta(414, 112, "desencadena", t.c, "start")}
  ${etiqueta(202, 196, "lo mantiene", t.c)}${etiqueta(440, 184, "amortigua", t.c, "start")}
  ${caja(Pd, "Predisponentes", "¿Por qué esta persona?", t)}
  ${caja(Pc, "Precipitantes", "¿Por qué ahora?", t)}
  ${caja(Pr, "Problema presente", "¿Qué le pasa?", t, true)}
  ${caja(Pe, "Perpetuantes", "¿Qué lo mantiene?", t)}
  ${caja(Po, "Protectores", "¿Con qué cuenta?", t)}
  </svg>`;
};

const platoGrande = (t, vacio) => `<svg viewBox="0 0 300 300" width="${vacio ? "62mm" : "70mm"}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="150" cy="150" r="140" fill="#fff" stroke="#E6DAC6" stroke-width="6"/>
  <circle cx="150" cy="150" r="118" fill="#fff" stroke="#EFE6D6" stroke-width="2"/>
  ${vacio ? `<line x1="150" y1="32" x2="150" y2="268" stroke="#D9C9A8" stroke-width="2" stroke-dasharray="6 6"/><line x1="150" y1="150" x2="268" y2="150" stroke="#D9C9A8" stroke-width="2" stroke-dasharray="6 6"/>
   <text x="92" y="155" text-anchor="middle" font-family="Manrope" font-size="12" fill="#B8A898">verduras</text><text x="209" y="100" text-anchor="middle" font-family="Manrope" font-size="12" fill="#B8A898">proteína</text><text x="209" y="210" text-anchor="middle" font-family="Manrope" font-size="12" fill="#B8A898">cereales</text>` :
  `<path d="M150 150 L150 32 A118 118 0 0 0 150 268 Z" fill="#9BB06A"/>
   <path d="M150 150 L150 32 A118 118 0 0 1 268 150 Z" fill="#C98B5C"/>
   <path d="M150 150 L268 150 A118 118 0 0 1 150 268 Z" fill="#E2C27A"/>
   <text x="92" y="146" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="17" fill="#fff">½</text><text x="92" y="166" text-anchor="middle" font-family="Manrope" font-size="12" font-weight="700" fill="#fff">Verduras</text>
   <text x="205" y="98" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="16" fill="#fff">¼</text><text x="205" y="116" text-anchor="middle" font-family="Manrope" font-size="12" font-weight="700" fill="#fff">Proteína</text>
   <text x="205" y="200" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="16" fill="#5d4636">¼</text><text x="205" y="218" text-anchor="middle" font-family="Manrope" font-size="12" font-weight="700" fill="#5d4636">Cereales</text>`}
  </svg>`;

// Iconos pequeños para rejillas
const ico = {
  vaso: t => `<svg viewBox="0 0 30 30" height="9mm"><path d="M8 5 h14 l-2 21 h-10 z" fill="${t.bg}" stroke="${t.c}" stroke-width="1.8"/><path d="M9.5 12 h11" stroke="${t.c}" stroke-width="1.4"/></svg>`,
  gota: t => `<svg viewBox="0 0 30 30" height="9mm"><path d="M15 4 C 20 12, 23 15, 23 19 a8 8 0 0 1 -16 0 C7 15, 10 12, 15 4z" fill="${t.bg}" stroke="${t.c}" stroke-width="1.8"/></svg>`,
  fruta: t => `<svg viewBox="0 0 30 30" height="9mm"><circle cx="15" cy="17" r="9" fill="${t.bg}" stroke="${t.c}" stroke-width="1.8"/><path d="M15 8 q2 -4 6 -4" stroke="${t.c}" stroke-width="1.8" fill="none"/></svg>`,
  legumbre: t => `<svg viewBox="0 0 30 30" height="9mm"><ellipse cx="11" cy="15" rx="5" ry="7" fill="${t.bg}" stroke="${t.c}" stroke-width="1.8"/><ellipse cx="20" cy="15" rx="5" ry="7" fill="${t.bg}" stroke="${t.c}" stroke-width="1.8"/></svg>`,
};

module.exports = { hero, circuloAnsiedad, curvaExposicion, cincoP, platoGrande, ico, flecha, arco, caja, borde, punta, etiqueta };
