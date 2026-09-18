-- =====================================================================
-- Plataforma GynFem — Migración inicial
-- Esquema, RLS por rol, auditoría, inmutabilidad clínica y funciones KPI
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.app_rol as enum ('admin','medico','obstetra','asistente','soporte');
create type public.tipo_documento as enum ('DNI','CE','PASAPORTE');
create type public.estado_cita as enum ('programada','confirmada','atendida','no_asistio','cancelada','reprogramada');
create type public.estado_atencion as enum ('borrador','firmada');
create type public.tipo_seguimiento as enum ('control','resultado_pendiente','procedimiento','otro');
create type public.estado_seguimiento as enum ('pendiente','contactada','completado','cancelado');
create type public.canal_recordatorio as enum ('whatsapp_manual','whatsapp_api','email','sms');
create type public.estado_recordatorio as enum ('pendiente','enviado','fallido','cancelado');

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.fn_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  rol             public.app_rol not null default 'asistente',
  activo          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ¿El usuario actual está activo y tiene alguno de estos roles?
create or replace function public.tiene_rol(variadic roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.rol::text = any(roles) from public.profiles p where p.id = auth.uid() and p.activo),
    false)
$$;

-- Crea el perfil al crear el usuario. El rol viene de app_metadata (solo editable con clave secreta).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nombre_completo, rol, activo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email, 'Sin nombre'),
    coalesce((new.raw_app_meta_data->>'rol')::public.app_rol, 'asistente'),
    coalesce(new.raw_app_meta_data ? 'rol', false)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Catálogo de servicios
