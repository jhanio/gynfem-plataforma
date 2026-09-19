import { describe, expect, it } from "vitest";

import type { Rol } from "./roles";
import {
  MENU,
  menuParaRol,
  puedeVerRuta,
  rutaInicialParaRol,
} from "./roles";

const TODOS_LOS_ROLES: Rol[] = [
  "admin",
  "medico",
  "obstetra",
  "asistente",
  "soporte",
];

// Rutas esperadas por rol según el mapa acordado en la Fase 2.
const ESPERADO: Record<Rol, string[]> = {
  admin: [
    "/inicio",
    "/agenda",
    "/pacientes",
    "/seguimientos",
    "/recordatorios",
    "/dashboard",
    "/admin/usuarios",
    "/admin/servicios",
    "/admin/auditoria",
  ],
  medico: ["/inicio", "/agenda", "/pacientes", "/seguimientos", "/dashboard"],
  obstetra: ["/inicio", "/agenda", "/pacientes", "/seguimientos", "/dashboard"],
  asistente: [
    "/inicio",
    "/agenda",
    "/pacientes",
    "/seguimientos",
    "/recordatorios",
  ],
  soporte: ["/inicio"],
};

describe("menuParaRol", () => {
  it.each(TODOS_LOS_ROLES)("devuelve las rutas correctas para %s", (rol) => {
    const urls = menuParaRol(rol).map((item) => item.url);
    expect(urls).toEqual(ESPERADO[rol]);
  });

  it("todo ítem del menú tiene al menos un rol permitido", () => {
    for (const item of MENU) {
      expect(item.roles.length).toBeGreaterThan(0);
    }
  });

  it("solo admin ve el grupo de administración", () => {
    const soloAdmin = MENU.filter((i) => i.grupo === "administracion");
    for (const item of soloAdmin) {
      expect(item.roles).toEqual(["admin"]);
    }
  });
});

describe("puedeVerRuta", () => {
  it("asistente NO puede ver rutas de administración", () => {
    expect(puedeVerRuta("asistente", "/admin/usuarios")).toBe(false);
    expect(puedeVerRuta("asistente", "/admin/servicios")).toBe(false);
  });

  it("admin puede ver rutas de administración", () => {
    expect(puedeVerRuta("admin", "/admin/usuarios")).toBe(true);
  });

  it("médico NO puede ver recordatorios", () => {
    expect(puedeVerRuta("medico", "/recordatorios")).toBe(false);
  });

  it("médico SÍ puede ver dashboard; asistente no", () => {
    expect(puedeVerRuta("medico", "/dashboard")).toBe(true);
    expect(puedeVerRuta("asistente", "/dashboard")).toBe(false);
  });

  it("soporte solo puede ver inicio", () => {
    expect(puedeVerRuta("soporte", "/inicio")).toBe(true);
    expect(puedeVerRuta("soporte", "/pacientes")).toBe(false);
    expect(puedeVerRuta("soporte", "/agenda")).toBe(false);
  });

  it("respeta subrutas por prefijo", () => {
    expect(puedeVerRuta("asistente", "/pacientes/123-abc")).toBe(true);
    expect(puedeVerRuta("soporte", "/pacientes/123-abc")).toBe(false);
  });

  it("una ruta desconocida no es visible para nadie", () => {
    expect(puedeVerRuta("admin", "/ruta-inexistente")).toBe(false);
  });
});

describe("rutaInicialParaRol", () => {
  it("lleva a los roles operativos a la agenda", () => {
    expect(rutaInicialParaRol("admin")).toBe("/agenda");
    expect(rutaInicialParaRol("medico")).toBe("/agenda");
    expect(rutaInicialParaRol("obstetra")).toBe("/agenda");
    expect(rutaInicialParaRol("asistente")).toBe("/agenda");
  });

  it("soporte permanece en inicio", () => {
    expect(rutaInicialParaRol("soporte")).toBe("/inicio");
  });
});
