import { describe, expect, it } from "vitest";

import {
  construirFiltroBusquedaPacientes,
  sanitizarTerminoBusqueda,
} from "./busqueda";

describe("sanitizarTerminoBusqueda", () => {
  it("recorta espacios", () => {
    expect(sanitizarTerminoBusqueda("  maría  ")).toBe("maría");
  });

  it("elimina la coma usada para inyectar condiciones PostgREST", () => {
    expect(sanitizarTerminoBusqueda("a,id.neq.0")).not.toContain(",");
  });

  it("elimina el punto usado para separar columna.operador.valor", () => {
    expect(sanitizarTerminoBusqueda("a,id.neq.0")).not.toContain(".");
  });

  it("elimina paréntesis usados para agrupar condiciones", () => {
    expect(sanitizarTerminoBusqueda("%)")).not.toContain(")");
    expect(sanitizarTerminoBusqueda("(x")).not.toContain("(");
  });

  it("elimina comillas simples, dobles y backticks", () => {
    expect(sanitizarTerminoBusqueda(`a'b"c\`d`)).toBe("abcd");
  });

  it("escapa el comodín % de ILIKE como literal", () => {
    expect(sanitizarTerminoBusqueda("%)")).toBe("\\%");
  });

  it("escapa el comodín _ de ILIKE como literal", () => {
    expect(sanitizarTerminoBusqueda("a_b")).toBe("a\\_b");
  });

  it("escapa la barra invertida literal", () => {
    expect(sanitizarTerminoBusqueda("a\\b")).toBe("a\\\\b");
  });

  it("limita la longitud a 80 caracteres", () => {
    const largo = "a".repeat(200);
    expect(sanitizarTerminoBusqueda(largo).length).toBe(80);
  });

  it("deja intacto un término normal", () => {
    expect(sanitizarTerminoBusqueda("Torres")).toBe("Torres");
  });
});

describe("construirFiltroBusquedaPacientes", () => {
  it("devuelve null cuando el término está vacío", () => {
    expect(construirFiltroBusquedaPacientes("")).toBeNull();
  });

  it("devuelve null cuando el término solo tiene caracteres especiales", () => {
    expect(construirFiltroBusquedaPacientes(",.()\"'`")).toBeNull();
  });

  it("construye una condición ilike por cada campo buscable", () => {
    const filtro = construirFiltroBusquedaPacientes("Torres");
    expect(filtro).toBe(
      "numero_documento.ilike.%Torres%,nombres.ilike.%Torres%,apellidos.ilike.%Torres%,telefono.ilike.%Torres%",
    );
  });

  it("una entrada maliciosa con comas no puede agregar condiciones extra", () => {
    const filtro = construirFiltroBusquedaPacientes("a,id.neq.0");
    // 4 campos buscables => exactamente 3 comas separadoras, nunca más.
    expect(filtro?.split(",").length).toBe(4);
  });

  it("una entrada maliciosa no puede cerrar el grupo ilike con paréntesis", () => {
    const filtro = construirFiltroBusquedaPacientes("%)");
    expect(filtro).not.toContain(")");
    expect(filtro).toContain("\\%");
  });
});
