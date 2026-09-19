import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

export const ZONA_HORARIA_LIMA = "America/Lima";

function aFechaLima(fecha: Date | string): TZDate {
  const instante = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new TZDate(instante, ZONA_HORARIA_LIMA);
}

export function formatearFecha(fecha: Date | string): string {
  return format(aFechaLima(fecha), "dd/MM/yyyy");
}

export function formatearHora(fecha: Date | string): string {
  return format(aFechaLima(fecha), "HH:mm");
}

export function formatearFechaHora(fecha: Date | string): string {
  return format(aFechaLima(fecha), "dd/MM/yyyy HH:mm");
}

export function obtenerInicioDiaLima(fecha: Date | string): Date {
  const enLima = aFechaLima(fecha);
  return new TZDate(
    enLima.getFullYear(),
    enLima.getMonth(),
    enLima.getDate(),
    0,
    0,
    0,
    0,
    ZONA_HORARIA_LIMA,
  );
}

export function obtenerFinDiaLima(fecha: Date | string): Date {
  const enLima = aFechaLima(fecha);
  return new TZDate(
    enLima.getFullYear(),
    enLima.getMonth(),
    enLima.getDate(),
    23,
    59,
    59,
    999,
    ZONA_HORARIA_LIMA,
  );
}

export function esMismoDiaLima(a: Date | string, b: Date | string): boolean {
  return formatearFecha(a) === formatearFecha(b);
}

/** Fecha del día en Lima, en formato AAAA-MM-DD (para inputs y filtros de rango). */
export function obtenerFechaISOLima(fecha: Date | string): string {
  return format(aFechaLima(fecha), "yyyy-MM-dd");
}

/**
 * Formatea una fecha calendario ("AAAA-MM-DD", sin hora) como DD/MM/AAAA.
 * A diferencia de formatearFecha, no interpreta el valor como instante UTC ni
 * lo convierte a Lima: úsala para columnas `date` (p. ej. fecha_objetivo de
 * seguimientos), donde ese paso de por medio causaría un día de diferencia.
 */
export function formatearFechaISO(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

/**
 * Interpreta una fecha ("AAAA-MM-DD") y hora ("HH:mm") elegidas en un
 * formulario como hora de Lima y devuelve el instante UTC correspondiente
 * (para guardar en columnas timestamptz).
 */
export function combinarFechaHoraLima(fechaISO: string, horaHHmm: string): Date {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const [hora, minuto] = horaHHmm.split(":").map(Number);
  return new TZDate(anio, mes - 1, dia, hora, minuto, 0, 0, ZONA_HORARIA_LIMA);
}
