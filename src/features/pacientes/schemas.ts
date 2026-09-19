import { z } from "zod";

export const TIPOS_DOCUMENTO = ["DNI", "CE", "PASAPORTE"] as const;
export const CANALES_RECORDATORIO = [
  "whatsapp_manual",
  "whatsapp_api",
  "email",
  "sms",
] as const;

const hoyISO = () => new Date().toISOString().slice(0, 10);

const numeroDocumentoBase = z
  .string()
  .trim()
  .min(1, "El número de documento es obligatorio")
  .max(20, "El número de documento es demasiado largo");

const telefonoSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^9[0-9]{8}$/.test(v), {
    message: "El teléfono debe tener 9 dígitos y empezar en 9",
  });

const emailSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || z.email().safeParse(v).success, {
    message: "Correo electrónico no válido",
  });

export const pacienteSchema = z
  .object({
    tipoDocumento: z.enum(TIPOS_DOCUMENTO),
    numeroDocumento: numeroDocumentoBase,
    nombres: z
      .string()
      .trim()
      .min(1, "Los nombres son obligatorios")
      .max(120, "Los nombres son demasiado largos"),
    apellidos: z
      .string()
      .trim()
      .min(1, "Los apellidos son obligatorios")
      .max(120, "Los apellidos son demasiado largos"),
    fechaNacimiento: z
      .string()
      .trim()
      .refine((v) => v === "" || v <= hoyISO(), {
        message: "La fecha de nacimiento no puede ser futura",
      }),
    telefono: telefonoSchema,
    email: emailSchema,
    direccion: z.string().trim().max(200, "La dirección es demasiado larga"),
    distrito: z.string().trim().max(100, "El distrito es demasiado largo"),
    canalPreferido: z.enum(CANALES_RECORDATORIO),
    aceptaRecordatorios: z.boolean(),
    consentimientoDatos: z
      .boolean()
      .refine((v) => v === true, {
        message: "Debes registrar el consentimiento de tratamiento de datos",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.tipoDocumento === "DNI" && !/^[0-9]{8}$/.test(data.numeroDocumento)) {
      ctx.addIssue({
        code: "custom",
        path: ["numeroDocumento"],
        message: "El DNI debe tener 8 dígitos",
      });
    }
    if (
      data.tipoDocumento !== "DNI" &&
      !/^[A-Za-z0-9]+$/.test(data.numeroDocumento)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["numeroDocumento"],
        message: "El documento solo admite letras y números",
      });
    }
  });

export const editarPacienteSchema = pacienteSchema.and(
  z.object({ id: z.string().uuid("Identificador de paciente no válido") }),
);

export const eliminarPacienteSchema = z.object({
  id: z.string().uuid("Identificador de paciente no válido"),
});

export type PacienteInput = z.infer<typeof pacienteSchema>;
export type PacienteFormInput = z.input<typeof pacienteSchema>;
export type EditarPacienteInput = z.infer<typeof editarPacienteSchema>;
export type EliminarPacienteInput = z.infer<typeof eliminarPacienteSchema>;
