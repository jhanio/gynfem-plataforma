"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import {
  adendaSchema,
  firmarAtencionSchema,
  guardarBorradorSchema,
  iniciarAtencionSchema,
} from "./schemas";

const ROLES_CLINICOS = ["medico", "obstetra"] as const;

/**
 * Inicia una atención en borrador desde una cita (precarga paciente y servicio).
 * Si ya existe una atención para esa cita, solo la devuelve si pertenece al
 * profesional actual; nunca expone el borrador de otro profesional.
 */
export async function iniciarAtencion(
  input: unknown,
): Promise<Resultado<{ id: string }>> {
  const perfil = await requireRol(...ROLES_CLINICOS);

  const parsed = iniciarAtencionSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }
  const { citaId, motivoConsulta } = parsed.data;
  const supabase = await createClient();

  const { data: cita, error: errorCita } = await supabase
    .from("citas")
    .select("paciente_id, servicio_id, estado")
    .eq("id", citaId)
    .maybeSingle();

  if (errorCita || !cita) {
    return fallo("La cita no existe o no tiene acceso a ella.");
  }

  const { data, error } = await supabase
    .from("atenciones")
    .insert({
      cita_id: citaId,
      paciente_id: cita.paciente_id,
      servicio_id: cita.servicio_id,
      motivo_consulta: motivoConsulta,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Ya existe una atención para esta cita (unique cita_id).
    if (error?.code === "23505") {
      const { data: existente } = await supabase
        .from("atenciones")
        .select("id, profesional_id")
        .eq("cita_id", citaId)
        .maybeSingle();

      if (existente && existente.profesional_id === perfil.id) {
        return ok({ id: existente.id });
      }
      return fallo(
        "Ya existe una atención para esta cita registrada por otro profesional.",
      );
    }
    return fallo("No se pudo iniciar la atención.");
  }

  revalidatePath("/agenda");
  return ok({ id: data.id });
}

/** Guarda cambios en un borrador de atención (solo el autor, mientras sea borrador). */
export async function guardarBorrador(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_CLINICOS);

  const parsed = guardarBorradorSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }
  const d = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("atenciones")
    .update({
      motivo_consulta: d.motivoConsulta,
      anamnesis: d.anamnesis || null,
      examen_fisico: d.examenFisico || null,
      diagnostico: d.diagnostico || null,
      cie10: d.cie10,
      plan_tratamiento: d.planTratamiento || null,
      indicaciones: d.indicaciones || null,
    })
    .eq("id", d.id)
    .eq("estado", "borrador")
    .select("id")
    .maybeSingle();

  if (error) {
    return fallo("No se pudieron guardar los cambios.");
  }
  if (!data) {
    return fallo(
      "No se pudo guardar: la atención ya no es un borrador editable o no te pertenece.",
    );
  }

  revalidatePath(`/atenciones/${d.id}`);
  return ok(null);
}

/**
 * Firma una atención: el estado pasa a 'firmada' y la BD asigna firmada_at y
 * firmada_por (nunca el cliente). Si afecta 0 filas se trata como error.
 */
export async function firmarAtencion(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_CLINICOS);

  const parsed = firmarAtencionSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Identificador de atención no válido.");
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("atenciones")
    .update({ estado: "firmada" })
    .eq("id", parsed.data.id)
    .eq("estado", "borrador")
    .select("id")
    .maybeSingle();

  if (error) {
    return fallo("No se pudo firmar la atención.");
  }
  if (!data) {
    return fallo(
      "No se pudo firmar: la atención no es un borrador que te pertenezca.",
    );
  }

  revalidatePath(`/atenciones/${parsed.data.id}`);
  revalidatePath("/agenda");
  return ok(null);
}

/** Agrega una adenda a una atención firmada (registro inmutable, autor en BD). */
export async function agregarAdenda(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_CLINICOS);

  const parsed = adendaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa el contenido de la adenda.");
  }
  const supabase = await createClient();

  const { error } = await supabase.from("adendas").insert({
    atencion_id: parsed.data.atencionId,
    contenido: parsed.data.contenido,
  });

  if (error) {
    if (error.code === "42501") {
      return fallo("Solo puedes agregar adendas a atenciones firmadas.");
    }
    return fallo("No se pudo registrar la adenda.");
  }

  revalidatePath(`/atenciones/${parsed.data.atencionId}`);
  return ok(null);
}
