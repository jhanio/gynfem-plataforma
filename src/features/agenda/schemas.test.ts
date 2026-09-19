import { describe, expect, it } from "vitest";
import {
  cancelarCitaSchema,
  confirmarCitaSchema,
  crearCitaSchema,
  marcarNoAsistioSchema,
  reprogramarCitaSchema,
} from "./schemas";

const PACIENTE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SERVICIO_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROFESIONAL_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CITA_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("crearCitaSchema", () => {
  const base = {
    pacienteId: PACIENTE_ID,
    servicioId: SERVICIO_ID,
    profesionalId: PROFESIONAL_ID,
    fecha: "2026-03-10",
    hora: "09:00",
  };

  it("acepta datos válidos", () => {
    expect(crearCitaSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza un pacienteId que no es uuid", () => {
    const r = crearCitaSchema.safeParse({ ...base, pacienteId: "no-es-uuid" });
    expect(r.success).toBe(false);
  });

  it("rechaza una fecha con formato inválido", () => {
    const r = crearCitaSchema.safeParse({ ...base, fecha: "10/03/2026" });
    expect(r.success).toBe(false);
  });

  it("rechaza una hora con formato inválido", () => {
    const r = crearCitaSchema.safeParse({ ...base, hora: "9:00" });
    expect(r.success).toBe(false);
  });

  it("rechaza una hora fuera de rango", () => {
    const r = crearCitaSchema.safeParse({ ...base, hora: "24:00" });
    expect(r.success).toBe(false);
  });

  it("acepta notas administrativas opcionales", () => {
    const r = crearCitaSchema.safeParse({ ...base, notasAdmin: "Prefiere la tarde" });
    expect(r.success).toBe(true);
  });
});

describe("confirmarCitaSchema", () => {
  it("acepta un id válido", () => {
    expect(confirmarCitaSchema.safeParse({ id: CITA_ID }).success).toBe(true);
  });

  it("rechaza un id inválido", () => {
    expect(confirmarCitaSchema.safeParse({ id: "x" }).success).toBe(false);
  });
});

describe("cancelarCitaSchema", () => {
  it("acepta sin motivo (motivo es opcional al cancelar)", () => {
    expect(cancelarCitaSchema.safeParse({ id: CITA_ID }).success).toBe(true);
  });

  it("acepta con motivo", () => {
    expect(
      cancelarCitaSchema.safeParse({ id: CITA_ID, motivo: "Paciente canceló" }).success,
    ).toBe(true);
  });
});

describe("marcarNoAsistioSchema", () => {
  it("acepta un id válido", () => {
    expect(marcarNoAsistioSchema.safeParse({ id: CITA_ID }).success).toBe(true);
  });
});

describe("reprogramarCitaSchema", () => {
  const base = { id: CITA_ID, fecha: "2026-03-12", hora: "10:00", motivo: "Nueva disponibilidad" };

  it("acepta datos válidos", () => {
    expect(reprogramarCitaSchema.safeParse(base).success).toBe(true);
  });

  it("exige un motivo no vacío", () => {
    const r = reprogramarCitaSchema.safeParse({ ...base, motivo: "  " });
    expect(r.success).toBe(false);
  });

  it("rechaza sin motivo", () => {
    const sinMotivo: Record<string, unknown> = { ...base };
    delete sinMotivo.motivo;
    const r = reprogramarCitaSchema.safeParse(sinMotivo);
    expect(r.success).toBe(false);
  });
});
