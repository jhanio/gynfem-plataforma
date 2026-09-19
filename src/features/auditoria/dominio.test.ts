import { describe, expect, test } from "vitest";
import { enmascararSiEsClinica, esTablaClinica, TABLAS_CLINICAS } from "./dominio";

describe("esTablaClinica", () => {
  test.each(TABLAS_CLINICAS)("%s es clínica", (tabla) => {
    expect(esTablaClinica(tabla)).toBe(true);
  });

  test.each(["pacientes", "citas", "servicios", "seguimientos", "profiles"])(
    "%s NO es clínica",
    (tabla) => {
      expect(esTablaClinica(tabla)).toBe(false);
    },
  );
});

describe("enmascararSiEsClinica", () => {
  test("oculta datosAntes y datosDespues cuando la tabla es clínica", () => {
    const resultado = enmascararSiEsClinica({
      tabla: "atenciones",
      datosAntes: { estado: "borrador" },
      datosDespues: { campos_modificados: ["diagnostico"] },
    });
    expect(resultado).toEqual({
      tabla: "atenciones",
      datosAntes: null,
      datosDespues: null,
    });
  });

  test("conserva datosAntes y datosDespues cuando la tabla no es clínica", () => {
    const antes = { activo: false };
    const despues = { activo: true };
    const resultado = enmascararSiEsClinica({
      tabla: "profiles",
      datosAntes: antes,
      datosDespues: despues,
    });
    expect(resultado).toEqual({ tabla: "profiles", datosAntes: antes, datosDespues: despues });
  });
});
