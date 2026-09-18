# SETUP — Paso a paso (Fase 0 y configuración)

Los pasos marcados con 🔑 implican credenciales: nunca las pegues en el chat ni las subas a GitHub.

## 1. Instalar herramientas (una vez)
- Node.js LTS (22 o superior) y Git.
- GitHub CLI: `winget install GitHub.cli` → `gh auth login` (Claude Code lo usa para abrir PRs).
- Opcional: Docker Desktop (para correr tests pgTAP en tu PC con `npx supabase test db`; si no, los corre CI).
- Supabase CLI: no hace falta instalarlo, se usa con `npx supabase ...`.

## 2. Crear la app
```bash
npx create-next-app@latest gynfem-plataforma --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd gynfem-plataforma
```

## 3. Copiar los documentos de este paquete
Copia a la raíz del proyecto: `CLAUDE.md`, `.env.example`, carpetas `docs/`, `supabase/`, `.github/`, `.claude/`.

Agrega a `.gitignore`:
```
.env*.local
.env
supabase/.temp
supabase/.branches
```

## 4. Crear el repositorio en GitHub
```bash
git add .
git commit -m "chore: documentación inicial y esqueleto Next.js"
gh repo create gynfem-plataforma --private --source=. --push
```
Luego en GitHub → Settings → Branches → regla para `main`: exigir PR y que pase el check `CI`.

## 5. 🔑 Crear el proyecto Supabase `gynfem-dev`
1. supabase.com → New project → nombre `gynfem-dev`, región **South America (São Paulo)**, contraseña de BD fuerte (guárdala en tu gestor de contraseñas).
2. Authentication → Sign In / Providers → **desactiva "Allow new users to sign up"**. Deja Email habilitado.
3. Authentication → URL Configuration: Site URL `http://localhost:3000` (lo cambias en el paso 9).
4. Project Settings → API Keys: copia **Project URL**, **Publishable key** y **Secret key** (o `anon` y `service_role` si ves las legacy).

## 6. 🔑 Enlazar y aplicar la migración
```bash
npx supabase login
npx supabase init            # si pregunta por sobrescribir, NO borres supabase/migrations
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.types.ts
```
Luego, en Supabase → SQL Editor, pega y ejecuta el contenido de `supabase/seed.sql` (catálogo de servicios).

## 7. 🔑 Variables locales
```bash
cp .env.example .env.local   # en PowerShell: Copy-Item .env.example .env.local
```
Completa `.env.local` con los valores del paso 5.

## 8. 🔑 Tu usuario administrador
Supabase → Authentication → Users → Add user → tu correo + contraseña (marca "Auto confirm").
Luego en SQL Editor:
```sql
update public.profiles
set rol = 'admin', activo = true, nombre_completo = 'Tu nombre'
where id = (select id from auth.users where email = 'tu-correo@dominio.com');
```
Los demás usuarios los crearás desde `/admin/usuarios` (Fase 2).

## 9. 🔑 Vercel
1. vercel.com → Add New → Project → importa `gynfem-plataforma` desde GitHub.
2. Environment Variables (Production y Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` (la URL de Vercel), `NEXT_PUBLIC_WHATSAPP_SEDE`.
3. Deploy.
4. Vuelve a Supabase → Authentication → URL Configuration:
   - Site URL: `https://gynfem-plataforma.vercel.app` (tu URL real)
   - Redirect URLs: `http://localhost:3000/**` y `https://*-TU-USUARIO-VERCEL.vercel.app/**` (previews)

## 10. Claude Code
```bash
claude
```
Primera sesión: `/fase 1`. Revisa el plan, apruébalo, deja que implemente, revisa el PR y el preview de Vercel, y haz **tú** el merge. Repite con `/fase 2`, etc.

Ritmo recomendado por fase:
1. `/fase N` → aprobar plan
2. Revisión del PR en GitHub + prueba en preview con 2 roles
3. Merge (tú) → Vercel despliega producción automáticamente
4. `git checkout main && git pull` antes de la siguiente fase

## 11. Antes de usar datos reales (no para la demo académica)
- Crear `gynfem-prod` y pasar a Supabase Pro (backups diarios, sin pausa) y Vercel Pro (uso comercial).
- Validación legal: inventario de datos, aviso de privacidad, consentimiento, flujo transfronterizo (servidores en Brasil/EE. UU.), inscripción del banco de datos ante la autoridad, contratos con proveedores.
- Procedimiento probado de respaldo y restauración.
