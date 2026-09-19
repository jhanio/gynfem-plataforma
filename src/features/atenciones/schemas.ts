import { z } from "zod";

/** CIE-10: una letra + dos dígitos, con decimal opcional (p. ej. N80, N80.1). */
export const CIE10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/;

const MAX_TEXTO = 5000;

function normalizarCie10(valor: unknown): string[] {
  const bruto = Array.isArray(valor)
    ? valor.map(String)
    : typeof valor === "string"
      ? valor.split(/[\s,]+/)
      : [];
  return bruto.map((c) => c.trim().toUpperCase()).filter(Boolean);
}

const cie10Schema = z.preprocess(
  normalizarCie10,
  z
    .array(
      z
        .string()
        .regex(CIE10_REGEX, "Código CIE-10 inválido (p. ej. N80 o N80.1)"),
    )
    .max(20, "Demasiados códigos CIE-10"),
);

const textoOpcional = (max = MAX_TEXTO) =>
  z.string().trim().max(max, "El texto es demasiado largo").optional();

const motivoConsultaSchema = z
  .string()
  .trim()
  .min(1, "El motivo de consulta es obligatorio")
  .max(500, "El motivo de consulta es demasiado largo");

export const iniciarAtencionSchema = z.object({
  citaId: z.string().uuid("Identificador de cita no válido"),
  motivoConsulta: motivoConsultaSchema,
});

export const guardarBorradorSchema = z.object({
  id: z.string().uuid("Identificador de atención no válido"),
  motivoConsulta: motivoConsultaSchema,
  anamnesis: textoOpcional(),
  examenFisico: textoOpcional(),
  diagnostico: textoOpcional(),
  cie10: cie10Schema,
  planTratamiento: textoOpcional(),
  indicaciones: textoOpcional(),
});

export const firmarAtencionSchema = z.object({
  id: z.string().uuid("Identificador de atención no válido"),
});

export const adendaSchema = z.object({
  atencionId: z.string().uuid("Identificador de atención no válido"),
  contenido: z
    .string()
    .trim()
    .min(1, "El contenido de la adenda es obligatorio")
    .max(MAX_TEXTO, "El contenido es demasiado largo"),
});

export type IniciarAtencionInput = z.infer<typeof iniciarAtencionSchema>;
export type GuardarBorradorInput = z.infer<typeof guardarBorradorSchema>;
export type GuardarBorradorFormInput = z.input<typeof guardarBorradorSchema>;
export type FirmarAtencionInput = z.infer<typeof firmarAtencionSchema>;
export type AdendaInput = z.infer<typeof adendaSchema>;
export type AdendaFormInput = z.input<typeof adendaSchema>;
