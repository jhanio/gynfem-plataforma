import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  listarAtencionesPaciente,
  type AtencionResumen,
} from "@/features/atenciones/queries";

export interface Antecedentes {
  id: string;
  grupoSanguineo: string | null;
  alergias: string | null;
  menarquiaEdad: number | null;
  gestas: number | null;
  partos: number | null;
  abortos: number | null;
  cesareas: number | null;
  fechaUltimaRegla: string | null;
  metodoAnticonceptivo: string | null;
  antecedentesPersonales: string | null;
  antecedentesQuirurgicos: string | null;
  antecedentesFamiliares: string | null;
}

export type CargaHistoria =
  | { ok: true; antecedentes: Antecedentes | null; atenciones: AtencionResumen[] }
  | { ok: false };

interface FilaHistoria {
  id: string;
  grupo_sanguineo: string | null;
  alergias: string | null;
  menarquia_edad: number | null;
  gestas: number | null;
  partos: number | null;
  abortos: number | null;
  cesareas: number | null;
  fecha_ultima_regla: string | null;
  metodo_anticonceptivo: string | null;
  antecedentes_personales: string | null;
  antecedentes_quirurgicos: string | null;
  antecedentes_familiares: string | null;
}

function mapearAntecedentes(fila: FilaHistoria): Antecedentes {
  return {
    id: fila.id,
    grupoSanguineo: fila.grupo_sanguineo,
    alergias: fila.alergias,
    menarquiaEdad: fila.menarquia_edad,
    gestas: fila.gestas,
    partos: fila.partos,
    abortos: fila.abortos,
    cesareas: fila.cesareas,
    fechaUltimaRegla: fila.fecha_ultima_regla,
    metodoAnticonceptivo: fila.metodo_anticonceptivo,
    antecedentesPersonales: fila.antecedentes_personales,
    antecedentesQuirurgicos: fila.antecedentes_quirurgicos,
    antecedentesFamiliares: fila.antecedentes_familiares,
  };
}

/**
 * Carga la historia clínica (antecedentes + línea de tiempo de atenciones)
 * registrando el acceso READ en auditoría dentro de la MISMA lectura.
 * Si el registro de acceso falla, NO se devuelven datos clínicos.
 */
export async function cargarHistoriaClinica(
  pacienteId: string,
): Promise<CargaHistoria> {
  const supabase = await createClient();

  // 1) Registro de acceso clínico (auditoría) antes de entregar los datos.
  const { error: errorAcceso } = await supabase.rpc("registrar_acceso_historia", {
    p_paciente_id: pacienteId,
  });
  if (errorAcceso) {
    return { ok: false };
  }

  // 2) Antecedentes (0 o 1 fila por paciente).
  const { data, error } = await supabase
    .from("historias_clinicas")
    .select(
      `id, grupo_sanguineo, alergias, menarquia_edad, gestas, partos, abortos,
       cesareas, fecha_ultima_regla, metodo_anticonceptivo,
       antecedentes_personales, antecedentes_quirurgicos, antecedentes_familiares`,
    )
    .eq("paciente_id", pacienteId)
    .maybeSingle();

  if (error) {
    return { ok: false };
  }

  const atenciones = await listarAtencionesPaciente(pacienteId);

  return {
    ok: true,
    antecedentes: data ? mapearAntecedentes(data as FilaHistoria) : null,
    atenciones,
  };
}
