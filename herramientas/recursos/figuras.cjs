// Esquemas reutilizables para el cuerpo de los recursos. Todas las flechas usan la geometría de
// ilustraciones.cjs (salen y llegan al borde de cada caja con un hueco), así que no se montan.
const { flecha, arco, caja, punta, etiqueta, borde } = require("./ilustraciones.cjs");
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-family="Manrope" font-size="${o.s || 11}" font-weight="${o.w || 400}" fill="${o.c || "#5d4636"}"${o.extra || ""}>${s}</text>`;

// Ciclo de 3 a 5 elementos con flechas curvas en sentido horario. nodos: [[título, sub], …]
function ciclo(nodos, t, { fuerte = -1, centro = [], ancho = "122mm", bw = 150 } = {}) {
  const n = nodos.length, bh = 56, cx = 300, cy = 150, rx = n === 3 ? 190 : 205, ry = n === 3 ? 100 : 108;
  const pos = nodos.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, w: bw, h: bh }; });
  const flechas = pos.map((p, i) => arco(p, pos[(i + 1) % n], t.c, n === 3 ? -0.18 : -0.26)).join("");
  return `<svg viewBox="0 0 600 300" width="${ancho}" xmlns="http://www.w3.org/2000/svg">${flechas}
    ${pos.map((p, i) => caja(p, nodos[i][0], nodos[i][1], t, i === fuerte)).join("")}
    ${centro.map((l, k) => `<text x="${cx}" y="${cy + 6 - (centro.length - 1) * 10 + k * 20}" text-anchor="middle" font-family="Serif" font-style="italic" font-size="19" fill="${t.c}">${l}</text>`).join("")}</svg>`;
}

// Pasos en línea, de izquierda a derecha. pasos: [[título, sub], …]
function flujo(pasos, t, { fuerte = -1, ancho = "180mm", alto = 66 } = {}) {
  const n = pasos.length, hueco = 28, W = Math.max(560, n * 150), bw = (W - hueco * (n - 1)) / n;
  const cajas = pasos.map((_, i) => ({ x: bw / 2 + i * (bw + hueco), y: alto / 2 + 4, w: bw, h: alto }));
  return `<svg viewBox="0 0 ${W} ${alto + 8}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${cajas.slice(0, -1).map((c, i) => flecha(c, cajas[i + 1], t.c, { ancho: 2 })).join("")}
    ${cajas.map((c, i) => caja(c, pasos[i][0], pasos[i][1], t, i === fuerte)).join("")}</svg>`;
}

// Barra de interpretación de una puntuación. rangos: [[desde, hasta, etiqueta], …]
function bandas(rangos, t, { ancho = "170mm" } = {}) {
  const max = rangos[rangos.length - 1][1], min = rangos[0][0], W = 760, x0 = 20, x1 = W - 20;
  const X = v => x0 + (v - min) / (max - min) * (x1 - x0);
  const cols = ["#C6D8B4", "#E4DC9C", "#EBC38C", "#E39C7C", "#D06F5E"];
  const k = rangos.length;
  return `<svg viewBox="0 0 ${W} 78" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${rangos.map(([a, b, l], i) => {
      const xa = X(a), xb = X(b), c = cols[Math.round(i * (cols.length - 1) / Math.max(1, k - 1))];
      return `<rect x="${xa + 1}" y="8" width="${xb - xa - 2}" height="28" rx="6" fill="${c}"/>${T((xa + xb) / 2, 27, l, { w: 800, s: 11.5, c: "#221610" })}${T((xa + xb) / 2, 56, `${a}–${b}`, { s: 11, c: "#7d6553" })}`;
    }).join("")}</svg>`;
}

