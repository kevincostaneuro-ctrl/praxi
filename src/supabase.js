import { createClient } from "@supabase/supabase-js";

// La clave "publishable" está pensada para ir en el navegador: la seguridad
// la ponen las políticas RLS de la base de datos (supabase/schema.sql).
const URL = import.meta.env.VITE_SUPABASE_URL || "https://dsujxycedqfvtkokhutd.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Gxj5CCICnfUUOjWg3Gkp0A_3aaMKhCU";

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Supabase devuelve como máximo 1000 filas por petición: leer por páginas
export async function leerTodo(tabla, clinicaId) {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select("*")
      .eq("clinica_id", clinicaId).order("id").range(desde, desde + 999);
    if (error) throw error;
    filas.push(...data);
    if (data.length < 1000) return filas;
  }
}

// Compara el estado anterior con el nuevo y guarda solo lo que ha cambiado
export async function sincronizar(tabla, clinicaId, prev, next, aFila) {
  const antes = new Map(prev.map(x => [x.id, x]));
  const ahora = new Set(next.map(x => x.id));
  const cambiados = next.filter(x => antes.get(x.id) !== x).map(aFila);
  const borrados = prev.filter(x => !ahora.has(x.id)).map(x => x.id);
  if (cambiados.length) {
    const { error } = await supabase.from(tabla).upsert(cambiados, { onConflict: "clinica_id,id" });
    if (error) throw error;
  }
  if (borrados.length) {
    const { data, error } = await supabase.from(tabla).delete()
      .eq("clinica_id", clinicaId).in("id", borrados).select("id");
    if (error) throw error;
    if ((data || []).length < borrados.length) throw new Error("Sin permiso para borrar");
  }
}
