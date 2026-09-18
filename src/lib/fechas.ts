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
