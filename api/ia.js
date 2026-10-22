// ═════════════════════════════════════════════════════════════════════════════
// Asistente IA de Praxi — función del servidor (Vercel)
// La clave de Anthropic vive SOLO aquí (variable de entorno ANTHROPIC_API_KEY en
// Vercel). El navegador nunca la ve. Solo responde a profesionales con sesión
// iniciada y que sean miembros activos de una clínica.
// ═════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dsujxycedqfvtkokhutd.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_Gxj5CCICnfUUOjWg3Gkp0A_3aaMKhCU";
const MODELO = process.env.IA_MODELO || "claude-haiku-5-5";
// Tope contra abusos: ningún uso profesional normal llega aquí
const LIMITE_DIARIO = Number(process.env.IA_LIMITE_DIARIO) || 300;

const MAX_MENSAJES = 30;
const MAX_CARACTERES = 120000;

function responder(res, status, cuerpo) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(cuerpo));
}

// ¿Quién llama? Comprueba el token de sesión con Supabase y que sea miembro activo
export async function verificarMiembro(token, fetchImpl = fetch) {
  if (!token) return null;
  const cab = { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` };
  const u = await fetchImpl(`${SUPABASE_URL}/auth/v1/user`, { headers: cab });
  if (!u.ok) return null;
  const usuario = await u.json();
  if (!usuario?.id) return null;
  const m = await fetchImpl(`${SUPABASE_URL}/rest/v1/miembros?select=id,activo,clinica_id&user_id=eq.${usuario.id}`, { headers: cab });
  if (!m.ok) return null;
  const filas = await m.json();
  const miembro = Array.isArray(filas) && filas.find(f => f.activo);
  return miembro ? { userId: usuario.id, miembroId: miembro.id, clinicaId: miembro.clinica_id } : null;
}

// Suma la consulta al contador del día (lo controla la base de datos)
export async function consumirCuota(token, fetchImpl = fetch) {
  const r = await fetchImpl(`${SUPABASE_URL}/rest/v1/rpc/consumir_ia`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_limite: LIMITE_DIARIO }),
  });
  if (r.ok) return { ok: true };
  const e = await r.json().catch(() => ({}));
  if (/límite diario/i.test(e?.message || "")) return { ok: false, status: 429, error: "Has alcanzado el límite diario del asistente. Mañana vuelve a estar disponible." };
  return { ok: false, status: 503, error: "El asistente no está disponible ahora mismo." };
}

export function validarPeticion(body) {
  if (!body || typeof body.system !== "string" || !Array.isArray(body.messages)) return "Petición no válida";
  if (body.messages.length === 0 || body.messages.length > MAX_MENSAJES) return "Demasiados mensajes en la conversación";
  for (const m of body.messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return "Mensaje no válido";
  }
  const total = body.system.length + body.messages.reduce((a, m) => a + m.content.length, 0);
  if (total > MAX_CARACTERES) return "La consulta es demasiado larga";
  return null;
}

export default async function handler(req, res, fetchImpl = fetch) {
  if (req.method !== "POST") return responder(res, 405, { error: "Método no permitido" });
  if (!process.env.ANTHROPIC_API_KEY) return responder(res, 503, { error: "El asistente IA no está configurado" });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let miembro;
  try { miembro = await verificarMiembro(token, fetchImpl); } catch { miembro = null; }
  if (!miembro) return responder(res, 401, { error: "Inicia sesión para usar el asistente" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const fallo = validarPeticion(body);
  if (fallo) return responder(res, 400, { error: fallo });

  let cuota;
  try { cuota = await consumirCuota(token, fetchImpl); } catch { cuota = { ok: false, status: 503, error: "El asistente no está disponible ahora mismo." }; }
  if (!cuota.ok) return responder(res, cuota.status, { error: cuota.error });

  try {
    const r = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1500,
        // La ficha va como contexto en caché: los mensajes siguientes no la pagan entera
        system: [{ type: "text", text: body.system, cache_control: { type: "ephemeral" } }],
        messages: body.messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic", r.status, data?.error?.type);
      return responder(res, 502, { error: "El asistente no ha podido responder. Inténtalo de nuevo." });
    }
    const texto = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return responder(res, 200, { texto: texto || "Sin respuesta." });
  } catch (e) {
    console.error("IA", e?.message);
    return responder(res, 502, { error: "No se ha podido conectar con el asistente." });
  }
}
