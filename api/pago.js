// ═════════════════════════════════════════════════════════════════════════════
// Praxi — empezar un pago (Stripe Checkout) o abrir el portal de la suscripción
// POST /api/pago  { accion: "elegir", plan, periodo }  → { url } de la página de pago
// POST /api/pago  { accion: "gestionar" }             → { url } del portal de Stripe
// Solo el administrador de la clínica puede hacerlo.
// ═════════════════════════════════════════════════════════════════════════════
import { FUNDADOR, PRECIOS, URL_APP, ivaIncluido, quienLlama, responder, stripe, supabaseServicio } from "./_pagos.js";

const PLANES_VALIDOS = ["basico", "profesional", "fundador", "clinica"];

export default async function handler(req, res, fetchImpl = fetch) {
  if (req.method !== "POST") return responder(res, 405, { error: "Método no permitido" });
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return responder(res, 503, { error: "Los pagos todavía no están configurados." });
  const yo = await quienLlama(req, fetchImpl).catch(() => null);
  if (!yo) return responder(res, 401, { error: "Inicia sesión para continuar." });
  if (!yo.esAdmin) return responder(res, 403, { error: "Solo el administrador de la clínica puede gestionar el plan." });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  try {
    const [actual] = await supabaseServicio(`suscripciones?clinica_id=eq.${yo.clinicaId}&select=*`, { fetchImpl });

    if (body.accion === "gestionar") {
      if (!actual?.stripe_customer_id) return responder(res, 400, { error: "Todavía no tienes una suscripción." });
      const confs = await stripe("billing_portal/configurations", { metodo: "GET", datos: { active: true, limit: 1 }, fetchImpl });
      let configuracion = confs.data?.[0]?.id;
      if (!configuracion) {
        configuracion = (await stripe("billing_portal/configurations", { fetchImpl, datos: {
          business_profile: { headline: "Praxi · tu suscripción" },
          features: { invoice_history: { enabled: true }, payment_method_update: { enabled: true }, customer_update: { enabled: true, allowed_updates: { 0: "email", 1: "address", 2: "tax_id" } }, subscription_cancel: { enabled: true, mode: "at_period_end" } },
        } })).id;
      }
      const p = await stripe("billing_portal/sessions", { fetchImpl, datos: { customer: actual.stripe_customer_id, return_url: URL_APP, configuration: configuracion } });
      return responder(res, 200, { url: p.url });
    }

    // Elegir plan
    const plan = String(body.plan || "");
    const periodo = body.periodo === "anual" ? "anual" : "mensual";
    if (!PLANES_VALIDOS.includes(plan)) return responder(res, 400, { error: "Plan no válido." });
    const precio = PRECIOS[plan];
    if (!precio[periodo]) return responder(res, 400, { error: "Ese plan no tiene pago anual." });
    if (actual && ["activa", "impagada"].includes(actual.estado) && actual.stripe_subscription_id) return responder(res, 409, { error: "Ya tienes un plan activo. Cámbialo o cancélalo desde «Gestionar suscripción»." });
    if (plan === "fundador") {
      if (Date.now() >= new Date(FUNDADOR.hasta).getTime()) return responder(res, 400, { error: "El precio de fundador ya no está disponible." });
      const fundadores = await supabaseServicio("suscripciones?plan=eq.fundador&estado=in.(activa,impagada,cortesia)&select=clinica_id", { fetchImpl });
      if ((fundadores || []).length >= FUNDADOR.plazas) return responder(res, 400, { error: "Ya se han cubierto las 100 plazas de fundador." });
    }
    // Profesionales extra en Clínica: los que pasen de 3
    let extra = 0;
    if (plan === "clinica") {
      const miembros = await supabaseServicio(`miembros?clinica_id=eq.${yo.clinicaId}&activo=eq.true&select=id`, { fetchImpl });
      extra = Math.max(0, (miembros || []).length - 3);
    }
    const iva = await ivaIncluido(fetchImpl);
    const intervalo = periodo === "anual" ? "year" : "month";
    const linea = (p, cantidad, tipo) => ({
      price_data: { currency: "eur", unit_amount: p[periodo], tax_behavior: "inclusive", recurring: { interval: intervalo }, product_data: { name: p.nombre, metadata: { praxi: tipo } } },
      quantity: cantidad, tax_rates: { 0: iva },
    });
    const lineas = { 0: linea(precio, 1, plan) };
    if (extra > 0) lineas[1] = linea(PRECIOS.extra, extra, "extra");
    const metadata = { clinica_id: yo.clinicaId, plan, periodo, extra };
    const sesion = await stripe("checkout/sessions", { fetchImpl, datos: {
      mode: "subscription",
      line_items: lineas,
      client_reference_id: yo.clinicaId,
      ...(actual?.stripe_customer_id ? { customer: actual.stripe_customer_id } : { customer_email: yo.email }),
      subscription_data: { metadata },
      metadata,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      locale: "es",
      success_url: `${URL_APP}?pago=ok`,
      cancel_url: `${URL_APP}?pago=cancelado`,
    } });
    return responder(res, 200, { url: sesion.url });
  } catch (e) {
    console.error("Pago", e?.message, e?.stripe?.code || "");
    return responder(res, 502, { error: "No se ha podido iniciar el pago. Inténtalo de nuevo." });
  }
}
