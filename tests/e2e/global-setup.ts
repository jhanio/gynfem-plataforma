/**
 * Global setup de Playwright: prepara usuarios y datos mínimos en
 * gynfem-dev y guarda una storageState autenticada por rol para que los
 * specs no repitan el login (ni el enrolamiento MFA) en cada test.
 *
 * MFA es obligatorio para medico/obstetra desde la Fase 8, así que no
 * hay atajo: este setup recrea al usuario de prueba (sin factores TOTP
 * previos), conduce el navegador por /mfa/activar, lee el secreto que
 * la propia página muestra en texto plano y calcula un código válido
 * con otplib — exactamente lo que haría una persona con su app de
 * autenticación.
 *
 * Solo pensado para gynfem-dev: usa la clave secreta para borrar y
 * recrear usuarios de prueba, y cancela citas de pruebas anteriores.
 *
 * (Todo el trabajo con el cliente admin vive dentro de globalSetup() en
 * funciones internas, no en helpers de nivel de módulo: sin un
 * database.types.ts pasado a createClient(), anotar un tipo de
 * parámetro aparte para "el cliente admin" obliga a nombrar el tipo
 * genérico por defecto explícitamente, y ese tipo por defecto es `any`
 * — exactamente lo que el lint del proyecto prohíbe. Usarlo por cierre
 * de variable evita necesitar esa anotación.)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { authenticator } from "otplib";

const PROYECTO_DEV_REF = "unlzfefbsltkkndfkeja";
const BASE_URL = "http://localhost:3000";

const MEDICO_EMAIL = "e2e-medico@gynfem.test";
const MEDICO_NOMBRE = "E2E Médico";
const ASISTENTE_EMAIL = "e2e-asistente@gynfem.test";
const ASISTENTE_NOMBRE = "E2E Asistente";
const PASSWORD = "E2eGynfem!2026";

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
    // Sin .env.local: se usa el entorno del proceso (p. ej. en CI).
  }
}

export default async function globalSetup() {
  cargarEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  }
  if (!url.includes(PROYECTO_DEV_REF)) {
    throw new Error(
      `Los tests E2E solo corren contra gynfem-dev (${PROYECTO_DEV_REF}). URL: ${url}`,
    );
  }

  const admin = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function recrearUsuario(
    email: string,
    nombreCompleto: string,
    rol: string,
  ): Promise<string> {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existente = (data?.users ?? []).find((u) => u.email === email);
    if (existente) {
      await admin.auth.admin.deleteUser(existente.id);
    }

    const { data: creado, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nombre_completo: nombreCompleto },
      app_metadata: { rol },
    });

    if (error || !creado.user) {
      throw new Error(`No se pudo (re)crear el usuario E2E ${email}: ${error?.message}`);
    }

    await admin.from("profiles").update({ rol, activo: true }).eq("id", creado.user.id);
    return creado.user.id;
  }

  async function asegurarUsuarioIdempotente(
    email: string,
    nombreCompleto: string,
    rol: string,
  ): Promise<string> {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existente = (data?.users ?? []).find((u) => u.email === email);
    if (existente) {
      await admin.from("profiles").update({ rol, activo: true }).eq("id", existente.id);
      return existente.id;
    }
    return recrearUsuario(email, nombreCompleto, rol);
  }

  async function asegurarServicio(): Promise<void> {
    const { data: existente } = await admin
      .from("servicios")
      .select("id")
      .eq("nombre", "Consulta ginecológica")
      .maybeSingle();

    if (!existente) {
      await admin
        .from("servicios")
        .insert({ nombre: "Consulta ginecológica", categoria: "Consulta", duracion_min: 30 });
    }
  }

  await asegurarServicio();

  // El médico se recrea siempre: garantiza que no tenga factores MFA de
  // una corrida anterior, así el enrolamiento de abajo es determinista.
  const medicoId = await recrearUsuario(MEDICO_EMAIL, MEDICO_NOMBRE, "medico");
  await asegurarUsuarioIdempotente(ASISTENTE_EMAIL, ASISTENTE_NOMBRE, "asistente");

  // Libera cualquier horario que hayan ocupado citas de corridas E2E
  // anteriores (no se borran físicamente: se cancelan, como en el resto
  // de la app).
  await admin
    .from("citas")
    .update({ estado: "cancelada", motivo_cambio: "Reinicio de datos E2E" })
    .eq("profesional_id", medicoId)
    .eq("estado", "programada");

  const browser = await chromium.launch();

  try {
    const paginaMedico = await browser.newPage({ baseURL: BASE_URL });
    await paginaMedico.goto("/login");
    await paginaMedico.getByLabel("Correo electrónico").fill(MEDICO_EMAIL);
    await paginaMedico.getByLabel("Contraseña").fill(PASSWORD);
    await paginaMedico.getByRole("button", { name: "Iniciar sesión" }).click();

    await paginaMedico.waitForURL("**/mfa/activar");
    await paginaMedico.getByRole("button", { name: "Generar código QR" }).click();
    await paginaMedico.locator("#secreto-totp").waitFor();
    const secreto = await paginaMedico.locator("#secreto-totp").inputValue();
    const codigo = authenticator.generate(secreto);
    await paginaMedico.getByLabel("Código de 6 dígitos").fill(codigo);
    await paginaMedico.getByRole("button", { name: "Confirmar" }).click();

    await paginaMedico.waitForURL((u) => !u.pathname.startsWith("/mfa"));
    await paginaMedico.context().storageState({ path: "tests/e2e/.auth/medico.json" });
    await paginaMedico.close();

    const paginaAsistente = await browser.newPage({ baseURL: BASE_URL });
    await paginaAsistente.goto("/login");
    await paginaAsistente.getByLabel("Correo electrónico").fill(ASISTENTE_EMAIL);
    await paginaAsistente.getByLabel("Contraseña").fill(PASSWORD);
    await paginaAsistente.getByRole("button", { name: "Iniciar sesión" }).click();
    await paginaAsistente.waitForURL((u) => u.pathname === "/agenda");
    await paginaAsistente.context().storageState({ path: "tests/e2e/.auth/asistente.json" });
    await paginaAsistente.close();
  } finally {
    await browser.close();
  }
}