// Respiración: anillo dividido en fases proporcionales. fases: [[etiqueta, segundos], …]
function respiracion(fases, t, { ancho = "70mm" } = {}) {
  const total = fases.reduce((a, f) => a + f[1], 0), cx = 150, cy = 150, r = 100;
  let ang = -Math.PI / 2; const cols = [t.c, t.m, "#D9C9A8", t.m];
  const segs = fases.map(([l, s], i) => {
    const a0 = ang, a1 = ang + s / total * 2 * Math.PI; ang = a1;
    const g = 0.03, p = (a, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    const [x0, y0] = p(a0 + g, r), [x1, y1] = p(a1 - g, r), large = a1 - a0 > Math.PI ? 1 : 0;
    const [lx, ly] = p((a0 + a1) / 2, r + 38);
    return `<path d="M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}" fill="none" stroke="${cols[i % cols.length]}" stroke-width="26" stroke-linecap="butt"/>
      ${T(lx, ly - 3, l, { w: 800, s: 14, c: "#221610" })}${T(lx, ly + 14, `${s} s`, { s: 13, c: t.c, w: 700 })}`;
  }).join("");
  return `<svg viewBox="-40 -10 380 320" width="${ancho}" xmlns="http://www.w3.org/2000/svg">${segs}
    ${T(cx, cy - 2, "un ciclo", { s: 13, c: "#7d6553" })}${T(cx, cy + 20, `${total} segundos`, { s: 17, w: 800, c: "#221610" })}</svg>`;
}

// Gráfico vacío de una semana para que el paciente marque su puntuación diaria
function graficoSemana(t, { max = 10, eje = "Ánimo", ancho = "170mm", etiquetas = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], banda = true, paso = 1, cadaEtiqueta = 2 } = {}) {
  const dias = etiquetas, n = dias.length, W = 760, H = 210, x0 = 60, x1 = W - 20, y0 = 14, y1 = H - 30;
  const X = i => x0 + (i + .5) * (x1 - x0) / n, Y = v => y1 - v / max * (y1 - y0);
  return `<svg viewBox="0 0 ${W} ${H}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${banda ? `<rect x="${x0}" y="${Y(max * .7)}" width="${x1 - x0}" height="${Y(max * .4) - Y(max * .7)}" fill="${t.bg}" opacity=".7"/>` : ""}
    ${Array.from({ length: Math.floor(max / paso) + 1 }, (_, k) => { const v = k * paso; return `<line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" stroke="#E6DAC6" stroke-width="${v % (paso * 5) ? .8 : 1.4}"/>${k % cadaEtiqueta === 0 ? T(x0 - 10, Y(v) + 4, v, { a: "end", s: 11, c: "#9A7E68" }) : ""}`; }).join("")}
    ${dias.map((d, i) => `<line x1="${X(i)}" y1="${y0}" x2="${X(i)}" y2="${y1}" stroke="#EFE6D6" stroke-width="1" stroke-dasharray="3 4"/>${T(X(i), y1 + 20, d, { w: 700, s: 12, c: "#6B4A30" })}`).join("")}
    ${T(14, (y0 + y1) / 2, eje, { s: 11, c: "#7d6553", extra: ` transform="rotate(-90 14 ${(y0 + y1) / 2})"` })}
  </svg>`;
}

// Curva en U invertida: activación y rendimiento
function rendimiento(t, { ancho = "150mm" } = {}) {
  return `<svg viewBox="0 0 640 252" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    <rect x="235" y="20" width="170" height="168" fill="${t.bg}"/>
    <line x1="50" y1="188" x2="620" y2="188" stroke="#B8A898" stroke-width="1.5"/><line x1="50" y1="20" x2="50" y2="188" stroke="#B8A898" stroke-width="1.5"/>
    <path d="M60 178 C 180 175, 230 40, 320 40 S 470 176, 610 180" fill="none" stroke="${t.c}" stroke-width="3.5"/>
    ${T(140, 210, "Poca activación", { w: 700, s: 12, c: "#6B4A30" })}${T(140, 224, "apatía, aburrimiento", { s: 11 })}
    ${T(320, 210, "Zona óptima", { w: 800, s: 12, c: t.c })}${T(320, 224, "activo/a y centrado/a", { s: 11 })}
    ${T(510, 210, "Estrés excesivo", { w: 700, s: 12, c: "#A64A3A" })}${T(510, 224, "bloqueo, agotamiento", { s: 11 })}
    ${T(36, 104, "Rendimiento", { s: 11, c: "#7d6553", extra: ' transform="rotate(-90 36 104)"' })}${T(335, 246, "Nivel de activación →", { s: 11, c: "#7d6553" })}
  </svg>`;
}

// Ola de ansiedad: lo que temo frente a lo que ocurre
function olaAnsiedad(t, { ancho = "150mm" } = {}) {
  return `<svg viewBox="0 0 640 230" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="196" x2="620" y2="196" stroke="#B8A898" stroke-width="1.5"/><line x1="50" y1="18" x2="50" y2="196" stroke="#B8A898" stroke-width="1.5"/>
    <path d="M60 190 C 130 190, 170 60, 230 54" fill="none" stroke="#A64A3A" stroke-width="2.5" stroke-dasharray="7 6"/>
    <path d="M230 54 C 290 48, 340 30, 420 22" fill="none" stroke="#A64A3A" stroke-width="2.5" stroke-dasharray="7 6"/>${punta(424, 22, 4, -.6, "#A64A3A", 10)}
    ${etiqueta(430, 40, "Lo que temo: «no parará, iré a más»", "#A64A3A", "start")}
    <path d="M60 190 C 130 190, 170 60, 230 54 C 300 48, 330 170, 610 184" fill="none" stroke="${t.c}" stroke-width="3.5"/>
    <circle cx="230" cy="54" r="6" fill="${t.c}"/>
    ${etiqueta(132, 108, "sube", t.c)}${etiqueta(232, 82, "pico", t.c)}${etiqueta(470, 146, "baja por sí sola", t.c)}
    ${T(36, 110, "Ansiedad", { s: 11, c: "#7d6553", extra: ' transform="rotate(-90 36 110)"' })}${T(620, 216, "Tiempo (minutos) →", { a: "end", s: 11, c: "#7d6553" })}
  </svg>`;
}

// Termómetro con zonas (de abajo arriba). zonas: [[rango, etiqueta, color], …]
function termometro(zonas, t, { ancho = "60mm" } = {}) {
  const H = 300, top = 20, bot = 240, n = zonas.length, h = (bot - top) / n;
  return `<svg viewBox="0 0 260 ${H}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="${top - 6}" width="40" height="${bot - top + 12}" rx="20" fill="#fff" stroke="#B8A898" stroke-width="2"/>
    ${zonas.map(([r, l, c], i) => { const y = bot - (i + 1) * h; return `<rect x="48" y="${y + 2}" width="24" height="${h - 4}" rx="6" fill="${c}"/>
      <line x1="84" y1="${y + h / 2}" x2="98" y2="${y + h / 2}" stroke="#B8A898" stroke-width="1.5"/>${T(104, y + h / 2 - 3, r, { a: "start", w: 800, s: 14, c: "#221610" })}${T(104, y + h / 2 + 14, l, { a: "start", s: 12, c: "#6B4A30" })}`; }).join("")}
    <circle cx="60" cy="${bot + 26}" r="28" fill="${zonas[0][2]}" stroke="#B8A898" stroke-width="2"/>
  </svg>`;
}

// Rejilla de sueño: días × horas para sombrear el tiempo dormido
function rejillaSueno(t, { ancho = "180mm", dias = 7 } = {}) {
  const horas = ["21", "22", "23", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
  const W = 900, x0 = 90, cw = (W - x0 - 10) / horas.length, rh = 30, y0 = 26;
  const nd = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].slice(0, dias);
  return `<svg viewBox="0 0 ${W} ${y0 + rh * dias + 8}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${horas.map((h, i) => T(x0 + i * cw, 16, `${h}h`, { s: 11, w: 700, c: "#6B4A30" })).join("")}
    ${nd.map((d, j) => `${T(x0 - 12, y0 + j * rh + rh / 2 + 4, d, { a: "end", s: 11.5, w: 600, c: "#3B2A1E" })}
      ${horas.slice(0, -1).map((_, i) => `<rect x="${x0 + i * cw}" y="${y0 + j * rh}" width="${cw}" height="${rh}" fill="${(j % 2) ? "#FDFBF7" : "#fff"}" stroke="#E6DAC6" stroke-width="1"/>`).join("")}`).join("")}
    ${horas.map((_, i) => `<line x1="${x0 + i * cw}" y1="${y0 - 4}" x2="${x0 + i * cw}" y2="${y0 + rh * dias}" stroke="${i === 3 ? t.c : "#D9C9A8"}" stroke-width="${i === 3 ? 1.6 : 1}"/>`).join("")}
  </svg>`;
}

// Línea fina sin punta entre dos cajas (de borde a borde)
const enlace = (a, b, col, w = 1.6, dash = "") => { const [x1, y1] = borde(a, b.x, b.y, 4), [x2, y2] = borde(b, a.x, a.y, 4); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`; };

// Hexaflex de ACT: seis procesos alrededor de la flexibilidad psicológica
function hexaflex(t, { ancho = "150mm" } = {}) {
  const nodos = [["Momento presente", "atención flexible"], ["Valores", "lo que importa"], ["Acción comprometida", "pasos concretos"], ["Yo como contexto", "el observador"], ["Defusión", "pensamientos ≠ hechos"], ["Aceptación", "abrirse al malestar"]];
  const cx = 320, cy = 175, pos = nodos.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return { x: cx + Math.cos(a) * 225, y: cy + Math.sin(a) * 128, w: 168, h: 52 }; });
  const centro = { x: cx, y: cy, w: 190, h: 58 };
  return `<svg viewBox="0 0 640 350" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${pos.map((p, i) => enlace(p, pos[(i + 1) % 6], t.m, 1.4, "5 5")).join("")}
    ${pos.map(p => enlace(p, centro, t.c, 1.8)).join("")}
    ${pos.map((p, i) => caja(p, nodos[i][0], nodos[i][1], t, false)).join("")}
    ${caja(centro, "Flexibilidad", "psicológica", t, true)}</svg>`;
}

