import { describe, expect, it } from "vitest";

import { loginSchema } from "./schemas";

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const r = loginSchema.safeParse({
      email: "medico@gynfem.test",
      password: "secreto123",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const r = loginSchema.safeParse({ email: "no-es-email", password: "x" });
    expect(r.success).toBe(false);
  });

  it("rechaza email vacío", () => {
    const r = loginSchema.safeParse({ email: "", password: "secreto123" });
    expect(r.success).toBe(false);
  });

  it("rechaza contraseña vacía", () => {
    const r = loginSchema.safeParse({
      email: "a@b.com",
      password: "",
    });
    expect(r.success).toBe(false);
  });

  it("normaliza el email (trim + minúsculas)", () => {
    const r = loginSchema.safeParse({
      email: "  Medico@GynFem.TEST ",
      password: "secreto123",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("medico@gynfem.test");
    }
  });
});
