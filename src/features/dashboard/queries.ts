import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  calcularPorcentajeDuplicados,
  mapearGruposDuplicados,
  mapearKpiResumen,
  type GrupoDuplicado,
  type KpiResumen,
} from "./dominio";

/** Tarjetas y gráficos de /dashboard (solo agregados: rpc('kpi_resumen') bypasa RLS a propósito). */
export async function obtenerKpiResumen(desde: string, hasta: string): Promise<KpiResumen> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("kpi_resumen", { p_desde: desde, p_hasta: hasta });
  if (error) {
    return mapearKpiResumen(null);
  }
  return mapearKpiResumen(data);
}

/** Total de pacientes activas, denominador del porcentaje de posibles duplicados (KPI-07). */
export async function obtenerTotalPacientesActivas(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("pacientes")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (error || count === null) return 0;
  return count;
}

export interface ResumenDuplicados {
  grupos: GrupoDuplicado[];
  totalDuplicados: number;
  totalActivas: number;
  porcentaje: number;
}

/**
 * KPI-07, solo admin: rpc('pacientes_posibles_duplicados') ya exige
 * tiene_rol('admin') en la propia base (ver migración); aquí no se repite
 * el chequeo de rol, solo se agrega el porcentaje sobre el total de
 * pacientes activas.
 */
export async function obtenerResumenDuplicados(): Promise<ResumenDuplicados> {
  const supabase = await createClient();
  const [{ data, error }, totalActivas] = await Promise.all([
    supabase.rpc("pacientes_posibles_duplicados"),
    obtenerTotalPacientesActivas(),
  ]);

  const grupos = error || !data ? [] : mapearGruposDuplicados(data);
  const totalDuplicados = grupos.reduce((acumulado, g) => acumulado + g.cantidad, 0);

  return {
    grupos,
    totalDuplicados,
    totalActivas,
    porcentaje: calcularPorcentajeDuplicados(totalDuplicados, totalActivas),
  };
}
