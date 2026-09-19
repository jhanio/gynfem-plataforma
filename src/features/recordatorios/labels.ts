import type { EstadoRecordatorio } from "./queries";

export const ESTADO_RECORDATORIO_LABELS: Record<EstadoRecordatorio, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  fallido: "Fallido",
  cancelado: "Cancelado",
};

/**
 * Variante de Badge por estado. El texto (ESTADO_RECORDATORIO_LABELS) siempre
 * acompaña al color: el estado nunca se comunica solo por color.
 */
export const ESTADO_RECORDATORIO_VARIANTE: Record<
  EstadoRecordatorio,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendiente: "outline",
  enviado: "default",
  fallido: "destructive",
  cancelado: "secondary",
};
