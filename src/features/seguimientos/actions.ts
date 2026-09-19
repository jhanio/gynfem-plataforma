"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import { cambiarEstadoSeguimientoSchema, crearSeguimientoSchema } from "./schemas";

/** Registra un seguimiento pendiente (HU-13): solo medico/obstetra, igual que la RLS. */
export async function crearSeguimiento(input: unknown): Promise<Resultado<{ id: string }>> {
  await requireRol("medico", "obstetra");

  const parsed = crearSeguimientoSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }
  const d = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("seguimientos")
    .insert({
      paciente_id: d.pacienteId,
      atencion_id: d.atencionId ?? null,
      tipo: d.tipo,
      descripcion: d.descripcion,
      fecha_objetivo: d.fechaObjetivo,
      responsable_id: d.responsableId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return fallo("No se pudo registrar el seguimiento.");
  }

  revalidatePath("/seguimientos");
  revalidatePath(`/pacientes/${d.pacienteId}`);
  if (d.atencionId) {
    revalidatePath(`/atenciones/${d.atencionId}`);
  }
  return ok({ id: data.id });
}

/** Cambia el estado de un seguimiento con una nota (HU-14): medico/obstetra/asistente. */
export async function cambiarEstadoSeguimiento(input: unknown): Promise<Resultado<null>> {
  await requireRol("medico", "obstetra", "asistente");

  const parsed = cambiarEstadoSeguimientoSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }
  const d = parsed.data;
  const supabase = await createClient();

  const completadoAt = d.estado === "completado" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("seguimientos")
    .update({ estado: d.estado, notas: d.notas ?? null, completado_at: completadoAt })
    .eq("id", d.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return fallo("No se pudo actualizar el seguimiento.");
  }
  if (!data) {
    return fallo("No se pudo actualizar: el seguimiento no existe o no tienes acceso.");
  }

  revalidatePath("/seguimientos");
  return ok(null);
}