// Matriz ACT en blanco para rellenar en sesión
function matrizACT(t, { ancho = "165mm" } = {}) {
  const W = 700, H = 380, cx = 350, cy = 190;
  return `<svg viewBox="0 0 ${W} ${H}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="30" width="${W - 80}" height="${H - 60}" rx="14" fill="#fff" stroke="${t.m}" stroke-width="1.4"/>
    <line x1="40" y1="${cy}" x2="${W - 40}" y2="${cy}" stroke="${t.c}" stroke-width="2.2"/>
    <line x1="${cx}" y1="30" x2="${cx}" y2="${H - 30}" stroke="${t.c}" stroke-width="2.2"/>
    ${punta(36, cy, -1, 0, t.c, 11)}${punta(W - 36, cy, 1, 0, t.c, 11)}
    <circle cx="${cx}" cy="${cy}" r="30" fill="${t.c}"/>${T(cx, cy - 2, "Yo", { w: 800, s: 13, c: "#fff" })}${T(cx, cy + 13, "notando", { s: 10, c: "#fff" })}
    ${T(cx, 20, "LO QUE HAGO · conductas que se ven desde fuera", { w: 800, s: 11, c: t.c })}
    ${T(cx, H - 10, "LO QUE NOTO POR DENTRO · pensamientos, emociones, sensaciones", { w: 800, s: 11, c: t.c })}
    ${etiqueta(56, cy - 12, "ME ALEJA de lo que importa", t.c, "start")}
    ${etiqueta(W - 56, cy - 12, "ME ACERCA a lo que importa", t.c, "end")}
    ${T(60, 52, "¿Qué hago para quitarme el malestar?", { a: "start", s: 11, c: "#7d6553" })}
    ${T(W - 60, 52, "¿Qué haría si fuera hacia lo que me importa?", { a: "end", s: 11, c: "#7d6553" })}
    ${T(60, H - 44, "¿Qué aparece por dentro que me frena?", { a: "start", s: 11, c: "#7d6553" })}
    ${T(W - 60, H - 44, "¿Quién y qué es importante para mí?", { a: "end", s: 11, c: "#7d6553" })}</svg>`;
}

