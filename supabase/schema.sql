-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Esquema con clínicas, equipos y permisos por rol
-- Pegar entero en Supabase → SQL Editor → Run.
--
-- Reglas de acceso (las aplica la base de datos, no la pantalla):
--   · Administrador: ve y edita todos los pacientes y citas de su clínica,
--     invita y desactiva miembros, cambia la configuración.
--   · Profesional: solo ve y edita los pacientes y citas asignados a él.
--   · Nadie ve nada de otra clínica.
--   · Borrar pacientes: solo el administrador (la historia clínica debe
--     conservarse; Ley 41/2002).
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Seguridad: si Praxi ya está instalado, no hacer nada (no borrar datos) ──
do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'miembros') then
    raise exception 'Praxi ya está instalado. Este script no se vuelve a ejecutar para no borrar datos.';
  end if;
end $$;

-- ── Limpieza del esquema antiguo (tablas de prueba, sin datos reales) ────────
-- La lista de espera NO se borra.
drop table if exists sesiones, objetivos, pruebas, informes_medicos, tipos_cita, profesionales cascade;
drop table if exists citas, tareas, pacientes, invitaciones, miembros, clinicas cascade;

create extension if not exists pgcrypto;

-- ── Tablas ───────────────────────────────────────────────────────────────────
create table clinicas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  plan       text not null default 'profesional',
  config     jsonb not null default '{}',
  creado_en  timestamptz not null default now()
);

create table miembros (
  id            uuid primary key default gen_random_uuid(),
  clinica_id    uuid not null references clinicas(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  nombre        text not null,
  email         text not null,
  especialidad  text,
  color         text not null default '#A66B3F',
  rol           text not null check (rol in ('admin','profesional')),
  activo        boolean not null default true,
  creado_en     timestamptz not null default now(),
  unique (clinica_id, user_id)
);
create index on miembros (user_id);

create table invitaciones (
  id          uuid primary key default gen_random_uuid(),
  clinica_id  uuid not null references clinicas(id) on delete cascade,
  email       text not null,
  rol         text not null default 'profesional' check (rol in ('admin','profesional')),
  token       uuid not null unique default gen_random_uuid(),
  aceptada    boolean not null default false,
  creado_en   timestamptz not null default now(),
  expira_en   timestamptz not null default now() + interval '7 days'
);

-- Pacientes: la ficha completa va en "datos" (JSON) para poder cambiar la
-- ficha sin migraciones. El id lo genera la app; es único dentro de cada clínica.
create table pacientes (
  clinica_id      uuid not null references clinicas(id) on delete cascade,
  id              bigint not null,
  profesional_id  uuid references miembros(id) on delete set null,
  datos           jsonb not null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  primary key (clinica_id, id)
);
create index on pacientes (clinica_id, profesional_id);

create table citas (
  clinica_id      uuid not null references clinicas(id) on delete cascade,
  id              bigint not null,
  profesional_id  uuid references miembros(id) on delete set null,
  fecha           date not null,
  datos           jsonb not null,
  actualizado_en  timestamptz not null default now(),
  primary key (clinica_id, id)
);
create index on citas (clinica_id, fecha);

-- Agenda personal: cada usuario ve solo sus tareas
create table tareas (
  clinica_id  uuid not null references clinicas(id) on delete cascade,
  id          bigint not null,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  datos       jsonb not null,
  primary key (clinica_id, id)
);

create table if not exists lista_espera (
  id         uuid primary key default gen_random_uuid(),
  nombre     text,
  email      text unique not null,
  profesion  text,
  creado_en  timestamptz default now()
);

-- ── Funciones de permisos (security definer para evitar recursión en RLS) ──
create or replace function es_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros
                 where clinica_id = c and user_id = auth.uid() and activo);
$$;

create or replace function es_admin(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros
                 where clinica_id = c and user_id = auth.uid() and activo and rol = 'admin');
$$;

create or replace function mi_miembro(c uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from miembros
  where clinica_id = c and user_id = auth.uid() and activo limit 1;
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table clinicas     enable row level security;
alter table miembros     enable row level security;
alter table invitaciones enable row level security;
alter table pacientes    enable row level security;
alter table citas        enable row level security;
alter table tareas       enable row level security;
alter table lista_espera enable row level security;

-- Clínicas: los miembros la ven; solo el admin la modifica. Se crea por RPC.
create policy clinicas_select on clinicas for select to authenticated using (es_miembro(id));
create policy clinicas_update on clinicas for update to authenticated using (es_admin(id)) with check (es_admin(id));

-- Miembros: los compañeros se ven entre sí (nombre, rol); solo el admin cambia roles/activo.
create policy miembros_select on miembros for select to authenticated
  using (es_miembro(clinica_id) or user_id = auth.uid());
create policy miembros_update on miembros for update to authenticated
  using (es_admin(clinica_id)) with check (es_admin(clinica_id));

-- Invitaciones: solo el admin
create policy inv_select on invitaciones for select to authenticated using (es_admin(clinica_id));
create policy inv_insert on invitaciones for insert to authenticated with check (es_admin(clinica_id));
create policy inv_delete on invitaciones for delete to authenticated using (es_admin(clinica_id));

-- Pacientes: admin todo; profesional solo los suyos y no puede pasarlos a otro
create policy pac_select on pacientes for select to authenticated
  using (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id));
