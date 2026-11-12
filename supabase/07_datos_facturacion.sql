-- ═════════════════════════════════════════════════════════════════════════════
-- PRAXI — Datos de facturación de cada profesional
-- Cada profesional guarda sus datos (nombre fiscal, NIF, dirección…) para que
-- aparezcan en las facturas en PDF que genera. Praxi no aparece en la factura.
-- Pegar entero en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
-- ═════════════════════════════════════════════════════════════════════════════

alter table miembros add column if not exists datos_facturacion jsonb;

-- Cada profesional solo puede cambiar SUS datos de facturación
create or replace function guardar_mis_datos_facturacion(p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if p_datos is not null and (jsonb_typeof(p_datos) <> 'object' or length(p_datos::text) > 4000) then
    raise exception 'Datos de facturación no válidos';
  end if;
  update miembros set datos_facturacion = p_datos where user_id = auth.uid() and activo;
  if not found then raise exception 'No autorizado'; end if;
  return p_datos;
end $$;

revoke all on function guardar_mis_datos_facturacion(jsonb) from public, anon;
grant execute on function guardar_mis_datos_facturacion(jsonb) to authenticated;
