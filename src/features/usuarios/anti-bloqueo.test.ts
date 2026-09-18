import { describe, expect, it } from "vitest";

import { validarActivacion, validarCambioRol } from "./anti-bloqueo";

const ADMIN_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const USUARIO_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("validarCambioRol (anti-bloqueo)", () => {
  it("impide que un admin se quite a sí mismo el rol admin", () => {
    const r = validarCambioRol({
      actorId: ADMIN_A,
      objetivoId: ADMIN_A,
      nuevoRol: "asistente",
    });
    expect(r.ok).toBe(false);
  });

  it("permite que un admin mantenga su propio rol admin", () => {
    const r = validarCambioRol({
      actorId: ADMIN_A,
      objetivoId: ADMIN_A,
      nuevoRol: "admin",
    });
    expect(r.ok).toBe(true);
  });

  it("permite cambiar el rol de otro usuario", () => {
    const r = validarCambioRol({
      actorId: ADMIN_A,
      objetivoId: USUARIO_B,
      nuevoRol: "medico",
    });
    expect(r.ok).toBe(true);
  });
});

describe("validarActivacion (anti-bloqueo)", () => {
  it("impide que un admin se desactive a sí mismo", () => {
    const r = validarActivacion({
      actorId: ADMIN_A,
      objetivoId: ADMIN_A,
      activo: false,
    });
    expect(r.ok).toBe(false);
  });

  it("permite reactivarse a sí mismo (caso trivial)", () => {
    const r = validarActivacion({
      actorId: ADMIN_A,
      objetivoId: ADMIN_A,
      activo: true,
    });
    expect(r.ok).toBe(true);
  });

  it("permite desactivar a otro usuario", () => {
    const r = validarActivacion({
      actorId: ADMIN_A,
      objetivoId: USUARIO_B,
      activo: false,
    });
    expect(r.ok).toBe(true);
  });
});
