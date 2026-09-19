import { z } from "zod";

/** Precio opcional: "" o null → null; texto numérico → número. */
const precioSchema = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    }
    return v;
  },
  z
    .number({ error: "Precio no válido" })
    .min(0, "El precio no puede ser negativo")
    .nullable(),
);

export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre es demasiado largo"),
  categoria: z
    .string()
    .trim()
    .min(1, "La categoría es obligatoria")
    .max(60, "La categoría es demasiado larga"),
  duracionMin: z
    .number({ error: "La duración es obligatoria" })
    .int("La duración debe ser un número entero de minutos")
    .min(5, "La duración mínima es 5 minutos")
    .max(480, "La duración máxima es 480 minutos"),
  precioReferencial: precioSchema,
  activo: z.boolean(),
});

export const editarServicioSchema = servicioSchema.extend({
  id: z.string().uuid("Identificador de servicio no válido"),
});

export const activarServicioSchema = z.object({
  id: z.string().uuid("Identificador de servicio no válido"),
  activo: z.boolean(),
});

export type ServicioInput = z.infer<typeof servicioSchema>;
export type ServicioFormInput = z.input<typeof servicioSchema>;
export type EditarServicioInput = z.infer<typeof editarServicioSchema>;
export type ActivarServicioInput = z.infer<typeof activarServicioSchema>;
