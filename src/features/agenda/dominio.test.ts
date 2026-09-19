import { describe, expect, it } from "vitest";
import {
  ACCIONES_CITA,
  calcularFin,
  desplazarFechaISO,
  inicioSemanaISO,
  puedeAplicarAccion,
  type EstadoCita,
} from "./dominio";

describe("calcularFin", () => {
  it("suma la duración del servicio al inicio", () => {
    const fin = calcularFin(new Date("2026-03-10T14:00:00.000Z"), 30);
    expect(fin.toISOString()).toBe("2026-03-10T14:30:00.000Z");
  });

  it("funciona con duraciones que cruzan la hora", () => {
    const fin = calcularFin(new Date("2026-03-10T14:45:00.000Z"), 45);
    expect(fin.toISOString()).toBe("2026-03-10T15:30:00.000Z");
  });

  it("funciona con duraciones que cruzan la medianoche", () => {
    const fin = calcularFin(new Date("2026-03-10T23:50:00.000Z"), 20);
    expect(fin.toISOString()).toBe("2026-03-11T00:10:00.000Z");
  });
});

describe("puedeAplicarAccion", () => {
  const casos: Array<{ estado: EstadoCita; accion: (typeof ACCIONES_CITA)[number]; esperado: boolean }> = [
    { estado: "programada", accion: "confirmar", esperado: true },
    { estado: "programada", accion: "cancelar", esperado: true },
    { estado: "programada", accion: "reprogramar", esperado: true },
    { estado: "programada", accion: "no_asistio", esperado: true },
    { estado: "confirmada", accion: "confirmar", esperado: false },
    { estado: "confirmada", accion: "cancelar", esperado: true },
    { estado: "confirmada", accion: "reprogramar", esperado: true },
    { estado: "confirmada", accion: "no_asistio", esperado: true },
    { estado: "atendida", accion: "confirmar", esperado: false },
    { estado: "atendida", accion: "cancelar", esperado: false },
    { estado: "atendida", accion: "reprogramar", esperado: false },
    { estado: "atendida", accion: "no_asistio", esperado: false },
    { estado: "no_asistio", accion: "confirmar", esperado: false },
    { estado: "no_asistio", accion: "reprogramar", esperado: false },
    { estado: "cancelada", accion: "confirmar", esperado: false },
    { estado: "cancelada", accion: "reprogramar", esperado: false },
    { estado: "reprogramada", accion: "confirmar", esperado: false },
    { estado: "reprogramada", accion: "reprogramar", esperado: false },
  ];

  for (const { estado, accion, esperado } of casos) {
    it(`${estado} + ${accion} → ${esperado}`, () => {
      expect(puedeAplicarAccion(estado, accion)).toBe(esperado);
    });
  }
});

describe("desplazarFechaISO", () => {
  it("suma días dentro del mismo mes", () => {
    expect(desplazarFechaISO("2026-03-10", 1)).toBe("2026-03-11");
  });

  it("resta días cruzando el mes", () => {
    expect(desplazarFechaISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("suma una semana cruzando el año", () => {
    expect(desplazarFechaISO("2025-12-30", 7)).toBe("2026-01-06");
  });
});

describe("inicioSemanaISO", () => {
  it("un miércoles retrocede al lunes de esa semana", () => {
    // 2026-03-11 es miércoles
    expect(inicioSemanaISO("2026-03-11")).toBe("2026-03-09");
  });

  it("un lunes se queda igual", () => {
    expect(inicioSemanaISO("2026-03-09")).toBe("2026-03-09");
  });

  it("un domingo retrocede al lunes anterior", () => {
    // 2026-03-15 es domingo
    expect(inicioSemanaISO("2026-03-15")).toBe("2026-03-09");
  });
});