-- ---------------------------------------------------------------------
create table public.servicios (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null unique,
  categoria          text not null,
  duracion_min       smallint not null default 30 check (duracion_min between 5 and 480),
  precio_referencial numeric(10,2) check (precio_referencial >= 0),
  activo             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Registro maestro de pacientes
-- ---------------------------------------------------------------------
create table public.pacientes (
  id                   uuid primary key default gen_random_uuid(),
  tipo_documento       public.tipo_documento not null default 'DNI',
  numero_documento     text not null,
  nombres              text not null check (length(trim(nombres)) > 0),
  apellidos            text not null check (length(trim(apellidos)) > 0),
  fecha_nacimiento     date check (fecha_nacimiento <= current_date),
  telefono             text,
  email                text,
  direccion            text,
  distrito             text,
  canal_preferido      public.canal_recordatorio not null default 'whatsapp_manual',
  acepta_recordatorios boolean not null default false,
  consentimiento_datos boolean not null default false,
  consentimiento_fecha timestamptz,
  created_by           uuid default auth.uid() references public.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  constraint pacientes_dni_formato check (tipo_documento <> 'DNI' or numero_documento ~ '^[0-9]{8}$'),
  constraint pacientes_consentimiento check (consentimiento_datos and consentimiento_fecha is not null)
);

create unique index pacientes_documento_unico
  on public.pacientes (tipo_documento, numero_documento) where deleted_at is null;
create index pacientes_apellidos_nombres on public.pacientes (apellidos, nombres);
create index pacientes_telefono on public.pacientes (telefono);

-- ---------------------------------------------------------------------
-- Historia clínica (antecedentes; 1 por paciente)  — CLÍNICO
-- ---------------------------------------------------------------------
create table public.historias_clinicas (
  id                       uuid primary key default gen_random_uuid(),
  paciente_id              uuid not null unique references public.pacientes(id),
  grupo_sanguineo          text,
  alergias                 text,
  menarquia_edad           smallint check (menarquia_edad between 5 and 25),
  gestas                   smallint check (gestas >= 0),
  partos                   smallint check (partos >= 0),
  abortos                  smallint check (abortos >= 0),
  cesareas                 smallint check (cesareas >= 0),
  fecha_ultima_regla       date,
  metodo_anticonceptivo    text,
  antecedentes_personales  text,
  antecedentes_quirurgicos text,
  antecedentes_familiares  text,
  created_by               uuid default auth.uid() references public.profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Agenda
-- ---------------------------------------------------------------------
create table public.citas (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references public.pacientes(id),
  profesional_id uuid not null references public.profiles(id),
  servicio_id    uuid not null references public.servicios(id),
  inicio         timestamptz not null,
  fin            timestamptz not null,
  estado         public.estado_cita not null default 'programada',
  cita_origen_id uuid references public.citas(id),
  motivo_cambio  text,
  notas_admin    text,
  confirmada_at  timestamptz,
  created_by     uuid default auth.uid() references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint citas_rango_valido check (fin > inicio),
  constraint citas_sin_cruce exclude using gist (
    profesional_id with =,
    tstzrange(inicio, fin, '[)') with &&
  ) where (estado in ('programada','confirmada'))
);

create index citas_inicio on public.citas (inicio);
create index citas_paciente on public.citas (paciente_id, inicio desc);

-- ---------------------------------------------------------------------
-- Atenciones (episodios asistenciales) — CLÍNICO
-- ---------------------------------------------------------------------
create table public.atenciones (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references public.pacientes(id),
  cita_id          uuid unique references public.citas(id),
  profesional_id   uuid not null default auth.uid() references public.profiles(id),
  servicio_id      uuid references public.servicios(id),
  fecha            timestamptz not null default now(),
  motivo_consulta  text not null check (length(trim(motivo_consulta)) > 0),
  anamnesis        text,
  examen_fisico    text,
  diagnostico      text,
  cie10            text[] not null default '{}',
  plan_tratamiento text,
  indicaciones     text,
  estado           public.estado_atencion not null default 'borrador',
  firmada_at       timestamptz,
  firmada_por      uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index atenciones_paciente on public.atenciones (paciente_id, fecha desc);

create table public.adendas (
  id          uuid primary key default gen_random_uuid(),
  atencion_id uuid not null references public.atenciones(id),
  contenido   text not null check (length(trim(contenido)) > 0),
  created_by  uuid not null default auth.uid() references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index adendas_atencion on public.adendas (atencion_id);

-- Inmutabilidad de atenciones firmadas
create or replace function public.fn_proteger_atencion()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.estado = 'firmada' then
    raise exception 'La atención está firmada y no puede modificarse. Registre una adenda.'
      using errcode = 'P0001';
  end if;
  if new.estado = 'firmada' then
    new.firmada_at  := now();
    new.firmada_por := auth.uid();
  end if;
  return new;
end $$;

-- Al firmar, la cita vinculada pasa a 'atendida'
create or replace function public.fn_cita_atendida()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'firmada' and old.estado = 'borrador' and new.cita_id is not null then
    update public.citas set estado = 'atendida' where id = new.cita_id;
  end if;
  return null;
end $$;

-- ---------------------------------------------------------------------
-- Seguimientos
-- ---------------------------------------------------------------------
create table public.seguimientos (
  id             uuid primary key default gen_random_uuid(),
  paciente_id    uuid not null references public.pacientes(id),
  atencion_id    uuid references public.atenciones(id),
  tipo           public.tipo_seguimiento not null,
  descripcion    text not null check (length(trim(descripcion)) > 0), -- administrativa, sin detalle clínico
  fecha_objetivo date not null,
  responsable_id uuid references public.profiles(id),
  estado         public.estado_seguimiento not null default 'pendiente',
  notas          text,
  completado_at  timestamptz,
  created_by     uuid default auth.uid() references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index seguimientos_bandeja on public.seguimientos (estado, fecha_objetivo);

-- ---------------------------------------------------------------------
-- Recordatorios
-- ---------------------------------------------------------------------
create table public.recordatorios (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid not null references public.pacientes(id),
  cita_id         uuid references public.citas(id),
  seguimiento_id  uuid references public.seguimientos(id),
  canal           public.canal_recordatorio not null,
  programado_para timestamptz not null,
  mensaje         text not null,  -- sin información clínica
  estado          public.estado_recordatorio not null default 'pendiente',
  enviado_at      timestamptz,
  error           text,
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint recordatorios_origen check (cita_id is not null or seguimiento_id is not null)
);

create index recordatorios_cola on public.recordatorios (estado, programado_para);
create index recordatorios_cita on public.recordatorios (cita_id);

-- ---------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------
create table public.audit_log (
  id            bigint generated always as identity primary key,
  tabla         text not null,
  registro_id   text,
  accion        text not null check (accion in ('INSERT','UPDATE','SOFT_DELETE','DELETE','READ')),
  usuario_id    uuid,
  datos_antes   jsonb,
  datos_despues jsonb,
  created_at    timestamptz not null default now()
);

create index audit_log_fecha on public.audit_log (created_at desc);
create index audit_log_usuario on public.audit_log (usuario_id, created_at desc);
create index audit_log_tabla on public.audit_log (tabla, created_at desc);

-- Trigger genérico. Argumento 'solo_campos' => guarda solo nombres de campos modificados (tablas clínicas).
create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old    jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  v_new    jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  v_accion text  := tg_op;
  v_id     text;
  v_campos jsonb;
begin
  v_id := coalesce(v_new->>'id', v_old->>'id');

  if tg_op = 'UPDATE' and (v_old->>'deleted_at') is null and (v_new->>'deleted_at') is not null then
    v_accion := 'SOFT_DELETE';
  end if;

  if tg_nargs > 0 and tg_argv[0] = 'solo_campos' then
    select coalesce(jsonb_agg(n.key), '[]'::jsonb) into v_campos
    from jsonb_each(coalesce(v_new, '{}'::jsonb)) n
    where v_old is null or n.value is distinct from (v_old -> n.key);
    v_old := null;
    v_new := jsonb_build_object('campos_modificados', v_campos);
  end if;

  insert into public.audit_log (tabla, registro_id, accion, usuario_id, datos_antes, datos_despues)
  values (tg_table_name, v_id, v_accion, auth.uid(), v_old, v_new);
  return null;
end $$;

-- Registro explícito de lectura de historia clínica
create or replace function public.registrar_acceso_historia(p_paciente_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.tiene_rol('medico','obstetra') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  insert into public.audit_log (tabla, registro_id, accion, usuario_id)
  values ('historias_clinicas', p_paciente_id::text, 'READ', auth.uid());
end $$;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
create trigger trg_updated_at before update on public.profiles           for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.servicios          for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.pacientes          for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.historias_clinicas for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.citas              for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.atenciones         for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.seguimientos       for each row execute function public.fn_set_updated_at();
create trigger trg_updated_at before update on public.recordatorios      for each row execute function public.fn_set_updated_at();

create trigger trg_proteger_atencion before update on public.atenciones
  for each row execute function public.fn_proteger_atencion();
create trigger trg_cita_atendida after update on public.atenciones
  for each row execute function public.fn_cita_atendida();

-- Auditoría completa (administrativo)
create trigger trg_auditoria after insert or update on public.profiles     for each row execute function public.fn_auditoria();
create trigger trg_auditoria after insert or update on public.servicios    for each row execute function public.fn_auditoria();
create trigger trg_auditoria after insert or update on public.pacientes    for each row execute function public.fn_auditoria();
create trigger trg_auditoria after insert or update on public.citas        for each row execute function public.fn_auditoria();
create trigger trg_auditoria after insert or update on public.seguimientos for each row execute function public.fn_auditoria();
-- Auditoría sin valores (clínico)
create trigger trg_auditoria after insert or update on public.historias_clinicas for each row execute function public.fn_auditoria('solo_campos');
create trigger trg_auditoria after insert or update on public.atenciones         for each row execute function public.fn_auditoria('solo_campos');
create trigger trg_auditoria after insert on public.adendas                      for each row execute function public.fn_auditoria('solo_campos');

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.servicios          enable row level security;
alter table public.pacientes          enable row level security;
alter table public.historias_clinicas enable row level security;
alter table public.citas              enable row level security;
alter table public.atenciones         enable row level security;
alter table public.adendas            enable row level security;
alter table public.seguimientos       enable row level security;
alter table public.recordatorios      enable row level security;
alter table public.audit_log          enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.tiene_rol('admin','medico','obstetra','asistente','soporte')));
create policy profiles_update on public.profiles for update to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- servicios
create policy servicios_select on public.servicios for select to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente','soporte')));
create policy servicios_insert on public.servicios for insert to authenticated
  with check ((select public.tiene_rol('admin')));
create policy servicios_update on public.servicios for update to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- pacientes (datos maestros; no clínicos)
create policy pacientes_select on public.pacientes for select to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente'))
         and (deleted_at is null or (select public.tiene_rol('admin'))));
create policy pacientes_insert on public.pacientes for insert to authenticated
  with check ((select public.tiene_rol('admin','medico','obstetra','asistente')) and deleted_at is null);
create policy pacientes_update on public.pacientes for update to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente'))
         and (deleted_at is null or (select public.tiene_rol('admin'))))
  with check ((select public.tiene_rol('admin','medico','obstetra','asistente'))
         and (deleted_at is null or (select public.tiene_rol('admin'))));

-- historias_clinicas (clínico)
create policy historias_select on public.historias_clinicas for select to authenticated
  using ((select public.tiene_rol('medico','obstetra')));
create policy historias_insert on public.historias_clinicas for insert to authenticated
  with check ((select public.tiene_rol('medico','obstetra')));
create policy historias_update on public.historias_clinicas for update to authenticated
  using ((select public.tiene_rol('medico','obstetra'))) with check ((select public.tiene_rol('medico','obstetra')));

-- citas
create policy citas_select on public.citas for select to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente')));
create policy citas_insert on public.citas for insert to authenticated
  with check ((select public.tiene_rol('admin','medico','obstetra','asistente')));
create policy citas_update on public.citas for update to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente')))
  with check ((select public.tiene_rol('admin','medico','obstetra','asistente')));

-- atenciones (clínico; solo el profesional autor edita su borrador)
create policy atenciones_select on public.atenciones for select to authenticated
  using ((select public.tiene_rol('medico','obstetra')));
create policy atenciones_insert on public.atenciones for insert to authenticated
  with check ((select public.tiene_rol('medico','obstetra')) and profesional_id = (select auth.uid()));
create policy atenciones_update on public.atenciones for update to authenticated
  using ((select public.tiene_rol('medico','obstetra')) and profesional_id = (select auth.uid()) and estado = 'borrador')
  with check (profesional_id = (select auth.uid()));

-- adendas (clínico; solo sobre atenciones firmadas)
create policy adendas_select on public.adendas for select to authenticated
  using ((select public.tiene_rol('medico','obstetra')));
create policy adendas_insert on public.adendas for insert to authenticated
  with check ((select public.tiene_rol('medico','obstetra'))
              and created_by = (select auth.uid())
              and exists (select 1 from public.atenciones a where a.id = atencion_id and a.estado = 'firmada'));

-- seguimientos
create policy seguimientos_select on public.seguimientos for select to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente')));
create policy seguimientos_insert on public.seguimientos for insert to authenticated
  with check ((select public.tiene_rol('medico','obstetra')));
create policy seguimientos_update on public.seguimientos for update to authenticated
  using ((select public.tiene_rol('medico','obstetra','asistente')))
  with check ((select public.tiene_rol('medico','obstetra','asistente')));

-- recordatorios
create policy recordatorios_select on public.recordatorios for select to authenticated
  using ((select public.tiene_rol('admin','medico','obstetra','asistente')));
create policy recordatorios_insert on public.recordatorios for insert to authenticated
  with check ((select public.tiene_rol('admin','asistente')));
create policy recordatorios_update on public.recordatorios for update to authenticated
  using ((select public.tiene_rol('admin','asistente'))) with check ((select public.tiene_rol('admin','asistente')));

-- audit_log (solo lectura para admin; escritura solo por triggers/funciones)
create policy audit_select on public.audit_log for select to authenticated
  using ((select public.tiene_rol('admin')));

-- ---------------------------------------------------------------------
-- Funciones de negocio
-- ---------------------------------------------------------------------

-- KPI agregados (sin datos identificables). Bypassa RLS a propósito: solo devuelve conteos.
create or replace function public.kpi_resumen(p_desde date, p_hasta date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if not public.tiene_rol('admin','medico','obstetra') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  with c as (
    select ci.id, ci.estado, ci.inicio, p.acepta_recordatorios
    from public.citas ci
    join public.pacientes p on p.id = ci.paciente_id
    where (ci.inicio at time zone 'America/Lima')::date between p_desde and p_hasta
  )
  select jsonb_build_object(
    'citas_total',      count(*) filter (where estado not in ('cancelada','reprogramada')),
    'citas_atendidas',  count(*) filter (where estado = 'atendida'),
    'citas_no_asistio', count(*) filter (where estado = 'no_asistio'),
    'tasa_inasistencia_pct', round(100.0 * count(*) filter (where estado = 'no_asistio')
        / nullif(count(*) filter (where estado in ('atendida','no_asistio')), 0), 1),
    'cobertura_recordatorios_pct', round(100.0 * count(*) filter (
          where acepta_recordatorios and estado not in ('cancelada','reprogramada')
            and exists (select 1 from public.recordatorios r where r.cita_id = c.id and r.estado = 'enviado'))
        / nullif(count(*) filter (where acepta_recordatorios and estado not in ('cancelada','reprogramada')), 0), 1)
  ) into v
  from c;

  v := v || jsonb_build_object(
    'pacientes_nuevos', (
      select count(*) from public.pacientes p
      where p.deleted_at is null
        and (p.created_at at time zone 'America/Lima')::date between p_desde and p_hasta),
    'atenciones_firmadas', (
      select count(*) from public.atenciones a
      where a.estado = 'firmada'
        and (a.fecha at time zone 'America/Lima')::date between p_desde and p_hasta),
    'seguimientos_vencidos', (
      select count(*) from public.seguimientos s
      where s.estado in ('pendiente','contactada')
        and s.fecha_objetivo < (now() at time zone 'America/Lima')::date),
    'citas_por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', d.dia, 'total', d.total) order by d.dia)
      from (
        select (ci.inicio at time zone 'America/Lima')::date as dia, count(*) as total
        from public.citas ci
        where (ci.inicio at time zone 'America/Lima')::date between p_desde and p_hasta
          and ci.estado not in ('cancelada','reprogramada')
        group by 1
      ) d), '[]'::jsonb),
    'atenciones_por_servicio', coalesce((
      select jsonb_agg(jsonb_build_object('servicio', x.nombre, 'total', x.total) order by x.total desc)
      from (
        select sv.nombre, count(*) as total
        from public.atenciones a
        join public.servicios sv on sv.id = a.servicio_id
        where a.estado = 'firmada'
          and (a.fecha at time zone 'America/Lima')::date between p_desde and p_hasta
        group by sv.nombre
      ) x), '[]'::jsonb)
  );

  return v;
