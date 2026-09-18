# ROADMAP de construcción — Plataforma GynFem

Cada fase = una rama + un PR + un deploy de preview en Vercel. En Claude Code ejecuta: `/fase N`.
Duración estimada total del MVP: 4 a 6 semanas a tiempo parcial.

> Relación con el plan estratégico: este MVP técnico construye P01–P07. El documento académico
> escalona la **adopción** en 3 años; técnicamente los módulos pueden estar listos antes y activarse
> por etapas en el consultorio. P08 (portal de pacientes) y P10 (IA) quedan fuera del MVP.

| Fase | Nombre | Proyectos | HU | Estimado |
|---|---|---|---|---|
| 0 | Preparación (tú, sin Claude Code) | — | — | 1 día |
| 1 | Esqueleto desplegado | P01 | — | 1 día |
| 2 | Base de datos, login y roles | P01, P09 | HU-01, 02, 19 | 3 días |
| 3 | Registro maestro de pacientes | P02 | HU-03, 04, 05 | 3 días |
| 4 | Agenda integrada | P03 | HU-06, 07, 08 | 4 días |
| 5 | Historia clínica y atenciones | P04 | HU-09 a 12 | 4 días |
| 6 | Seguimientos y recordatorios | P05, P06 | HU-13 a 16 | 3 días |
| 7 | Dashboard KPI y auditoría | P07, P09 | HU-17, 18 | 3 días |
| 8 | Endurecimiento, demo y testeo | P09 | HU-02 (MFA) | 3 días |

---

## Fase 0 — Preparación (tú)
Sigue `docs/SETUP.md` pasos 1 a 7. Al terminar debes tener: repo en GitHub con estos documentos,
app Next.js creada, proyecto Supabase `gynfem-dev` y cuenta de Vercel conectada a GitHub.

---

## Fase 1 — Esqueleto desplegado
**Objetivo:** una app vacía pero profesional, desplegada en Vercel, con CI en verde.

Tareas:
- Scripts en `package.json`: `typecheck` (`tsc --noEmit`), `test` (Vitest), `test:e2e` (Playwright).
- Configurar Vitest + Testing Library y Playwright (un test de humo cada uno).
- `shadcn init` y componentes base: button, input, label, form, card, table, dialog, sheet, select, badge, calendar, popover, dropdown-menu, tabs, textarea, sonner, skeleton, separator, avatar, sidebar, chart, command, checkbox, alert.
- Dependencias: zod, react-hook-form, @hookform/resolvers, date-fns, @date-fns/tz, @supabase/supabase-js, @supabase/ssr, server-only.
- Tema: variables CSS con la paleta de `docs/V0_PROMPTS.md`; fuente con `next/font`.
- Layout `(app)` con sidebar (items fijos por ahora) y página `/login` estática.
- `src/lib/fechas.ts` con helpers de zona `America/Lima` + tests.
- CI (`.github/workflows/ci.yml` ya existe; el job `database` puede fallar hasta la Fase 2: márcalo como `continue-on-error: true` temporalmente).

Checklist:
- [ ] `npm run build` pasa localmente
- [ ] PR abierto y CI (job app) en verde
- [ ] Preview de Vercel muestra login y layout

---

## Fase 2 — Base de datos, login y roles
**Objetivo:** usuarios reales (ficticios) con roles y seguridad activa en BD.

Tareas:
- `npx supabase init` (genera `supabase/config.toml`); conservar la migración y tests existentes.
- Clientes: `lib/supabase/{client,server,middleware,admin}.ts` según la guía oficial de `@supabase/ssr` vigente.
- `middleware.ts`/`proxy.ts`: refresco de sesión y redirección a `/login` si no hay usuario en rutas `(app)`.
- Login email/contraseña con Server Action; logout; pantalla `/cuenta-inactiva`.
- `lib/auth/roles.ts`: tipo `Rol`, `requireRol()`, mapa de menú por rol (tests unitarios).
- Sidebar filtrado por rol.
- `/admin/usuarios`: listar, crear (Auth Admin API con `app_metadata.rol` y contraseña temporal), cambiar rol, activar/desactivar.
- `/admin/servicios`: CRUD sin borrado (HU-19).
- Tests pgTAP: ampliar `supabase/tests` para cubrir **cada fila** de la matriz de `DATABASE.md`.
- Quitar `continue-on-error` del job `database`.

🔑 Aquí necesitas: URL y claves de Supabase en `.env.local` y en Vercel (ver SETUP paso 8).

Checklist:
- [ ] 5 usuarios ficticios, uno por rol, pueden entrar
- [ ] Asistente no ve "Historia clínica" en el menú y la URL directa no muestra datos
- [ ] Usuario desactivado ve `/cuenta-inactiva`
- [ ] Tests pgTAP y CI en verde

---

## Fase 3 — Registro maestro de pacientes
**Objetivo:** ficha única por paciente.

Tareas:
- `features/pacientes/schemas.ts` (Zod): DNI 8 dígitos, CE/pasaporte, teléfono peruano (9 dígitos, empieza en 9), email opcional, consentimiento obligatorio.
- Listado con búsqueda (documento, nombre, teléfono), paginación en servidor y estado vacío.
- Formulario de registro/edición; error `23505` → mensaje con enlace a la ficha existente.
- Texto de aviso de privacidad (placeholder marcado "VALIDAR CON ASESORÍA LEGAL") junto al checkbox de consentimiento.
- Ficha `/pacientes/[id]` con tabs: Datos · Citas · Historia clínica (solo medico/obstetra) · Seguimientos.
- Admin: marcar como eliminada (duplicado) con confirmación.