// Cadena A → B → C con la flecha de retorno que mantiene la conducta
function abc(t, { ancho = "165mm" } = {}) {
  const cajas = [{ x: 110, y: 50, w: 190, h: 64 }, { x: 350, y: 50, w: 190, h: 64 }, { x: 590, y: 50, w: 190, h: 64 }];
  const txt = [["A · Antecedentes", "qué pasa antes"], ["B · Conducta", "qué hace exactamente"], ["C · Consecuencias", "qué consigue o evita"]];
  return `<svg viewBox="0 0 700 160" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${flecha(cajas[0], cajas[1], t.c)}${flecha(cajas[1], cajas[2], t.c)}
    <path d="M590 88 C 590 140, 350 140, 350 96" fill="none" stroke="${t.c}" stroke-width="2" stroke-dasharray="6 5"/>${punta(350, 89, 0, -1, t.c)}
    ${cajas.map((c, i) => caja(c, txt[i][0], txt[i][1], t, i === 1)).join("")}
    ${etiqueta(470, 142, "la consecuencia inmediata mantiene la conducta", t.c)}</svg>`;
}

// Barra de tiempo de una sesión. bloques: [[nombre, minutos], …]; etiquetas alternas arriba y abajo
function tiempos(bloques, t, { ancho = "170mm", unidad = "′" } = {}) {
  const total = bloques.reduce((a, b) => a + b[1], 0), W = 760, x0 = 10, x1 = W - 10, y = 46, h = 34;
  let x = x0; const tonos = [t.c, t.m];
  const seg = bloques.map(([n, m], i) => { const w = (x1 - x0) * m / total, xa = x; x += w; const mid = xa + w / 2, arriba = i % 2 === 0;
    return `<rect x="${xa + 1.5}" y="${y}" width="${w - 3}" height="${h}" rx="7" fill="${tonos[i % 2]}"/>${T(mid, y + 22, m.toLocaleString("es-ES") + unidad, { w: 800, s: 13, c: i % 2 ? "#221610" : "#fff" })}
      <line x1="${mid}" y1="${arriba ? y - 4 : y + h + 4}" x2="${mid}" y2="${arriba ? y - 14 : y + h + 14}" stroke="${t.m}" stroke-width="1.2"/>
      ${T(mid, arriba ? y - 20 : y + h + 30, n, { w: 700, s: 12, c: "#221610" })}`; }).join("");
  return `<svg viewBox="0 0 ${W} 132" width="${ancho}" xmlns="http://www.w3.org/2000/svg">${seg}</svg>`;
}

