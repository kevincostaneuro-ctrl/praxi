-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Código de acceso para crear clínicas (acceso anticipado / beta)
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
--
-- · Crear una clínica nueva exige un código válido. Lo comprueba la base de
--   datos, así que no se puede saltar desde el navegador.
-- · Unirse a una clínica con una invitación NO necesita código.
--
-- Gestionar códigos (en el SQL Editor):
--   Crear uno:      insert into codigos_acceso (codigo, usos_max, nota) values ('PRAXI-ANA', 1, 'Ana, psicóloga');
--   Ver su uso:     select * from codigos_acceso;
--   Desactivarlo:   update codigos_acceso set activo = false where codigo = 'MICODIGO';
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists codigos_acceso (
  codigo     text primary key,
  usos_max   int  not null default 1 check (usos_max > 0),
  usos       int  not null default 0,
  activo     boolean not null default true,
  nota       text,
  creado_en  timestamptz not null default now()
);
-- Nadie puede leer ni tocar los códigos desde la web (sin políticas = sin acceso)
alter table codigos_acceso enable row level security;
revoke all on codigos_acceso from anon, authenticated;

-- Qué código usó cada clínica
alter table clinicas add column if not exists codigo_acceso text;

-- La versión antigua (sin código) deja de existir: así no hay forma de saltárselo
drop function if exists crear_clinica(text, text, text);

create or replace function crear_clinica(p_nombre text, p_mi_nombre text, p_especialidad text, p_codigo text)
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
  select * into cod from codigos_acceso
  where upper(codigo) = upper(trim(coalesce(p_codigo,''))) for update;
  if not found or not cod.activo or cod.usos >= cod.usos_max then
    raise exception 'Código de acceso no válido';
  end if;
  update codigos_acceso set usos = usos + 1 where codigo = cod.codigo;
  insert into clinicas (nombre, codigo_acceso) values (trim(p_nombre), cod.codigo) returning id into c;
  insert into miembros (clinica_id, user_id, nombre, email, especialidad, rol)
  values (c, auth.uid(), trim(p_mi_nombre), lower(auth.jwt() ->> 'email'), p_especialidad, 'admin');
  return c;
end $$;

revoke all on function crear_clinica(text,text,text,text) from public, anon;
grant execute on function crear_clinica(text,text,text,text) to authenticated;

-- Los códigos NO se escriben en este archivo (el repositorio es público).
-- Créalos directamente en el SQL Editor de Supabase, por ejemplo:
--   insert into codigos_acceso (codigo, usos_max, nota) values ('MICODIGO', 10, 'Beta testers');
-- Si ejecutaste una versión anterior de este archivo, desactiva el código de ejemplo:
update codigos_acceso set activo = false where codigo = 'PRAXI-BETA';