end $$;

-- Genera recordatorios para las citas de mañana (pg_cron diario o botón admin/asistente).
create or replace function public.generar_recordatorios_citas()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  if auth.uid() is not null and not public.tiene_rol('admin','asistente') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  insert into public.recordatorios (paciente_id, cita_id, canal, programado_para, mensaje)
  select c.paciente_id, c.id, p.canal_preferido, now(),
         format('Hola %s, le recordamos su cita en GynFem el %s a las %s. Por favor, confirme su asistencia respondiendo este mensaje.',
                split_part(p.nombres, ' ', 1),
                to_char(c.inicio at time zone 'America/Lima', 'DD/MM/YYYY'),
                to_char(c.inicio at time zone 'America/Lima', 'HH24:MI'))
  from public.citas c
  join public.pacientes p on p.id = c.paciente_id
  where c.estado in ('programada','confirmada')
    and p.deleted_at is null
    and p.acepta_recordatorios
    and (c.inicio at time zone 'America/Lima')::date = (now() at time zone 'America/Lima')::date + 1
    and not exists (
      select 1 from public.recordatorios r
      where r.cita_id = c.id and r.estado <> 'cancelado');

  get diagnostics n = row_count;
  return n;
end $$;

-- Programación diaria (ejecutar en Fase 6 tras habilitar pg_cron en Database > Extensions):
-- select cron.schedule('recordatorios-diarios', '0 13 * * *', $cron$select public.generar_recordatorios_citas()$cron$); -- 08:00 Lima

-- ---------------------------------------------------------------------
-- Privilegios: sin acceso anónimo, sin DELETE físico
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke delete, truncate on all tables in schema public from authenticated;
revoke insert, update on public.audit_log from authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.tiene_rol(text[])                to authenticated;
grant execute on function public.registrar_acceso_historia(uuid)  to authenticated;
grant execute on function public.kpi_resumen(date, date)          to authenticated;
grant execute on function public.generar_recordatorios_citas()    to authenticated;
