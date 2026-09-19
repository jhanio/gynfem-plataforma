import { describe, expect, it } from "vitest";

import { generarPasswordTemporal } from "./password";

// Política de contraseñas configurada en Supabase Auth para este
// proyecto: mínimo 10 caracteres, con minúsculas, mayúsculas y números.
const LARGO_MINIMO = 10;

describe("generarPasswordTemporal", () => {
  it("cumple el largo mínimo de la política de Supabase Auth", () => {
    expect(generarPasswordTemporal().length).toBeGreaterThanOrEqual(LARGO_MINIMO);
  });

  it("incluye al menos una minúscula", () => {
    expect(generarPasswordTemporal()).toMatch(/[a-z]/);
  });

  it("incluye al menos una mayúscula", () => {
    expect(generarPasswordTemporal()).toMatch(/[A-Z]/);
  });

  it("incluye al menos un número", () => {
    expect(generarPasswordTemporal()).toMatch(/[0-9]/);
  });

  it("cumple la política completa en múltiples generaciones (no depende del azar)", () => {
    for (let i = 0; i < 200; i++) {
      const password = generarPasswordTemporal();
      expect(password.length).toBeGreaterThanOrEqual(LARGO_MINIMO);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[0-9]/);
    }
  });

  it("genera valores distintos en cada llamada", () => {
    expect(generarPasswordTemporal()).not.toBe(generarPasswordTemporal());
  });
});
