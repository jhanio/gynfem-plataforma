-- =====================================================================
-- Tests RLS — cobertura de la matriz de permisos de docs/DATABASE.md §3
-- y de las reglas de negocio de §4. Ejecutar: npx supabase test db
-- Todos los datos son ficticios.
--
-- Patrones:
--  - SELECT denegado  -> la fila no es visible (count = 0)
--  - INSERT/with_check denegado -> error 42501
--  - UPDATE denegado (using falso) -> afecta 0 filas (no es error)
--    Se verifica con: WITH u AS (UPDATE ... RETURNING 1) SELECT count(*) FROM u
-- =====================================================================
begin;
select plan(58);

-- ---------------------------------------------------------------------
-- Usuarios (uno por rol) + inactivo
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'medico@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'asistente@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'soporte@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'inactivo@test.local'),
  ('55555555-5555-5555-5555-555555555555', 'admin@test.local'),
  ('66666666-6666-6666-6666-666666666666', 'obstetra@test.local');

update public.profiles set rol = 'medico',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'asistente', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set rol = 'soporte',   activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set rol = 'admin',     activo = true where id = '55555555-5555-5555-5555-555555555555';
update public.profiles set rol = 'obstetra',  activo = true where id = '66666666-6666-6666-6666-666666666666';
-- 4444 queda inactivo (sin rol en app_metadata)

-- Servicio
insert into public.servicios (id, nombre, categoria, duracion_min)
values ('50000000-0000-0000-0000-000000000001', 'Servicio Ficticio', 'Consulta', 30);

-- Pacientes: P1 (con historia), P2 (borrada), P3 (sin historia)
insert into public.pacientes (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
values
  ('a0000000-0000-0000-0000-000000000001', '00000001', 'Paciente', 'Uno',  true, now()),
  ('a0000000-0000-0000-0000-000000000003', '00000003', 'Paciente', 'Tres', true, now());
insert into public.pacientes (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha, deleted_at)
values
  ('a0000000-0000-0000-0000-000000000002', '00000002', 'Paciente', 'Dos', true, now(), now());

insert into public.historias_clinicas (paciente_id, alergias)
values ('a0000000-0000-0000-0000-000000000001', 'Ninguna (dato ficticio)');

-- Cita C1 (programada, profesional = médico), 2026-01-10 09:00–09:30 Lima
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin, estado)
values ('c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001',
        '2026-01-10 14:00:00+00', '2026-01-10 14:30:00+00', 'programada');

-- Atenciones: A1 borrador (cita C1), A2 firmada (sin cita)
insert into public.atenciones (id, paciente_id, cita_id, profesional_id, servicio_id, motivo_consulta, estado)
values ('d0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001',
        'Control (ficticio)', 'borrador');
insert into public.atenciones (id, paciente_id, profesional_id, servicio_id, motivo_consulta, estado, firmada_at, firmada_por)
values ('d0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001',
        'Consulta firmada (ficticia)', 'firmada', now(), '11111111-1111-1111-1111-111111111111');

-- Seguimiento SG1
insert into public.seguimientos (id, paciente_id, tipo, descripcion, fecha_objetivo, created_by)
values ('e0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001', 'control', 'Control en 4 semanas',
        current_date + 28, '11111111-1111-1111-1111-111111111111');

