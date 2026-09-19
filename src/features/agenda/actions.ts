"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { combinarFechaHoraLima } from "@/lib/fechas";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import { sanitizarTerminoBusqueda } from "@/features/pacientes/busqueda";
import {
  cancelarCitaSchema,
  confirmarCitaSchema,
  crearCitaSchema,
  marcarNoAsistioSchema,
  reprogramarCitaSchema,
} from "./schemas";
import { calcularFin } from "./dominio";

const ROLES_AGENDA = ["admin", "medico", "obstetra", "asistente"] as const;

const MENSAJE_CRUCE_HORARIO = "El profesional ya tiene una cita en ese horario";

function esErrorCruceHorario(code?: string): boolean {
  return code === "23P01";
}

/** Registra una cita nueva. */
export async function crearCita(
  input: unknown,
): Promise<Resultado<{ id: string }>> {
  await requireRol(...ROLES_AGENDA);

  const parsed = crearCitaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { data: servicio, error: errorServicio } = await supabase
    .from("servicios")
    .select("duracion_min")
    .eq("id", d.servicioId)
    .eq("activo", true)
    .maybeSingle();

  if (errorServicio || !servicio) {
    return fallo("El servicio seleccionado no es válido.");
  }

  const inicio = combinarFechaHoraLima(d.fecha, d.hora);
  const fin = calcularFin(inicio, servicio.duracion_min);

  const { data, error } = await supabase
    .from("citas")
    .insert({
      paciente_id: d.pacienteId,
      profesional_id: d.profesionalId,
      servicio_id: d.servicioId,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      notas_admin: d.notasAdmin || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (esErrorCruceHorario(error?.code)) {
      return fallo(MENSAJE_CRUCE_HORARIO);
    }
    return fallo("No se pudo registrar la cita.");
  }

  revalidatePath("/agenda");
  return ok({ id: data.id });
}

/** Confirma una cita programada. */
export async function confirmarCita(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_AGENDA);

  const parsed = confirmarCitaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Identificador de cita no válido.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("citas")
    .update({ estado: "confirmada", confirmada_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("estado", "programada")
    .select("id")
    .maybeSingle();

  if (error) {
    return fallo("No se pudo confirmar la cita.");
  }
  if (!data) {
    return fallo("La cita ya no está en un estado que permita confirmarla.");
  }

  revalidatePath("/agenda");
  return ok(null);
}

/** Cancela una cita programada o confirmada. */
export async function cancelarCita(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_AGENDA);

  const parsed = cancelarCitaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("citas")
    .update({ estado: "cancelada", motivo_cambio: parsed.data.motivo || null })
    .eq("id", parsed.data.id)
    .in("estado", ["programada", "confirmada"])
    .select("id")
    .maybeSingle();

  if (error) {
    return fallo("No se pudo cancelar la cita.");
  }
  if (!data) {
    return fallo("La cita ya no está en un estado que permita cancelarla.");
  }

  revalidatePath("/agenda");
  return ok(null);
}

/** Marca una cita como no asistida. */
export async function marcarNoAsistio(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_AGENDA);

  const parsed = marcarNoAsistioSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Identificador de cita no válido.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("citas")
    .update({ estado: "no_asistio" })
    .eq("id", parsed.data.id)
    .in("estado", ["programada", "confirmada"])
    .select("id")
    .maybeSingle();

  if (error) {
    return fallo("No se pudo registrar la inasistencia.");
  }
  if (!data) {
    return fallo("La cita ya no está en un estado que permita marcar inasistencia.");
  }

  revalidatePath("/agenda");
  return ok(null);
}

/**
 * Reprograma una cita mediante la función transaccional de BD
 * (public.reprogramar_cita): crea la cita nueva enlazada y marca la
 * original como reprogramada, de forma atómica.
 */
export async function reprogramarCita(
  input: unknown,
): Promise<Resultado<{ id: string }>> {
  await requireRol(...ROLES_AGENDA);

  const parsed = reprogramarCitaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const d = parsed.data;
  const inicio = combinarFechaHoraLima(d.fecha, d.hora);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reprogramar_cita", {
    p_cita_id: d.id,
    p_nuevo_inicio: inicio.toISOString(),
    p_motivo: d.motivo,
  });

  if (error || !data) {
    if (esErrorCruceHorario(error?.code)) {
      return fallo(MENSAJE_CRUCE_HORARIO);
    }
    if (error?.code === "P0001") {
      return fallo(error.message);
    }
    if (error?.code === "P0002") {
      return fallo("La cita no existe o no tiene acceso a ella.");
    }
    if (error?.code === "42501") {
      return fallo("No tiene permisos para reprogramar esta cita.");
    }
    return fallo("No se pudo reprogramar la cita.");
  }

  revalidatePath("/agenda");
  return ok({ id: data });
}

export interface PacienteBusquedaAgenda {
  id: string;
  etiqueta: string;
}

/** Búsqueda de pacientes activas para el command de "Nueva cita". */
export async function buscarPacientesAgenda(
  q: string,
): Promise<PacienteBusquedaAgenda[]> {
  await requireRol(...ROLES_AGENDA);

  const termino = sanitizarTerminoBusqueda(q);
  if (!termino) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .select("id, tipo_documento, numero_documento, nombres, apellidos")
    .is("deleted_at", null)
    .or(
      `numero_documento.ilike.%${termino}%,nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%`,
    )
    .order("apellidos", { ascending: true })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    etiqueta: `${p.apellidos}, ${p.nombres} — ${p.tipo_documento} ${p.numero_documento}`,
  }));
}
