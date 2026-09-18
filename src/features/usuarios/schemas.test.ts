import { describe, expect, it } from "vitest";

import { cambiarRolSchema, crearUsuarioSchema } from "./schemas";

describe("crearUsuarioSchema", () => {
  it("acepta datos válidos", () => {
    const r = crearUsuarioSchema.safeParse({
      nombreCompleto: "Ana Ficticia",
      email: "ana@gynfem.test",
      rol: "medico",
    });
    expect(r.success).toBe(true);
  });

  it("normaliza email y recorta el nombre", () => {
    const r = crearUsuarioSchema.safeParse({
      nombreCompleto: "  Ana Ficticia  ",
      email: " ANA@GynFem.test ",
      rol: "asistente",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("ana@gynfem.test");
      expect(r.data.nombreCompleto).toBe("Ana Ficticia");
    }
  });

  it("rechaza nombre vacío", () => {
    const r = crearUsuarioSchema.safeParse({
      nombreCompleto: "   ",
      email: "ana@gynfem.test",
      rol: "medico",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza rol no válido", () => {
    const r = crearUsuarioSchema.safeParse({
      nombreCompleto: "Ana",
      email: "ana@gynfem.test",
      rol: "superusuario",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza email inválido", () => {
    const r = crearUsuarioSchema.safeParse({
      nombreCompleto: "Ana",
      email: "no-email",
      rol: "medico",
    });
    expect(r.success).toBe(false);
  });
});

describe("cambiarRolSchema", () => {
  it("acepta un rol válido", () => {
    const r = cambiarRolSchema.safeParse({
      usuarioId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      rol: "obstetra",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza un id que no es uuid", () => {
    const r = cambiarRolSchema.safeParse({ usuarioId: "123", rol: "obstetra" });
    expect(r.success).toBe(false);
  });
});
