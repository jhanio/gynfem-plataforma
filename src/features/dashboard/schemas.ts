import { z } from "zod";
import { RANGOS_PRESET } from "./dominio";

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function presetOPorDefecto(valor: unknown): string {
  return typeof valor === "string" && (RANGOS_PRESET as readonly string[]).includes(valor)
    ? valor
    : "7dias";
}

/** undefined si no es una fecha "AAAA-MM-DD" válida (vacía, mal formada, etc). */
function fechaValidaOUndefined(valor: unknown): unknown {
  return typeof valor === "string" && FECHA_ISO.test(valor) ? valor : undefined;
}

/** Normaliza los searchParams del selector de rango de /dashboard. */
export const rangoDashboardSchema = z.object({
  preset: z.preprocess(presetOPorDefecto, z.enum(RANGOS_PRESET)),
  desde: z.preprocess(fechaValidaOUndefined, z.string().optional()),
  hasta: z.preprocess(fechaValidaOUndefined, z.string().optional()),
});

export type RangoDashboardInput = z.infer<typeof rangoDashboardSchema>;
