"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import {
  activarServicioSchema,
  editarServicioSchema,
  servicioSchema,
} from "./schemas";

function traducirError(code?: string): string {
  if (code === "23505") return "Ya existe un servicio con ese nombre.";
  if (code === "23514") return "Algún valor está fuera de los límites permitidos.";
  return "No se pudo guardar el servicio.";
}

/** Crea un servicio del catálogo. */
export async function crearServicio(input: unknown): Promise<Resultado<null>> {
  await requireRol("admin");

  const parsed = servicioSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").insert({
    nombre: parsed.data.nombre,
    categoria: parsed.data.categoria,
    duracion_min: parsed.data.duracionMin,
    precio_referencial: parsed.data.precioReferencial,
    activo: parsed.data.activo,
  });

  if (error) {
    return fallo(traducirError(error.code));
  }

  revalidatePath("/admin/servicios");
  return ok(null);
}

/** Edita un servicio existente. */
export async function editarServicio(input: unknown): Promise<Resultado<null>> {
  await requireRol("admin");

  const parsed = editarServicioSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("servicios")
    .update({
      nombre: parsed.data.nombre,
      categoria: parsed.data.categoria,
      duracion_min: parsed.data.duracionMin,
      precio_referencial: parsed.data.precioReferencial,
      activo: parsed.data.activo,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return fallo(traducirError(error.code));
  }

  revalidatePath("/admin/servicios");
  return ok(null);
}

/**
 * Activa o desactiva un servicio (sin borrado físico: HU-19 / ADR-06).
 */
export async function activarDesactivarServicio(
  input: unknown,
): Promise<Resultado<null>> {
  await requireRol("admin");

  const parsed = activarServicioSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Datos no válidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("servicios")
    .update({ activo: parsed.data.activo })
    .eq("id", parsed.data.id);

  if (error) {
    return fallo("No se pudo actualizar el estado del servicio.");
  }

  revalidatePath("/admin/servicios");
  return ok(null);
}
