---
description: Ejecuta una fase del ROADMAP con el flujo del proyecto GynFem
argument-hint: <número de fase>
---
Vas a ejecutar la **Fase $ARGUMENTS** de la Plataforma GynFem.

1. Lee `CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md` y la sección "Fase $ARGUMENTS" de `docs/ROADMAP.md`.
2. Actualiza `main` y crea la rama `fase-$ARGUMENTS-<slug>`.
3. Presenta un plan numerado: archivos a crear/modificar, migraciones, tests, dependencias nuevas y riesgos. **Espera mi aprobación.**
4. Implementa con TDD: primero el test que falla (dominio, RLS o componente), luego el código mínimo, luego refactor.
5. Verifica: `npm run lint`, `npm run typecheck`, `npm run test -- --run`, `npm run build` y, si hubo cambios en BD, `npx supabase test db`.
6. Recorre el checklist de la fase y marca cada punto con evidencia.
7. Commits convencionales en español, push y abre un PR con `gh pr create` (resumen, HU cubiertas, checklist, cómo probar con cada rol). **No hagas merge.**
8. Si necesitas credenciales, variables de entorno o acciones en Supabase/Vercel/GitHub, detente y dime exactamente qué hacer.
