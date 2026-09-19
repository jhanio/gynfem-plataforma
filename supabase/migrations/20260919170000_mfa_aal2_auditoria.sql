-- =====================================================================
-- Fase 8 — Exigir AAL2 (MFA) en tablas clínicas, auditoría y perfiles
-- + defensa en profundidad: audit_log no puede contener contenido
--   clínico aunque un trigger futuro lo intente.
-- =====================================================================

-- ¿La sesión actual completó el segundo factor (TOTP)?
create or replace function public.requiere_aal2()
returns boolean language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
$$;

revoke execute on function public.requiere_aal2() from public, anon;
grant execute on function public.requiere_aal2() to authenticated;

-- ---------------------------------------------------------------------
-- profiles — la actualización (solo admin) también exige aal2
-- ---------------------------------------------------------------------
alter policy profiles_update on public.profiles
  using ((select public.tiene_rol('admin')) and (select public.requiere_aal2()))
  with check ((select public.tiene_rol('admin')) and (select public.requiere_aal2()));

-- ---------------------------------------------------------------------
-- historias_clinicas — exige medico/obstetra + aal2
-- ---------------------------------------------------------------------
alter policy historias_select on public.historias_clinicas
  using ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2()));

alter policy historias_insert on public.historias_clinicas
  with check ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2()));

alter policy historias_update on public.historias_clinicas
  using ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2()))
  with check ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2()));

-- ---------------------------------------------------------------------
-- atenciones — exige medico/obstetra + aal2 (WITH CHECK conserva el
-- diseño original: solo valida propiedad, el USING ya filtra rol+aal)
-- ---------------------------------------------------------------------
alter policy atenciones_select on public.atenciones
  using ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2()));

alter policy atenciones_insert on public.atenciones
  with check ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2())
              and profesional_id = (select auth.uid()));

alter policy atenciones_update on public.atenciones
  using ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2())
         and profesional_id = (select auth.uid()) and estado = 'borrador')
  with check (profesional_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- adendas — exige medico/obstetra + aal2
-- ---------------------------------------------------------------------
alter policy adendas_select on public.adendas
  using ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2()));

alter policy adendas_insert on public.adendas
  with check ((select public.tiene_rol('medico','obstetra')) and (select public.requiere_aal2())
              and created_by = (select auth.uid())
              and exists (select 1 from public.atenciones a where a.id = atencion_id and a.estado = 'firmada'));

-- ---------------------------------------------------------------------
-- audit_log — exige admin + aal2 para leer
-- ---------------------------------------------------------------------
alter policy audit_select on public.audit_log
  using ((select public.tiene_rol('admin')) and (select public.requiere_aal2()));

-- Defensa en profundidad: ninguna fila de audit_log puede contener
-- contenido clínico real, sin importar qué trigger la haya insertado.
alter table public.audit_log add constraint audit_log_clinico_enmascarado check (
  tabla not in ('historias_clinicas','atenciones','adendas')
  or (
    datos_antes is null
    and (datos_despues is null or (datos_despues - 'campos_modificados') = '{}'::jsonb)
  )
);

-- ---------------------------------------------------------------------
-- registrar_acceso_historia — también exige aal2 (coherente con la
-- política SELECT que protege aquello de lo que esta función deja
-- constancia)
-- ---------------------------------------------------------------------
create or replace function public.registrar_acceso_historia(p_paciente_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (public.tiene_rol('medico','obstetra') and public.requiere_aal2()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  insert into public.audit_log (tabla, registro_id, accion, usuario_id)
  values ('historias_clinicas', p_paciente_id::text, 'READ', auth.uid());
end $$;

-- ---------------------------------------------------------------------
-- registrar_reset_mfa — deja constancia en auditoría cuando un admin
-- restablece el MFA de otro usuario (el borrado real del factor lo hace
-- el servidor con la clave secreta; aquí solo se audita con la sesión
-- del admin para capturar auth.uid() como actor).
-- ---------------------------------------------------------------------
create or replace function public.registrar_reset_mfa(p_usuario_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (public.tiene_rol('admin') and public.requiere_aal2()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_despues)
  values ('profiles', p_usuario_id::text, 'UPDATE', auth.uid(), jsonb_build_object('evento', 'mfa_reset'));
end $$;

revoke execute on function public.registrar_reset_mfa(uuid) from public, anon;
grant execute on function public.registrar_reset_mfa(uuid) to authenticated;
