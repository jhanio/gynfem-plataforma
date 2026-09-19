import { ACCIONES_AUDITORIA, TABLAS_AUDITADAS } from "./schemas";

export const ACCION_LABELS: Record<(typeof ACCIONES_AUDITORIA)[number], string> = {
  INSERT: "Creación",
  UPDATE: "Modificación",
  SOFT_DELETE: "Borrado lógico",
  DELETE: "Eliminación",
  READ: "Lectura",
};

export const TABLA_LABELS: Record<(typeof TABLAS_AUDITADAS)[number], string> = {
  profiles: "Usuarios",
  servicios: "Servicios",
  pacientes: "Pacientes",
  citas: "Citas",
  seguimientos: "Seguimientos",
  historias_clinicas: "Historias clínicas",
  atenciones: "Atenciones",
  adendas: "Adendas",
};
