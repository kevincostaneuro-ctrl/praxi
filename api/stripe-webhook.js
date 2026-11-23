// ═════════════════════════════════════════════════════════════════════════════
// Praxi — avisos de Stripe (webhook)
// Stripe llama aquí cuando alguien paga, cambia, deja de pagar o cancela.
// Se comprueba la firma y se actualiza la tabla suscripciones de la clínica.
// En Stripe: Developers → Webhooks → endpoint https://www.praxiclinic.com/api/stripe-webhook
// con los eventos checkout.session.completed y customer.subscription.*
// ═════════════════════════════════════════════════════════════════════════════
import { filaSuscripcion, firmaValida, responder, stripe, supabaseServicio } from "./_pagos.js";

// En Vercel, leer req.body lo convierte en objeto y la firma ya no cuadra:
// se lee el flujo en bruto sin tocar req.body (en los tests llega un texto).
async function cuerpoEnBruto(req) {
  if (typeof req.rawBody === "string") return req.rawBody;
  const trozos = [];
  for await (const t of req) trozos.push(typeof t === "string" ? Buffer.from(t) : t);
  return Buffer.concat(trozos).toString("utf8");
}

export async function guardar(sub, fetchImpl = fetch) {
  const fila = filaSuscripcion(sub);
  if (!fila.clinica_id || !fila.plan) return false;
  await supabaseServicio("suscripciones?on_conflict=clinica_id", { metodo: "POST", cuerpo: fila, prefer: "resolution=merge-duplicates,return=minimal", fetchImpl });
  return true;
}

export default async function handler(req, res, fetchImpl = fetch) {
  if (req.method !== "POST") return responder(res, 405, { error: "Método no permitido" });
  const crudo = await cuerpoEnBruto(req);
  if (!firmaValida(crudo, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET)) return responder(res, 400, { error: "Firma no válida" });
  let evento;
  try { evento = JSON.parse(crudo); } catch { return responder(res, 400, { error: "Cuerpo no válido" }); }
  try {
    const o = evento.data?.object || {};
    if (evento.type === "checkout.session.completed" && o.mode === "subscription" && o.subscription) {
      const sub = await stripe(`subscriptions/${o.subscription}`, { metodo: "GET", fetchImpl });
      if (!sub.metadata?.clinica_id && o.client_reference_id) sub.metadata = { ...(o.metadata || {}), ...(sub.metadata || {}), clinica_id: o.client_reference_id };
      await guardar(sub, fetchImpl);
    } else if (evento.type?.startsWith("customer.subscription.")) {
      await guardar(o, fetchImpl);
    }
    return responder(res, 200, { recibido: true });
  } catch (e) {
    console.error("Webhook", evento?.type, e?.message);
    return responder(res, 500, { error: "No se pudo procesar" }); // Stripe lo reintentará
  }
}

// El cuerpo debe llegar sin procesar para comprobar la firma
export const config = { api: { bodyParser: false } };
