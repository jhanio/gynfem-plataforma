"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import { historiaSchema } from "./schemas";

const ROLES_CLINICOS = ["medico", "obstetra"] as const;

const pacienteIdSchema = z.string().uuid();

/** Crea o actualiza los antecedentes gineco-obstétricos de una paciente. */
export async function guardarHistoria(
  pacienteId: string,
  input: unknown,
): Promise<Resultado<null>> {
  await requireRol(...ROLES_CLINICOS);

  if (!pacienteIdSchema.safeParse(pacienteId).success) {
    return fallo("Identificador de paciente no válido.");
  }

  const parsed = historiaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("historias_clinicas").upsert(
    {
      paciente_id: pacienteId,
      grupo_sanguineo: d.grupoSanguineo || null,
      alergias: d.alergias || null,
      menarquia_edad: d.menarquiaEdad ?? null,
      gestas: d.gestas ?? null,
      partos: d.partos ?? null,
      abortos: d.abortos ?? null,
      cesareas: d.cesareas ?? null,
      fecha_ultima_regla: d.fechaUltimaRegla ?? null,
      metodo_anticonceptivo: d.metodoAnticonceptivo || null,
      antecedentes_personales: d.antecedentesPersonales || null,
      antecedentes_quirurgicos: d.antecedentesQuirurgicos || null,
      antecedentes_familiares: d.antecedentesFamiliares || null,
    },
    { onConflict: "paciente_id" },
  );

  if (error) {
    return fallo("No se pudieron guardar los antecedentes.");
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  return ok(null);
}
