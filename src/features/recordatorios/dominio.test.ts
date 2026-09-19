import { describe, expect, test } from "vitest";
import { construirUrlWhatsapp, normalizarTelefonoPeru } from "./dominio";

describe("normalizarTelefonoPeru", () => {
  test("convierte un celular peruano de 9 dígitos a formato internacional 51XXXXXXXXX", () => {
    expect(normalizarTelefonoPeru("987654321")).toBe("51987654321");
  });

  test("acepta espacios y guiones y los ignora", () => {
    expect(normalizarTelefonoPeru("987 654 321")).toBe("51987654321");
    expect(normalizarTelefonoPeru("987-654-321")).toBe("51987654321");
  });

  test("acepta el prefijo +51 ya incluido", () => {
    expect(normalizarTelefonoPeru("+51987654321")).toBe("51987654321");
    expect(normalizarTelefonoPeru("51987654321")).toBe("51987654321");
  });

  test("rechaza teléfonos que no empiezan en 9 (fijos u otros formatos)", () => {
    expect(normalizarTelefonoPeru("123456789")).toBeNull();
  });

  test("rechaza teléfonos con más o menos de 9 dígitos", () => {
    expect(normalizarTelefonoPeru("98765432")).toBeNull();
    expect(normalizarTelefonoPeru("9876543210")).toBeNull();
  });

  test("rechaza vacío o nulo", () => {
    expect(normalizarTelefonoPeru("")).toBeNull();
    expect(normalizarTelefonoPeru(null)).toBeNull();
  });
});

describe("construirUrlWhatsapp", () => {
  test("arma un enlace wa.me con el teléfono normalizado y el mensaje codificado", () => {
    const url = construirUrlWhatsapp("987654321", "Hola Ana, le recordamos su cita");
    expect(url).toBe(
      "https://wa.me/51987654321?text=Hola%20Ana%2C%20le%20recordamos%20su%20cita",
    );
  });

  test("devuelve null si el teléfono no es válido", () => {
    expect(construirUrlWhatsapp("123", "Mensaje")).toBeNull();
  });
});
