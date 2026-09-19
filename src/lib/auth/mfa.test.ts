import { describe, expect, it } from "vitest";

import type { Rol } from "./roles";
import {
  idsFactoresTotpSinVerificar,
  mensajeErrorMfa,
  nombreFactorMfa,
  requiereDesafioMfa,
  requiereInscripcionMfa,
  requiereMfa,
  type FactorMfa,
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

describe("idsFactoresTotpSinVerificar", () => {
  const factor = (overrides: Partial<FactorMfa>): FactorMfa => ({
    id: "id",
    factor_type: "totp",
    status: "unverified",
    ...overrides,
  });

  it("incluye factores TOTP sin verificar", () => {
    const factores = [factor({ id: "a", status: "unverified" })];
    expect(idsFactoresTotpSinVerificar(factores)).toEqual(["a"]);
  });

  it("excluye factores TOTP ya verificados", () => {
    const factores = [factor({ id: "a", status: "verified" })];
    expect(idsFactoresTotpSinVerificar(factores)).toEqual([]);
  });

  it("excluye factores que no son TOTP aunque estén sin verificar", () => {
    const factores = [factor({ id: "a", factor_type: "phone", status: "unverified" })];
    expect(idsFactoresTotpSinVerificar(factores)).toEqual([]);
  });

  it("devuelve varios ids cuando hay varios factores TOTP sin verificar", () => {
    const factores = [
      factor({ id: "a", status: "unverified" }),
      factor({ id: "b", status: "verified" }),
      factor({ id: "c", status: "unverified" }),
    ];
    expect(idsFactoresTotpSinVerificar(factores)).toEqual(["a", "c"]);
  });

  it("lista vacía cuando no hay factores", () => {
    expect(idsFactoresTotpSinVerificar([])).toEqual([]);
  });
});

describe("nombreFactorMfa", () => {
  it("incluye el prefijo GynFem y la fecha en formato ISO", () => {
    const fecha = new Date("2026-09-19T18:11:36.000Z");
    expect(nombreFactorMfa(fecha)).toBe("GynFem 2026-09-19T18:11:36.000Z");
  });

  it("nunca queda vacío", () => {
    expect(nombreFactorMfa(new Date()).length).toBeGreaterThan(0);
  });

  it("dos fechas distintas producen nombres distintos", () => {
    const a = nombreFactorMfa(new Date("2026-09-19T18:11:36.000Z"));
    const b = nombreFactorMfa(new Date("2026-09-19T18:11:37.000Z"));
    expect(a).not.toBe(b);
  });
});

describe("mensajeErrorMfa", () => {
  it("mapea mfa_factor_name_conflict a un mensaje que explica la limpieza automática", () => {
    expect(mensajeErrorMfa("mfa_factor_name_conflict")).toMatch(/inscripción pendiente/);
  });

  it("mapea mfa_verification_failed a un mensaje de código incorrecto", () => {
    expect(mensajeErrorMfa("mfa_verification_failed")).toMatch(/Código incorrecto/);
  });

  it("devuelve un mensaje genérico para un código desconocido", () => {
    expect(mensajeErrorMfa("codigo_inventado_que_no_existe")).toBe(
      "No se pudo completar la operación de verificación en dos pasos. Intenta de nuevo.",
    );
  });

  it("devuelve un mensaje genérico cuando no hay código", () => {
    expect(mensajeErrorMfa(undefined)).toBe(
      "No se pudo completar la operación de verificación en dos pasos. Intenta de nuevo.",
    );
  });

  it("ningún mensaje mapeado contiene datos personales (correo, nombre)", () => {
    for (const mensaje of [
      mensajeErrorMfa("mfa_factor_name_conflict"),
      mensajeErrorMfa("mfa_verification_failed"),
      mensajeErrorMfa("mfa_verification_rejected"),
      mensajeErrorMfa("mfa_challenge_expired"),
      mensajeErrorMfa("mfa_ip_address_mismatch"),
      mensajeErrorMfa("mfa_factor_not_found"),
      mensajeErrorMfa("too_many_enrolled_mfa_factors"),
      mensajeErrorMfa("over_request_rate_limit"),
    ]) {
      expect(mensaje).not.toMatch(/@/);
    }
  });
});
