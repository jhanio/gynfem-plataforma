import { describe, expect, it } from "vitest";
import {
  adendaSchema,
  firmarAtencionSchema,
  guardarBorradorSchema,
  iniciarAtencionSchema,
} from "./schemas";

const UUID = "d0a1b2c3-0000-4000-8000-000000000001";

describe("iniciarAtencionSchema", () => {
  it("acepta una cita y un motivo de consulta", () => {
    const r = iniciarAtencionSchema.safeParse({
      citaId: UUID,
      motivoConsulta: "Control ginecológico",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza motivo de consulta vacío", () => {
    const r = iniciarAtencionSchema.safeParse({ citaId: UUID, motivoConsulta: "  " });
    expect(r.success).toBe(false);
  });

  it("rechaza cita que no es UUID", () => {
    const r = iniciarAtencionSchema.safeParse({ citaId: "x", motivoConsulta: "Ok" });
    expect(r.success).toBe(false);
  });
});

describe("guardarBorradorSchema — CIE-10", () => {
  it("acepta códigos válidos con y sin decimal", () => {
    const r = guardarBorradorSchema.safeParse({
      id: UUID,
      motivoConsulta: "Dolor pélvico",
      cie10: ["N80", "N80.1", "R10.2"],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cie10).toEqual(["N80", "N80.1", "R10.2"]);
  });

  it("normaliza a mayúsculas y admite texto separado por comas o espacios", () => {
    const r = guardarBorradorSchema.safeParse({
      id: UUID,
      motivoConsulta: "Dolor pélvico",
      cie10: "n80, r10.2  e11",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cie10).toEqual(["N80", "R10.2", "E11"]);
  });

  it("rechaza un código con formato inválido", () => {
    const r = guardarBorradorSchema.safeParse({
      id: UUID,
      motivoConsulta: "Dolor pélvico",
      cie10: ["80N"],
    });
    expect(r.success).toBe(false);
  });

  it("acepta la ausencia de códigos (arreglo vacío por defecto)", () => {
    const r = guardarBorradorSchema.safeParse({ id: UUID, motivoConsulta: "Control" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cie10).toEqual([]);
  });

  it("exige motivo de consulta", () => {
    const r = guardarBorradorSchema.safeParse({ id: UUID, motivoConsulta: "" });
    expect(r.success).toBe(false);
  });
});

describe("firmarAtencionSchema", () => {
  it("exige un identificador válido", () => {
    expect(firmarAtencionSchema.safeParse({ id: UUID }).success).toBe(true);
    expect(firmarAtencionSchema.safeParse({ id: "no" }).success).toBe(false);
  });
});

describe("adendaSchema", () => {
  it("exige contenido no vacío", () => {
    expect(
      adendaSchema.safeParse({ atencionId: UUID, contenido: "Corrección" }).success,
    ).toBe(true);
    expect(
      adendaSchema.safeParse({ atencionId: UUID, contenido: "   " }).success,
    ).toBe(false);
  });
});
