-- =====================================================================
-- Tests pgTAP — public.generar_recordatorios_citas() (Fase 6)
-- Ejecutar: npx supabase test db. Todos los datos son ficticios.
--
-- Cobertura:
--  - Elegibilidad: acepta_recordatorios, teléfono presente y con formato
--    válido, cita de "mañana" (no hoy), sin recordatorio previo activo.
--  - Mensaje: incluye nombre/sede/fecha/hora; nunca el nombre del servicio.
--  - Autorización: sin sesión (contexto pg_cron) SÍ ejecuta sin exigir rol;
--    con sesión autenticada exige admin/asistente; anon no tiene EXECUTE.
-- =====================================================================
begin;
select plan(14);

insert into auth.users (id, email) values
  ('71111111-1111-1111-1111-111111111111', 'medico-f6@test.local'),
  ('72222222-2222-2222-2222-222222222222', 'asistente-f6@test.local');

update public.profiles set rol = 'medico',    activo = true where id = '71111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'asistente', activo = true where id = '72222222-2222-2222-2222-222222222222';

insert into public.servicios (id, nombre, categoria, duracion_min)
values ('75000000-0000-0000-0000-000000000001', 'Ecografía Fase6 No Debe Aparecer', 'Consulta', 30);

-- Pacientes: uno elegible, cuatro que deben excluirse por distintas razones,
-- uno con recordatorio ya generado, y uno para la llamada explícita de asistente.
insert into public.pacientes (id, numero_documento, nombres, apellidos, telefono, acepta_recordatorios, consentimiento_datos, consentimiento_fecha)
values
  ('7a000000-0000-0000-0000-000000000001', '70000001', 'Elegible',         'Uno',   '987111111', true,  true, now()),
  ('7a000000-0000-0000-0000-000000000002', '70000002', 'NoAcepta',         'Dos',   '987222222', false, true, now()),
  ('7a000000-0000-0000-0000-000000000003', '70000003', 'SinTelefono',      'Tres',  null,        true,  true, now()),
  ('7a000000-0000-0000-0000-000000000004', '70000004', 'TelefonoInvalido', 'Cuatro','12345',     true,  true, now()),
  ('7a000000-0000-0000-0000-000000000005', '70000005', 'YaAvisada',        'Cinco', '987555555', true,  true, now()),
  ('7a000000-0000-0000-0000-000000000006', '70000006', 'CitaHoy',          'Seis',  '987666666', true,  true, now()),
  ('7a000000-0000-0000-0000-000000000007', '70000007', 'Elegible',         'Siete', '987777777', true,  true, now());

