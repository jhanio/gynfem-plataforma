import { describe, expect, it } from "vitest";
import {
  puedeAgregarAdenda,
  puedeEditarAtencion,
  puedeFirmarAtencion,
  type EstadoAtencion,
} from "./dominio";

describe("puedeEditarAtencion", () => {
  const casos: Array<{ estado: EstadoAtencion; esperado: boolean }> = [
    { estado: "borrador", esperado: true },
    { estado: "firmada", esperado: false },
  ];
  for (const { estado, esperado } of casos) {
    it(`${estado} → ${esperado}`, () => {
      expect(puedeEditarAtencion(estado)).toBe(esperado);
    });
  }
});

describe("puedeFirmarAtencion", () => {
  it("solo un borrador puede firmarse", () => {
    expect(puedeFirmarAtencion("borrador")).toBe(true);
    expect(puedeFirmarAtencion("firmada")).toBe(false);
  });
});

describe("puedeAgregarAdenda", () => {
  it("solo una atención firmada admite adendas", () => {
    expect(puedeAgregarAdenda("firmada")).toBe(true);
    expect(puedeAgregarAdenda("borrador")).toBe(false);
  });
});
