-- =====================================================================
-- Fase 5 — Historia clínica y atenciones
-- Cubre: registro de acceso (READ) server-side, firma solo por el autor
-- (cruce entre profesionales) y adenda inmutable. Datos ficticios.
-- Ejecutar: npx supabase test db
-- =====================================================================
begin;
select plan(7);

-- ---------------------------------------------------------------------
-- Usuarios: médico (111), obstetra (666), asistente (222), admin (555)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'medico@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'asistente@test.local'),
  ('55555555-5555-5555-5555-555555555555', 'admin@test.local'),
  ('66666666-6666-6666-6666-666666666666', 'obstetra@test.local');

update public.profiles set rol = 'medico',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'asistente', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set rol = 'admin',     activo = true where id = '55555555-5555-5555-5555-555555555555';
update public.profiles set rol = 'obstetra',  activo = true where id = '66666666-6666-6666-6666-666666666666';

insert into public.servicios (id, nombre, categoria, duracion_min)
values ('50000000-0000-0000-0000-000000000001', 'Servicio Ficticio', 'Consulta', 30);

insert into public.pacientes (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
values ('a0000000-0000-0000-0000-000000000001', '00000001', 'Paciente', 'Uno', true, now());

-- Atención A1: borrador del MÉDICO. A2: firmada del MÉDICO.
insert into public.atenciones (id, paciente_id, profesional_id, servicio_id, motivo_consulta, estado)
values ('d0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001',
        'Control (ficticio)', 'borrador');
insert into public.atenciones (id, paciente_id, profesional_id, servicio_id, motivo_consulta, estado, firmada_at, firmada_por)
values ('d0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001',
        'Consulta firmada (ficticia)', 'firmada', now(), '11111111-1111-1111-1111-111111111111');

-- =====================================================================
-- registrar_acceso_historia: solo medico/obstetra; genera READ
-- =====================================================================
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select lives_ok(
  $$ select public.registrar_acceso_historia('a0000000-0000-0000-0000-000000000001') $$,
  'médico registra acceso a la historia (READ)');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","aal":"aal2"}';
select throws_ok(
  $$ select public.registrar_acceso_historia('a0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'asistente NO puede registrar acceso a la historia');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","aal":"aal2"}';
select throws_ok(
  $$ select public.registrar_acceso_historia('a0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'admin NO puede registrar acceso a la historia');

-- El admin sí puede leer la auditoría: exactamente 1 READ registrado.
select is(
  (select count(*)::int from public.audit_log
   where accion = 'READ' and tabla = 'historias_clinicas'
     and registro_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'se registró exactamente un READ de historia clínica');

-- =====================================================================
-- Firma: una obstetra NO puede firmar el borrador de un médico (0 filas)
-- =====================================================================
set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated","aal":"aal2"}';
select results_eq(
  $$ WITH u AS (UPDATE public.atenciones SET estado = 'firmada'
                WHERE id = 'd0000000-0000-0000-0000-000000000001' RETURNING 1)
     SELECT count(*)::int FROM u $$,
  $$ VALUES (0) $$,
  'obstetra NO puede firmar el borrador de otro profesional (0 filas)');

-- El borrador sigue siendo borrador.
select is(
  (select estado::text from public.atenciones where id = 'd0000000-0000-0000-0000-000000000001'),
  'borrador', 'el borrador ajeno permanece sin firmar');

-- =====================================================================
-- Adenda: inmutable una vez creada (sin política UPDATE -> 0 filas)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
insert into public.adendas (id, atencion_id, contenido)
values ('f0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000002', 'Corrección ficticia');
select results_eq(
  $$ WITH u AS (UPDATE public.adendas SET contenido = 'Alterada'
                WHERE id = 'f0000000-0000-0000-0000-000000000001' RETURNING 1)
     SELECT count(*)::int FROM u $$,
  $$ VALUES (0) $$,
  'una adenda es inmutable: UPDATE afecta 0 filas');

select * from finish();
rollback;
