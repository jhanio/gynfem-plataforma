import { z } from "zod";

export const TIPOS_SEGUIMIENTO = [
  "control",
  "resultado_pendiente",
  "procedimiento",
  "otro",
] as const;

export const ESTADOS_SEGUIMIENTO = [
  "pendiente",
  "contactada",
  "completado",
  "cancelado",
] as const;

export const crearSeguimientoSchema = z.object({
  pacienteId: z.string().uuid("Identificador de paciente no válido"),
  atencionId: z.string().uuid("Identificador de atención no válido").optional(),
  tipo: z.enum(TIPOS_SEGUIMIENTO),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(300, "La descripción es demasiado larga"),
  fechaObjetivo: z
    .string()
    .trim()
    .min(1, "La fecha objetivo es obligatoria"),
  responsableId: z.string().uuid("Responsable no válido").optional(),
});

export const cambiarEstadoSeguimientoSchema = z.object({
  id: z.string().uuid("Identificador de seguimiento no válido"),
  estado: z.enum(ESTADOS_SEGUIMIENTO),
  notas: z.string().trim().max(500, "Las notas son demasiado largas").optional(),
});

export type CrearSeguimientoInput = z.infer<typeof crearSeguimientoSchema>;
export type CambiarEstadoSeguimientoInput = z.infer<typeof cambiarEstadoSeguimientoSchema>;