// Leyenda de genograma y espacio para dibujarlo
function genograma(t, { ancho = "170mm" } = {}) {
  const c = t.c, y = 34, sim = [
    [`<rect x="-11" y="-11" width="22" height="22" fill="#fff" stroke="${c}" stroke-width="1.8"/>`, "Varón"],
    [`<circle r="11.5" fill="#fff" stroke="${c}" stroke-width="1.8"/>`, "Mujer"],
    [`<rect x="-11" y="-11" width="22" height="22" fill="#fff" stroke="${c}" stroke-width="1.8"/><rect x="-6.5" y="-6.5" width="13" height="13" fill="none" stroke="${c}" stroke-width="1.4"/>`, "Menor (caso)"],
    [`<rect x="-11" y="-11" width="22" height="22" fill="#fff" stroke="${c}" stroke-width="1.8"/><path d="M-11 -11 L11 11 M11 -11 L-11 11" stroke="${c}" stroke-width="1.4"/>`, "Fallecido/a"],
    [`<path d="M-20 0 H20" stroke="${c}" stroke-width="2"/>`, "Unión"],
    [`<path d="M-20 0 H20 M-4 8 L4 -8" stroke="${c}" stroke-width="2"/>`, "Separación"],
    [`<path d="M-20 0 H20 M-8 8 L0 -8 M0 8 L8 -8" stroke="${c}" stroke-width="2"/>`, "Divorcio"],
    [`<path d="M-20 0 H20" stroke="${c}" stroke-width="2" stroke-dasharray="4 4"/>`, "Convivencia"],
  ];
  return `<svg viewBox="0 0 760 300" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="758" height="298" rx="14" fill="#fff" stroke="${t.m}" stroke-width="1.4"/>
    <rect x="1" y="1" width="758" height="66" rx="14" fill="${t.bg}"/><rect x="1" y="50" width="758" height="17" fill="${t.bg}"/>
    ${sim.map(([g, l], i) => `<g transform="translate(${46 + i * 94} ${y})">${g}</g>${T(46 + i * 94, y + 26, l, { s: 10.5, c: "#5d4636" })}`).join("")}
    ${T(380, 290, "Tres generaciones si es posible · edades dentro de los símbolos · rodee a quienes conviven con el menor", { s: 10.5, c: "#9A7E68" })}</svg>`;
}

