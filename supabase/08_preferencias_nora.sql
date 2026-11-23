-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Cómo te habla Nora (preferencias de cada profesional)
-- Tono, extensión, formato, tratamiento, cómo llamarte e instrucciones propias.
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
-- ═════════════════════════════════════════════════════════════════════════════

alter table miembros add column if not exists preferencias_nora jsonb;

-- Cada profesional solo puede cambiar SUS preferencias (no el resto de su ficha de miembro)
create or replace function guardar_mis_preferencias_nora(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if p is not null and (jsonb_typeof(p) <> 'object' or length(p::text) > 3000) then
    raise exception 'Preferencias no válidas';
  end if;
  update miembros set preferencias_nora = p where user_id = auth.uid() and activo;
  if not found then raise exception 'No autorizado'; end if;
  return p;
end $$;

revoke all on function guardar_mis_preferencias_nora(jsonb) from public, anon;
grant execute on function guardar_mis_preferencias_nora(jsonb) to authenticated;
