import { z } from "zod";

export const ROLES = [
  "admin",
  "medico",
  "obstetra",
  "asistente",
  "soporte",
] as const;

const rolSchema = z.enum(ROLES);

export const crearUsuarioSchema = z.object({
  nombreCompleto: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre es demasiado largo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico no válido"),
  rol: rolSchema,
});

export const cambiarRolSchema = z.object({
  usuarioId: z.string().uuid("Identificador de usuario no válido"),
  rol: rolSchema,
});

export const activarUsuarioSchema = z.object({
  usuarioId: z.string().uuid("Identificador de usuario no válido"),
  activo: z.boolean(),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type CambiarRolInput = z.infer<typeof cambiarRolSchema>;
export type ActivarUsuarioInput = z.infer<typeof activarUsuarioSchema>;
