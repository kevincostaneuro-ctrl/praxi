// Personaliza un recurso PDF de la biblioteca: escribe paciente, profesional, clínica y fecha
// en los huecos de la cabecera. Las posiciones salen de /recursos/campos.json, que genera
// herramientas/recursos/construir.cjs al crear los PDF.
let mapaCampos = null;
async function campos() {
  if (!mapaCampos) mapaCampos = fetch("/recursos/campos.json").then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  return mapaCampos;
}

const pad = n => String(n).padStart(2, "0");
export const fechaHoy = (d = new Date()) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const iniciales = p => `${p?.nombre || ""} ${p?.apellidos || ""}`.split(/\s+/).filter(Boolean).map(s => s.trim()[0].toUpperCase() + ".").join(" ");

// Valores de cada campo según el tipo de recurso (en los del profesional, solo iniciales del paciente)
export function valoresCampos({ recurso, paciente, profesional, clinica, fecha = fechaHoy() }) {
  const nombrePaciente = paciente ? (recurso.cat === "profesional" ? iniciales(paciente) : `${paciente.nombre || ""} ${paciente.apellidos || ""}`.trim()) : "";
  return { paciente: nombrePaciente, profesional: profesional || "", clinica: clinica || "", fecha };
}

// Helvetica estándar usa WinAnsi: se conservan tildes y eñes y se limpia lo que no se puede escribir
function limpiar(texto, fuente) {
  let s = String(texto || "").replace(/\s+/g, " ").trim();
  try { fuente.encodeText(s); return s; } catch { /* sigue */ }
  s = [...s].map(ch => { try { fuente.encodeText(ch); return ch; } catch { const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, ""); try { fuente.encodeText(base); return base; } catch { return ""; } } }).join("");
  return s;
}

export async function pdfPersonalizado(recurso, valores) {
  const [{ PDFDocument, StandardFonts, rgb }, mapa, bytes] = await Promise.all([
    import("pdf-lib"), campos(), fetch(recurso.url).then(r => { if (!r.ok) throw new Error("No se pudo descargar el recurso"); return r.arrayBuffer(); }),
  ]);
  const posiciones = mapa[recurso.url];
  if (!posiciones?.length) return new Blob([bytes], { type: "application/pdf" });
  const doc = await PDFDocument.load(bytes);
  const fuente = await doc.embedFont(StandardFonts.Helvetica);
  const pagina = doc.getPage(0);
  for (const { campo, x, y, w } of posiciones) {
    const texto = limpiar(valores[campo], fuente);
    if (!texto) continue;
    let tam = 9.5;
    while (tam > 6 && fuente.widthOfTextAtSize(texto, tam) > w - 2) tam -= 0.25;
    let t = texto;
    while (t.length > 1 && fuente.widthOfTextAtSize(t, tam) > w - 2) t = t.slice(0, -2) + "…";
    pagina.drawText(t, { x: x + 1, y, size: tam, font: fuente, color: rgb(0.13, 0.09, 0.06) });
  }
  doc.setTitle(`${recurso.codigo} · ${recurso.titulo}`);
  doc.setProducer("Praxi");
  return new Blob([await doc.save()], { type: "application/pdf" });
}

export const nombreArchivo = (recurso, valores) => {
  const base = recurso.url.split("/").pop().replace(/\.pdf$/, "");
  const quien = (valores.paciente || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}${quien ? "-" + quien : ""}.pdf`;
};
