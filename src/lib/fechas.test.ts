import { describe, expect, it } from "vitest";
import {
  combinarFechaHoraLima,
  esMismoDiaLima,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
  obtenerFechaISOLima,
  obtenerFinDiaLima,
  obtenerInicioDiaLima,
  ZONA_HORARIA_LIMA,
} from "./fechas";

describe("ZONA_HORARIA_LIMA", () => {
  it("es America/Lima", () => {
    expect(ZONA_HORARIA_LIMA).toBe("America/Lima");
  });
});

describe("formatearFecha", () => {
  it("formatea un instante UTC como DD/MM/AAAA en hora de Lima", () => {
    expect(formatearFecha("2026-01-15T05:30:00.000Z")).toBe("15/01/2026");
  });

  it("retrocede al día anterior cuando la hora UTC aún no llega a Lima", () => {
    expect(formatearFecha("2026-01-15T04:59:00.000Z")).toBe("14/01/2026");
  });
});

describe("formatearHora", () => {
  it("formatea la hora en formato 24h de Lima", () => {
    expect(formatearHora("2026-01-15T05:30:00.000Z")).toBe("00:30");
  });
});

describe("formatearFechaHora", () => {
  it("combina fecha y hora separadas por un espacio", () => {
    expect(formatearFechaHora("2026-01-15T05:30:00.000Z")).toBe("15/01/2026 00:30");
  });
});

describe("obtenerInicioDiaLima", () => {
  it("devuelve el instante UTC del inicio del día en Lima", () => {
    const inicio = obtenerInicioDiaLima("2026-01-15T15:00:00.000Z");
    expect(new Date(inicio).toISOString()).toBe("2026-01-15T05:00:00.000Z");
  });
});

describe("obtenerFinDiaLima", () => {
  it("devuelve el instante UTC del fin del día en Lima", () => {
    const fin = obtenerFinDiaLima("2026-01-15T15:00:00.000Z");
    expect(new Date(fin).toISOString()).toBe("2026-01-16T04:59:59.999Z");
  });
});

describe("esMismoDiaLima", () => {
  it("es verdadero cuando ambos instantes caen en el mismo día en Lima", () => {
    expect(esMismoDiaLima("2026-01-15T05:30:00.000Z", "2026-01-15T23:00:00.000Z")).toBe(true);
  });

  it("es falso cuando el instante UTC cruza la medianoche de Lima", () => {
    expect(esMismoDiaLima("2026-01-15T04:59:00.000Z", "2026-01-15T05:30:00.000Z")).toBe(false);
  });
});

describe("obtenerFechaISOLima", () => {
  it("devuelve AAAA-MM-DD del día en Lima", () => {
    expect(obtenerFechaISOLima("2026-01-15T05:30:00.000Z")).toBe("2026-01-15");
  });

  it("retrocede al día anterior cuando la hora UTC aún no llega a Lima", () => {
    expect(obtenerFechaISOLima("2026-01-15T04:59:00.000Z")).toBe("2026-01-14");
  });
});

describe("combinarFechaHoraLima", () => {
  it("interpreta fecha y hora como hora de Lima y devuelve el instante UTC", () => {
    const instante = combinarFechaHoraLima("2026-03-10", "21:00");
    expect(instante.getTime()).toBe(new Date("2026-03-11T02:00:00.000Z").getTime());
  });

  it("una cita a las 21:00 de Lima NO aparece en el día siguiente", () => {
    const instante = combinarFechaHoraLima("2026-03-10", "21:00");
    // Aunque el instante UTC ya cae en el 11/03, en Lima sigue siendo 10/03.
    expect(formatearFecha(instante)).toBe("10/03/2026");
    expect(esMismoDiaLima(instante, "2026-03-10T12:00:00.000Z")).toBe(true);
    expect(esMismoDiaLima(instante, "2026-03-11T12:00:00.000Z")).toBe(false);
  });
});
