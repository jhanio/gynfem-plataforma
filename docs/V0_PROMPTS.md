# Prompts para v0 (etapa Prototipo de Design Thinking)

**Regla:** v0 genera pantallas con datos de ejemplo. No conecta Supabase ni define lógica.
El código definitivo vive en el repo; Claude Code conecta cada pantalla a datos reales en su fase.
Para traer un diseño al repo usa el botón de v0 que genera `npx shadcn@latest add "<url>"`, en la rama de la fase.

## Brief base (pégalo al inicio de cada chat en v0)
```
Proyecto: "Plataforma GynFem", sistema interno de un consultorio ginecológico en Perú.
Usuarios: recepción (tablet/PC), ginecólogos y obstetras (PC/móvil), dirección.
Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, lucide-react. Sin librerías extra.
Idioma: español (Perú). Fechas DD/MM/AAAA, hora 24 h, moneda S/.
Estilo: clínico, sereno y cálido; nada de rosado estereotipado ni iconos de género.
Paleta: primario ciruela profundo #5B2A4E, acento verde salvia #6B8F71, fondo marfil #FAF7F5,
texto #1F1A1D, alertas ámbar #B7791F, error #B42318. Bordes suaves (radius 0.75rem).
Tipografía sans humanista legible. Contraste AA. Estados siempre con texto, no solo color.
Datos de ejemplo tipados y ficticios. Sin llamadas a APIs.
```

## Pantallas
1. **Layout + login**: "Crea el login (correo, contraseña, logo 'GynFem') y el layout interno con sidebar colapsable: Inicio, Agenda, Pacientes, Seguimientos, Recordatorios, Dashboard, Administración (Usuarios, Servicios, Auditoría). Muestra nombre y rol del usuario abajo."
2. **Pacientes**: "Lista de pacientes con buscador (DNI, nombre, teléfono), tabla paginada y botón 'Nueva paciente'. Formulario de registro: tipo y número de documento, nombres, apellidos, fecha de nacimiento, teléfono, email, dirección, distrito, canal preferido, checkbox obligatorio de consentimiento con texto de aviso, checkbox opcional de recordatorios."
3. **Ficha de paciente**: "Cabecera con datos clave y tabs: Datos, Citas, Historia clínica, Seguimientos. Historia clínica: antecedentes gineco-obstétricos (G, P, A, C, FUR, menarquia, método anticonceptivo, alergias) y línea de tiempo de atenciones con estado borrador/firmada y adendas."
4. **Agenda**: "Agenda día/semana por profesional, bloques de 30 min de 08:00 a 20:00, citas coloreadas por estado (programada, confirmada, atendida, no asistió, cancelada) con etiqueta de texto. Diálogo 'Nueva cita' con buscador de paciente, servicio, profesional, fecha y hora."
5. **Atención**: "Formulario de atención: motivo de consulta, anamnesis, examen físico, diagnóstico, códigos CIE-10 (chips), plan, indicaciones. Botones 'Guardar borrador' y 'Firmar' con diálogo de confirmación que advierte que no podrá editarse."
6. **Seguimientos y recordatorios**: "Bandeja con secciones Vencidos, Hoy, Próximos 7 días (tipo, paciente, fecha objetivo, responsable, estado). Pantalla 'Recordatorios de hoy' con lista de mensajes y botón 'Abrir WhatsApp' y 'Marcar enviado/fallido'."
7. **Dashboard**: "Dashboard de dirección con selector de rango, 7 tarjetas KPI (citas, atendidas, % inasistencia, pacientes nuevas, atenciones firmadas, seguimientos vencidos, % cobertura de recordatorios), gráfico de línea 'Citas por día' y barras 'Atenciones por servicio' usando el componente chart de shadcn."

Consejo: usa estas pantallas en la entrevista/testeo con el personal **antes** de construir la fase correspondiente; anota cambios en el PR.