-- Recordatorio R1
insert into public.recordatorios (id, paciente_id, cita_id, canal, programado_para, mensaje)
values ('f0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'whatsapp_manual', now(), 'Recordatorio ficticio');

set local role authenticated;

-- =====================================================================
-- profiles: todos S; solo admin U
-- =====================================================================
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.profiles) = 6, 'asistente ve todos los perfiles (S)');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok((select count(*) from public.profiles) = 6, 'médico ve todos los perfiles (S)');
select results_eq(
  $$ WITH u AS (UPDATE public.profiles SET nombre_completo = 'X' WHERE id = '22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (0) $$, 'médico NO puede actualizar perfiles (0 filas)');

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select ok((select count(*) from public.profiles) = 6, 'soporte ve todos los perfiles (S)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","aal":"aal2"}';
select results_eq(
  $$ WITH u AS (UPDATE public.profiles SET nombre_completo = 'Admin edita' WHERE id = '22222222-2222-2222-2222-222222222222' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'admin SÍ puede actualizar perfiles (U)');

-- =====================================================================
-- servicios: admin S I U; resto solo S
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok((select count(*) from public.servicios) >= 1, 'médico ve servicios (S)');
select throws_ok(
  $$ insert into public.servicios (nombre, categoria, duracion_min) values ('Nuevo', 'X', 30) $$,
  '42501', null, 'médico NO puede crear servicios (I)');
select results_eq(
  $$ WITH u AS (UPDATE public.servicios SET categoria = 'X' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (0) $$, 'médico NO puede actualizar servicios (0 filas)');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.servicios) >= 1, 'asistente ve servicios (S)');
select throws_ok(
  $$ insert into public.servicios (nombre, categoria, duracion_min) values ('Otro', 'X', 30) $$,
  '42501', null, 'asistente NO puede crear servicios (I)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select lives_ok(
  $$ insert into public.servicios (nombre, categoria, duracion_min) values ('Servicio Admin', 'Consulta', 30) $$,
  'admin SÍ puede crear servicios (I)');
select results_eq(
  $$ WITH u AS (UPDATE public.servicios SET categoria = 'Modificada' WHERE nombre = 'Servicio Admin' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'admin SÍ puede actualizar servicios (U)');

-- =====================================================================
-- pacientes: admin/medico/obstetra/asistente S I U; soporte nada; admin ve borradas
-- =====================================================================
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.pacientes) = 2, 'asistente ve pacientes NO borradas (P1,P3)');
select lives_ok(
  $$ insert into public.pacientes (numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
     values ('00009999', 'Nueva', 'Ficticia', true, now()) $$,
  'asistente SÍ puede registrar pacientes (I)');
select results_eq(
  $$ WITH u AS (UPDATE public.pacientes SET telefono = '999888777' WHERE numero_documento = '00000001' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'asistente SÍ puede actualizar pacientes (U)');

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select ok((select count(*) from public.pacientes) = 0, 'soporte NO ve pacientes (S)');
select throws_ok(
  $$ insert into public.pacientes (numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
     values ('00008888', 'X', 'Y', true, now()) $$,
  '42501', null, 'soporte NO puede registrar pacientes (I)');

set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}';
select lives_ok(
  $$ insert into public.pacientes (numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
     values ('00007777', 'Obs', 'Ficticia', true, now()) $$,
  'obstetra SÍ puede registrar pacientes (I)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select ok((select count(*) from public.pacientes where deleted_at is not null) = 1, 'admin SÍ ve pacientes borradas');

-- =====================================================================
-- historias_clinicas: solo medico/obstetra S I U, y con aal2
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select ok((select count(*) from public.historias_clinicas) = 1, 'médico ve historia clínica (S)');
select lives_ok(
  $$ insert into public.historias_clinicas (paciente_id, alergias)
     values ('a0000000-0000-0000-0000-000000000003', 'Ninguna') $$,
  'médico SÍ puede crear historia clínica (I)');
select results_eq(
  $$ WITH u AS (UPDATE public.historias_clinicas SET alergias = 'Polen' WHERE paciente_id = 'a0000000-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'médico SÍ puede actualizar historia clínica (U)');

set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated","aal":"aal2"}';
select ok((select count(*) from public.historias_clinicas) = 2, 'obstetra ve historias clínicas (S)');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.historias_clinicas) = 0, 'asistente NO ve historia clínica (S)');
select throws_ok(
  $$ insert into public.historias_clinicas (paciente_id, alergias) values ('a0000000-0000-0000-0000-000000000001', 'X') $$,
  '42501', null, 'asistente NO puede crear historia clínica (I)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select ok((select count(*) from public.historias_clinicas) = 0, 'admin NO ve historia clínica (S)');

-- =====================================================================
-- citas: admin/medico/obstetra/asistente S I U; soporte nada
-- =====================================================================
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.citas) = 1, 'asistente ve citas (S)');
select lives_ok(
  $$ insert into public.citas (paciente_id, profesional_id, servicio_id, inicio, fin)
     values ('a0000000-0000-0000-0000-000000000001','66666666-6666-6666-6666-666666666666','50000000-0000-0000-0000-000000000001','2026-01-11 14:00:00+00','2026-01-11 14:30:00+00') $$,
  'asistente SÍ puede crear citas (I)');

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select ok((select count(*) from public.citas) = 0, 'soporte NO ve citas (S)');

-- =====================================================================
-- atenciones: solo medico/obstetra S; insert propio; update propio borrador; firmada inmutable
-- (todo exige aal2)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select ok((select count(*) from public.atenciones) = 2, 'médico ve atenciones (S)');
select results_eq(
  $$ WITH u AS (UPDATE public.atenciones SET anamnesis = 'edit' WHERE id = 'd0000000-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'médico SÍ puede editar su atención en borrador (U)');
select results_eq(
  $$ WITH u AS (UPDATE public.atenciones SET anamnesis = 'no' WHERE id = 'd0000000-0000-0000-0000-000000000002' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (0) $$, 'atención firmada es inmutable (0 filas)');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.atenciones) = 0, 'asistente NO ve atenciones (S)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select ok((select count(*) from public.atenciones) = 0, 'admin NO ve atenciones (S)');

-- =====================================================================
-- adendas: medico/obstetra S; insert solo sobre atención firmada (aal2)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select lives_ok(
  $$ insert into public.adendas (atencion_id, contenido) values ('d0000000-0000-0000-0000-000000000002', 'Corrección ficticia') $$,
  'médico SÍ puede adjuntar adenda a atención firmada (I)');
select throws_ok(
  $$ insert into public.adendas (atencion_id, contenido) values ('d0000000-0000-0000-0000-000000000001', 'No permitido') $$,
  '42501', null, 'médico NO puede adjuntar adenda a atención en borrador (I)');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.adendas) = 0, 'asistente NO ve adendas (S)');

-- =====================================================================
-- seguimientos: admin S; medico/obstetra S I U; asistente S U (no I)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.seguimientos (paciente_id, tipo, descripcion, fecha_objetivo)
     values ('a0000000-0000-0000-0000-000000000001','control','Control ficticio', current_date + 14) $$,
  'médico SÍ puede crear seguimientos (I)');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.seguimientos) >= 1, 'asistente ve seguimientos (S)');
select results_eq(
  $$ WITH u AS (UPDATE public.seguimientos SET estado = 'contactada' WHERE id = 'e0000000-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'asistente SÍ puede actualizar seguimientos (U)');
select throws_ok(
  $$ insert into public.seguimientos (paciente_id, tipo, descripcion, fecha_objetivo)
     values ('a0000000-0000-0000-0000-000000000001','control','No permitido', current_date + 7) $$,
  '42501', null, 'asistente NO puede crear seguimientos (I)');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select ok((select count(*) from public.seguimientos) >= 1, 'admin ve seguimientos (S)');
select throws_ok(
  $$ insert into public.seguimientos (paciente_id, tipo, descripcion, fecha_objetivo)
     values ('a0000000-0000-0000-0000-000000000001','control','No permitido admin', current_date + 7) $$,
  '42501', null, 'admin NO puede crear seguimientos (I)');
select results_eq(
  $$ WITH u AS (UPDATE public.seguimientos SET estado = 'completado' WHERE id = 'e0000000-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (0) $$, 'admin NO puede actualizar seguimientos (0 filas)');

-- =====================================================================
-- recordatorios: admin/asistente S I U; medico/obstetra solo S; soporte nada
-- =====================================================================
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok((select count(*) from public.recordatorios) = 1, 'asistente ve recordatorios (S)');
select results_eq(
  $$ WITH u AS (UPDATE public.recordatorios SET estado = 'enviado' WHERE id = 'f0000000-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*)::int FROM u $$,
  $$ VALUES (1) $$, 'asistente SÍ puede actualizar recordatorios (U)');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok((select count(*) from public.recordatorios) = 1, 'médico ve recordatorios (S)');
select throws_ok(
  $$ insert into public.recordatorios (paciente_id, cita_id, canal, programado_para, mensaje)
     values ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','whatsapp_manual', now(), 'X') $$,
  '42501', null, 'médico NO puede crear recordatorios (I)');

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select ok((select count(*) from public.recordatorios) = 0, 'soporte NO ve recordatorios (S)');

-- =====================================================================
-- audit_log: solo admin S, y con aal2
-- =====================================================================
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","aal":"aal2"}';
select ok((select count(*) from public.audit_log) > 0, 'admin ve auditoría (S)');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok((select count(*) from public.audit_log) = 0, 'médico NO ve auditoría (S)');

-- =====================================================================
-- Reglas de negocio (docs/DATABASE.md §4)
-- =====================================================================
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ insert into public.pacientes (numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
     values ('00000001', 'Duplicada', 'Ficticia', true, now()) $$,
  '23505', null, 'documento único por paciente activa (23505)');
select throws_ok(
  $$ insert into public.pacientes (tipo_documento, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
     values ('DNI', '123', 'DNI', 'Corto', true, now()) $$,
  '23514', null, 'DNI de 8 dígitos (23514)');
select throws_ok(
  $$ insert into public.pacientes (numero_documento, nombres, apellidos, consentimiento_datos)
     values ('00006666', 'Sin', 'Consentimiento', false) $$,
  '23514', null, 'consentimiento obligatorio (23514)');
select throws_ok(
  $$ insert into public.citas (paciente_id, profesional_id, servicio_id, inicio, fin)
     values ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','50000000-0000-0000-0000-000000000001','2026-01-10 14:15:00+00','2026-01-10 14:45:00+00') $$,
  '23P01', null, 'sin cruce de citas por profesional (23P01)');
select throws_ok(
  $$ delete from public.pacientes $$,
  '42501', null, 'nadie puede borrar físicamente (42501)');

-- =====================================================================
-- Flujo clínico: firmar borrador -> cita 'atendida' (trigger) (aal2)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select lives_ok(
  $$ update public.atenciones set estado = 'firmada' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'médico firma su atención en borrador');
select is(
  (select estado::text from public.citas where id = 'c0000000-0000-0000-0000-000000000001'),
  'atendida', 'al firmar, la cita vinculada pasa a atendida');

select * from finish();
rollback;
