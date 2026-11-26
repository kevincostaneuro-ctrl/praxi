-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Pruebas de aislamiento entre clínicas (no cambia nada)
-- Crea dos clínicas ficticias con usuarios, pacientes y citas, comprueba quién puede
-- ver y tocar qué, y al final lo DESHACE TODO: el script termina siempre con un
-- «error» que muestra el resultado; ese error es lo que obliga a deshacer los cambios.
-- Requiere 09_suscripciones.sql y 10_seguridad.sql.
-- Uso: Supabase → SQL Editor → pegar → Run. Leer el mensaje «RESULTADO: …».
-- Ejecutarlo después de cada cambio en permisos o tablas.
-- ═════════════════════════════════════════════════════════════════════════════
do $$
declare
  ua uuid := gen_random_uuid();  -- administrador de A
  up uuid := gen_random_uuid();  -- profesional de A
  ui uuid := gen_random_uuid();  -- miembro desactivado de A
  ub uuid := gen_random_uuid();  -- administrador de B
  uc uuid := gen_random_uuid();  -- administrador de C (prueba caducada)
  ca uuid; cb uuid; cc uuid; ma uuid; mp uuid; mb uuid;
  n int; ok boolean; total int := 0; bien int := 0; fallos text := '';

begin
  -- ── Preparación (como administrador de la base de datos) ───────────────────
  insert into auth.users (id, email, aud, role) values
    (ua, 'prueba-a@praxi.test', 'authenticated', 'authenticated'),
    (up, 'prueba-p@praxi.test', 'authenticated', 'authenticated'),
    (ui, 'prueba-i@praxi.test', 'authenticated', 'authenticated'),
    (ub, 'prueba-b@praxi.test', 'authenticated', 'authenticated'),
    (uc, 'prueba-c@praxi.test', 'authenticated', 'authenticated');
  insert into clinicas (nombre) values ('Prueba A') returning id into ca;
  insert into clinicas (nombre) values ('Prueba B') returning id into cb;
  insert into clinicas (nombre, creado_en) values ('Prueba C caducada', now() - interval '120 days') returning id into cc;
  insert into miembros (clinica_id, user_id, nombre, email, rol) values (ca, ua, 'Admin A', 'prueba-a@praxi.test', 'admin') returning id into ma;
  insert into miembros (clinica_id, user_id, nombre, email, rol) values (ca, up, 'Prof A', 'prueba-p@praxi.test', 'profesional') returning id into mp;
  insert into miembros (clinica_id, user_id, nombre, email, rol, activo) values (ca, ui, 'Inactivo A', 'prueba-i@praxi.test', 'profesional', false);
  insert into miembros (clinica_id, user_id, nombre, email, rol) values (cb, ub, 'Admin B', 'prueba-b@praxi.test', 'admin') returning id into mb;
  insert into miembros (clinica_id, user_id, nombre, email, rol) values (cc, uc, 'Admin C', 'prueba-c@praxi.test', 'admin');
  insert into pacientes (clinica_id, id, profesional_id, datos) values
    (ca, 900001, mp, '{"nombre":"Paciente A1"}'), (ca, 900002, ma, '{"nombre":"Paciente A2"}'),
    (cb, 900003, mb, '{"nombre":"Paciente B1"}'), (cc, 900004, null, '{"nombre":"Paciente C1"}');
  insert into citas (clinica_id, id, profesional_id, fecha, datos) values
    (ca, 900001, mp, current_date, '{}'), (cb, 900002, mb, current_date, '{}');

  -- ── Administrador de A ─────────────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from pacientes where clinica_id in (ca, cb);
  total := total + 1; if n = 2 then bien := bien + 1; else fallos := fallos || ' [1 admin A ve ' || n || ' pacientes, esperado 2]'; end if;

  select count(*) into n from pacientes where clinica_id = cb;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [2 admin A ve pacientes de B]'; end if;

  select count(*) into n from citas where clinica_id = cb;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [3 admin A ve citas de B]'; end if;

  update pacientes set datos = '{"nombre":"cambiado"}' where clinica_id = cb;
  get diagnostics n = row_count;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [4 admin A modifica pacientes de B]'; end if;

  delete from pacientes where clinica_id = cb;
  get diagnostics n = row_count;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [5 admin A borra pacientes de B]'; end if;

  ok := false;
  begin insert into pacientes (clinica_id, id, profesional_id, datos) values (cb, 900099, ma, '{}'); exception when others then ok := true; end;
  total := total + 1; if ok then bien := bien + 1; else fallos := fallos || ' [6 admin A crea pacientes en B]'; end if;

  select count(*) into n from auditoria where clinica_id = cb;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [7 admin A ve el registro de accesos de B]'; end if;

  ok := false;
  begin insert into suscripciones (clinica_id, plan, estado) values (ca, 'clinica', 'activa'); exception when others then ok := true; end;
  total := total + 1; if ok then bien := bien + 1; else fallos := fallos || ' [8 un usuario se da un plan a sí mismo]'; end if;

  ok := false;
  begin update clinicas set nombre = 'hackeada' where id = cb; get diagnostics n = row_count; ok := (n = 0); exception when others then ok := true; end;
  total := total + 1; if ok then bien := bien + 1; else fallos := fallos || ' [9 admin A cambia la clínica B]'; end if;
  execute 'reset role';

  -- ── Profesional de A: solo sus pacientes ───────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', up, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from pacientes where clinica_id = ca;
  total := total + 1; if n = 1 then bien := bien + 1; else fallos := fallos || ' [10 profesional ve ' || n || ' pacientes, esperado 1]'; end if;
  update pacientes set datos = '{"nombre":"cambiado"}' where clinica_id = ca and id = 900002;
  get diagnostics n = row_count;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [11 profesional modifica pacientes de otro]'; end if;
  select count(*) into n from auditoria where clinica_id = ca;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [12 profesional ve el registro de accesos]'; end if;
  execute 'reset role';

  -- ── Miembro desactivado: nada ─────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', ui, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from pacientes;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [13 miembro desactivado ve pacientes]'; end if;
  execute 'reset role';

  -- ── Sin sesión (anónimo): nada ────────────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
  ok := false;
  begin select count(*) into n from pacientes; ok := (n = 0); exception when others then ok := true; end;
  total := total + 1; if ok then bien := bien + 1; else fallos := fallos || ' [14 un anónimo ve pacientes]'; end if;
  execute 'reset role';

  -- ── Verificación en dos pasos: sin el código no se ve nada ─────────────────
  insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
  values (gen_random_uuid(), ub, 'Praxi', 'totp', 'verified', now(), now());
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from pacientes where clinica_id = cb;
  total := total + 1; if n = 0 then bien := bien + 1; else fallos := fallos || ' [15 con 2 pasos activado, ve pacientes sin el código]'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from pacientes where clinica_id = cb;
  total := total + 1; if n = 1 then bien := bien + 1; else fallos := fallos || ' [16 con el código no ve sus pacientes]'; end if;
  execute 'reset role';

  -- ── Clínica caducada: ve, pero no crea ─────────────────────────────────────
  perform set_config('request.jwt.claims', json_build_object('sub', uc, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from pacientes where clinica_id = cc;
  total := total + 1; if n = 1 then bien := bien + 1; else fallos := fallos || ' [17 la clínica caducada no ve sus datos]'; end if;
  ok := false;
  begin insert into pacientes (clinica_id, id, datos) values (cc, 900098, '{}'); exception when others then ok := true; end;
  total := total + 1; if ok then bien := bien + 1; else fallos := fallos || ' [18 la clínica caducada puede crear pacientes]'; end if;
  execute 'reset role';

  -- ── Resultado (y se deshace todo) ─────────────────────────────────────────
  raise exception 'RESULTADO: % de % pruebas superadas.%', bien, total,
    case when fallos = '' then ' Todo correcto. (Este «error» es normal: deshace los datos de prueba.)' else ' FALLOS:' || fallos end;
end $$;
