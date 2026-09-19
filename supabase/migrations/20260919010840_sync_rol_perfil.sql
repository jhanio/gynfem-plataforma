-- =====================================================================
-- Fix: el rol del perfil no se asignaba al crear usuarios con la Auth Admin API.
--
-- GoTrue crea el usuario en dos pasos:
--   1) INSERT en auth.users con raw_app_meta_data solo del proveedor
--      (sin el 'rol' que pasamos en app_metadata).
--   2) UPDATE posterior que agrega el app_metadata personalizado (rol).
-- handle_new_user() es AFTER INSERT, así que en el paso 1 no ve el rol y el
-- perfil queda con rol='asistente' y activo=false.
--
-- Este trigger promueve el perfil cuando aparece el rol (paso 2). Dispara SOLO
-- en la transición "sin rol -> con rol", que ocurre una única vez (en la
-- creación); nunca revierte un cambio de rol hecho luego por un admin sobre
-- public.profiles (allí profiles.rol sigue siendo la fuente de verdad).
-- =====================================================================

create or replace function public.handle_user_rol_actualizado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (old.raw_app_meta_data ? 'rol') is false
     and (new.raw_app_meta_data ? 'rol') is true then
    update public.profiles
       set rol    = (new.raw_app_meta_data->>'rol')::public.app_rol,
           activo = true
     where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_rol_actualizado
  after update of raw_app_meta_data on auth.users
  for each row execute function public.handle_user_rol_actualizado();
