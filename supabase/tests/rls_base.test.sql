-- Tests RLS base (pgTAP). Ejecutar: npx supabase test db
-- Todos los datos son ficticios.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'medico@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'asistente@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'soporte@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'inactivo@test.local'),
  ('55555555-5555-5555-5555-555555555555', 'admin@test.local');

update public.profiles set rol = 'medico',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'asistente', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set rol = 'soporte',   activo = true where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set rol = 'admin',     activo = true where id = '55555555-5555-5555-5555-555555555555';
-- 4444 queda inactivo (sin rol en app_metadata)

insert into public.pacientes (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000001', 'Paciente', 'Ficticia Uno', true, now());
insert into public.historias_clinicas (paciente_id, alergias)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ninguna (dato ficticio)');

set local role authenticated;

-- Asistente
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from public.pacientes), 1, 'asistente ve pacientes');
select is((select count(*)::int from public.historias_clinicas), 0, 'asistente NO ve historia clínica');
select throws_ok($$ delete from public.pacientes $$, '42501', null, 'nadie puede borrar físicamente');

-- Médico (con aal2: la política de historias_clinicas ahora lo exige)
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select is((select count(*)::int from public.historias_clinicas), 1, 'médico ve historia clínica');
select is((select count(*)::int from public.audit_log), 0, 'médico NO ve auditoría');

-- Soporte
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.pacientes), 0, 'soporte NO ve pacientes');

-- Usuario inactivo
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select is((select count(*)::int from public.servicios), 0, 'usuario inactivo no ve nada');

-- Admin (con aal2: la política de audit_log ahora lo exige)
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","aal":"aal2"}';
select is((select count(*)::int from public.historias_clinicas), 0, 'admin NO ve historia clínica');
select ok((select count(*) from public.audit_log) > 0, 'admin ve auditoría');

select * from finish();
rollback;
