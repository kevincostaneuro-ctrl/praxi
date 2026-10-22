-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Lista de espera: consentimiento RGPD + aviso por email en cada alta
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
-- Requiere haber guardado antes la clave API de Brevo en Vault (ver README de
-- los pasos): select vault.create_secret('xkeysib-…', 'brevo_api_key');
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Prueba del consentimiento (RGPD art. 7.1: hay que poder demostrarlo) ─────
alter table lista_espera add column if not exists acepta_privacidad boolean not null default false;
alter table lista_espera add column if not exists consentimiento_en timestamptz;
alter table lista_espera add column if not exists version_privacidad text;

-- Desde la web solo se admite el alta si se ha aceptado la política
drop policy if exists le_insert on lista_espera;
create policy le_insert on lista_espera for insert to anon, authenticated
  with check (acepta_privacidad = true);

-- La fecha del consentimiento la pone el servidor, no el navegador
create or replace function public.fecha_consentimiento() returns trigger
language plpgsql as $$
begin
  if new.acepta_privacidad then new.consentimiento_en := now(); end if;
  return new;
end $$;
drop trigger if exists lista_espera_fecha_consentimiento on lista_espera;
create trigger lista_espera_fecha_consentimiento before insert on lista_espera
  for each row execute function fecha_consentimiento();

-- ── Aviso por email a contacto@praxiclinic.com en cada alta ───────────────────
create extension if not exists pg_net;

create or replace function public.avisar_nueva_espera() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  clave text;
  total int;
begin
  select decrypted_secret into clave from vault.decrypted_secrets where name = 'brevo_api_key' limit 1;
  if clave is null then return new; end if;
  select count(*) into total from public.lista_espera;
  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', clave, 'content-type', 'application/json', 'accept', 'application/json'),
    body    := jsonb_build_object(
      'sender',  jsonb_build_object('name', 'Praxi', 'email', 'no-reply@praxiclinic.com'),
      'to',      jsonb_build_array(jsonb_build_object('email', 'contacto@praxiclinic.com')),
      'subject', 'Nueva persona en la lista de espera de Praxi',
      -- Solo texto (sin HTML): lo que escribe la persona no puede inyectar nada en el email
      'textContent',
        'Se ha apuntado alguien a la lista de espera.' || E'\n\n' ||
        'Nombre: '    || coalesce(new.nombre, '-')    || E'\n' ||
        'Email: '     || coalesce(new.email, '-')     || E'\n' ||
        'Profesión: ' || coalesce(new.profesion, '-') || E'\n' ||
        'Fecha: '     || to_char(now() at time zone 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') || E'\n\n' ||
        'Total en la lista: ' || total || E'\n\n' ||
        'Ver la lista completa: https://supabase.com/dashboard/project/dsujxycedqfvtkokhutd/editor'
    )
  );
  return new;
exception when others then
  -- Si el aviso falla, el alta se guarda igualmente
  return new;
end $$;

drop trigger if exists lista_espera_avisar on lista_espera;
create trigger lista_espera_avisar after insert on lista_espera
  for each row execute function avisar_nueva_espera();
