import { describe, expect, it } from "vitest";

import type { Rol } from "./roles";
import {
  requiereDesafioMfa,
  requiereInscripcionMfa,
  requiereMfa,
} from "./mfa";

const ESPERADO: Record<Rol, boolean> = {
  admin: true,
  medico: true,
  obstetra: true,
  asistente: false,
  soporte: false,
};

describe("requiereMfa", () => {
  for (const [rol, esperado] of Object.entries(ESPERADO) as [Rol, boolean][]) {
    it(`rol ${rol} -> ${esperado}`, () => {
      expect(requiereMfa(rol)).toBe(esperado);
    });
  }
});

describe("requiereInscripcionMfa", () => {
  it("sin ningún factor verificado (nextLevel aal1) exige inscripción", () => {
    expect(requiereInscripcionMfa({ currentLevel: "aal1", nextLevel: "aal1" })).toBe(true);
  });

  it("sin claim de aal (sesión antigua o sin MFA) exige inscripción", () => {
    expect(requiereInscripcionMfa({ currentLevel: null, nextLevel: null })).toBe(true);
  });

  it("con un factor verificado (nextLevel aal2) no exige inscripción", () => {
    expect(requiereInscripcionMfa({ currentLevel: "aal1", nextLevel: "aal2" })).toBe(false);
    expect(requiereInscripcionMfa({ currentLevel: "aal2", nextLevel: "aal2" })).toBe(false);
  });
});

describe("requiereDesafioMfa", () => {
  it("factor inscrito pero sesión aún en aal1 exige el desafío", () => {
    expect(requiereDesafioMfa({ currentLevel: "aal1", nextLevel: "aal2" })).toBe(true);
  });

  it("sesión ya en aal2 no exige el desafío", () => {
    expect(requiereDesafioMfa({ currentLevel: "aal2", nextLevel: "aal2" })).toBe(false);
  });

  it("sin ningún factor inscrito (nextLevel aal1) no es un desafío pendiente, es inscripción", () => {
    expect(requiereDesafioMfa({ currentLevel: "aal1", nextLevel: "aal1" })).toBe(false);
  });
});
