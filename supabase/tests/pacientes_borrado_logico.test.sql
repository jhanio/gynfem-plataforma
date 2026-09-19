-- =====================================================================
-- Verifica el borrado lógico de pacientes (ADR-06, DATABASE.md §3):
--  - RLS oculta deleted_at no nulo a todos los roles salvo admin.
--  - admin SÍ puede verla si no filtra (necesario para gestionar
--    duplicados), pero el filtro `deleted_at is null` que aplica
--    features/pacientes/queries.ts la oculta también para admin en el
--    listado y la ficha por defecto.
-- Ejecutar: npx supabase test db. Datos ficticios.
-- =====================================================================
begin;
select plan(4);

insert into auth.users (id, email) values
  ('77777777-7777-4777-8777-777777777777', 'asistente.borrado@test.local'),
  ('88888888-8888-4888-8888-888888888888', 'admin.borrado@test.local');

update public.profiles set rol = 'asistente', activo = true
  where id = '77777777-7777-4777-8777-777777777777';
update public.profiles set rol = 'admin', activo = true
  where id = '88888888-8888-4888-8888-888888888888';

insert into public.pacientes
  (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha)
values
  ('b0000000-0000-0000-0000-000000000001', '00000010', 'Activa', 'Ficticia', true, now());

insert into public.pacientes
  (id, numero_documento, nombres, apellidos, consentimiento_datos, consentimiento_fecha, deleted_at)
values
  ('b0000000-0000-0000-0000-000000000002', '00000011', 'Borrada', 'Ficticia', true, now(), now());

set local role authenticated;

-- ---------------------------------------------------------------------
-- Asistente: RLS oculta la paciente borrada, incluso sin filtro explícito
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}';
select ok(
  (select count(*) from public.pacientes
     where id in ('b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002')) = 1,
  'asistente NO ve la paciente borrada aunque no filtre deleted_at (RLS)');
select ok(
  not exists (
    select 1 from public.pacientes where id = 'b0000000-0000-0000-0000-000000000002'
  ),
  'la paciente borrada es invisible para asistente por RLS');

-- ---------------------------------------------------------------------
-- Admin: RLS SÍ permite verla (diseño para gestionar duplicados), pero
-- el filtro de la app (deleted_at is null) la vuelve a ocultar.
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}';
select ok(
  (select count(*) from public.pacientes
     where id in ('b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002')) = 2,
  'admin SÍ ve la paciente borrada cuando no filtra (RLS lo permite por diseño)');
select ok(
  (select count(*) from public.pacientes
     where id in ('b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002')
       and deleted_at is null) = 1,
  'con el filtro deleted_at is null que usa la app, admin tampoco ve la borrada por defecto');

select * from finish();
rollback;
