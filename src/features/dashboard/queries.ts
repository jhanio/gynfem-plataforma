import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapearKpiResumen, type KpiResumen } from "./dominio";

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
