import "server-only";

import { createClient } from "@/lib/supabase/server";
import { obtenerFinDiaLima, obtenerInicioDiaLima } from "@/lib/fechas";
import type { EstadoCita } from "./dominio";

export interface ProfesionalAgenda {
  id: string;
  nombreCompleto: string;
}

/** Profesionales activos que pueden atender citas (medico, obstetra). */
export async function listarProfesionalesAgenda(): Promise<ProfesionalAgenda[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre_completo")
    .eq("activo", true)
    .in("rol", ["medico", "obstetra"])
    .order("nombre_completo", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({ id: p.id, nombreCompleto: p.nombre_completo }));
}

export interface CitaAgenda {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  motivoCambio: string | null;
  notasAdmin: string | null;
  citaOrigenId: string | null;
  paciente: { id: string; nombres: string; apellidos: string; telefono: string | null };
  servicio: { id: string; nombre: string; duracionMin: number };
  profesional: { id: string; nombreCompleto: string };
}

const SELECT_CITA_AGENDA = `
  id, inicio, fin, estado, motivo_cambio, notas_admin, cita_origen_id,
  paciente:pacientes!citas_paciente_id_fkey(id, nombres, apellidos, telefono),
  servicio:servicios!citas_servicio_id_fkey(id, nombre, duracion_min),
  profesional:profiles!citas_profesional_id_fkey(id, nombre_completo)
`;

interface FilaCitaAgenda {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  motivo_cambio: string | null;
  notas_admin: string | null;
  cita_origen_id: string | null;
  paciente: { id: string; nombres: string; apellidos: string; telefono: string | null } | null;
  servicio: { id: string; nombre: string; duracion_min: number } | null;
  profesional: { id: string; nombre_completo: string } | null;
}

function mapearCitaAgenda(fila: FilaCitaAgenda): CitaAgenda | null {
  if (!fila.paciente || !fila.servicio || !fila.profesional) {
    return null;
  }
  return {
    id: fila.id,
    inicio: fila.inicio,
    fin: fila.fin,
    estado: fila.estado,
    motivoCambio: fila.motivo_cambio,
    notasAdmin: fila.notas_admin,
    citaOrigenId: fila.cita_origen_id,
    paciente: fila.paciente,
    servicio: { id: fila.servicio.id, nombre: fila.servicio.nombre, duracionMin: fila.servicio.duracion_min },
    profesional: { id: fila.profesional.id, nombreCompleto: fila.profesional.nombre_completo },
  };
}

/**
 * Citas en un rango de instantes UTC (calculado por el llamador a partir de
 * límites de día en hora de Lima), opcionalmente filtradas por profesional.
 */
export async function listarCitasRango(
  desde: Date,
  hasta: Date,
  profesionalId?: string,
): Promise<CitaAgenda[]> {
  const supabase = await createClient();
  let query = supabase
    .from("citas")
    .select(SELECT_CITA_AGENDA)
    .gte("inicio", desde.toISOString())
    .lte("inicio", hasta.toISOString())
    .order("inicio", { ascending: true });

  if (profesionalId) {
    query = query.eq("profesional_id", profesionalId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return (data as FilaCitaAgenda[])
    .map(mapearCitaAgenda)
    .filter((c): c is CitaAgenda => c !== null);
}

/** Citas del día de hoy (hora de Lima), de todos los profesionales. */
export async function listarCitasHoy(): Promise<CitaAgenda[]> {
  const ahora = new Date();
  return listarCitasRango(obtenerInicioDiaLima(ahora), obtenerFinDiaLima(ahora));
}

/** Historial de citas de una paciente, más recientes primero. */
export async function listarCitasPaciente(pacienteId: string): Promise<CitaAgenda[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("citas")
    .select(SELECT_CITA_AGENDA)
    .eq("paciente_id", pacienteId)
    .order("inicio", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as FilaCitaAgenda[])
    .map(mapearCitaAgenda)
    .filter((c): c is CitaAgenda => c !== null);
}
