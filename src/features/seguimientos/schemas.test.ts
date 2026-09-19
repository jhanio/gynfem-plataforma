import { describe, expect, it } from "vitest";
import { cambiarEstadoSeguimientoSchema, crearSeguimientoSchema } from "./schemas";

const UUID = "e0a1b2c3-0000-4000-8000-000000000001";

describe("crearSeguimientoSchema", () => {
  it("acepta los campos mínimos requeridos", () => {
    const r = crearSeguimientoSchema.safeParse({
      pacienteId: UUID,
      tipo: "control",
      descripcion: "Control en 4 semanas",
      fechaObjetivo: "2026-10-15",
    });
    expect(r.success).toBe(true);
  });

  it("acepta atencionId y responsableId opcionales", () => {
    const r = crearSeguimientoSchema.safeParse({
      pacienteId: UUID,
      atencionId: UUID,
      tipo: "resultado_pendiente",
      descripcion: "Esperando resultado de laboratorio",
      fechaObjetivo: "2026-10-20",
      responsableId: UUID,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza descripción vacía", () => {
    const r = crearSeguimientoSchema.safeParse({
      pacienteId: UUID,
      tipo: "control",
      descripcion: "   ",
      fechaObjetivo: "2026-10-15",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza tipo fuera del catálogo", () => {
    const r = crearSeguimientoSchema.safeParse({
      pacienteId: UUID,
      tipo: "invalido",
      descripcion: "Algo",
      fechaObjetivo: "2026-10-15",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza pacienteId que no es UUID", () => {
    const r = crearSeguimientoSchema.safeParse({
      pacienteId: "no-es-uuid",
      tipo: "control",
      descripcion: "Algo",
      fechaObjetivo: "2026-10-15",
    });
    expect(r.success).toBe(false);
  });
});

describe("cambiarEstadoSeguimientoSchema", () => {
  it("acepta id, estado y notas opcionales", () => {
    const r = cambiarEstadoSeguimientoSchema.safeParse({
      id: UUID,
      estado: "contactada",
      notas: "Se contactó por WhatsApp",
    });
    expect(r.success).toBe(true);
  });

  it("acepta sin notas", () => {
    const r = cambiarEstadoSeguimientoSchema.safeParse({ id: UUID, estado: "completado" });
    expect(r.success).toBe(true);
  });

  it("rechaza estado fuera del catálogo", () => {
    const r = cambiarEstadoSeguimientoSchema.safeParse({ id: UUID, estado: "invalido" });
    expect(r.success).toBe(false);
  });
});
