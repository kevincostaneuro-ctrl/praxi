// Genera los PDF de los recursos y el mapa de campos personalizables.
// Uso: node herramientas/recursos/construir.cjs [salida] [lote ...]
//   salida por defecto: public/recursos   ·   lotes: nombres de archivos de contenido/ (sin .cjs)
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const { html, TEMAS } = require("./plantilla.cjs");

const RAIZ = path.join(__dirname, "..", "..");
const salida = path.resolve(process.argv[2] || path.join(RAIZ, "public", "recursos"));
const lotes = process.argv.slice(3).length ? process.argv.slice(3) : fs.readdirSync(path.join(__dirname, "contenido")).map(f => f.replace(/\.cjs$/, ""));

const pie = (codigo, aviso) => `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:6.2pt;color:#9A7E68;padding:0 15mm;">
  <div style="border-top:0.5pt solid #E3D6BF;padding-top:1.5mm;display:flex;justify-content:space-between;gap:4mm;">
    <span style="white-space:nowrap;">${aviso}</span><span style="white-space:nowrap;">praXi · praxiclinic.com · ${codigo} · <span class="pageNumber"></span>/<span class="totalPages"></span></span></div></div>`;
const AVISO_PAC = "Material de apoyo: no sustituye la atención de tu profesional. Si piensas en hacerte daño: 024 (gratuito, 24 h) · Emergencias: 112";
const AVISO_PRO = "Uso profesional. Material de apoyo: no sustituye el juicio clínico ni la formación específica en cada técnica o instrumento.";

