import { test, expect, type Browser } from "@playwright/test";

/**
 * Flujo crítico (Fase 8): registrar paciente → agendar cita → iniciar
 * atención y firmar. Cruza dos roles (asistente y médico), así que usa
 * dos BrowserContext con la storageState que dejó global-setup.ts en
 * lugar de dos specs desconectados — así se prueba la continuidad real
 * del dato entre pantallas, como ocurriría en la clínica.
 */

const NOMBRE_PACIENTE = "E2E";
const APELLIDO_PACIENTE = "Playwright";
const HORA_CITA = "09:00";

function numeroDocumentoUnico(): string {
  return `77${String(Date.now()).slice(-6)}`;
}

async function registrarPacienteYAgendar(browser: Browser): Promise<void> {
  const context = await browser.newContext({ storageState: "tests/e2e/.auth/asistente.json" });
  const page = await context.newPage();

  await page.goto("/pacientes/nuevo");
  await page.getByLabel("Número de documento").fill(numeroDocumentoUnico());
  await page.getByLabel("Nombres").fill(NOMBRE_PACIENTE);
  await page.getByLabel("Apellidos").fill(APELLIDO_PACIENTE);
  await page.getByLabel("Teléfono").fill("987654321");
  await page.getByLabel(/consiente el tratamiento de sus datos/).check();
  await page.getByRole("button", { name: "Guardar" }).click();

  await page.waitForURL(/\/pacientes\/[0-9a-f-]+$/);
  await expect(page.getByText(`${APELLIDO_PACIENTE}`, { exact: false }).first()).toBeVisible();

  await page.goto("/agenda");
  await page.getByRole("button", { name: "Nueva cita" }).click();

  await page.getByRole("combobox", { name: /Buscar por documento/ }).click();
  await page.getByPlaceholder("Buscar paciente…").fill(APELLIDO_PACIENTE);
  await page.getByText(`${APELLIDO_PACIENTE}, ${NOMBRE_PACIENTE}`).first().click();

  await page.getByLabel("Profesional").click();
  await page.getByRole("option", { name: "E2E Médico" }).click();

  const hoy = new Date().toISOString().slice(0, 10);
  await page.locator("#nueva-cita-fecha").fill(hoy);
  await page.locator("#nueva-cita-hora").fill(HORA_CITA);

  await page.getByRole("button", { name: "Crear cita" }).click();
  await expect(page.getByText("Cita registrada")).toBeVisible();

  await context.close();
}

async function atenderYFirmar(browser: Browser): Promise<void> {
  const context = await browser.newContext({ storageState: "tests/e2e/.auth/medico.json" });
  const page = await context.newPage();

  await page.goto("/agenda?vista=hoy");

  const filaCita = page
    .locator("li", { hasText: `${APELLIDO_PACIENTE}, ${NOMBRE_PACIENTE}` })
    .first();
  await expect(filaCita).toBeVisible();

  await filaCita.getByRole("button", { name: "Más acciones" }).click();
  await page.getByRole("menuitem", { name: "Iniciar atención" }).click();

  await page.getByLabel("Motivo de consulta").fill("Control de rutina (E2E ficticio)");
  await page.getByRole("button", { name: "Iniciar atención" }).click();

  await page.waitForURL(/\/atenciones\/[0-9a-f-]+$/);
  await page.getByRole("button", { name: "Firmar atención" }).click();
  await page.getByRole("button", { name: "Firmar", exact: true }).click();

  await expect(page.getByText("Atención firmada")).toBeVisible();

  await context.close();
}

test("registrar paciente → agendar cita → iniciar atención y firmar", async ({ browser }) => {
  await registrarPacienteYAgendar(browser);
  await atenderYFirmar(browser);
});
