-- =====================================================================
-- Fase 8 — AAL2 (MFA) obligatorio en tablas clínicas y auditoría
-- + defensa en profundidad del enmascarado de audit_log.
-- Ejecutar: npx supabase test db
-- Todos los datos son ficticios.
-- =====================================================================
begin;
select plan(14);

-- ---------------------------------------------------------------------
-- Usuarios: médico (111), asistente (222), admin (555)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'medico@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'asistente@test.local'),
  ('55555555-5555-5555-5555-555555555555', 'admin@test.local');

update public.profiles set rol = 'medico',    activo = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set rol = 'asistente', activo = true where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set rol = 'admin',     activo = true where id = '55555555-5555-5555-5555-555555555555';

insert into public.servicios (id, nombre, categoria, duracion_min)
values ('50000000-0000-0000-0000-000000000001', 'Servicio Ficticio', 'Consulta', 30);

insert into public.pacientes (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
values ('a0000000-0000-0000-0000-000000000001', '00000001', 'Paciente', 'Uno', true, now());

insert into public.historias_clinicas (paciente_id, alergias)
values ('a0000000-0000-0000-0000-000000000001', 'Ninguna (dato ficticio)');

insert into public.atenciones (id, paciente_id, profesional_id, servicio_id, motivo_consulta, estado, firmada_at, firmada_por)
values ('d0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '50000000-0000-0000-0000-000000000001',
        'Consulta firmada (ficticia)', 'firmada', now(), '11111111-1111-1111-1111-111111111111');

-- =====================================================================
-- Defensa en profundidad: audit_log no admite contenido clínico real
-- (corre antes de "set local role authenticated": el owner de la
-- migración crea estas filas de auditoría desde funciones security
-- definer, nunca directamente el rol authenticated).
-- =====================================================================
select throws_ok(
  $$ insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_despues)
     values ('atenciones', 'x', 'UPDATE', null, '{"diagnostico":"dato clinico real"}'::jsonb) $$,
  '23514', null, 'audit_log rechaza contenido clínico sin enmascarar (CHECK)');

select lives_ok(
  $$ insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_despues)
     values ('atenciones', 'x', 'UPDATE', null, '{"campos_modificados":["diagnostico"]}'::jsonb) $$,
  'audit_log SÍ acepta el formato enmascarado (solo nombres de campos)');

set local role authenticated;

-- =====================================================================
-- médico con aal1 (sin el segundo factor completado en esta sesión)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal1"}';
select is((select count(*)::int from public.historias_clinicas), 0, 'médico con aal1 NO ve historia clínica');
select is((select count(*)::int from public.atenciones), 0, 'médico con aal1 NO ve atenciones');
select throws_ok(
  $$ insert into public.adendas (atencion_id, contenido) values ('d0000000-0000-0000-0000-000000000001', 'No permitido sin aal2') $$,
  '42501', null, 'médico con aal1 NO puede crear una adenda');
select throws_ok(
  $$ select public.registrar_acceso_historia('a0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'médico con aal1 NO puede registrar acceso a la historia');

-- =====================================================================
-- médico con aal2 (segundo factor verificado en esta sesión)
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}';
select is((select count(*)::int from public.historias_clinicas), 1, 'médico con aal2 SÍ ve historia clínica');
select is((select count(*)::int from public.atenciones), 1, 'médico con aal2 SÍ ve atenciones');
select lives_ok(
  $$ insert into public.adendas (atencion_id, contenido) values ('d0000000-0000-0000-0000-000000000001', 'Corrección ficticia con aal2') $$,
  'médico con aal2 SÍ puede crear una adenda');
select lives_ok(
  $$ select public.registrar_acceso_historia('a0000000-0000-0000-0000-000000000001') $$,
  'médico con aal2 SÍ puede registrar acceso a la historia');

-- =====================================================================
-- admin: audit_log exige aal2
-- =====================================================================
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","aal":"aal1"}';
select is((select count(*)::int from public.audit_log), 0, 'admin con aal1 NO ve auditoría');

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated","aal":"aal2"}';
select ok((select count(*) from public.audit_log) > 0, 'admin con aal2 SÍ ve auditoría');

-- =====================================================================
-- Sin claim "aal" (token antiguo o sin MFA): se trata como aal1, nunca
-- como aal2 por omisión.
-- =====================================================================
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.historias_clinicas), 0, 'médico sin claim "aal" (ausente) NO ve historia clínica');

-- asistente: rol sin acceso a historia clínica, con o sin aal2, sigue sin verla
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","aal":"aal2"}';
select is((select count(*)::int from public.historias_clinicas), 0, 'asistente con aal2 sigue sin ver historia clínica (rol insuficiente)');

select * from finish();
rollback;
