# Guion de prueba de usabilidad (Design Thinking — Testeo)

Fase 8. Objetivo: medir KPI-12 (satisfacción) y detectar fricciones antes de la sustentación o
un piloto real. Se ejecuta con datos ficticios (ver `scripts/seed-demo.ts`), nunca con datos de
pacientes reales.

## Antes de empezar

- Participante: idealmente alguien del personal de GynFem (recepción o profesional de salud) que
  no haya visto la plataforma antes, o con exposición mínima.
- Rol de prueba: asigna la cuenta ficticia que corresponda al rol del participante (asistente,
  médico/obstetra o admin).
- Un observador toma el tiempo y anota errores; el participante piensa en voz alta.
- No corrijas ni ayudes salvo que el participante quede completamente bloqueado más de 2 minutos.

## Tareas (5)

Para cada tarea registra: tiempo (segundos), si se completó sin ayuda / con ayuda / no se
completó, y los errores u observaciones.

| # | Tarea | Rol | Tiempo (s) | Resultado | Errores / observaciones |
|---|---|---|---|---|---|
| 1 | Registrar una nueva paciente ficticia (con su documento y consentimiento) | Asistente | | | |
| 2 | Agendar una cita para esa paciente con un profesional, sin que choque con otra | Asistente | | | |
| 3 | Confirmar la cita y luego reprogramarla a otro horario | Asistente | | | |
| 4 | Iniciar la atención desde la cita, completar el motivo/diagnóstico y firmarla | Médico/Obstetra | | | |
| 5 | Generar los recordatorios del día y marcar uno como enviado | Asistente | | | |

Resultado: **Completada sin ayuda** / **Completada con ayuda** / **No completada**.

## Encuesta de satisfacción (KPI-12)

Aplicar al terminar las 5 tareas. Escala 1 (muy en desacuerdo) a 5 (muy de acuerdo).

1. La plataforma fue fácil de usar.
2. Encontré rápido lo que necesitaba en el menú.
3. Los mensajes de error (si aparecieron) me ayudaron a entender qué hacer.
4. Confío en que los datos quedan guardados correctamente.
5. Usaría esta plataforma en mi trabajo diario en vez del método actual (papel/Excel/Word).

Preguntas abiertas:
- ¿Qué fue lo más confuso o lento?
- ¿Qué cambiarías antes de usarla con pacientes reales?

## Reporte de la sesión

- Tiempo total por tarea (tabla de arriba) → promedio y comparación entre participantes.
- Tasa de finalización sin ayuda (KPI-05, proxy de tiempo administrativo).
- Lista de errores agrupados por pantalla/flujo, priorizados por severidad.
- Puntaje promedio de la encuesta (KPI-12).