create policy pac_insert on pacientes for insert to authenticated
  with check (es_admin(clinica_id) or (es_miembro(clinica_id) and profesional_id = mi_miembro(clinica_id)));
create policy pac_update on pacientes for update to authenticated
  using (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id))
  with check (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id));
create policy pac_delete on pacientes for delete to authenticated using (es_admin(clinica_id));

-- Citas: igual que pacientes, pero el profesional puede cancelar las suyas
create policy cit_select on citas for select to authenticated
  using (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id));
create policy cit_insert on citas for insert to authenticated
  with check (es_admin(clinica_id) or (es_miembro(clinica_id) and profesional_id = mi_miembro(clinica_id)));
create policy cit_update on citas for update to authenticated
  using (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id))
  with check (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id));
create policy cit_delete on citas for delete to authenticated
  using (es_admin(clinica_id) or profesional_id = mi_miembro(clinica_id));

-- Tareas: solo las propias
create policy tar_all on tareas for all to authenticated
  using (user_id = auth.uid() and es_miembro(clinica_id))
  with check (user_id = auth.uid() and es_miembro(clinica_id));

-- Lista de espera: cualquiera puede apuntarse, nadie puede leerla desde la web
drop policy if exists "allow all" on lista_espera;
drop policy if exists le_insert on lista_espera;
create policy le_insert on lista_espera for insert to anon, authenticated with check (true);

-- ── Funciones que llama la app ───────────────────────────────────────────────
-- Crear clínica: quien la crea queda como administrador
create or replace function crear_clinica(p_nombre text, p_mi_nombre text, p_especialidad text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then
    raise exception 'Este usuario ya pertenece a una clínica';
  end if;
  if coalesce(trim(p_nombre),'') = '' or coalesce(trim(p_mi_nombre),'') = '' then
    raise exception 'Faltan datos';
  end if;
  insert into clinicas (nombre) values (trim(p_nombre)) returning id into c;
  insert into miembros (clinica_id, user_id, nombre, email, especialidad, rol)
  values (c, auth.uid(), trim(p_mi_nombre), lower(auth.jwt() ->> 'email'), p_especialidad, 'admin');
  return c;
end $$;

-- Ver a qué clínica te invitan (antes de registrarte)
create or replace function ver_invitacion(p_token uuid)
returns table (clinica text, email text, rol text)
language sql stable security definer set search_path = public as $$
  select c.nombre, i.email, i.rol
  from invitaciones i join clinicas c on c.id = i.clinica_id
  where i.token = p_token and not i.aceptada and i.expira_en > now();
$$;

-- Aceptar invitación: el email de la cuenta debe coincidir con el invitado
create or replace function aceptar_invitacion(p_token uuid, p_nombre text, p_especialidad text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invitaciones%rowtype; colores text[] := array['#A66B3F','#6B8C5A','#C48C2A','#7B6B8C','#8C4A3A','#4A7B6B']; n int;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select * into inv from invitaciones
  where token = p_token and not aceptada and expira_en > now() for update;
  if not found then raise exception 'Invitación no válida o caducada'; end if;
  if lower(inv.email) <> lower(auth.jwt() ->> 'email') then
    raise exception 'Esta invitación es para otro email';
  end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then
    raise exception 'Este usuario ya pertenece a una clínica';
  end if;
  select count(*) into n from miembros where clinica_id = inv.clinica_id;
  insert into miembros (clinica_id, user_id, nombre, email, especialidad, rol, color)
  values (inv.clinica_id, auth.uid(), trim(p_nombre), lower(inv.email), p_especialidad, inv.rol,
          colores[(n % array_length(colores,1)) + 1]);
  update invitaciones set aceptada = true where id = inv.id;
  return inv.clinica_id;
end $$;

-- Una clínica nunca puede quedarse sin administrador activo
create or replace function proteger_ultimo_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.rol = 'admin' and old.activo and (new.rol <> 'admin' or not new.activo) then
    if not exists (select 1 from miembros
                   where clinica_id = old.clinica_id and id <> old.id and rol = 'admin' and activo) then
      raise exception 'La clínica debe tener al menos un administrador activo';
    end if;
  end if;
  -- Nadie cambia de clínica ni de usuario por la puerta de atrás
  if new.clinica_id <> old.clinica_id or new.user_id <> old.user_id then
    raise exception 'No permitido';
  end if;
  return new;
end $$;
create trigger miembros_proteger_admin before update on miembros
  for each row execute function proteger_ultimo_admin();

-- ── Permisos de ejecución ────────────────────────────────────────────────────
grant select, insert, update, delete on clinicas, miembros, invitaciones, pacientes, citas, tareas to authenticated;
grant insert on lista_espera to anon, authenticated;
revoke all on function crear_clinica(text,text,text), aceptar_invitacion(uuid,text,text) from public, anon;
grant execute on function crear_clinica(text,text,text), aceptar_invitacion(uuid,text,text) to authenticated;
grant execute on function ver_invitacion(uuid) to anon, authenticated;
grant execute on function es_miembro(uuid), es_admin(uuid), mi_miembro(uuid) to authenticated;
