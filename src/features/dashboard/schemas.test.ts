import { describe, expect, test } from "vitest";
import { rangoDashboardSchema } from "./schemas";

describe("rangoDashboardSchema", () => {
  test("por defecto usa el preset 7dias sin fechas personalizadas", () => {
    expect(rangoDashboardSchema.parse({})).toEqual({ preset: "7dias" });
  });

  test("acepta un preset válido", () => {
    expect(rangoDashboardSchema.parse({ preset: "mes" })).toEqual({ preset: "mes" });
  });

  test("vuelve a 7dias si el preset no existe", () => {
    expect(rangoDashboardSchema.parse({ preset: "anio" })).toEqual({ preset: "7dias" });
  });

  test("acepta desde/hasta con formato AAAA-MM-DD para el preset personalizado", () => {
    expect(
      rangoDashboardSchema.parse({ preset: "personalizado", desde: "2026-01-01", hasta: "2026-01-31" }),
    ).toEqual({ preset: "personalizado", desde: "2026-01-01", hasta: "2026-01-31" });
  });

  test("descarta un desde/hasta con formato inválido", () => {
    expect(
      rangoDashboardSchema.parse({ preset: "personalizado", desde: "01/01/2026", hasta: "" }),
    ).toEqual({ preset: "personalizado" });
  });
});
