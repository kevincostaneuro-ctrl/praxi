-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Planes y suscripciones
-- · Cada clínica tiene 3 meses de prueba desde que se crea (todo abierto, sin tarjeta).
-- · Después necesita una suscripción activa; si no, queda en SOLO LECTURA:
--   puede ver, exportar y borrar, pero no crear ni modificar pacientes ni citas.
-- · La tabla suscripciones solo la escribe el servidor (webhook de Stripe) con la
--   clave de servicio: ningún usuario puede darse un plan a sí mismo.
-- · Nora: 50 consultas al día en el plan Básico; ninguna si la cuenta está caducada.
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists suscripciones (
  clinica_id              uuid primary key references clinicas(id) on delete cascade,
  plan                    text not null check (plan in ('basico','profesional','clinica','fundador')),
  periodo                 text not null default 'mensual' check (periodo in ('mensual','anual')),
  estado                  text not null default 'activa' check (estado in ('activa','impagada','cancelada','cortesia')),
  profesionales_extra     int  not null default 0,
  fin_periodo             timestamptz,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  actualizado_en          timestamptz not null default now()
);

alter table suscripciones enable row level security;
revoke insert, update, delete on suscripciones from anon, authenticated;
grant select on suscripciones to authenticated;
drop policy if exists sus_select on suscripciones;
create policy sus_select on suscripciones for select to authenticated using (es_miembro(clinica_id));

-- Plan efectivo de una clínica: el de su suscripción, 'prueba' o 'caducado'
-- Un impago conserva el acceso 14 días desde el fin del periodo pagado.
create or replace function plan_efectivo(c uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select s.plan from suscripciones s
      where s.clinica_id = c
        and (s.estado in ('activa','cortesia')
             or (s.estado in ('impagada','cancelada') and now() < coalesce(s.fin_periodo, now()) + interval '14 days'))),
    (select 'prueba' from clinicas cl where cl.id = c and now() < cl.creado_en + interval '90 days'),
    'caducado');
$$;

create or replace function puede_escribir(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select plan_efectivo(c) <> 'caducado';
$$;
grant execute on function plan_efectivo(uuid) to authenticated;
grant execute on function puede_escribir(uuid) to authenticated;

-- Solo lectura: políticas RESTRICTIVAS que se suman a las de siempre (crear y modificar)
drop policy if exists pac_plan_insert on pacientes;
drop policy if exists pac_plan_update on pacientes;
drop policy if exists cit_plan_insert on citas;
drop policy if exists cit_plan_update on citas;
create policy pac_plan_insert on pacientes as restrictive for insert to authenticated with check (puede_escribir(clinica_id));
create policy pac_plan_update on pacientes as restrictive for update to authenticated using (puede_escribir(clinica_id)) with check (puede_escribir(clinica_id));
create policy cit_plan_insert on citas as restrictive for insert to authenticated with check (puede_escribir(clinica_id));
create policy cit_plan_update on citas as restrictive for update to authenticated using (puede_escribir(clinica_id)) with check (puede_escribir(clinica_id));

-- Nora: el límite depende del plan
create or replace function consumir_ia(p_limite int)
returns int language plpgsql security definer set search_path = public as $$
declare yo miembros%rowtype; hoy date := (now() at time zone 'Europe/Madrid')::date; n int; pl text; lim int;
begin
  select * into yo from miembros where user_id = auth.uid() and activo limit 1;
  if not found then raise exception 'No autorizado'; end if;
  pl := plan_efectivo(yo.clinica_id);
  if pl = 'caducado' then raise exception 'Plan caducado'; end if;
  lim := case when pl = 'basico' then least(50, greatest(p_limite, 1)) else greatest(p_limite, 1) end;
  insert into uso_ia (miembro_id, clinica_id, dia, consultas)
  values (yo.id, yo.clinica_id, hoy, 0)
  on conflict (miembro_id, dia) do nothing;
  update uso_ia set consultas = consultas + 1
  where miembro_id = yo.id and dia = hoy and consultas < lim
  returning consultas into n;
  if n is null then raise exception 'Límite diario del asistente alcanzado'; end if;
  return n;
end $$;
revoke all on function consumir_ia(int) from public, anon;
grant execute on function consumir_ia(int) to authenticated;
