import { describe, expect, it } from "vitest";
import { marcarEnviadoSchema, marcarFallidoSchema } from "./schemas";

const UUID = "f0a1b2c3-0000-4000-8000-000000000001";

describe("marcarEnviadoSchema", () => {
  it("exige un identificador válido", () => {
    expect(marcarEnviadoSchema.safeParse({ id: UUID }).success).toBe(true);
    expect(marcarEnviadoSchema.safeParse({ id: "no" }).success).toBe(false);
  });
});

describe("marcarFallidoSchema", () => {
  it("exige motivo no vacío", () => {
    expect(
      marcarFallidoSchema.safeParse({ id: UUID, motivo: "No responde" }).success,
    ).toBe(true);
    expect(marcarFallidoSchema.safeParse({ id: UUID, motivo: "   " }).success).toBe(false);
  });
});
