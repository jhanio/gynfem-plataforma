-- =====================================================================
-- Reproduce el flujo REAL de creación de la Auth Admin API (GoTrue) y verifica
-- que el perfil queda con el rol correcto y activo=true.
--
-- GoTrue escribe en dos pasos:
--   1) INSERT en auth.users con raw_app_meta_data solo del proveedor (sin rol)
--   2) UPDATE que agrega app_metadata (rol)
-- Ejecutar: npx supabase test db. Datos ficticios.
-- =====================================================================
begin;
select plan(5);

-- --- Paso 1 de GoTrue: INSERT sin 'rol' en raw_app_meta_data ----------
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values (
  '99999999-9999-4999-8999-999999999999',
  'nuevo.medico@test.local',
  '{"nombre_completo":"Nuevo Médico Ficticio"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb
);

-- Tras el paso 1, el perfil queda con los valores por defecto (el bug original).
select is(
  (select rol::text from public.profiles where id = '99999999-9999-4999-8999-999999999999'),
  'asistente', 'paso 1 (INSERT sin rol): perfil con rol por defecto');
select is(
  (select activo from public.profiles where id = '99999999-9999-4999-8999-999999999999'),
  false, 'paso 1 (INSERT sin rol): perfil inactivo');

-- --- Paso 2 de GoTrue: UPDATE que agrega el rol en app_metadata -------
update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"rol":"medico"}'::jsonb
 where id = '99999999-9999-4999-8999-999999999999';

-- El trigger sync_rol_perfil promueve el perfil al rol correcto y lo activa.
select is(
  (select rol::text from public.profiles where id = '99999999-9999-4999-8999-999999999999'),
  'medico', 'paso 2 (UPDATE con rol): perfil con rol correcto');
select is(
  (select activo from public.profiles where id = '99999999-9999-4999-8999-999999999999'),
  true, 'paso 2 (UPDATE con rol): perfil activo');

-- --- No clobbering: un cambio de rol posterior (fuente de verdad =
--     public.profiles) no debe ser revertido por updates de auth.users -----
update public.profiles set rol = 'obstetra'
 where id = '99999999-9999-4999-8999-999999999999';
update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"otro":"x"}'::jsonb
 where id = '99999999-9999-4999-8999-999999999999';

select is(
  (select rol::text from public.profiles where id = '99999999-9999-4999-8999-999999999999'),
  'obstetra', 'el trigger NO revierte un cambio de rol posterior (sin clobbering)');

select * from finish();
rollback;
