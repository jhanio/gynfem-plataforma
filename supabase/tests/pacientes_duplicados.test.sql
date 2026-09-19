-- =====================================================================
-- Tests pgTAP — public.pacientes_posibles_duplicados() (Fase 7, KPI-07)
-- Ejecutar: npx supabase test db. Todos los datos son ficticios.
--
-- Cobertura:
--  - Detecta duplicados por nombres+apellidos+fecha_nacimiento normalizando
--    mayúsculas y espacios (lower/trim).
--  - No agrupa por nombre si difiere la fecha de nacimiento.
--  - No incluye pacientes borradas (deleted_at) ni sin fecha de nacimiento.
--  - Autorización: solo admin. Sin excepción para contexto sin sesión
--    (a diferencia de generar_recordatorios_citas, aquí no hay uso desde cron).
--  - anon no tiene privilegio EXECUTE (revocado explícitamente).
-- =====================================================================
begin;
select plan(8);

insert into auth.users (id, email) values
  ('81111111-1111-1111-1111-111111111111', 'admin-f7@test.local'),
  ('82222222-2222-2222-2222-222222222222', 'asistente-f7@test.local');

update public.profiles set rol = 'admin',     activo = true where id = '81111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'asistente', activo = true where id = '82222222-2222-2222-2222-222222222222';

-- Par duplicado real: mismo nombre/apellido/fecha, con variantes de
-- mayúsculas y espacios que deben normalizarse.
insert into public.pacientes (id, numero_documento, nombres, apellidos, fecha_nacimiento, consentimiento_datos, consentimiento_fecha)
values
  ('8a000000-0000-0000-0000-000000000001', '80000001', 'Maria Jose',   'Lopez Rios', '1990-05-10', true, now()),
  ('8a000000-0000-0000-0000-000000000002', '80000002', '  MARIA JOSE ', 'lopez rios', '1990-05-10', true, now()),
  -- Mismo nombre pero fecha de nacimiento distinta: NO debe agruparse.
  ('8a000000-0000-0000-0000-000000000003', '80000003', 'Maria Jose',   'Lopez Rios', '1985-01-01', true, now()),
  -- Nombre único: no debe aparecer.
  ('8a000000-0000-0000-0000-000000000004', '80000004', 'Ana',          'Torres',     '1992-02-02', true, now()),
  -- Duplicado pero sin fecha de nacimiento: excluido por diseño.
  ('8a000000-0000-0000-0000-000000000005', '80000005', 'Sin Fecha',    'Duplicada',  null,         true, now()),
  ('8a000000-0000-0000-0000-000000000006', '80000006', 'Sin Fecha',    'Duplicada',  null,         true, now());

-- Duplicado marcado como borrado: no debe contarse.
insert into public.pacientes (id, numero_documento, nombres, apellidos, fecha_nacimiento, consentimiento_datos, consentimiento_fecha, deleted_at)
values ('8a000000-0000-0000-0000-000000000007', '80000007', 'Maria Jose', 'Lopez Rios', '1990-05-10', true, now(), now());

-- =====================================================================
-- Autorización
-- =====================================================================
select throws_ok(
  $$ select public.pacientes_posibles_duplicados() $$,
  '42501', null, 'sin sesión: no autorizado (no hay excepción de contexto cron)');

set local role authenticated;
set local request.jwt.claims = '{"sub":"82222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.pacientes_posibles_duplicados() $$,
  '42501', null, 'asistente NO puede consultar posibles duplicados');

set local request.jwt.claims = '{"sub":"81111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- =====================================================================
-- Resultado para admin
-- =====================================================================
select is(
  (select count(*)::int from public.pacientes_posibles_duplicados()),
  1,
  'admin ve exactamente un grupo de posibles duplicados');

select is(
  (select cantidad from public.pacientes_posibles_duplicados() limit 1),
  2::bigint,
  'el grupo detectado tiene 2 pacientes (variantes de mayúsculas/espacios normalizadas)');

select ok(
  (select paciente_ids from public.pacientes_posibles_duplicados() limit 1)
    @> array['8a000000-0000-0000-0000-000000000001'::uuid, '8a000000-0000-0000-0000-000000000002'::uuid],
  'el grupo incluye ambos ids de las pacientes duplicadas');

select ok(
  not ((select paciente_ids from public.pacientes_posibles_duplicados() limit 1)
    @> array['8a000000-0000-0000-0000-000000000003'::uuid]),
  'no agrupa cuando la fecha de nacimiento difiere, aunque el nombre coincida');

select ok(
  not exists (
    select 1 from public.pacientes_posibles_duplicados() d
    where '8a000000-0000-0000-0000-000000000007' = any(d.paciente_ids)),
  'excluye pacientes borradas (deleted_at)');

-- =====================================================================
-- anon: sin privilegio EXECUTE (revocado explícitamente en la migración)
-- =====================================================================
set local role anon;
select throws_ok(
  $$ select public.pacientes_posibles_duplicados() $$,
  '42501', null, 'anon no tiene privilegio EXECUTE sobre pacientes_posibles_duplicados');

select * from finish();
rollback;
