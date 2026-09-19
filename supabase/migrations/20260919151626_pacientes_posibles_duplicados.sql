-- =====================================================================
-- Fase 7 — Posibles duplicados de pacientes (KPI-07)
-- Agrupa pacientes activas por nombres + apellidos (normalizados con
-- lower/trim para detectar variantes de mayúsculas y espacios) y fecha
-- de nacimiento. Solo admin: security definer con chequeo estricto de
-- rol, sin excepción para contextos sin sesión (no hay uso desde cron).
-- =====================================================================

create or replace function public.pacientes_posibles_duplicados()
returns table (
  nombres          text,
  apellidos        text,
  fecha_nacimiento date,
  cantidad         bigint,
  paciente_ids     uuid[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  select
    min(p.nombres)    as nombres,
    min(p.apellidos)  as apellidos,
    p.fecha_nacimiento,
    count(*)::bigint  as cantidad,
    array_agg(p.id order by p.created_at) as paciente_ids
  from public.pacientes p
  where p.deleted_at is null
    and p.fecha_nacimiento is not null
  group by lower(trim(p.nombres)), lower(trim(p.apellidos)), p.fecha_nacimiento
  having count(*) > 1
  order by count(*) desc, min(p.apellidos), min(p.nombres);
end;
$$;

revoke all on function public.pacientes_posibles_duplicados() from public;
revoke all on function public.pacientes_posibles_duplicados() from anon;
grant execute on function public.pacientes_posibles_duplicados() to authenticated;
