import type { CANALES_RECORDATORIO, TIPOS_DOCUMENTO } from "./schemas";

export const TIPO_DOCUMENTO_LABELS: Record<
  (typeof TIPOS_DOCUMENTO)[number],
  string
> = {
  DNI: "DNI",
  CE: "Carné de extranjería",
  PASAPORTE: "Pasaporte",
};

export const CANAL_LABELS: Record<
  (typeof CANALES_RECORDATORIO)[number],
  string
> = {
  whatsapp_manual: "WhatsApp (manual)",
  whatsapp_api: "WhatsApp (automático)",
  email: "Correo electrónico",
  sms: "SMS",
};
