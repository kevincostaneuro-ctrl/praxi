-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Enlace de videollamada de cada profesional
-- Cada profesional guarda su enlace fijo (Zoom, Google Meet, Teams, Doxy.me…).
-- Las citas nuevas lo usan por defecto y se puede cambiar en cada cita.
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
-- ═════════════════════════════════════════════════════════════════════════════

alter table miembros add column if not exists enlace_videollamada text;

-- Cada profesional solo puede cambiar SU enlace (no el resto de su ficha de miembro)
create or replace function guardar_mi_enlace(p_enlace text)
returns text language plpgsql security definer set search_path = public as $$
declare e text := nullif(trim(coalesce(p_enlace, '')), '');
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if e is not null and (e !~* '^https://[^\s]+$' or length(e) > 500) then
    raise exception 'El enlace debe empezar por https://';
  end if;
  update miembros set enlace_videollamada = e where user_id = auth.uid() and activo;
  if not found then raise exception 'No autorizado'; end if;
  return e;
end $$;

revoke all on function guardar_mi_enlace(text) from public, anon;
grant execute on function guardar_mi_enlace(text) to authenticated;
