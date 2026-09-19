import { z } from "zod";

/** Tablas cubiertas por trg_auditoria (ver migración inicial). */
export const TABLAS_AUDITADAS = [
  "profiles",
  "servicios",
  "pacientes",
  "citas",
  "seguimientos",
  "historias_clinicas",
  "atenciones",
  "adendas",
] as const;

export const ACCIONES_AUDITORIA = ["INSERT", "UPDATE", "SOFT_DELETE", "DELETE", "READ"] as const;

/** Radix Select no admite value="" en sus ítems: se usa este valor para "todos/as". */
export const FILTRO_TODOS = "__todos__";

function vacioAUndefined(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  const limpio = valor.trim();
  return limpio === "" || limpio === FILTRO_TODOS ? undefined : valor;
}

function normalizarPagina(valor: unknown): number {
  const n = Number.parseInt(String(valor ?? "1"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Normaliza los searchParams de /admin/auditoria (todos llegan como string u undefined). */
export const filtrosAuditoriaSchema = z.object({
  usuarioId: z.preprocess(vacioAUndefined, z.string().uuid("Usuario no válido").optional()),
  tabla: z.preprocess(vacioAUndefined, z.enum(TABLAS_AUDITADAS).optional()),
  accion: z.preprocess(vacioAUndefined, z.enum(ACCIONES_AUDITORIA).optional()),
  desde: z.preprocess(vacioAUndefined, z.string().optional()),
  hasta: z.preprocess(vacioAUndefined, z.string().optional()),
  pagina: z.preprocess(normalizarPagina, z.number().int().positive()),
});

export type FiltrosAuditoria = z.infer<typeof filtrosAuditoriaSchema>;
