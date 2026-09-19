import { z } from "zod";

export const marcarEnviadoSchema = z.object({
  id: z.string().uuid("Identificador de recordatorio no válido"),
});

export const marcarFallidoSchema = z.object({
  id: z.string().uuid("Identificador de recordatorio no válido"),
  motivo: z
    .string()
    .trim()
    .min(1, "El motivo es obligatorio")
    .max(300, "El motivo es demasiado largo"),
});

export type MarcarEnviadoInput = z.infer<typeof marcarEnviadoSchema>;
export type MarcarFallidoInput = z.infer<typeof marcarFallidoSchema>;
