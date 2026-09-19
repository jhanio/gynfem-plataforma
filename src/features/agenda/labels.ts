import type { EstadoCita } from "./dominio";

export const ESTADO_CITA_LABELS: Record<EstadoCita, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  atendida: "Atendida",
  no_asistio: "No asistió",
  cancelada: "Cancelada",
  reprogramada: "Reprogramada",
};

/**
 * Variante de Badge por estado. El texto (ESTADO_CITA_LABELS) siempre
 * acompaña al color: el estado nunca se comunica solo por color.
 */
export const ESTADO_CITA_VARIANTE: Record<
  EstadoCita,
  "default" | "secondary" | "destructive" | "outline"
> = {
  programada: "outline",
  confirmada: "default",
  atendida: "secondary",
  no_asistio: "destructive",
  cancelada: "destructive",
  reprogramada: "secondary",
};
