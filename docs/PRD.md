# PRD — Plataforma GynFem · Seguimiento Ginecológico Inteligente

## 1. Contexto
GynFem opera con historias clínicas en papel, documentos en Word, controles en Excel y agendamiento,
confirmación y seguimiento manuales. No existe una plataforma que relacione a la paciente con sus citas,
antecedentes, atenciones, controles y recordatorios. Volumen estimado: 20 atenciones/día, 6 días/semana
(≈520/mes, ≈6,240/año).

## 2. Objetivo del producto
Centralizar la operación clínica y administrativa en una sola aplicación web para mejorar la continuidad
de atención, reducir procesos manuales y permitir una gestión basada en datos, protegiendo la información
sensible de las pacientes.

## 3. Alcance del MVP

| Incluido (MVP) | Proyecto del plan |
|---|---|
| Usuarios, roles, auditoría, catálogo de servicios | P01, P09 |
| Registro maestro de pacientes con control de duplicidad y consentimiento | P02 |
| Agenda integrada por profesional con estados | P03 |
| Historia clínica digital (antecedentes + atenciones + adendas) | P04 |
| Recordatorios (generación automática diaria, envío asistido por WhatsApp) | P05 |
| Seguimientos personalizados | P06 |
| Dashboard de KPI | P07 |

**Fuera del MVP:** portal de pacientes (P08), IA/analítica predictiva (P10), envío automático por
WhatsApp Cloud API, facturación/caja/SUNAT, telesalud, integración RENHICE, firma digital certificada,
migración masiva de historias en papel (solo historias activas, de forma controlada).

## 4. Roles

| Rol | Quién | Ve datos clínicos | Resumen |
|---|---|---|---|
| `admin` | Administración / responsable del sistema | No (solo agregados KPI) | Usuarios, servicios, auditoría, pacientes, agenda |
| `medico` | Ginecólogos/as y dirección médica | Sí | Historia clínica, atenciones, seguimientos, agenda |
| `obstetra` | Obstetras | Sí | Igual que médico |
| `asistente` | Recepción | No | Pacientes (datos maestros), agenda, recordatorios, seguimientos (estado) |
| `soporte` | Técnico de informática | No | Sin acceso a datos de pacientes; opera la infraestructura |

El detalle exacto de permisos está en `docs/DATABASE.md` (matriz RLS).

## 5. Historias de usuario

### Módulo Acceso y administración (P01, P09)
**HU-01** Como administrador, quiero crear usuarios y asignarles un rol para limitar el acceso según responsabilidad. *(KPI-10)*
- El registro público está deshabilitado; solo admin crea usuarios.
- Admin puede cambiar rol y activar/desactivar. Un usuario inactivo no accede a ningún dato.
- Todo cambio de rol queda en auditoría.

**HU-02** Como usuario interno, quiero iniciar sesión con correo y contraseña para acceder solo a lo que me corresponde.
- Redirección al inicio según rol; menú lateral muestra solo módulos permitidos.
- Usuario inactivo ve la pantalla "Cuenta pendiente de activación".
- (Fase 8) MFA obligatorio para `admin`, `medico` y `obstetra`.

**HU-19** Como administrador, quiero gestionar el catálogo de servicios (nombre, categoría, duración, precio referencial, activo) para sostener el crecimiento del portafolio. *(OE6)*

### Módulo Pacientes (P02)
**HU-03** Como asistente, quiero registrar una paciente con su documento para tener una ficha única. *(KPI-06, KPI-07)*
- DNI de 8 dígitos; CE y pasaporte alfanuméricos.
- Si el documento ya existe: bloquear y mostrar enlace a la ficha existente.
- Consentimiento de tratamiento de datos obligatorio (se guarda fecha). Aceptación de recordatorios y canal preferido: opcionales.

**HU-04** Como asistente, quiero buscar pacientes por documento, nombre o teléfono para encontrarlas en segundos.
- Búsqueda paginada en servidor; respuesta < 1 s con 10,000 registros.

**HU-05** Como asistente, quiero actualizar datos de contacto; los cambios quedan auditados.

### Módulo Agenda (P03)
**HU-06** Como asistente, quiero registrar citas en una sola agenda para evitar duplicidad y errores. *(KPI-01)*
- Campos: paciente, servicio, profesional, fecha y hora; la hora de fin se calcula con la duración del servicio.
- No se permiten cruces de horario para el mismo profesional (restricción en BD).

**HU-07** Como asistente o profesional, quiero ver la agenda diaria y semanal por profesional con estados diferenciados (color + texto).

