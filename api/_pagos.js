// ═════════════════════════════════════════════════════════════════════════════
// Pagos de Praxi (Stripe) — utilidades compartidas del servidor
// Los archivos de /api que empiezan por «_» no son rutas: solo se importan.
// Claves (solo en Vercel, nunca en el código):
//   STRIPE_SECRET_KEY          clave secreta de Stripe (sk_test_… / sk_live_…)
//   STRIPE_WEBHOOK_SECRET      secreto del webhook (whsec_…)
//   SUPABASE_SERVICE_ROLE_KEY  clave de servicio de Supabase (escribe suscripciones)
// ═════════════════════════════════════════════════════════════════════════════
import crypto from "node:crypto";

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://dsujxycedqfvtkokhutd.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_Gxj5CCICnfUUOjWg3Gkp0A_3aaMKhCU";
export const URL_APP = process.env.URL_APP || "https://www.praxiclinic.com/app";
const VERSION_STRIPE = "2024-06-20";

// Precios finales en céntimos, IVA incluido. El extra de Clínica es por profesional a partir del 4.º
export const PRECIOS = {
  basico: { nombre: "Praxi Básico", mensual: 999 },
  profesional: { nombre: "Praxi Profesional", mensual: 2400, anual: 24000 },
  fundador: { nombre: "Praxi Profesional · precio fundador", mensual: 1500 },
  clinica: { nombre: "Praxi Clínica", mensual: 5900, anual: 59000 },
  extra: { nombre: "Praxi Clínica · profesional adicional", mensual: 1900, anual: 19000 },
};
export const FUNDADOR = { plazas: 100, hasta: "2027-04-01T00:00:00+02:00" };

export function responder(res, status, cuerpo) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(cuerpo));
}

// Codifica objetos anidados como los quiere la API de Stripe: a[b][0][c]=…
export function formulario(obj, prefijo = "", partes = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const clave = prefijo ? `${prefijo}[${k}]` : k;
    if (typeof v === "object") formulario(v, clave, partes);
    else partes.push(`${encodeURIComponent(clave)}=${encodeURIComponent(String(v))}`);
  }
  return partes.join("&");
}

export async function stripe(ruta, { metodo = "POST", datos, fetchImpl = fetch } = {}) {
  const url = `https://api.stripe.com/v1/${ruta}${metodo === "GET" && datos ? `?${formulario(datos)}` : ""}`;
  const r = await fetchImpl(url, {
    method: metodo,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Stripe-Version": VERSION_STRIPE, ...(metodo === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: metodo === "POST" && datos ? formulario(datos) : undefined,
  });
  const j = await r.json();
  if (!r.ok) { const e = new Error(j?.error?.message || "Error de Stripe"); e.stripe = j?.error; throw e; }
  return j;
}

// Supabase con la clave de servicio (solo servidor)
export async function supabaseServicio(ruta, { metodo = "GET", cuerpo, prefer, fetchImpl = fetch } = {}) {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetchImpl(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    method: metodo,
    headers: { apikey: clave, Authorization: `Bearer ${clave}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// Quién llama: usuario con sesión, miembro activo; devuelve también su rol y su email
export async function quienLlama(req, fetchImpl = fetch) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const cab = { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` };
  const u = await fetchImpl(`${SUPABASE_URL}/auth/v1/user`, { headers: cab });
  if (!u.ok) return null;
  const usuario = await u.json();
  if (!usuario?.id) return null;
  const m = await fetchImpl(`${SUPABASE_URL}/rest/v1/miembros?select=id,activo,rol,clinica_id&user_id=eq.${usuario.id}`, { headers: cab });
  if (!m.ok) return null;
  const miembro = (await m.json()).find(f => f.activo);
  return miembro ? { email: usuario.email, miembroId: miembro.id, clinicaId: miembro.clinica_id, esAdmin: miembro.rol === "admin" } : null;
}

// Tipo de IVA del 21 % «incluido en el precio» (se crea la primera vez)
export async function ivaIncluido(fetchImpl = fetch) {
  const lista = await stripe("tax_rates", { metodo: "GET", datos: { active: true, inclusive: true, limit: 100 }, fetchImpl });
  const existente = (lista.data || []).find(t => Number(t.percentage) === 21 && t.inclusive && /iva/i.test(t.display_name || ""));
  if (existente) return existente.id;
  const nuevo = await stripe("tax_rates", { datos: { display_name: "IVA", description: "IVA 21 % incluido", percentage: 21, inclusive: true, country: "ES", jurisdiction: "ES" }, fetchImpl });
  return nuevo.id;
}

// Webhook: comprueba la firma de Stripe (cabecera stripe-signature) con el cuerpo en bruto
export function firmaValida(cuerpo, cabecera, secreto, ahora = Date.now(), tolerancia = 300) {
  if (!cabecera || !secreto) return false;
  const partes = Object.fromEntries(cabecera.split(",").map(p => p.split("=")).filter(p => p.length === 2).map(([k, v]) => [k.trim(), v]));
  const t = Number(partes.t);
  const firmas = cabecera.split(",").filter(p => p.trim().startsWith("v1=")).map(p => p.trim().slice(3));
  if (!t || !firmas.length || Math.abs(ahora / 1000 - t) > tolerancia) return false;
  const esperada = crypto.createHmac("sha256", secreto).update(`${t}.${cuerpo}`, "utf8").digest("hex");
  return firmas.some(f => f.length === esperada.length && crypto.timingSafeEqual(Buffer.from(f), Buffer.from(esperada)));
}

// Estado de Stripe → estado de Praxi
export function estadoDesdeStripe(s) {
  if (["active", "trialing"].includes(s)) return "activa";
  if (["past_due", "unpaid", "incomplete"].includes(s)) return "impagada";
  return "cancelada";
}

// Fila de suscripciones a partir de una suscripción de Stripe
export function filaSuscripcion(sub) {
  const md = sub.metadata || {};
  const fin = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  const extra = (sub.items?.data || []).filter(i => i.price?.metadata?.praxi === "extra" || /adicional/i.test(i.price?.product?.name || i.price?.nickname || "")).reduce((a, i) => a + (i.quantity || 0), 0);
  return {
    clinica_id: md.clinica_id,
    plan: md.plan,
    periodo: md.periodo === "anual" ? "anual" : "mensual",
    estado: estadoDesdeStripe(sub.status),
    profesionales_extra: Number(md.extra ?? extra) || 0,
    fin_periodo: fin ? new Date(fin * 1000).toISOString() : null,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    actualizado_en: new Date().toISOString(),
  };
}