Checklist:
- [ ] No se puede registrar dos veces el mismo DNI
- [ ] Búsqueda funciona por las 3 vías
- [ ] Edición aparece en auditoría (ver con admin en SQL o en Fase 7)

---

## Fase 4 — Agenda integrada
**Objetivo:** una sola agenda sin cruces.

Tareas:
- Vista día y semana por profesional (selector), colores + texto por estado, navegación por fechas.
- Diálogo "Nueva cita": buscar paciente (command), servicio → calcula fin, profesional, fecha/hora.
- Error `23P01` → "El profesional ya tiene una cita en ese horario".
- Acciones: confirmar, reprogramar (nueva cita con `cita_origen_id`; la anterior → `reprogramada` con motivo), cancelar, no asistió.
- Vista "Hoy" para asistente con lista cronológica.
- Tests unitarios: cálculo de fin, transiciones de estado permitidas.

Checklist:
- [ ] Dos citas cruzadas para el mismo profesional son rechazadas
- [ ] Reprogramación conserva el historial
- [ ] Usable en tablet

---

## Fase 5 — Historia clínica y atenciones
**Objetivo:** historia longitudinal con integridad.

Tareas:
- Tab "Historia clínica": al abrir, `rpc('registrar_acceso_historia')`; antecedentes editables (medico/obstetra).
- Línea de tiempo de atenciones con sus adendas.
- "Iniciar atención" desde la cita: precarga paciente y servicio; guardado en borrador.
- "Firmar": diálogo de confirmación → estado `firmada`; si el update afecta 0 filas, mostrar error.
- Adendas sobre atenciones firmadas.
- Al firmar, ofrecer crear seguimiento (se implementa en Fase 6; dejar el punto de extensión).
- (Opcional) Storage: migración nueva con bucket privado `documentos-clinicos`, tabla `documentos` y políticas solo medico/obstetra; descargas con URL firmada de 60 s.

Checklist:
- [ ] Asistente no puede ver ni por URL una atención
- [ ] Una atención firmada no se puede editar
- [ ] Cada apertura de historia genera un `READ` en auditoría

---

## Fase 6 — Seguimientos y recordatorios
**Objetivo:** continuidad de la atención.

Tareas:
- Crear seguimiento desde la atención (tipo, descripción administrativa, fecha objetivo, responsable).
- Bandeja `/seguimientos`: vencidos · hoy · próximos 7 días; cambio de estado con nota.
- `/recordatorios` (asistente/admin): lista de pendientes de hoy; botón "Abrir WhatsApp" con `https://wa.me/51XXXXXXXXX?text=<mensaje codificado>`; marcar enviado o fallido (con motivo); botón "Generar ahora" que llama `rpc('generar_recordatorios_citas')`.
- Helpers con tests: normalizar teléfono peruano a formato internacional; construir URL de WhatsApp; verificar que el mensaje no contiene nombre del servicio.
- Programar pg_cron (ver comentario al final de la migración) — acción manual en Supabase.

🔑 Aquí: habilitar la extensión `pg_cron` en Supabase (Database → Extensions) y ejecutar el `cron.schedule`.

Checklist:
- [ ] Al día siguiente de programar, aparecen recordatorios generados automáticamente
- [ ] El mensaje no incluye información clínica
- [ ] Seguimientos vencidos se destacan

---

## Fase 7 — Dashboard KPI y auditoría
**Objetivo:** gestión basada en datos.

Tareas:
- `/dashboard` (admin, medico, obstetra): selector de rango (hoy, 7 días, mes, personalizado), tarjetas KPI y gráficos (`chart` de shadcn): citas por día (línea), atenciones por servicio (barras).
- Todo desde `rpc('kpi_resumen')`. Estados de carga (skeleton) y vacío.
- `/admin/auditoria`: tabla filtrable por usuario, tabla, acción y fechas; paginación; detalle en `sheet`.
- Migración: vista o función de posibles duplicados (mismo nombre + fecha de nacimiento) para KPI-07, solo admin.

Checklist:
- [ ] Los números del dashboard coinciden con conteos manuales de datos demo
- [ ] Ningún gráfico muestra nombres de pacientes

---

## Fase 8 — Endurecimiento, demo y testeo
**Objetivo:** listo para presentar y para evaluar un piloto.

Tareas:
- MFA TOTP (Supabase Auth MFA): enrolamiento en perfil; exigir `aal2` para admin, medico y obstetra.
- Cabeceras de seguridad en `next.config` (CSP básica, `X-Frame-Options`, `Referrer-Policy`).
- Revisar Security Advisor y Performance Advisor de Supabase y corregir hallazgos.
- Script `scripts/seed-demo.ts` con datos **ficticios** (30 pacientes, 2 semanas de citas, atenciones y seguimientos) usando la clave secreta, solo contra `gynfem-dev`.
- Tests E2E (Playwright) de los 3 flujos críticos: registrar paciente → agendar → atender y firmar.
- Guion de prueba de usabilidad (Design Thinking – Testeo): 5 tareas, tiempo por tarea, errores y encuesta de satisfacción (KPI-12).
- README con capturas y enlace de demo.

Checklist:
- [ ] MFA activo para roles clínicos y admin
- [ ] Security Advisor sin alertas críticas
- [ ] Demo con datos ficticios lista para la sustentación

---

## Después del MVP (Años 2–3 del plan)
- Canal `whatsapp_api` (WhatsApp Cloud API + Edge Function) reutilizando la tabla `recordatorios`.
- Portal de pacientes (P08) con autenticación propia y acceso limitado a citas e indicaciones.
- Analítica avanzada / IA de bajo riesgo (P10) con supervisión humana.
- Paso a producción: Supabase Pro + Vercel Pro, validación legal (Ley 29733 / 30024), migración controlada de historias activas.
