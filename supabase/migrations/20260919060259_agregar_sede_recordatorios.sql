-- =====================================================================
-- Fase 6 — Seguimientos y recordatorios
-- HU-16: el mensaje de recordatorio debe incluir nombre, fecha, hora y
-- sede (sin datos clínicos). La función original no incluía la sede;
-- además no filtraba teléfonos ausentes o con formato inválido.
--
-- Cambia la firma de generar_recordatorios_citas() a
-- generar_recordatorios_citas(p_sede text default 'GynFem - Pisco'),
-- por lo que se elimina la versión anterior antes de recrearla.
-- =====================================================================

drop function if exists public.generar_recordatorios_citas();

-- Genera recordatorios para las citas de mañana (pg_cron diario o botón admin/asistente).
-- Se ejecuta sin sesión (auth.uid() nulo) desde pg_cron: en ese caso NO se exige rol,
-- porque el trabajo programado no llega con JWT. Cuando sí hay sesión (llamada por la
-- app vía RPC autenticado), se exige admin o asistente. anon nunca puede invocarla:
-- el REVOKE/GRANT de más abajo le quita el privilegio EXECUTE a nivel de Postgres,
-- por lo que ni siquiera llega a evaluarse el cuerpo de la función.
create or replace function public.generar_recordatorios_citas(p_sede text default 'GynFem - Pisco')
returns integer language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  if auth.uid() is not null and not public.tiene_rol('admin','asistente') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  insert into public.recordatorios (paciente_id, cita_id, canal, programado_para, mensaje)
  select c.paciente_id, c.id, p.canal_preferido, now(),
         format('Hola %s, le recordamos su cita en %s el %s a las %s. Por favor, confirme su asistencia respondiendo este mensaje.',
                split_part(p.nombres, ' ', 1),
                p_sede,
                to_char(c.inicio at time zone 'America/Lima', 'DD/MM/YYYY'),
                to_char(c.inicio at time zone 'America/Lima', 'HH24:MI'))
  from public.citas c
  join public.pacientes p on p.id = c.paciente_id
  where c.estado in ('programada','confirmada')
    and p.deleted_at is null
    and p.acepta_recordatorios
    and p.telefono is not null
    and p.telefono ~ '^9[0-9]{8}$'
    and (c.inicio at time zone 'America/Lima')::date = (now() at time zone 'America/Lima')::date + 1
    and not exists (
      select 1 from public.recordatorios r
      where r.cita_id = c.id and r.estado <> 'cancelado');

  get diagnostics n = row_count;
  return n;
end $$;

-- Postgres otorga EXECUTE a PUBLIC por defecto en toda función nueva;
-- el REVOKE global de la migración inicial no cubre esta función recreada
-- (aplicó solo a las funciones existentes en ese momento), así que se repite aquí.
revoke all on function public.generar_recordatorios_citas(text) from public, anon;
grant execute on function public.generar_recordatorios_citas(text) to authenticated;

-- Programación diaria (ejecutar en Fase 6 tras habilitar pg_cron en Database > Extensions).
-- pg_cron corre en UTC por defecto en Supabase; 13:00 UTC == 08:00 America/Lima (UTC-5, sin horario de verano).
-- Si ya existía el schedule con la firma anterior, elimínalo primero con cron.unschedule('recordatorios-diarios').
-- select cron.schedule('recordatorios-diarios', '0 13 * * *', $cron$select public.generar_recordatorios_citas()$cron$); -- usa el sede por defecto
