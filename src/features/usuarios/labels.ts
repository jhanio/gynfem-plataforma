import type { Rol } from "@/lib/auth/roles";

export const ROL_LABELS: Record<Rol, string> = {
  admin: "Administrador",
  medico: "Médico",
  obstetra: "Obstetra",
  asistente: "Asistente",
  soporte: "Soporte",
};
