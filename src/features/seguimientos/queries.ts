import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EstadoSeguimiento, TipoSeguimiento } from "./dominio";

export interface SeguimientoLista {
  id: string;
  tipo: TipoSeguimiento;
  descripcion: string;
  fechaObjetivo: string;
  estado: EstadoSeguimiento;
  notas: string | null;
  paciente: { id: string; nombres: string; apellidos: string };
  responsable: { id: string; nombreCompleto: string } | null;
}

const SELECT_SEGUIMIENTO_LISTA = `
  id, tipo, descripcion, fecha_objetivo, estado, notas,
  paciente:pacientes!seguimientos_paciente_id_fkey(id, nombres, apellidos),
  responsable:profiles!seguimientos_responsable_id_fkey(id, nombre_completo)
`;

interface FilaSeguimientoLista {
  id: string;
  tipo: TipoSeguimiento;
  descripcion: string;
  fecha_objetivo: string;
  estado: EstadoSeguimiento;
  notas: string | null;
  paciente: { id: string; nombres: string; apellidos: string } | null;
  responsable: { id: string; nombre_completo: string } | null;
}

function mapearSeguimiento(fila: FilaSeguimientoLista): SeguimientoLista | null {
  if (!fila.paciente) return null;
  return {
    id: fila.id,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    fechaObjetivo: fila.fecha_objetivo,
    estado: fila.estado,
    notas: fila.notas,
    paciente: fila.paciente,
    responsable: fila.responsable
      ? { id: fila.responsable.id, nombreCompleto: fila.responsable.nombre_completo }
      : null,
  };
}

/** Bandeja de seguimientos activos (pendiente/contactada), para clasificar en HU-14. */
export async function obtenerBandejaSeguimientos(): Promise<SeguimientoLista[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seguimientos")
    .select(SELECT_SEGUIMIENTO_LISTA)
    .in("estado", ["pendiente", "contactada"])
    .order("fecha_objetivo", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as FilaSeguimientoLista[])
    .map(mapearSeguimiento)
    .filter((s): s is SeguimientoLista => s !== null);
}

/** Historial de seguimientos de una paciente, más recientes primero. */
export async function listarSeguimientosPaciente(pacienteId: string): Promise<SeguimientoLista[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seguimientos")
    .select(SELECT_SEGUIMIENTO_LISTA)
    .eq("paciente_id", pacienteId)
    .order("fecha_objetivo", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as FilaSeguimientoLista[])
    .map(mapearSeguimiento)
    .filter((s): s is SeguimientoLista => s !== null);
}

export interface ResponsableSeguimiento {
  id: string;
  nombreCompleto: string;
}

/** Responsables posibles de un seguimiento: personal clínico y de recepción. */
export async function listarResponsablesSeguimiento(): Promise<ResponsableSeguimiento[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre_completo")
    .eq("activo", true)
    .in("rol", ["medico", "obstetra", "asistente"])
    .order("nombre_completo", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({ id: p.id, nombreCompleto: p.nombre_completo }));
}
