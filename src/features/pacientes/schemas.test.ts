import { describe, expect, it } from "vitest";

import { editarPacienteSchema, pacienteSchema } from "./schemas";

const base = {
  tipoDocumento: "DNI" as const,
  numeroDocumento: "12345678",
  nombres: "María",
  apellidos: "Ficticia Torres",
  fechaNacimiento: "",
  telefono: "",
  email: "",
  direccion: "",
  distrito: "",
  canalPreferido: "whatsapp_manual" as const,
  aceptaRecordatorios: false,
  consentimientoDatos: true,
};

describe("pacienteSchema", () => {
  it("acepta datos válidos mínimos", () => {
    expect(pacienteSchema.safeParse(base).success).toBe(true);
  });

  it("recorta nombres y apellidos", () => {
    const r = pacienteSchema.safeParse({
      ...base,
      nombres: "  María  ",
      apellidos: "  Ficticia Torres  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nombres).toBe("María");
      expect(r.data.apellidos).toBe("Ficticia Torres");
    }
  });

  it("rechaza nombres vacíos", () => {
    expect(pacienteSchema.safeParse({ ...base, nombres: "   " }).success).toBe(
      false,
    );
  });

  it("rechaza DNI con menos de 8 dígitos", () => {
    expect(
      pacienteSchema.safeParse({ ...base, numeroDocumento: "1234567" }).success,
    ).toBe(false);
  });

  it("rechaza DNI con letras", () => {
    expect(
      pacienteSchema.safeParse({ ...base, numeroDocumento: "1234567A" }).success,
    ).toBe(false);
  });

  it("acepta carné de extranjería alfanumérico", () => {
    const r = pacienteSchema.safeParse({
      ...base,
      tipoDocumento: "CE",
      numeroDocumento: "AB123456",
    });
    expect(r.success).toBe(true);
  });

  it("acepta pasaporte alfanumérico", () => {
    const r = pacienteSchema.safeParse({
      ...base,
      tipoDocumento: "PASAPORTE",
      numeroDocumento: "P1234567",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza CE con caracteres no alfanuméricos", () => {
    const r = pacienteSchema.safeParse({
      ...base,
      tipoDocumento: "CE",
      numeroDocumento: "AB-123456",
    });
    expect(r.success).toBe(false);
  });

  it("acepta teléfono peruano válido", () => {
    const r = pacienteSchema.safeParse({ ...base, telefono: "987654321" });
    expect(r.success).toBe(true);
  });

  it("rechaza teléfono que no empieza en 9", () => {
    const r = pacienteSchema.safeParse({ ...base, telefono: "887654321" });
    expect(r.success).toBe(false);
  });

  it("rechaza teléfono con menos de 9 dígitos", () => {
    const r = pacienteSchema.safeParse({ ...base, telefono: "98765432" });
    expect(r.success).toBe(false);
  });

  it("acepta teléfono vacío (opcional)", () => {
    const r = pacienteSchema.safeParse({ ...base, telefono: "" });
    expect(r.success).toBe(true);
  });

  it("acepta email vacío (opcional)", () => {
    const r = pacienteSchema.safeParse({ ...base, email: "" });
    expect(r.success).toBe(true);
  });

  it("rechaza email inválido cuando se completa", () => {
    const r = pacienteSchema.safeParse({ ...base, email: "no-es-un-correo" });
    expect(r.success).toBe(false);
  });

  it("rechaza fecha de nacimiento futura", () => {
    const futura = new Date();
    futura.setFullYear(futura.getFullYear() + 1);
    const r = pacienteSchema.safeParse({
      ...base,
      fechaNacimiento: futura.toISOString().slice(0, 10),
    });
    expect(r.success).toBe(false);
  });

  it("rechaza consentimiento no aceptado", () => {
    const r = pacienteSchema.safeParse({
      ...base,
      consentimientoDatos: false,
    });
    expect(r.success).toBe(false);
  });
});

describe("editarPacienteSchema", () => {
  it("exige un id uuid válido", () => {
    const r = editarPacienteSchema.safeParse({ ...base, id: "no-es-uuid" });
    expect(r.success).toBe(false);
  });

  it("acepta datos válidos con id uuid", () => {
    const r = editarPacienteSchema.safeParse({
      ...base,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    expect(r.success).toBe(true);
  });
});
