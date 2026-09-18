# CLAUDE.md — Plataforma GynFem · Seguimiento Ginecológico Inteligente

## Qué es este proyecto
Plataforma web de gestión clínica y administrativa para GynFem (BIOSALUD SS PERU S.A.C., Pisco, Ica).
Centraliza: registro maestro de pacientes, historia clínica digital, agenda, recordatorios, seguimientos,
indicadores (KPI) y control de accesos por rol. **No reemplaza el criterio médico.**

Maneja **datos personales sensibles** (salud y vida sexual) → Ley N.º 29733 (y D.S. 016-2024-JUS) y Ley N.º 30024.
La seguridad no es una fase: es una restricción de cada línea de código.

## Documentos fuente (léelos antes de cualquier tarea)
- `docs/PRD.md` — alcance, roles, historias de usuario (HU) y criterios de aceptación
- `docs/ARCHITECTURE.md` — stack, estructura de carpetas, decisiones (ADR)
- `docs/DATABASE.md` — modelo de datos y matriz de permisos RLS
- `docs/ROADMAP.md` — fases; trabaja **solo** la fase indicada
- `supabase/migrations/` — fuente de verdad del esquema

## Stack
Next.js (App Router) · TypeScript strict · Tailwind CSS · shadcn/ui · Supabase (Postgres, Auth, RLS, Storage)
· Vercel · Zod + React Hook Form · Recharts (vía componente `chart` de shadcn) · date-fns con zona `America/Lima`
· Vitest + Testing Library · Playwright · pgTAP (`supabase test db`).

## Comandos
```bash
npm run dev            # desarrollo
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test           # Vitest
npm run test:e2e       # Playwright
npm run build          # build de producción
npx supabase migration new <nombre>     # nueva migración
npx supabase db push                    # aplicar migraciones al proyecto remoto enlazado (dev)
npx supabase test db                    # tests RLS con pgTAP (requiere Docker local o CI)
npx supabase gen types typescript --linked > src/types/database.types.ts
```

## Reglas no negociables

### Seguridad y datos
1. Toda tabla nueva: `enable row level security` + políticas explícitas **en la misma migración** + test pgTAP.
2. La clave secreta de Supabase (`SUPABASE_SECRET_KEY`) solo se usa en `src/lib/supabase/admin.ts`, que inicia con `import "server-only"`. Nunca en componentes cliente ni con prefijo `NEXT_PUBLIC_`.
3. La autorización real vive en RLS. La UI solo oculta opciones. Nunca confíes en un rol enviado desde el cliente.
4. En el servidor usa `supabase.auth.getUser()` (o `getClaims()`) para autorizar; nunca `getSession()`.
5. No hay borrado físico: el rol `authenticated` no tiene privilegio DELETE.
   - citas → estado `cancelada` · seguimientos → `cancelado` · atenciones → inmutables al firmar (corrección = adenda)
   - pacientes → `deleted_at` (solo admin, p. ej. duplicados)
6. Una atención `firmada` es inmutable (trigger en BD). Correcciones mediante `adendas`.
7. Al abrir la historia clínica de una paciente, llamar `rpc('registrar_acceso_historia', { p_paciente_id })`.
8. Mensajes de recordatorio: **sin** servicio, diagnóstico ni resultados. Solo nombre, fecha, hora y sede.
9. Nunca registres datos de pacientes en `console.log`, mensajes de error, analytics ni servicios de terceros.
10. Datos de prueba, seeds, capturas y demos: **siempre ficticios**.

### Base de datos
- Cambios de esquema solo con `supabase migration new`. Nunca edites una migración ya aplicada: crea otra.
- Tras cada migración, regenera `src/types/database.types.ts`.
- Fechas en `timestamptz`; se muestran en `America/Lima`.
- Error `23P01` en citas = cruce de horario del profesional → mensaje: "El profesional ya tiene una cita en ese horario".

### Código
- TypeScript strict, sin `any`. Tipos de BD desde `database.types.ts`.
- Lecturas en Server Components (`src/features/<modulo>/queries.ts`).
- Escrituras con Server Actions (`src/features/<modulo>/actions.ts`) que validan con el mismo esquema Zod del formulario (`schemas.ts`).
- Las acciones devuelven `{ ok: true, data } | { ok: false, error: string }` con mensajes en español.
- UI en español (Perú). Solo shadcn/ui como librería de componentes.
- Accesibilidad: labels asociados, foco visible, contraste AA, estados no comunicados solo por color.
- Responsive: recepción usa tablet/PC; profesionales pueden usar móvil.

### Flujo de trabajo
- Una fase del ROADMAP por rama: `fase-N-<slug>`.
- TDD para lógica de dominio (validaciones, reglas de agenda, cálculos, construcción de mensajes) y para RLS.
- Commits convencionales en español: `feat(agenda): crear cita con validación de cruce`.
- **Nunca** hagas merge a `main`, `push --force` ni cambies la configuración del repositorio. Abre PR y detente.
- Antes de declarar terminado: lint + typecheck + test + build en verde y checklist de la fase cumplido.
- Si una tarea requiere credenciales o acciones en un dashboard (Supabase, Vercel, GitHub): **detente y pídelo** con instrucciones exactas.
- No agregues dependencias fuera de las listadas sin justificarlo en el plan.

## Definition of Done (por historia de usuario)
- [ ] Criterios de aceptación del PRD cumplidos
- [ ] Tests en verde (unitarios + RLS si toca datos)
- [ ] Sin errores de TypeScript ni ESLint
- [ ] Probado con un rol permitido y uno denegado
- [ ] Funciona en el preview de Vercel del PR