// Escala de hambre y saciedad 0–10 (los dos extremos son incómodos)
function hambre(t, { ancho = "170mm" } = {}) {
  const W = 760, x0 = 20, x1 = W - 20, w = (x1 - x0) / 11, y = 40, h = 40;
  const col = ["#C9705B", "#D98B67", "#E3A878", "#E8C48C", "#D9D49A", "#BFD3A0", "#A9CC9C", "#BFD3A0", "#E8C48C", "#E3A878", "#C9705B"];
  const marcas = [[0, "Muy hambriento/a"], [3, "Con hambre"], [5, "Ni hambre ni lleno/a"], [7, "Satisfecho/a"], [10, "Lleno/a hasta sentirme mal"]];
  return `<svg viewBox="0 0 ${W} 132" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${col.map((c, i) => `<rect x="${x0 + i * w + 2}" y="${y}" width="${w - 4}" height="${h}" rx="8" fill="${c}"/>${T(x0 + i * w + w / 2, y + 26, i, { w: 800, s: 15, c: "#221610" })}`).join("")}
    ${marcas.map(([v, l], k) => { const x = x0 + v * w + w / 2, arriba = k % 2 === 0, a = v === 0 ? "start" : v === 10 ? "end" : "middle", xt = v === 0 ? x0 + 2 : v === 10 ? x1 - 2 : x;
      return `<line x1="${x}" y1="${arriba ? y - 4 : y + h + 4}" x2="${x}" y2="${arriba ? y - 12 : y + h + 12}" stroke="#B9A687" stroke-width="1.2"/>${T(xt, arriba ? y - 18 : y + h + 28, l, { w: 700, s: 12, c: "#3B2A1E", a })}`; }).join("")}
    ${T(x0 + 6 * w + w / 2, 128, "zona cómoda: empieza a comer hacia el 3 y para hacia el 7", { s: 11, c: t.c, w: 700 })}</svg>`;
}

// Umbrales orientativos por 100 g en barras verde / ámbar / rojo. filas: [[nutriente, bajo, alto, max]]
function umbrales(filas, t, { ancho = "170mm" } = {}) {
  const W = 760, x0 = 150, x1 = W - 20, fh = 46;
  return `<svg viewBox="0 0 ${W} ${filas.length * fh + 30}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${filas.map(([n, b, a, max], i) => { const y = 14 + i * fh, X = v => x0 + v / max * (x1 - x0);
      return `${T(x0 - 14, y + 19, n, { a: "end", w: 800, s: 13, c: "#221610" })}
        <rect x="${x0}" y="${y}" width="${X(b) - x0 - 2}" height="26" rx="7" fill="#BFD3A0"/>
        <rect x="${X(b) + 2}" y="${y}" width="${X(a) - X(b) - 4}" height="26" rx="7" fill="#EBD08F"/>
        <rect x="${X(a) + 2}" y="${y}" width="${x1 - X(a) - 2}" height="26" rx="7" fill="#E39C7C"/>
        ${T((x0 + X(b)) / 2, y + 18, "bajo ≤ " + String(b).replace(".", ","), { w: 700, s: 11.5, c: "#221610" })}
        ${T((X(a) + x1) / 2, y + 18, "alto > " + String(a).replace(".", ","), { w: 700, s: 11.5, c: "#221610" })}`; }).join("")}
    ${T((x0 + x1) / 2, filas.length * fh + 22, "gramos por 100 g · entre medias, cantidad moderada", { s: 11, c: "#7d6553" })}</svg>`;
}