-- Citas de "mañana" (hora de Lima) para P1..P5 y P7; P6 tiene su cita "hoy".
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin)
values
  ('7c000000-0000-0000-0000-000000000001', '7a000000-0000-0000-0000-000000000001',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 08:00:00')::timestamp at time zone 'America/Lima'),
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 08:30:00')::timestamp at time zone 'America/Lima')),
  ('7c000000-0000-0000-0000-000000000002', '7a000000-0000-0000-0000-000000000002',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 09:00:00')::timestamp at time zone 'America/Lima'),
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 09:30:00')::timestamp at time zone 'America/Lima')),
  ('7c000000-0000-0000-0000-000000000003', '7a000000-0000-0000-0000-000000000003',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 10:00:00')::timestamp at time zone 'America/Lima'),
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 10:30:00')::timestamp at time zone 'America/Lima')),
  ('7c000000-0000-0000-0000-000000000004', '7a000000-0000-0000-0000-000000000004',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 11:00:00')::timestamp at time zone 'America/Lima'),
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 11:30:00')::timestamp at time zone 'America/Lima')),
  ('7c000000-0000-0000-0000-000000000005', '7a000000-0000-0000-0000-000000000005',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 12:00:00')::timestamp at time zone 'America/Lima'),
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 12:30:00')::timestamp at time zone 'America/Lima')),
  ('7c000000-0000-0000-0000-000000000006', '7a000000-0000-0000-0000-000000000006',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   (((now() at time zone 'America/Lima')::date::text || ' 08:00:00')::timestamp at time zone 'America/Lima'),
   (((now() at time zone 'America/Lima')::date::text || ' 08:30:00')::timestamp at time zone 'America/Lima')),
  ('7c000000-0000-0000-0000-000000000007', '7a000000-0000-0000-0000-000000000007',
   '71111111-1111-1111-1111-111111111111', '75000000-0000-0000-0000-000000000001',
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 13:00:00')::timestamp at time zone 'America/Lima'),
   ((((now() at time zone 'America/Lima')::date + 1)::text || ' 13:30:00')::timestamp at time zone 'America/Lima'));

-- P5 ya tiene un recordatorio activo para su cita de mañana: no debe duplicarse.
insert into public.recordatorios (paciente_id, cita_id, canal, programado_para, mensaje, estado)
values ('7a000000-0000-0000-0000-000000000005', '7c000000-0000-0000-0000-000000000005',
        'whatsapp_manual', now(), 'Recordatorio ya generado (ficticio)', 'pendiente');

-- =====================================================================
-- Contexto pg_cron: sin sesión (auth.uid() nulo), sin cambiar de rol.
-- Debe generar únicamente el recordatorio de P1 (el resto queda excluido).
-- =====================================================================
select results_eq(
  $$ select public.generar_recordatorios_citas() $$,
  $$ values (1) $$,
  'contexto cron (sin sesión): genera solo el recordatorio elegible (P1)');

select ok(
  (select mensaje from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000001') like '%Elegible%',
  'el mensaje incluye el nombre de la paciente');
select ok(
  (select mensaje from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000001') like '%GynFem - Pisco%',
  'el mensaje incluye la sede por defecto');
select ok(
  (select mensaje from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000001')
    not like '%Ecografía Fase6 No Debe Aparecer%',
  'el mensaje NUNCA incluye el nombre del servicio');

select is((select count(*)::int from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000002'), 0,
  'excluye pacientes con acepta_recordatorios = false');
select is((select count(*)::int from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000003'), 0,
  'excluye pacientes sin teléfono registrado');
select is((select count(*)::int from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000004'), 0,
  'excluye pacientes con teléfono en formato inválido');
select is((select count(*)::int from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000006'), 0,
  'excluye citas que son hoy (solo genera para "mañana")');
select is((select count(*)::int from public.recordatorios where cita_id = '7c000000-0000-0000-0000-000000000005'), 1,
  'no duplica recordatorio si ya existe uno activo para la cita');

-- =====================================================================
-- Autorización con sesión: exige admin/asistente (RPC autenticado desde la app)
-- =====================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub":"71111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ select public.generar_recordatorios_citas() $$,
  '42501', null, 'médico NO puede ejecutar generar_recordatorios_citas con sesión propia');

set local request.jwt.claims = '{"sub":"72222222-2222-2222-2222-222222222222","role":"authenticated"}';
select results_eq(
  $$ select public.generar_recordatorios_citas('GynFem - Sede Norte') $$,
  $$ values (1) $$,
  'asistente SÍ puede generar recordatorios manualmente, pasando su propia sede');
select ok(
  (select mensaje from public.recordatorios where paciente_id = '7a000000-0000-0000-0000-000000000007') like '%GynFem - Sede Norte%',
  'la llamada manual usa la sede recibida por parámetro, no el valor por defecto');

-- =====================================================================
-- anon: sin privilegio EXECUTE (revocado explícitamente en la migración)
-- =====================================================================
set local role anon;
select throws_ok(
  $$ select public.generar_recordatorios_citas() $$,
  '42501', null, 'anon no tiene privilegio EXECUTE sobre generar_recordatorios_citas');

select * from finish();
rollback;
