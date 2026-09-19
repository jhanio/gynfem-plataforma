import { describe, expect, test } from "vitest";
import {
  clasificarSeguimiento,
  puedeCambiarEstadoSeguimiento,
} from "./dominio";

describe("clasificarSeguimiento", () => {
  test("una fecha objetivo anterior a hoy es 'vencido'", () => {
    expect(clasificarSeguimiento("2026-09-01", "2026-09-10")).toBe("vencido");
  });

  test("una fecha objetivo igual a hoy es 'hoy'", () => {
    expect(clasificarSeguimiento("2026-09-10", "2026-09-10")).toBe("hoy");
  });

  test("una fecha objetivo dentro de los próximos 7 días es 'proximo'", () => {
    expect(clasificarSeguimiento("2026-09-11", "2026-09-10")).toBe("proximo");
    expect(clasificarSeguimiento("2026-09-17", "2026-09-10")).toBe("proximo");
  });

  test("una fecha objetivo a más de 7 días es 'mas_adelante'", () => {
    expect(clasificarSeguimiento("2026-09-18", "2026-09-10")).toBe("mas_adelante");
  });
});

describe("puedeCambiarEstadoSeguimiento", () => {
  test("pendiente puede pasar a contactada, completado o cancelado", () => {
    expect(puedeCambiarEstadoSeguimiento("pendiente", "contactada")).toBe(true);
    expect(puedeCambiarEstadoSeguimiento("pendiente", "completado")).toBe(true);
    expect(puedeCambiarEstadoSeguimiento("pendiente", "cancelado")).toBe(true);
  });

  test("contactada puede pasar a completado o cancelado, pero no a pendiente", () => {
    expect(puedeCambiarEstadoSeguimiento("contactada", "completado")).toBe(true);
    expect(puedeCambiarEstadoSeguimiento("contactada", "cancelado")).toBe(true);
    expect(puedeCambiarEstadoSeguimiento("contactada", "pendiente")).toBe(false);
  });

  test("completado y cancelado son estados finales", () => {
    expect(puedeCambiarEstadoSeguimiento("completado", "pendiente")).toBe(false);
    expect(puedeCambiarEstadoSeguimiento("completado", "contactada")).toBe(false);
    expect(puedeCambiarEstadoSeguimiento("cancelado", "pendiente")).toBe(false);
  });

  test("un estado no puede 'cambiar' a sí mismo", () => {
    expect(puedeCambiarEstadoSeguimiento("pendiente", "pendiente")).toBe(false);
  });
});
