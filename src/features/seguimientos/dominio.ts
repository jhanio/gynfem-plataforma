import type { Database } from "@/types/database.types";

export type TipoSeguimiento = Database["public"]["Enums"]["tipo_seguimiento"];
export type EstadoSeguimiento = Database["public"]["Enums"]["estado_seguimiento"];

export const CATEGORIAS_BANDEJA = [
  "vencido",
  "hoy",
  "proximo",
  "mas_adelante",
] as const;

export type CategoriaBandeja = (typeof CATEGORIAS_BANDEJA)[number];

const DIAS_VENTANA_PROXIMO = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function diferenciaEnDias(fechaISO: string, hoyISO: string): number {
  const [a1, m1, d1] = fechaISO.split("-").map(Number);
  const [a2, m2, d2] = hoyISO.split("-").map(Number);
  const fecha = Date.UTC(a1, m1 - 1, d1);
  const hoy = Date.UTC(a2, m2 - 1, d2);
  return Math.round((fecha - hoy) / MS_POR_DIA);
}

/** Clasifica un seguimiento para la bandeja (HU-14): vencidos, hoy, próximos 7 días o más adelante. */
export function clasificarSeguimiento(fechaObjetivoISO: string, hoyISO: string): CategoriaBandeja {
  const dias = diferenciaEnDias(fechaObjetivoISO, hoyISO);
  if (dias < 0) return "vencido";
  if (dias === 0) return "hoy";
  if (dias <= DIAS_VENTANA_PROXIMO) return "proximo";
  return "mas_adelante";
}

/** Transiciones de estado permitidas (HU-14). completado y cancelado son finales. */
const TRANSICIONES_PERMITIDAS: Record<EstadoSeguimiento, readonly EstadoSeguimiento[]> = {
  pendiente: ["contactada", "completado", "cancelado"],
  contactada: ["completado", "cancelado"],
  completado: [],
  cancelado: [],
};

export function puedeCambiarEstadoSeguimiento(
  actual: EstadoSeguimiento,
  nuevo: EstadoSeguimiento,
): boolean {
  return TRANSICIONES_PERMITIDAS[actual].includes(nuevo);
}