**HU-08** Como asistente, quiero confirmar, reprogramar, cancelar o marcar inasistencia. *(KPI-02)*
- Reprogramar crea una cita nueva enlazada (`cita_origen_id`) y la anterior pasa a `reprogramada`, con motivo.

### Módulo Historia clínica (P04)
**HU-09** Como médico, quiero acceder al historial autorizado de la paciente para contar con continuidad de información. *(KPI-11)*
- Vista longitudinal: antecedentes gineco-obstétricos + atenciones ordenadas por fecha + adendas.
- Cada apertura registra un acceso (`READ`) en auditoría.

**HU-10** Como médico u obstetra, quiero registrar la atención desde la cita (precarga paciente y servicio).
- Se guarda como borrador; al firmar queda inmutable y la cita pasa a `atendida`.

**HU-11** Como médico, quiero agregar una adenda a una atención firmada para corregir o complementar sin alterar el original.

**HU-12** Como asistente, no debo poder ver contenido clínico (verificado con test RLS).

### Módulo Seguimiento (P06)
**HU-13** Como obstetra, quiero registrar seguimientos pendientes (control, resultado pendiente, procedimiento) con fecha objetivo y responsable. *(KPI-08)*
- La descripción es administrativa (p. ej. "Control en 4 semanas"); el detalle clínico queda en la atención.

**HU-14** Como profesional o asistente, quiero una bandeja de seguimientos: vencidos, de hoy y próximos 7 días, y cambiar su estado.

### Módulo Recordatorios (P05)
**HU-15** Como paciente, quiero recibir un recordatorio antes de mi cita para no olvidarla. *(KPI-03)*
- Cada día a las 08:00 (Lima) se generan recordatorios para las citas del día siguiente de pacientes que aceptaron.
- Panel "Recordatorios de hoy": botón que abre WhatsApp con el mensaje prellenado; la asistente marca enviado/fallido.

**HU-16** El mensaje no contiene información clínica: solo nombre, fecha, hora y sede.

### Módulo Dashboard y auditoría (P07, P09)
**HU-17** Como dirección, quiero visualizar indicadores de atención para decidir con datos. *(KPI-01 a KPI-09)*
- Filtro por rango de fechas. Tarjetas: citas, atendidas, tasa de inasistencia, pacientes nuevos, atenciones firmadas, seguimientos vencidos, cobertura de recordatorios.
- Gráficos: citas por día (línea) y atenciones por servicio (barras).
- Solo datos agregados (sin identificar pacientes).

**HU-18** Como administrador, quiero consultar la auditoría filtrando por usuario, tabla, acción y fecha. *(KPI-11)*

## 6. Requisitos no funcionales
- Disponibilidad mensual ≥ 95 % (KPI-09).
- Carga de pantallas principales < 2 s en conexión 4G.
- Responsive: PC/tablet (recepción) y móvil (profesionales).
- Español (Perú), zona horaria America/Lima.
- Accesibilidad WCAG 2.1 AA en formularios y agenda.
- Cumplimiento: consentimiento, mínimo privilegio, auditoría, cifrado en tránsito y reposo (provisto por Supabase/Vercel), inventario de datos y aviso de privacidad antes de operar con datos reales.

## 7. Trazabilidad con el plan estratégico

| KPI | Cómo lo mide la plataforma |
|---|---|
| KPI-01 Citas digitales | Citas registradas en `citas` / total (el total manual se registra aparte en la línea base) |
| KPI-02 Inasistencia | `kpi_resumen.tasa_inasistencia_pct` |
| KPI-03 Recordatorios | `kpi_resumen.cobertura_recordatorios_pct` |
| KPI-04 Historias digitalizadas | Pacientes activas con `historias_clinicas` / pacientes activas |
| KPI-05 Tiempo administrativo | Medición manual antes/después (cronometraje en piloto) |
| KPI-06 Completitud | Campos obligatorios completos (validación Zod + consulta) |
| KPI-07 Duplicidad | Índice único por documento + reporte de posibles duplicados por nombre |
| KPI-08 Seguimientos | `seguimientos` registrados / atenciones que requieren control |
| KPI-09 Disponibilidad | Monitoreo externo (UptimeRobot o similar) |
| KPI-10 Roles | 100 % por diseño (`profiles.rol` NOT NULL) |
| KPI-11 Auditoría | Triggers + registro de lectura de historia clínica |
| KPI-12 Satisfacción | Encuesta en pruebas de usabilidad (Fase 8) |
