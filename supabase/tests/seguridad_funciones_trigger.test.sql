-- =====================================================================
-- Fase 8 — Security Advisor: funciones de trigger no invocables
-- directamente por anon/authenticated, y los triggers siguen operando
-- pese al REVOKE (el motor de triggers no pasa por el chequeo de
-- privilegio EXECUTE). Ejecutar: npx supabase test db
-- =====================================================================
begin;
select plan(9);

-- ---------------------------------------------------------------------
-- anon: ninguna de las 4 funciones es invocable directamente
-- ---------------------------------------------------------------------
set local role anon;

select throws_ok(
  $$ select public.handle_user_rol_actualizado() $$,
  '42501', null, 'anon NO puede ejecutar handle_user_rol_actualizado()');
select throws_ok(
  $$ select public.fn_auditoria() $$,
  '42501', null, 'anon NO puede ejecutar fn_auditoria()');
select throws_ok(
  $$ select public.fn_cita_atendida() $$,
  '42501', null, 'anon NO puede ejecutar fn_cita_atendida()');
select throws_ok(
  $$ select public.handle_new_user() $$,
  '42501', null, 'anon NO puede ejecutar handle_new_user()');

-- ---------------------------------------------------------------------
-- authenticated: tampoco
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';

select throws_ok(
  $$ select public.handle_user_rol_actualizado() $$,
  '42501', null, 'authenticated NO puede ejecutar handle_user_rol_actualizado()');
select throws_ok(
  $$ select public.fn_auditoria() $$,
  '42501', null, 'authenticated NO puede ejecutar fn_auditoria()');
select throws_ok(
  $$ select public.fn_cita_atendida() $$,
  '42501', null, 'authenticated NO puede ejecutar fn_cita_atendida()');
select throws_ok(
  $$ select public.handle_new_user() $$,
  '42501', null, 'authenticated NO puede ejecutar handle_new_user()');

-- ---------------------------------------------------------------------
-- Los triggers SÍ siguen funcionando pese al REVOKE: el motor de
-- triggers invoca la función directamente, sin pasar por el chequeo de
-- privilegio EXECUTE del rol que ejecuta la sentencia.
-- ---------------------------------------------------------------------
reset role;
insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'trigger-vivo@test.local');

select is(
  (select count(*)::int from public.profiles where id = '88888888-8888-8888-8888-888888888888'),
  1, 'el trigger on_auth_user_created (handle_new_user) sí se disparó al insertar en auth.users');

select * from finish();
rollback;
