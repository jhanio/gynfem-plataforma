import { z } from "zod";

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida");

export const crearCitaSchema = z.object({
  pacienteId: z.string().uuid("Selecciona una paciente"),
  servicioId: z.string().uuid("Selecciona un servicio"),
  profesionalId: z.string().uuid("Selecciona un profesional"),
  fecha: fechaSchema,
  hora: horaSchema,
  notasAdmin: z.string().trim().max(500, "Las notas son demasiado largas").optional(),
});

export const confirmarCitaSchema = z.object({
  id: z.string().uuid("Identificador de cita no válido"),
});

export const cancelarCitaSchema = z.object({
  id: z.string().uuid("Identificador de cita no válido"),
  motivo: z.string().trim().max(500, "El motivo es demasiado largo").optional(),
});

export const marcarNoAsistioSchema = z.object({
  id: z.string().uuid("Identificador de cita no válido"),
});

export const reprogramarCitaSchema = z.object({
  id: z.string().uuid("Identificador de cita no válido"),
  fecha: fechaSchema,
  hora: horaSchema,
  motivo: z
    .string()
    .trim()
    .min(1, "Debes indicar un motivo de reprogramación")
    .max(500, "El motivo es demasiado largo"),
});

export type CrearCitaInput = z.infer<typeof crearCitaSchema>;
export type ConfirmarCitaInput = z.infer<typeof confirmarCitaSchema>;
export type CancelarCitaInput = z.infer<typeof cancelarCitaSchema>;
export type MarcarNoAsistioInput = z.infer<typeof marcarNoAsistioSchema>;
export type ReprogramarCitaInput = z.infer<typeof reprogramarCitaSchema>;
