import { describe, expect, it } from "vitest";
import { historiaSchema } from "./schemas";

describe("historiaSchema", () => {
  it("acepta una historia con todos los campos vacíos", () => {
    const r = historiaSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("convierte campos numéricos vacíos en null", () => {
    const r = historiaSchema.safeParse({
      menarquiaEdad: "",
      gestas: "",
      fechaUltimaRegla: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.menarquiaEdad).toBeNull();
      expect(r.data.gestas).toBeNull();
      expect(r.data.fechaUltimaRegla).toBeNull();
    }
  });

  it("coacciona edad de menarquia válida a número", () => {
    const r = historiaSchema.safeParse({ menarquiaEdad: "12" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.menarquiaEdad).toBe(12);
  });

  it("rechaza menarquia fuera del rango 5–25", () => {
    expect(historiaSchema.safeParse({ menarquiaEdad: "4" }).success).toBe(false);
    expect(historiaSchema.safeParse({ menarquiaEdad: "26" }).success).toBe(false);
  });

  it("rechaza número de gestas negativo", () => {
    expect(historiaSchema.safeParse({ gestas: "-1" }).success).toBe(false);
  });

  it("acepta una fecha de última regla válida", () => {
    const r = historiaSchema.safeParse({ fechaUltimaRegla: "2026-08-01" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.fechaUltimaRegla).toBe("2026-08-01");
  });

  it("rechaza una fecha con formato inválido", () => {
    expect(historiaSchema.safeParse({ fechaUltimaRegla: "01/08/2026" }).success).toBe(
      false,
    );
  });
});