// Palabras de cada página del PDF (pdftotext -bbox), sin el pie
function paginasBbox(pdf) {
  const xml = require("child_process").execFileSync("pdftotext", ["-bbox", pdf, "-"]).toString();
  return xml.split("<page ").slice(1).map(pg => [...pg.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
    .map(m => ({ t: m[5], yMin: +m[2], yMax: +m[4] })).filter(w => w.yMin < 790));
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 794, height: 1123 } }); // A4 a 96 ppp
  const mapaRuta = path.join(salida, "campos.json");
  const mapa = fs.existsSync(mapaRuta) ? JSON.parse(fs.readFileSync(mapaRuta, "utf8")) : {};
  for (const lote of lotes) {
    for (const r of require(`./contenido/${lote}.cjs`)) {
      await p.setContent(html(r), { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      // Posición exacta de los campos: se imprime una versión con marcas y se leen sus coordenadas del PDF
      const pdfOpts = { format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: `<div style="position:absolute;top:0;left:0;width:100%;height:4mm;background:${(TEMAS[r.tema] || TEMAS.profesional).c};-webkit-print-color-adjust:exact;"></div>`,
        footerTemplate: pie(r.codigo, r.aviso || (r.cat === "paciente" ? AVISO_PAC : AVISO_PRO)) };
      const tmp = path.join(require("os").tmpdir(), "praxi-medida.pdf");
      // Saltos de página condicionales: un salto que dejaría la página anterior medio vacía se anula
      for (let vuelta = 0; vuelta < 12; vuelta++) {
        await p.evaluate(() => document.querySelectorAll(".salto").forEach((el, k) => {
          const mk = s => `<div class="mk" style="height:0;overflow:visible;line-height:0;font-size:3px;color:#fff;white-space:nowrap">${s}${k}</div>`;
          el.insertAdjacentHTML("beforebegin", mk("SLE")); el.insertAdjacentHTML("afterend", mk("SLS"));
        }));
        await p.pdf({ ...pdfOpts, path: tmp });
        await p.evaluate(() => document.querySelectorAll(".mk").forEach(el => el.remove()));
        const paginas = paginasBbox(tmp);
        // el marcador mide 0 de alto; si cae justo en el corte sale en las dos páginas y cuenta la última
        const donde = (txt) => { for (let i = paginas.length - 1; i >= 0; i--) { const w = paginas[i].find(w => w.t === txt); if (w) return { pag: i, y: w.yMax }; } return null; };
        const fijos = await p.evaluate(() => [...document.querySelectorAll(".salto")].map(el => el.classList.contains("fijo")));
        const n = fijos.length;
        let anular = -1;
        for (let k = 0; k < n; k++) {
          if (fijos[k]) continue;
          const fin = donde("SLE" + k), ini = donde("SLS" + k);
          if (!fin || !ini) continue;
          const arriba = fin.pag === 0 ? 0 : 45.35, abajo = 790.9;
          const relleno = (fin.y - arriba) / (abajo - arriba);
          if (ini.pag - fin.pag > 1 || relleno < 0.55) { anular = k; break; }
        }
        if (anular < 0) break;
        await p.evaluate(k => { const el = document.querySelectorAll(".salto")[k]; el.className = "salto-anulado"; }, anular);
      }
      // Si la última página queda casi vacía (o solo con las referencias), se prueba una versión más compacta
      const resumen = async () => { await p.pdf({ ...pdfOpts, path: tmp }); const pg = paginasBbox(tmp), u = pg[pg.length - 1];
        const y = Math.max(0, ...u.map(w => w.yMax)), soloRefs = u.length > 0 && [...u].sort((a, b) => a.yMin - b.yMin)[0].t === "REFERENCIAS";
        return { n: pg.length, floja: pg.length > 1 && (soloRefs || (y - 45.35) / (790.9 - 45.35) < 0.12) }; };
      let est = await resumen();
      if (est.floja) for (const c of ["c1", "c2"]) {
        await p.evaluate(c => { document.body.classList.remove("c1", "c2"); document.body.classList.add(c); }, c);
        const e2 = await resumen();
        if (e2.n < est.n) { est = e2; break; }
        if (c === "c2") await p.evaluate(() => document.body.classList.remove("c1", "c2"));
      }
      await p.evaluate(() => document.querySelectorAll("[data-campo]").forEach(el => { el.innerHTML = `<span style="font-size:9pt;line-height:1">MRK${el.dataset.campo}</span>`; el.style.display = "flex"; el.style.alignItems = "flex-end"; }));
      await p.pdf({ ...pdfOpts, path: tmp });
      const bbox = require("child_process").execFileSync("pdftotext", ["-bbox", "-f", "1", "-l", "1", tmp, "-"]).toString();
      const altoPag = 841.89;
      mapa["/recursos/" + r.archivo] = [...bbox.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">MRK(\w+)<\/word>/g)].map(m => {
        return { campo: m[5], x: +(+m[1]).toFixed(1), y: +(altoPag - +m[4] + 2).toFixed(1) };
      });
      // ancho disponible: hasta el siguiente campo o el margen derecho
      const cs = mapa["/recursos/" + r.archivo];
      cs.forEach((c, k) => { c.w = +(((cs[k + 1] ? cs[k + 1].x : 595.28 - 42.5) - c.x - 10)).toFixed(1); });
      const esperados = (r.camposPerso || [1, 2, 3, 4]).length;
      if (cs.length !== esperados) throw new Error(`Se esperaban ${esperados} campos y hay ${cs.length} en ` + r.archivo);
      await p.evaluate(() => document.querySelectorAll("[data-campo]").forEach(el => { el.innerHTML = ""; el.style.display = ""; }));
      const destino = path.join(salida, r.archivo);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      await p.pdf({ ...pdfOpts, path: destino });
      const pags = paginasBbox(destino);
      const ultima = pags[pags.length - 1], yUlt = Math.max(0, ...ultima.map(w => w.yMax));
      const rUlt = pags.length > 1 ? (yUlt - 45.35) / (790.9 - 45.35) : 1;
      const vacias = pags.map((pg, i) => pg.length === 0 ? i + 1 : 0).filter(Boolean);
      console.log("✓", r.codigo.padEnd(11), String(pags.length) + " pág", rUlt < 0.2 ? `⚠ última página al ${Math.round(rUlt * 100)} %` : "", vacias.length ? `⚠ páginas en blanco: ${vacias}` : "", r.archivo);
    }
  }
  fs.writeFileSync(mapaRuta, JSON.stringify(mapa, null, 1));
  await b.close();
})();
