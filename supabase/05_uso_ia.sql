-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Límite diario del asistente IA por profesional (contra abusos)
-- El servidor (/api/ia) llama a consumir_ia() antes de cada consulta. Si el
-- profesional ya ha llegado al límite del día, no se llama a Anthropic.
-- El día se cuenta en hora de Madrid.
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
--
-- Ver el uso:  select m.nombre, u.dia, u.consultas from uso_ia u join miembros m on m.id = u.miembro_id order by u.dia desc, u.consultas desc;
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists uso_ia (
  miembro_id  uuid not null references miembros(id) on delete cascade,
  clinica_id  uuid not null references clinicas(id) on delete cascade,
  dia         date not null,
  consultas   int  not null default 0,
  primary key (miembro_id, dia)
);

alter table uso_ia enable row level security;
revoke insert, update, delete on uso_ia from anon, authenticated;
grant select on uso_ia to authenticated;
drop policy if exists uso_select on uso_ia;
-- Cada uno ve su uso; el administrador, el de toda su clínica
create policy uso_select on uso_ia for select to authenticated
  using (es_admin(clinica_id) or miembro_id = mi_miembro(clinica_id));

-- Suma una consulta y devuelve cuántas lleva hoy. Si ya llegó al límite, no suma y da error.
create or replace function consumir_ia(p_limite int)
returns int language plpgsql security definer set search_path = public as $$
declare yo miembros%rowtype; hoy date := (now() at time zone 'Europe/Madrid')::date; n int;
begin
  select * into yo from miembros where user_id = auth.uid() and activo limit 1;
  if not found then raise exception 'No autorizado'; end if;
  insert into uso_ia (miembro_id, clinica_id, dia, consultas)
  values (yo.id, yo.clinica_id, hoy, 0)
  on conflict (miembro_id, dia) do nothing;
  update uso_ia set consultas = consultas + 1
  where miembro_id = yo.id and dia = hoy and consultas < greatest(p_limite, 1)
  returning consultas into n;
  if n is null then raise exception 'Límite diario del asistente alcanzado'; end if;
  return n;
end $$;
revoke all on function consumir_ia(int) from public, anon;
grant execute on function consumir_ia(int) to authenticated;
