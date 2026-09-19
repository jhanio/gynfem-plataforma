import { describe, expect, test } from "vitest";
import {
  calcularPorcentajeDuplicados,
  calcularRangoFechas,
  mapearGruposDuplicados,
  mapearKpiResumen,
} from "./dominio";

const HOY = "2026-09-19";

describe("calcularRangoFechas", () => {
  test("hoy: desde y hasta son el mismo día", () => {
    expect(calcularRangoFechas("hoy", HOY)).toEqual({ desde: HOY, hasta: HOY });
  });

  test("7dias: incluye hoy y los 6 días anteriores (7 días en total)", () => {
    expect(calcularRangoFechas("7dias", HOY)).toEqual({ desde: "2026-09-13", hasta: HOY });
  });

  test("7dias: retrocede correctamente el mes cuando cruza el límite", () => {
    expect(calcularRangoFechas("7dias", "2026-09-03")).toEqual({
      desde: "2026-08-28",
      hasta: "2026-09-03",
    });
  });

  test("mes: desde el día 1 del mes actual hasta hoy", () => {
    expect(calcularRangoFechas("mes", HOY)).toEqual({ desde: "2026-09-01", hasta: HOY });
  });

  test("personalizado: usa las fechas provistas", () => {
    expect(
      calcularRangoFechas("personalizado", HOY, { desde: "2026-01-01", hasta: "2026-01-31" }),
    ).toEqual({ desde: "2026-01-01", hasta: "2026-01-31" });
  });

  test("personalizado: invierte el rango si desde es posterior a hasta", () => {
    expect(
      calcularRangoFechas("personalizado", HOY, { desde: "2026-02-15", hasta: "2026-02-01" }),
    ).toEqual({ desde: "2026-02-01", hasta: "2026-02-15" });
  });

  test("personalizado: usa hoy como respaldo si faltan las fechas", () => {
    expect(calcularRangoFechas("personalizado", HOY, {})).toEqual({ desde: HOY, hasta: HOY });
  });
});

describe("calcularPorcentajeDuplicados", () => {
  test("calcula el porcentaje redondeado a 1 decimal", () => {
    expect(calcularPorcentajeDuplicados(3, 200)).toBe(1.5);
  });

  test("devuelve 0 cuando no hay pacientes activas (evita división por cero)", () => {
    expect(calcularPorcentajeDuplicados(0, 0)).toBe(0);
  });

  test("devuelve 0 cuando no hay duplicados", () => {
    expect(calcularPorcentajeDuplicados(0, 150)).toBe(0);
  });
});

describe("mapearKpiResumen", () => {
  test("mapea el jsonb de kpi_resumen a un objeto camelCase tipado", () => {
    const json = {
      citas_total: 10,
      citas_atendidas: 7,
      citas_no_asistio: 1,
      tasa_inasistencia_pct: 12.5,
      cobertura_recordatorios_pct: 80,
      pacientes_nuevos: 3,
      atenciones_firmadas: 5,
      seguimientos_vencidos: 2,
      citas_por_dia: [{ dia: "2026-09-01", total: 3 }],
      atenciones_por_servicio: [{ servicio: "Ecografía", total: 4 }],
    };
    expect(mapearKpiResumen(json)).toEqual({
      citasTotal: 10,
      citasAtendidas: 7,
      citasNoAsistio: 1,
      tasaInasistenciaPct: 12.5,
      coberturaRecordatoriosPct: 80,
      pacientesNuevos: 3,
      atencionesFirmadas: 5,
      seguimientosVencidos: 2,
      citasPorDia: [{ dia: "2026-09-01", total: 3 }],
      atencionesPorServicio: [{ servicio: "Ecografía", total: 4 }],
    });
  });

  test("los porcentajes null (denominador 0 en BD) quedan como null, no 0", () => {
    const resultado = mapearKpiResumen({ tasa_inasistencia_pct: null, cobertura_recordatorios_pct: null });
    expect(resultado.tasaInasistenciaPct).toBeNull();
    expect(resultado.coberturaRecordatoriosPct).toBeNull();
  });

  test("devuelve un resumen vacío si el jsonb es null o no es un objeto", () => {
    expect(mapearKpiResumen(null).citasTotal).toBe(0);
    expect(mapearKpiResumen(null).citasPorDia).toEqual([]);
    expect(mapearKpiResumen("no-es-objeto").atencionesPorServicio).toEqual([]);
  });
});

describe("mapearGruposDuplicados", () => {
  test("convierte las filas de pacientes_posibles_duplicados a camelCase", () => {
    const filas = [
      {
        nombres: "Maria Jose",
        apellidos: "Lopez Rios",
        fecha_nacimiento: "1990-05-10",
        cantidad: 2,
        paciente_ids: ["id-1", "id-2"],
      },
    ];
    expect(mapearGruposDuplicados(filas)).toEqual([
      {
        nombres: "Maria Jose",
        apellidos: "Lopez Rios",
        fechaNacimiento: "1990-05-10",
        cantidad: 2,
        pacienteIds: ["id-1", "id-2"],
      },
    ]);
  });

  test("devuelve un arreglo vacío si no hay grupos", () => {
    expect(mapearGruposDuplicados([])).toEqual([]);
  });
});
