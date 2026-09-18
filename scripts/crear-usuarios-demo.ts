/**
 * Crea 5 usuarios internos FICTICIOS (uno por rol) en el proyecto Supabase
 * enlazado en .env.local (usar SOLO contra gynfem-dev).
 *
 * - Usa la Auth Admin API con la clave secreta.
 * - El rol se pasa en app_metadata (fuente del rol inicial en el trigger).
 * - Las contraseñas temporales se imprimen SOLO en consola; nunca se guardan
 *   en archivos ni en el repositorio.
 *
 * Ejecutar:  npx tsx scripts/crear-usuarios-demo.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

/** Carga variables de .env.local sin dependencias externas. */
function cargarEnvLocal(): void {
  try {
    const contenido = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const linea of contenido.split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const idx = limpia.indexOf("=");
      if (idx === -1) continue;
      const clave = limpia.slice(0, idx).trim();
      let valor = limpia.slice(idx + 1).trim();
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1);
      }
      if (!(clave in process.env)) process.env[clave] = valor;
    }
  } catch {
    // Si no existe .env.local, se usará el entorno del proceso.
  }
}

function passwordTemporal(): string {
  return `Gy${randomBytes(9).toString("base64url")}!9`;
}

const USUARIOS_DEMO = [
  { nombre: "Admin Ficticia", email: "admin@gynfem.test", rol: "admin" },
  { nombre: "Dra. Médica Ficticia", email: "medico@gynfem.test", rol: "medico" },
  { nombre: "Obstetra Ficticia", email: "obstetra@gynfem.test", rol: "obstetra" },
  { nombre: "Asistente Ficticia", email: "asistente@gynfem.test", rol: "asistente" },
  { nombre: "Soporte Ficticio", email: "soporte@gynfem.test", rol: "soporte" },
] as const;

async function main() {
  cargarEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const credenciales: { email: string; rol: string; password: string }[] = [];

  for (const u of USUARIOS_DEMO) {
    const password = passwordTemporal();
    const { error } = await supabase.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo: u.nombre },
      app_metadata: { rol: u.rol },
    });

    if (error) {
      console.warn(`- ${u.email} (${u.rol}): omitido — ${error.message}`);
      continue;
    }
    credenciales.push({ email: u.email, rol: u.rol, password });
  }

  if (credenciales.length === 0) {
    console.log(
      "\nNo se creó ningún usuario nuevo (probablemente ya existen).",
    );
    return;
  }

  console.log("\nUsuarios creados (guarda estas contraseñas de forma segura):\n");
  console.table(credenciales);
  console.log(
    "\nEstas contraseñas NO se vuelven a mostrar y no quedan en el repositorio.",
  );
}

main().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});
