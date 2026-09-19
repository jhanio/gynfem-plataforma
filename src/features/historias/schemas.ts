import { z } from "zod";

const MAX_TEXTO = 5000;

/** Campo numérico entero opcional: "" | null | undefined → null; valida rango. */
function numeroOpcional(min: number, max: number, etiqueta: string) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z
      .number({ message: `${etiqueta} debe ser un número` })
      .int(`${etiqueta} debe ser un número entero`)
      .min(min, `${etiqueta} fuera de rango`)
      .max(max, `${etiqueta} fuera de rango`)
      .nullable(),
  );
}

const textoOpcional = (max = MAX_TEXTO) =>
  z.string().trim().max(max, "El texto es demasiado largo").optional();

const fechaOpcional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .nullable(),
);

export const historiaSchema = z.object({
  grupoSanguineo: z.string().trim().max(10, "Valor demasiado largo").optional(),
  alergias: textoOpcional(2000),
  menarquiaEdad: numeroOpcional(5, 25, "La edad de menarquia"),
  gestas: numeroOpcional(0, 30, "El número de gestas"),
  partos: numeroOpcional(0, 30, "El número de partos"),
  abortos: numeroOpcional(0, 30, "El número de abortos"),
  cesareas: numeroOpcional(0, 30, "El número de cesáreas"),
  fechaUltimaRegla: fechaOpcional,
  metodoAnticonceptivo: z
    .string()
    .trim()
    .max(200, "Valor demasiado largo")
    .optional(),
  antecedentesPersonales: textoOpcional(),
  antecedentesQuirurgicos: textoOpcional(),
  antecedentesFamiliares: textoOpcional(),
});

export type HistoriaInput = z.infer<typeof historiaSchema>;
export type HistoriaFormInput = z.input<typeof historiaSchema>;
