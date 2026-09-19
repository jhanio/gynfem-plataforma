import type { CategoriaBandeja, EstadoSeguimiento, TipoSeguimiento } from "./dominio";

export const TIPO_SEGUIMIENTO_LABELS: Record<TipoSeguimiento, string> = {
  control: "Control",
  resultado_pendiente: "Resultado pendiente",
  procedimiento: "Procedimiento",
  otro: "Otro",
};

export const ESTADO_SEGUIMIENTO_LABELS: Record<EstadoSeguimiento, string> = {
  pendiente: "Pendiente",
  contactada: "Contactada",
  completado: "Completado",
  cancelado: "Cancelado",
};

/**
 * Variante de Badge por estado. El texto (ESTADO_SEGUIMIENTO_LABELS) siempre
 * acompaña al color: el estado nunca se comunica solo por color.
 */
export const ESTADO_SEGUIMIENTO_VARIANTE: Record<
  EstadoSeguimiento,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendiente: "outline",
  contactada: "secondary",
  completado: "default",
  cancelado: "destructive",
};

export const CATEGORIA_BANDEJA_LABELS: Record<CategoriaBandeja, string> = {
  vencido: "Vencidos",
  hoy: "Hoy",
  proximo: "Próximos 7 días",
  mas_adelante: "Más adelante",
};
