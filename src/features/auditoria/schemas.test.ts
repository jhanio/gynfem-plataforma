import { describe, expect, test } from "vitest";
import { ACCIONES_AUDITORIA, FILTRO_TODOS, filtrosAuditoriaSchema } from "./schemas";

describe("filtrosAuditoriaSchema", () => {
  test("acepta un objeto vacío y aplica página 1 por defecto", () => {
    const resultado = filtrosAuditoriaSchema.parse({});
    expect(resultado).toEqual({ pagina: 1 });
  });

  test("acepta filtros completos válidos", () => {
    const resultado = filtrosAuditoriaSchema.parse({
      usuarioId: "11111111-1111-4111-8111-111111111111",
      tabla: "pacientes",
      accion: "UPDATE",
      desde: "2026-09-01",
      hasta: "2026-09-30",
      pagina: "2",
    });
    expect(resultado).toEqual({
      usuarioId: "11111111-1111-4111-8111-111111111111",
      tabla: "pacientes",
      accion: "UPDATE",
      desde: "2026-09-01",
      hasta: "2026-09-30",
      pagina: 2,
    });
  });

  test("rechaza un usuarioId que no es UUID", () => {
    expect(() => filtrosAuditoriaSchema.parse({ usuarioId: "no-es-uuid" })).toThrow();
  });

  test("rechaza una acción fuera del catálogo", () => {
    expect(() => filtrosAuditoriaSchema.parse({ accion: "PATCH" })).toThrow();
  });

  test("trata el sentinel FILTRO_TODOS como ausencia de filtro (selects de Radix)", () => {
    const resultado = filtrosAuditoriaSchema.parse({
      usuarioId: FILTRO_TODOS,
      tabla: FILTRO_TODOS,
      accion: FILTRO_TODOS,
    });
    expect(resultado).toEqual({ pagina: 1 });
  });

  test("ignora una página inválida y vuelve a 1", () => {
    expect(filtrosAuditoriaSchema.parse({ pagina: "abc" }).pagina).toBe(1);
    expect(filtrosAuditoriaSchema.parse({ pagina: "-3" }).pagina).toBe(1);
  });

  test("expone el catálogo de acciones de auditoría", () => {
    expect(ACCIONES_AUDITORIA).toEqual(["INSERT", "UPDATE", "SOFT_DELETE", "DELETE", "READ"]);
  });
});
