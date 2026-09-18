import { test, expect } from "@playwright/test";

test("la pantalla de login carga con el formulario de acceso", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "GynFem" })).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
});
