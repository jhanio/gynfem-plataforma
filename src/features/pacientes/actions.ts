"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import {
  editarPacienteSchema,
  eliminarPacienteSchema,
  pacienteSchema,
} from "./schemas";
import { buscarPacienteActivaPorDocumento } from "./queries";

/**
 * Resultado de crear/editar una paciente. En caso de documento duplicado
 * (23505) incluye el id de la ficha existente para poder enlazarla desde
 * la UI, sin exponer más datos de la paciente en el mensaje de error.
 */
export type ResultadoGuardarPaciente =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string; idExistente?: string };

function esErrorDocumentoDuplicado(code?: string): boolean {
  return code === "23505";
}

/** Crea una paciente (registro maestro único por documento). */
export async function crearPaciente(
  input: unknown,
): Promise<ResultadoGuardarPaciente> {
  await requireRol("admin", "medico", "obstetra", "asistente");

  const parsed = pacienteSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .insert({
      tipo_documento: d.tipoDocumento,
      numero_documento: d.numeroDocumento,
      nombres: d.nombres,
      apellidos: d.apellidos,
      fecha_nacimiento: d.fechaNacimiento || null,
      telefono: d.telefono || null,
      email: d.email || null,
      direccion: d.direccion || null,
      distrito: d.distrito || null,
      canal_preferido: d.canalPreferido,
      acepta_recordatorios: d.aceptaRecordatorios,
      consentimiento_datos: d.consentimientoDatos,
      consentimiento_fecha: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    if (esErrorDocumentoDuplicado(error?.code)) {
      const idExistente = await buscarPacienteActivaPorDocumento(
        d.tipoDocumento,
        d.numeroDocumento,
      );
      return {
        ok: false,
        error: "Ya existe una paciente registrada con ese documento.",
        idExistente: idExistente ?? undefined,
      };
    }
    return fallo("No se pudo registrar la paciente.");
  }

  revalidatePath("/pacientes");
  return ok({ id: data.id });
}

/** Edita los datos de una paciente existente. */
export async function editarPaciente(
  input: unknown,
): Promise<ResultadoGuardarPaciente> {
  await requireRol("admin", "medico", "obstetra", "asistente");

  const parsed = editarPacienteSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("pacientes")
    .update({
      tipo_documento: d.tipoDocumento,
      numero_documento: d.numeroDocumento,
      nombres: d.nombres,
      apellidos: d.apellidos,
      fecha_nacimiento: d.fechaNacimiento || null,
      telefono: d.telefono || null,
      email: d.email || null,
      direccion: d.direccion || null,
      distrito: d.distrito || null,
      canal_preferido: d.canalPreferido,
      acepta_recordatorios: d.aceptaRecordatorios,
    })
    .eq("id", d.id);

  if (error) {
    if (esErrorDocumentoDuplicado(error.code)) {
      const idExistente = await buscarPacienteActivaPorDocumento(
        d.tipoDocumento,
        d.numeroDocumento,
      );
      return {
        ok: false,
        error: "Ya existe otra paciente registrada con ese documento.",
        idExistente: idExistente ?? undefined,
      };
    }
    return fallo("No se pudieron guardar los cambios.");
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${d.id}`);
  return ok({ id: d.id });
}

/**
 * Marca una paciente como eliminada (duplicado), sin borrado físico
 * (ADR-06). Solo admin.
 */
export async function eliminarPaciente(
  input: unknown,
): Promise<Resultado<null>> {
  await requireRol("admin");

  const parsed = eliminarPacienteSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Identificador de paciente no válido.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pacientes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  if (error) {
    return fallo("No se pudo marcar la paciente como eliminada.");
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${parsed.data.id}`);
  return ok(null);
}
