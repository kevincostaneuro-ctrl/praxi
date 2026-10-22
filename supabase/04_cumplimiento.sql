-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Cumplimiento RGPD
--   1. Aceptación de los Términos y del Contrato de encargo al crear una clínica
--   2. Registro de accesos (quién ve, crea, modifica o borra cada ficha y cita)
--   3. Borrado completo de una clínica (fin del encargo, art. 28.3.g RGPD)
-- Requiere haber ejecutado antes 03_codigos_acceso.sql.
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── 1. Aceptación de términos ────────────────────────────────────────────────
alter table clinicas add column if not exists terminos_version text;
alter table clinicas add column if not exists terminos_aceptados_en timestamptz;
alter table clinicas add column if not exists terminos_aceptados_por uuid;

drop function if exists crear_clinica(text, text, text, text);

create or replace function crear_clinica(p_nombre text, p_mi_nombre text, p_especialidad text, p_codigo text, p_terminos_version text)
returns uuid language plpgsql security definer set search_path = public as $$
declare c uuid; cod codigos_acceso%rowtype;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if exists (select 1 from miembros where user_id = auth.uid()) then
    raise exception 'Este usuario ya pertenece a una clínica';
  end if;
  if coalesce(trim(p_nombre),'') = '' or coalesce(trim(p_mi_nombre),'') = '' then
    raise exception 'Faltan datos';
  end if;
  if coalesce(trim(p_terminos_version),'') = '' then
    raise exception 'Hay que aceptar los términos';
  end if;
  select * into cod from codigos_acceso
  where upper(codigo) = upper(trim(coalesce(p_codigo,''))) for update;
  if not found or not cod.activo or cod.usos >= cod.usos_max then
    raise exception 'Código de acceso no válido';
  end if;
  update codigos_acceso set usos = usos + 1 where codigo = cod.codigo;
  insert into clinicas (nombre, codigo_acceso, terminos_version, terminos_aceptados_en, terminos_aceptados_por)
  values (trim(p_nombre), cod.codigo, trim(p_terminos_version), now(), auth.uid())
  returning id into c;
  insert into miembros (clinica_id, user_id, nombre, email, especialidad, rol)
  values (c, auth.uid(), trim(p_mi_nombre), lower(auth.jwt() ->> 'email'), p_especialidad, 'admin');
  return c;
end $$;

revoke all on function crear_clinica(text,text,text,text,text) from public, anon;
grant execute on function crear_clinica(text,text,text,text,text) to authenticated;

-- ── 2. Registro de accesos ───────────────────────────────────────────────────
create table if not exists auditoria (
  id          bigserial primary key,
  clinica_id  uuid not null references clinicas(id) on delete cascade,
  user_id     uuid,
  miembro_id  uuid,
  accion      text not null check (accion in ('ver','crear','modificar','borrar')),
  tabla       text not null,
  registro_id bigint,
  creado_en   timestamptz not null default now()
);
create index if not exists auditoria_clinica_fecha on auditoria (clinica_id, creado_en desc);

alter table auditoria enable row level security;
-- Solo el administrador lo consulta; nadie puede modificarlo ni borrarlo desde la app
drop policy if exists aud_select on auditoria;
create policy aud_select on auditoria for select to authenticated using (es_admin(clinica_id));
revoke insert, update, delete on auditoria from anon, authenticated;
grant select on auditoria to authenticated;

-- Cambios en pacientes y citas: los registra la base de datos (no se puede saltar)
create or replace function auditar_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
declare fila record; acc text;
begin
  if tg_op = 'DELETE' then fila := old; acc := 'borrar';
  elsif tg_op = 'INSERT' then fila := new; acc := 'crear';
  else fila := new; acc := 'modificar';
  end if;
  -- Si se está borrando la clínica entera, no hay nada que registrar
  if not exists (select 1 from clinicas where id = fila.clinica_id) then
    return null;
  end if;
  insert into auditoria (clinica_id, user_id, miembro_id, accion, tabla, registro_id)
  values (fila.clinica_id, auth.uid(), mi_miembro(fila.clinica_id), acc, tg_table_name, fila.id);
  return null;
end $$;

drop trigger if exists pacientes_auditar on pacientes;
create trigger pacientes_auditar after insert or update or delete on pacientes
  for each row execute function auditar_cambio();
drop trigger if exists citas_auditar on citas;
create trigger citas_auditar after insert or update or delete on citas
  for each row execute function auditar_cambio();

-- Consultas de fichas: la app avisa al abrir una ficha; solo se registra si
-- quien la abre tiene permiso para verla
create or replace function registrar_vista(p_clinica uuid, p_paciente bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from pacientes
             where clinica_id = p_clinica and id = p_paciente
               and (es_admin(p_clinica) or profesional_id = mi_miembro(p_clinica))) then
    insert into auditoria (clinica_id, user_id, miembro_id, accion, tabla, registro_id)
    values (p_clinica, auth.uid(), mi_miembro(p_clinica), 'ver', 'pacientes', p_paciente);
  end if;
end $$;
revoke all on function registrar_vista(uuid, bigint) from public, anon;
grant execute on function registrar_vista(uuid, bigint) to authenticated;

-- ── 3. Borrar la clínica y todos sus datos (solo el administrador) ───────────
create or replace function eliminar_clinica(p_clinica uuid, p_confirmacion text)
returns void language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if not es_admin(p_clinica) then raise exception 'Solo el administrador puede borrar la clínica'; end if;
  select nombre into n from clinicas where id = p_clinica;
  if n is null or trim(p_confirmacion) <> n then
    raise exception 'El nombre escrito no coincide con el de la clínica';
  end if;
  -- Borra en cascada: miembros, invitaciones, pacientes, citas, tareas y registro de accesos
  delete from clinicas where id = p_clinica;
end $$;
revoke all on function eliminar_clinica(uuid, text) from public, anon;
grant execute on function eliminar_clinica(uuid, text) to authenticated;
