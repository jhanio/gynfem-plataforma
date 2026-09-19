import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EstadoAtencion } from "./dominio";

export interface AdendaVista {
  id: string;
  contenido: string;
  createdAt: string;
  autor: string | null;
}

/** Fila resumida para la línea de tiempo de la historia clínica. */
export interface AtencionResumen {
  id: string;
  fecha: string;
  estado: EstadoAtencion;
  motivoConsulta: string;
  diagnostico: string | null;
  cie10: string[];
  servicioNombre: string | null;
  profesionalNombre: string | null;
  adendas: AdendaVista[];
}

/** Detalle completo de una atención (editor o vista de lectura). */
export interface AtencionDetalle {
  id: string;
  pacienteId: string;
  citaId: string | null;
  profesionalId: string;
  estado: EstadoAtencion;
  fecha: string;
  motivoConsulta: string;
  anamnesis: string | null;
  examenFisico: string | null;
  diagnostico: string | null;
  cie10: string[];
  planTratamiento: string | null;
  indicaciones: string | null;
  firmadaAt: string | null;
  servicioNombre: string | null;
  profesionalNombre: string | null;
  paciente: { nombres: string; apellidos: string };
  adendas: AdendaVista[];
}

const SELECT_ATENCION = `
  id, paciente_id, cita_id, profesional_id, estado, fecha, motivo_consulta,
  anamnesis, examen_fisico, diagnostico, cie10, plan_tratamiento, indicaciones, firmada_at,
  servicio:servicios!atenciones_servicio_id_fkey(nombre),
  profesional:profiles!atenciones_profesional_id_fkey(nombre_completo),
  paciente:pacientes!atenciones_paciente_id_fkey(nombres, apellidos),
  adendas:adendas!adendas_atencion_id_fkey(
    id, contenido, created_at,
    autor:profiles!adendas_created_by_fkey(nombre_completo)
  )
`;

interface FilaAdenda {
  id: string;
  contenido: string;
  created_at: string;
  autor: { nombre_completo: string } | null;
}

interface FilaAtencion {
  id: string;
  paciente_id: string;
  cita_id: string | null;
  profesional_id: string;
  estado: EstadoAtencion;
  fecha: string;
  motivo_consulta: string;
  anamnesis: string | null;
  examen_fisico: string | null;
  diagnostico: string | null;
  cie10: string[] | null;
  plan_tratamiento: string | null;
  indicaciones: string | null;
  firmada_at: string | null;
  servicio: { nombre: string } | null;
  profesional: { nombre_completo: string } | null;
  paciente: { nombres: string; apellidos: string } | null;
  adendas: FilaAdenda[] | null;
}

function mapearAdendas(filas: FilaAdenda[] | null): AdendaVista[] {
  return (filas ?? [])
    .map((a) => ({
      id: a.id,
      contenido: a.contenido,
      createdAt: a.created_at,
      autor: a.autor?.nombre_completo ?? null,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Línea de tiempo de atenciones de una paciente (más reciente primero) con sus
 * adendas. Solo medico/obstetra por RLS. El registro de acceso READ se hace en
 * la capa que compone la historia clínica.
 */
export async function listarAtencionesPaciente(
  pacienteId: string,
): Promise<AtencionResumen[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("atenciones")
    .select(SELECT_ATENCION)
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as FilaAtencion[]).map((fila) => ({
    id: fila.id,
    fecha: fila.fecha,
    estado: fila.estado,
    motivoConsulta: fila.motivo_consulta,
    diagnostico: fila.diagnostico,
    cie10: fila.cie10 ?? [],
    servicioNombre: fila.servicio?.nombre ?? null,
    profesionalNombre: fila.profesional?.nombre_completo ?? null,
    adendas: mapearAdendas(fila.adendas),
  }));
}

export type ResultadoAtencion =
  | { ok: true; atencion: AtencionDetalle }
  | { ok: false; motivo: "no_encontrada" | "sin_acceso" };

/**
 * Detalle de una atención registrando el acceso READ en auditoría dentro de la
 * misma lectura. Si el registro de acceso falla, NO se devuelven datos clínicos.
 */
export async function obtenerAtencion(id: string): Promise<ResultadoAtencion> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("atenciones")
    .select(SELECT_ATENCION)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, motivo: "no_encontrada" };
  }

  const fila = data as unknown as FilaAtencion;

  // Registro de acceso clínico en el servidor, antes de entregar los datos.
  const { error: errorAcceso } = await supabase.rpc("registrar_acceso_historia", {
    p_paciente_id: fila.paciente_id,
  });
  if (errorAcceso) {
    return { ok: false, motivo: "sin_acceso" };
  }

  return {
    ok: true,
    atencion: {
      id: fila.id,
      pacienteId: fila.paciente_id,
      citaId: fila.cita_id,
      profesionalId: fila.profesional_id,
      estado: fila.estado,
      fecha: fila.fecha,
      motivoConsulta: fila.motivo_consulta,
      anamnesis: fila.anamnesis,
      examenFisico: fila.examen_fisico,
      diagnostico: fila.diagnostico,
      cie10: fila.cie10 ?? [],
      planTratamiento: fila.plan_tratamiento,
      indicaciones: fila.indicaciones,
      firmadaAt: fila.firmada_at,
      servicioNombre: fila.servicio?.nombre ?? null,
      profesionalNombre: fila.profesional?.nombre_completo ?? null,
      paciente: {
        nombres: fila.paciente?.nombres ?? "",
        apellidos: fila.paciente?.apellidos ?? "",
      },
      adendas: mapearAdendas(fila.adendas),
    },
  };
}
