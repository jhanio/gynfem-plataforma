# Plataforma GynFem — Seguimiento Ginecológico Inteligente

Aplicación web de gestión clínica y administrativa para GynFem (BIOSALUD SS PERU S.A.C.).

- Guía de inicio: `docs/SETUP.md`
- Plan de construcción: `docs/ROADMAP.md`
- Requisitos: `docs/PRD.md` · Arquitectura: `docs/ARCHITECTURE.md` · Datos: `docs/DATABASE.md`
- Guion de prueba de usabilidad: `docs/USABILIDAD.md`

> Trabajo académico — Planeamiento Estratégico de TI. Todos los datos de demostración son ficticios.

## Correr el proyecto

```bash
npm install
cp .env.example .env.local   # completa con las credenciales de tu propio proyecto Supabase
npm run dev
```

Otros comandos: `npm run lint`, `npm run typecheck`, `npm run test -- --run`, `npm run test:e2e`
(requiere el servidor construido en producción, ver `playwright.config.ts`), `npm run build`.

Datos de demostración (solo contra el proyecto `gynfem-dev`, nunca en producción):

```bash
npx tsx scripts/crear-usuarios-demo.ts   # 5 usuarios ficticios, uno por rol
npx tsx scripts/seed-demo.ts             # + 30 pacientes, citas, atenciones y seguimientos
```

## Demo

- Preview de Vercel: _(agregar el enlace del PR/branch al desplegar)_.
- Capturas: _(agregar antes de la sustentación)_.
- **Credenciales de acceso:** este repositorio es público — las credenciales de las cuentas de
  demostración no se publican aquí. Solicítalas al responsable del proyecto.

## Seguridad

- Autenticación con correo y contraseña + **MFA obligatorio (TOTP)** para los roles `admin`,
  `medico` y `obstetra`, exigido en tres capas independientes: middleware, guards de servidor y
  RLS (ver `docs/DATABASE.md` §9).
- **Si un usuario clínico pierde su dispositivo de autenticación**, no existe un flujo de
  autorecuperación (Supabase no lo ofrece): un admin debe entrar a `/admin/usuarios` y usar
  "Restablecer MFA" para ese usuario. La próxima vez que inicie sesión, se le pedirá inscribir un
  factor nuevo. Un admin no puede restablecer su propio MFA por este medio (evita bloqueos
  autoinfligidos); si el único admin pierde su dispositivo, la única salida es soporte directo de
  Supabase sobre el proyecto.
- **Protección de contraseñas filtradas** (Supabase Auth → *Password protection* / *leaked
  password protection*): se activa manualmente en el dashboard de `gynfem-dev`, no por migración.
- Cabeceras de seguridad y Content-Security-Policy con nonce por request: ver `next.config.ts` y
  `src/proxy.ts`.
- RLS en todas las tablas; ninguna tiene privilegio `DELETE` para `authenticated` (sin borrado
  físico). Detalle completo de la matriz de permisos en `docs/DATABASE.md`.
- Reporta cualquier hallazgo de seguridad al responsable del proyecto antes de divulgarlo.
