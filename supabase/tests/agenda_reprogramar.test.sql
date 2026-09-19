-- =====================================================================
-- Tests pgTAP — public.reprogramar_cita() (Fase 4). Ejecutar: npx supabase test db
-- Todos los datos son ficticios. Fechas en 2027 para quedar siempre en el
-- futuro respecto de la fecha real de ejecución (evita chocar con la
-- validación de "fecha futura" de la propia función).
-- =====================================================================
begin;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'medico@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'soporte@test.local');

update public.profiles set rol = 'medico',  activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'soporte', activo = true where id = '33333333-3333-3333-3333-333333333333';

insert into public.servicios (id, nombre, categoria, duracion_min)
values ('50000000-0000-0000-0000-000000000001', 'Servicio Ficticio', 'Consulta', 30);

insert into public.pacientes (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
values ('a0000000-0000-0000-0000-000000000001', '00000001', 'Paciente', 'Uno', true, now());

-- C1: 2027-03-02 09:00–09:30 Lima — caso reprogramación normal
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin)
values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-02 14:00:00+00', '2027-03-02 14:30:00+00');

-- C3: 2027-03-04 09:00–09:30 Lima — caso auto-superposición
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin)
values ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-04 14:00:00+00', '2027-03-04 14:30:00+00');

-- C4 y C5: mismo profesional, 2027-03-05 — caso choque con otra cita
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin)
values ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-05 14:00:00+00', '2027-03-05 14:30:00+00'),
       ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-05 15:00:00+00', '2027-03-05 15:30:00+00');

-- C6: ya cancelada — caso estado no permite reprogramar
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin, estado)
values ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-06 14:00:00+00', '2027-03-06 14:30:00+00', 'cancelada');

-- C7: para el caso de motivo vacío
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin)
values ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-07 14:00:00+00', '2027-03-07 14:30:00+00');

-- C8: para el caso de fecha/hora pasada
insert into public.citas (id, paciente_id, profesional_id, servicio_id, inicio, fin)
values ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001',
        '2027-03-08 14:00:00+00', '2027-03-08 14:30:00+00');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- 1) Reprogramación normal: el fin se calcula desde la duración del servicio (30 min)
select lives_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000001', '2027-03-03 14:00:00+00', 'Paciente solicitó cambio de día') $$,
  'médico SÍ puede reprogramar una cita programada');
select is(
  (select estado::text from public.citas where id = 'c0000000-0000-0000-0000-000000000001'),
  'reprogramada', 'la cita original queda en estado reprogramada');
select is(
  (select fin from public.citas where cita_origen_id = 'c0000000-0000-0000-0000-000000000001'),
  '2027-03-03 14:30:00+00'::timestamptz,
  'el fin de la nueva cita se calcula con la duración del servicio (30 min), no lo envía la app');

-- 2) Auto-superposición: reprogramar dentro del propio horario original NO choca
--    consigo misma, porque el EXCLUDE de public.citas no cubre estado 'reprogramada'.
select lives_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000003', '2027-03-04 14:15:00+00', 'Ajuste de 15 min') $$,
  'reprogramar a un horario que se superpone con el ORIGINAL no choca consigo misma');

-- 3) Choque real con otra cita activa del mismo profesional: se revierte todo
select throws_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000004', '2027-03-05 15:15:00+00', 'Choca con otra cita') $$,
  '23P01', null, 'reprogramar a un horario que choca con OTRA cita es rechazado');
select is(
  (select estado::text from public.citas where id = 'c0000000-0000-0000-0000-000000000004'),
  'programada', 'si la reprogramación falla, la cita original NO queda a medio cambiar');

-- 4) Estado no permite reprogramar
select throws_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000006', '2027-03-09 14:00:00+00', 'No debería permitirse') $$,
  'P0001', null, 'no se puede reprogramar una cita cancelada');

-- 5) Motivo obligatorio
select throws_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000007', '2027-03-10 14:00:00+00', '') $$,
  'P0001', null, 'el motivo de reprogramación es obligatorio');

-- 6) Fecha/hora pasada rechazada
select throws_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000008', '2020-01-01 14:00:00+00', 'Fecha inválida') $$,
  'P0001', null, 'no se puede reprogramar a una fecha/hora pasada');

-- 7) soporte no tiene acceso a citas (RLS): la función no debe filtrar existencia
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ select public.reprogramar_cita('c0000000-0000-0000-0000-000000000005', '2027-03-11 14:00:00+00', 'Sin permiso') $$,
  'P0002', null, 'soporte no puede reprogramar (la cita "no existe" bajo su RLS)');

select * from finish();
rollback;
