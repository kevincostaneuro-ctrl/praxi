-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Seguridad y RGPD (2)
--   1. Verificación en dos pasos: quien la activa no puede ver datos clínicos
--      hasta introducir el código, aunque alguien conozca su contraseña.
--      Lo aplica la base de datos, no solo la pantalla.
--   2. Volver a aceptar los términos cuando cambian (lo hace el administrador).
-- Requiere 04_cumplimiento.sql. Pegar entero en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. Verificación en dos pasos ─────────────────────────────────────────────
-- true si la sesión ya ha pasado el segundo paso, o si el usuario no lo tiene activado
create or replace function mfa_ok() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
grant execute on function mfa_ok() to authenticated;

-- Políticas RESTRICTIVAS: se suman a las de siempre en los datos clínicos
drop policy if exists pac_mfa on pacientes;
drop policy if exists cit_mfa on citas;
drop policy if exists tar_mfa on tareas;
drop policy if exists aud_mfa on auditoria;
create policy pac_mfa on pacientes as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok());
create policy cit_mfa on citas     as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok());
create policy tar_mfa on tareas    as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok());
create policy aud_mfa on auditoria as restrictive for select to authenticated using (mfa_ok());

-- ── 2. Aceptar una nueva versión de los términos ─────────────────────────────
create or replace function aceptar_terminos(p_version text) returns void
language plpgsql security definer set search_path = public as $$
declare yo miembros%rowtype;
begin
  select * into yo from miembros where user_id = auth.uid() and activo and rol = 'admin' limit 1;
  if not found then raise exception 'Solo el administrador puede aceptar los términos'; end if;
  if coalesce(trim(p_version), '') = '' then raise exception 'Versión no válida'; end if;
  update clinicas set terminos_version = trim(p_version), terminos_aceptados_en = now(), terminos_aceptados_por = auth.uid()
  where id = yo.clinica_id;
end $$;
revoke all on function aceptar_terminos(text) from public, anon;
grant execute on function aceptar_terminos(text) to authenticated;