// Etiqueta nutricional de ejemplo con llamadas numeradas
function etiquetaNutricional(t, { ancho = "150mm" } = {}) {
  const filas = [["Valor energético", "392 kcal", "118 kcal", 0], ["Grasas", "9,5 g", "2,9 g", 0], ["  de las cuales saturadas", "4,1 g", "1,2 g", 2], ["Hidratos de carbono", "64 g", "19 g", 0], ["  de los cuales azúcares", "24 g", "7,2 g", 2], ["Fibra alimentaria", "6,8 g", "2,0 g", 3], ["Proteínas", "8,0 g", "2,4 g", 0], ["Sal", "0,9 g", "0,27 g", 2]];
  const x = 20, w = 420, y0 = 52, fh = 26;
  const marca = (n, cx, cy) => `<circle cx="${cx}" cy="${cy}" r="12" fill="${t.c}"/>${T(cx, cy + 4.5, n, { w: 800, s: 12.5, c: "#fff" })}`;
  return `<svg viewBox="0 0 700 ${y0 + filas.length * fh + 22}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x}" y="8" width="${w}" height="${y0 + filas.length * fh - 2}" rx="6" fill="#fff" stroke="#221610" stroke-width="2"/>
    ${T(x + 12, 31, "Información nutricional", { a: "start", w: 800, s: 14, c: "#221610" })}
    <rect x="${x + 232}" y="${y0 - 14}" width="96" height="${filas.length * fh + 12}" fill="${t.bg}"/>
    ${T(x + 280, y0 - 1, "por 100 g", { w: 800, s: 11, c: "#221610" })}${T(x + 372, y0 - 1, "por ración (30 g)", { s: 10, c: "#7d6553" })}
    ${filas.map(([n, a, b, k], i) => { const y = y0 + 20 + i * fh; return `<line x1="${x}" y1="${y - 17}" x2="${x + w}" y2="${y - 17}" stroke="#221610" stroke-width="${i === 0 ? 1.4 : .6}"/>
      ${T(x + 12, y, n.trim(), { a: "start", s: 11.5, c: "#221610", w: n.startsWith("  ") ? 400 : 700, extra: n.startsWith("  ") ? ' dx="12"' : "" })}${T(x + 280, y, a, { s: 11.5, c: "#221610", w: 700 })}${T(x + 372, y, b, { s: 11, c: "#7d6553" })}`; }).join("")}
    <line x1="${x + w + 8}" y1="${y0 - 5}" x2="472" y2="${y0 - 5}" stroke="${t.c}" stroke-width="1.4"/>${marca(1, 486, y0 - 5)}
    <line x1="${x + w + 8}" y1="${y0 + 20 + 2 * fh - 4}" x2="472" y2="${y0 + 20 + 2 * fh - 4}" stroke="${t.c}" stroke-width="1.4"/>${marca(2, 486, y0 + 20 + 2 * fh - 4)}${T(506, y0 + 20 + 2 * fh, "Saturadas, azúcares y sal:", { a: "start", s: 11.5, w: 700, c: "#221610" })}${T(506, y0 + 36 + 2 * fh, "cuanto menos, mejor", { a: "start", s: 11.5, c: "#5d4636" })}
    <line x1="${x + w + 8}" y1="${y0 + 20 + 5 * fh - 4}" x2="472" y2="${y0 + 20 + 5 * fh - 4}" stroke="${t.c}" stroke-width="1.4"/>${marca(3, 486, y0 + 20 + 5 * fh - 4)}${T(506, y0 + 20 + 5 * fh, "Fibra: cuanta más, mejor", { a: "start", s: 11.5, w: 700, c: "#221610" })}${T(506, y0 + 36 + 5 * fh, "(6 g o más es «alto en fibra»)", { a: "start", s: 11.5, c: "#5d4636" })}
    ${T(506, y0 - 1, "Compara siempre", { a: "start", s: 11.5, w: 700, c: "#221610" })}${T(506, y0 + 15, "por 100 g, no por ración", { a: "start", s: 11.5, c: "#5d4636" })}
  </svg>`;
}

