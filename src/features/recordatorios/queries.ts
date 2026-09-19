import "server-only";

import { createClient } from "@/lib/supabase/server";
import { obtenerFinDiaLima, obtenerInicioDiaLima } from "@/lib/fechas";
import type { Database } from "@/types/database.types";

export type EstadoRecordatorio = Database["public"]["Enums"]["estado_recordatorio"];

export interface RecordatorioHoy {
  id: string;
  mensaje: string;
  estado: EstadoRecordatorio;
  error: string | null;
  programadoPara: string;
  paciente: { id: string; nombres: string; apellidos: string; telefono: string | null };
}

const SELECT_RECORDATORIO_HOY = `
  id, mensaje, estado, error, programado_para,
  paciente:pacientes!recordatorios_paciente_id_fkey(id, nombres, apellidos, telefono)
`;

interface FilaRecordatorioHoy {
  id: string;
  mensaje: string;
  estado: EstadoRecordatorio;
  error: string | null;
  programado_para: string;
  paciente: { id: string; nombres: string; apellidos: string; telefono: string | null } | null;
}

/** Recordatorios generados hoy, para el panel de la asistente (HU-15). */
export async function obtenerRecordatoriosHoy(): Promise<RecordatorioHoy[]> {
  const supabase = await createClient();
  const ahora = new Date();

  const { data, error } = await supabase
    .from("recordatorios")
    .select(SELECT_RECORDATORIO_HOY)
    .gte("created_at", obtenerInicioDiaLima(ahora).toISOString())
    .lte("created_at", obtenerFinDiaLima(ahora).toISOString())
    .order("programado_para", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as FilaRecordatorioHoy[])
    .filter((fila): fila is FilaRecordatorioHoy & { paciente: NonNullable<FilaRecordatorioHoy["paciente"]> } =>
      fila.paciente !== null,
    )
    .map((fila) => ({
      id: fila.id,
      mensaje: fila.mensaje,
      estado: fila.estado,
      error: fila.error,
      programadoPara: fila.programado_para,
      paciente: fila.paciente,
    }));
}
