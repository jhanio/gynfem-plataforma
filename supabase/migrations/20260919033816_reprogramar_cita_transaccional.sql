-- =====================================================================
-- Fase 4 — Agenda: reprogramación transaccional de citas
--
-- SECURITY INVOKER (por defecto, sin "security definer"): la RLS de
-- public.citas sigue aplicando con el rol de quien invoca la función.
--
-- El fin de la nueva cita se calcula a partir de servicios.duracion_min
-- del servicio de la cita original: la app nunca puede enviar un fin
-- inconsistente.
--
-- La cita original libera su horario (pasa a 'reprogramada', fuera del
-- EXCLUDE de public.citas, que solo cubre 'programada'/'confirmada')
-- ANTES de insertar la nueva cita. Así:
--   - reprogramar dentro del propio horario original no choca consigo
--     misma.
--   - si la nueva cita choca con OTRA cita activa, toda la función
--     (incluida la UPDATE previa) se revierte: la cita original queda
--     intacta, nunca "a medio cambiar".
-- =====================================================================

create or replace function public.reprogramar_cita(
  p_cita_id      uuid,
  p_nuevo_inicio timestamptz,
  p_motivo       text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_cita         public.citas%rowtype;
  v_duracion_min smallint;
  v_nuevo_fin    timestamptz;
  v_nueva_id     uuid;
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'Debe indicar un motivo de reprogramación.' using errcode = 'P0001';
  end if;

  if p_nuevo_inicio <= now() then
    raise exception 'La nueva fecha y hora deben ser futuras.' using errcode = 'P0001';
  end if;

  -- Bloquea la fila; si la RLS de citas la oculta (sin permiso de SELECT),
  -- no la encuentra, sin distinguir "no existe" de "sin permiso".
  select * into v_cita from public.citas where id = p_cita_id for update;
  if not found then
    raise exception 'La cita no existe o no tiene acceso a ella.' using errcode = 'P0002';
  end if;

  if v_cita.estado not in ('programada', 'confirmada') then
    raise exception 'La cita no está en un estado que permita reprogramarla.' using errcode = 'P0001';
  end if;

  select duracion_min into v_duracion_min
  from public.servicios
  where id = v_cita.servicio_id;

  if not found then
    raise exception 'El servicio de la cita original ya no existe.' using errcode = 'P0001';
  end if;

  v_nuevo_fin := p_nuevo_inicio + make_interval(mins => v_duracion_min::integer);

  update public.citas
     set estado = 'reprogramada', motivo_cambio = p_motivo
   where id = p_cita_id;

  if not found then
    raise exception 'No tiene permisos para reprogramar esta cita.' using errcode = '42501';
  end if;

  insert into public.citas (paciente_id, profesional_id, servicio_id, inicio, fin, cita_origen_id)
  values (v_cita.paciente_id, v_cita.profesional_id, v_cita.servicio_id, p_nuevo_inicio, v_nuevo_fin, v_cita.id)
  returning id into v_nueva_id;

  return v_nueva_id;
end $$;

revoke execute on function public.reprogramar_cita(uuid, timestamptz, text) from public, anon;
grant execute on function public.reprogramar_cita(uuid, timestamptz, text) to authenticated;
