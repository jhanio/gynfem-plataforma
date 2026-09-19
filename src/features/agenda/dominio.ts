import type { Database } from "@/types/database.types";

export type EstadoCita = Database["public"]["Enums"]["estado_cita"];

export const ACCIONES_CITA = [
  "confirmar",
  "cancelar",
  "reprogramar",
  "no_asistio",
] as const;

export type AccionCita = (typeof ACCIONES_CITA)[number];

/**
 * Acciones permitidas por estado (HU-08). `atendida` y los estados
 * terminales (`no_asistio`, `cancelada`, `reprogramada`) no admiten ninguna
 * de estas acciones: firmar/corregir una atención es responsabilidad de la
 * Fase 5.
 */
const ACCIONES_PERMITIDAS: Record<EstadoCita, readonly AccionCita[]> = {
  programada: ["confirmar", "cancelar", "reprogramar", "no_asistio"],
  confirmada: ["cancelar", "reprogramar", "no_asistio"],
  atendida: [],
  no_asistio: [],
  cancelada: [],
  reprogramada: [],
};

export function puedeAplicarAccion(estado: EstadoCita, accion: AccionCita): boolean {
  return ACCIONES_PERMITIDAS[estado].includes(accion);
}

/** Instante de fin de una cita, a partir de la duración del servicio (minutos). */
export function calcularFin(inicio: Date, duracionMin: number): Date {
  return new Date(inicio.getTime() + duracionMin * 60_000);
}

/**
 * Suma/resta días a una fecha "AAAA-MM-DD" tratada como fecha calendario
 * (sin zona horaria: navegación de la agenda, no instantes reales).
 */
export function desplazarFechaISO(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const utc = new Date(Date.UTC(anio, mes - 1, dia));
  utc.setUTCDate(utc.getUTCDate() + dias);
  return utc.toISOString().slice(0, 10);
}

/** Lunes de la semana calendario a la que pertenece la fecha dada. */
export function inicioSemanaISO(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay(); // 0=domingo..6=sábado
  const offsetALunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  return desplazarFechaISO(fechaISO, offsetALunes);
}
