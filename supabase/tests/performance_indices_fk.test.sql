-- =====================================================================
-- Fase 8 — Performance Advisor: índices de cobertura para claves
-- foráneas. Smoke test para evitar que una migración futura los borre
-- por accidente. Ejecutar: npx supabase test db
-- =====================================================================
begin;
select plan(16);

select has_index('public', 'adendas',            'adendas_created_by',           'índice en adendas.created_by');

select has_index('public', 'atenciones',         'atenciones_firmada_por',       'índice en atenciones.firmada_por');
select has_index('public', 'atenciones',         'atenciones_profesional_id',    'índice en atenciones.profesional_id');
select has_index('public', 'atenciones',         'atenciones_servicio_id',       'índice en atenciones.servicio_id');

select has_index('public', 'citas',              'citas_cita_origen_id',         'índice en citas.cita_origen_id');
select has_index('public', 'citas',              'citas_created_by',             'índice en citas.created_by');
select has_index('public', 'citas',              'citas_servicio_id',            'índice en citas.servicio_id');

select has_index('public', 'historias_clinicas', 'historias_clinicas_created_by','índice en historias_clinicas.created_by');

select has_index('public', 'pacientes',          'pacientes_created_by',         'índice en pacientes.created_by');

select has_index('public', 'recordatorios',      'recordatorios_created_by',     'índice en recordatorios.created_by');
select has_index('public', 'recordatorios',      'recordatorios_paciente_id',    'índice en recordatorios.paciente_id');
select has_index('public', 'recordatorios',      'recordatorios_seguimiento_id', 'índice en recordatorios.seguimiento_id');

select has_index('public', 'seguimientos',       'seguimientos_atencion_id',     'índice en seguimientos.atencion_id');
select has_index('public', 'seguimientos',       'seguimientos_created_by',      'índice en seguimientos.created_by');
select has_index('public', 'seguimientos',       'seguimientos_paciente_id',     'índice en seguimientos.paciente_id');
select has_index('public', 'seguimientos',       'seguimientos_responsable_id',  'índice en seguimientos.responsable_id');

select * from finish();
rollback;