// Escala de consecución de metas (GAS): −2 … +2
function gasEscala(t, { ancho = "165mm" } = {}) {
  const niveles = [["−2", "mucho peor"], ["−1", "peor"], ["0", "lo esperado"], ["+1", "mejor"], ["+2", "mucho mejor"]];
  const W = 760, w = (W - 20) / 5, cols = ["#E39C7C", "#EBC38C", t.c, "#BFD3A0", "#9CC18E"];
  return `<svg viewBox="0 0 ${W} 86" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${niveles.map(([n, l], i) => `<rect x="${10 + i * w + 3}" y="6" width="${w - 6}" height="44" rx="10" fill="${cols[i]}"/>${T(10 + i * w + w / 2, 36, n, { w: 800, s: 20, c: i === 2 ? "#fff" : "#221610" })}${T(10 + i * w + w / 2, 72, l, { w: 700, s: 12.5, c: "#3B2A1E" })}`).join("")}</svg>`;
}

// Perfil cognitivo en blanco: dominios × percentiles, para marcar el rendimiento
function perfilCognitivo(dominios, t, { ancho = "170mm" } = {}) {
  const W = 760, x0 = 230, x1 = W - 16, fh = 30, y0 = 34, H = y0 + dominios.length * fh + 30;
  const tramos = [[0, 2, "≤ 2"], [2, 9, "3–8"], [9, 25, "9–24"], [25, 75, "25–74"], [75, 100, "≥ 75"]];
  const cols = ["#E39C7C", "#EBC38C", "#EDE0A6", "#D8E4C4", "#BFD3A0"];
  // Escala no lineal (los tramos bajos se ensanchan para poder marcar)
  const anchoT = [.14, .16, .18, .32, .20]; let acc = x0; const xs = anchoT.map(a => { const a0 = acc; acc += a * (x1 - x0); return [a0, acc]; });
  return `<svg viewBox="0 0 ${W} ${H}" width="${ancho}" xmlns="http://www.w3.org/2000/svg">
    ${xs.map(([a, b], i) => `<rect x="${a + 1}" y="${y0 - 6}" width="${b - a - 2}" height="${dominios.length * fh + 8}" rx="6" fill="${cols[i]}" opacity=".55"/>${T((a + b) / 2, y0 - 14, "Pc " + tramos[i][2], { w: 800, s: 11.5, c: "#221610" })}`).join("")}
    ${dominios.map((d, i) => { const y = y0 + i * fh + fh / 2; return `<line x1="${x0}" y1="${y + fh / 2 - 1}" x2="${x1}" y2="${y + fh / 2 - 1}" stroke="#fff" stroke-width="1.5"/>${T(x0 - 12, y + 4, d, { a: "end", w: 700, s: 12, c: "#221610" })}`; }).join("")}
    ${T((x0 + x1) / 2, H - 6, "Marque el percentil de cada dominio y únalos · las categorías dependen del baremo utilizado", { s: 11, c: "#7d6553" })}</svg>`;
}

module.exports = { gasEscala, perfilCognitivo, hambre, umbrales, etiquetaNutricional, hexaflex, matrizACT, abc, tiempos, genograma, ciclo, flujo, bandas, respiracion, graficoSemana, rendimiento, olaAnsiedad, termometro, rejillaSueno, T };
