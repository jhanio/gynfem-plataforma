import type { EstadoAtencion } from "./dominio";

export const ESTADO_ATENCION_LABELS: Record<EstadoAtencion, string> = {
  borrador: "Borrador",
  firmada: "Firmada",
};

/**
 * Variante de Badge por estado. El texto (ESTADO_ATENCION_LABELS) siempre
 * acompaña al color: el estado nunca se comunica solo por color.
 */
export const ESTADO_ATENCION_VARIANTE: Record<
  EstadoAtencion,
  "default" | "secondary" | "destructive" | "outline"
> = {
  borrador: "outline",
  firmada: "default",
};
