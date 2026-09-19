-- =====================================================================
-- Fase 8 — Performance Advisor: índices para claves foráneas sin índice
-- de cobertura. No se tocan los 5 índices marcados "unused" por el
-- Advisor (pacientes_apellidos_nombres, pacientes_telefono,
-- recordatorios_cola, audit_log_usuario, audit_log_tabla): en dev casi
-- no hay tráfico, así que ese hallazgo no es señal de que sobren.
-- =====================================================================

create index if not exists adendas_created_by            on public.adendas (created_by);

create index if not exists atenciones_firmada_por         on public.atenciones (firmada_por);
create index if not exists atenciones_profesional_id      on public.atenciones (profesional_id);
create index if not exists atenciones_servicio_id         on public.atenciones (servicio_id);

create index if not exists citas_cita_origen_id           on public.citas (cita_origen_id);
create index if not exists citas_created_by               on public.citas (created_by);
create index if not exists citas_servicio_id              on public.citas (servicio_id);

create index if not exists historias_clinicas_created_by  on public.historias_clinicas (created_by);

create index if not exists pacientes_created_by           on public.pacientes (created_by);

create index if not exists recordatorios_created_by       on public.recordatorios (created_by);
create index if not exists recordatorios_paciente_id      on public.recordatorios (paciente_id);
create index if not exists recordatorios_seguimiento_id   on public.recordatorios (seguimiento_id);

create index if not exists seguimientos_atencion_id       on public.seguimientos (atencion_id);
create index if not exists seguimientos_created_by        on public.seguimientos (created_by);
create index if not exists seguimientos_paciente_id       on public.seguimientos (paciente_id);
create index if not exists seguimientos_responsable_id    on public.seguimientos (responsable_id);
