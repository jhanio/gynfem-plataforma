import { describe, expect, it } from "vitest";

import { servicioSchema } from "./schemas";

const base = {
  nombre: "Consulta ginecológica",
  categoria: "Consulta",
  duracionMin: 30,
  precioReferencial: 80,
  activo: true,
};

describe("servicioSchema", () => {
  it("acepta un servicio válido", () => {
    expect(servicioSchema.safeParse(base).success).toBe(true);
  });

  it("recorta el nombre y la categoría", () => {
    const r = servicioSchema.safeParse({
      ...base,
      nombre: "  Colposcopia  ",
      categoria: "  Procedimiento  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nombre).toBe("Colposcopia");
      expect(r.data.categoria).toBe("Procedimiento");
    }
  });

  it("rechaza nombre vacío", () => {
    expect(servicioSchema.safeParse({ ...base, nombre: "  " }).success).toBe(
      false,
    );
  });

  it("rechaza duración fuera de rango (menor a 5)", () => {
    expect(
      servicioSchema.safeParse({ ...base, duracionMin: 4 }).success,
    ).toBe(false);
  });

  it("rechaza duración fuera de rango (mayor a 480)", () => {
    expect(
      servicioSchema.safeParse({ ...base, duracionMin: 481 }).success,
    ).toBe(false);
  });

  it("rechaza duración no entera", () => {
    expect(
      servicioSchema.safeParse({ ...base, duracionMin: 30.5 }).success,
    ).toBe(false);
  });

  it("rechaza precio negativo", () => {
    expect(
      servicioSchema.safeParse({ ...base, precioReferencial: -1 }).success,
    ).toBe(false);
  });

  it("acepta precio ausente (nulo)", () => {
    const r = servicioSchema.safeParse({
      ...base,
      precioReferencial: null,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.precioReferencial).toBeNull();
    }
  });

  it("convierte cadena vacía de precio en nulo", () => {
    const r = servicioSchema.safeParse({ ...base, precioReferencial: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.precioReferencial).toBeNull();
    }
  });

  it("coacciona precio numérico en texto", () => {
    const r = servicioSchema.safeParse({ ...base, precioReferencial: "120.5" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.precioReferencial).toBe(120.5);
    }
  });
});
