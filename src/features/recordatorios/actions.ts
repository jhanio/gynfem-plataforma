"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import { marcarEnviadoSchema, marcarFallidoSchema } from "./schemas";

const ROLES_RECORDATORIOS = ["admin", "asistente"] as const;

/** Marca un recordatorio como enviado tras abrir WhatsApp (HU-15). */
export async function marcarRecordatorioEnviado(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_RECORDATORIOS);

  const parsed = marcarEnviadoSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Identificador de recordatorio no válido.");
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("recordatorios")
    .update({ estado: "enviado", enviado_at: new Date().toISOString(), error: null })
    .eq("id", parsed.data.id);

  if (error) {
    return fallo("No se pudo marcar el recordatorio como enviado.");
  }

  revalidatePath("/recordatorios");
  return ok(null);
}

/** Marca un recordatorio como fallido, con motivo (HU-15). */
export async function marcarRecordatorioFallido(input: unknown): Promise<Resultado<null>> {
  await requireRol(...ROLES_RECORDATORIOS);

  const parsed = marcarFallidoSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa el motivo indicado.");
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("recordatorios")
    .update({ estado: "fallido", error: parsed.data.motivo })
    .eq("id", parsed.data.id);

  if (error) {
    return fallo("No se pudo registrar el motivo del fallo.");
  }

  revalidatePath("/recordatorios");
  return ok(null);
}

/** Genera manualmente los recordatorios de mañana (botón "Generar ahora", HU-15). */
export async function generarRecordatoriosAhora(): Promise<Resultado<{ creados: number }>> {
  await requireRol(...ROLES_RECORDATORIOS);

  const supabase = await createClient();
  const sede = process.env.NEXT_PUBLIC_WHATSAPP_SEDE;

  const { data, error } = await supabase.rpc(
    "generar_recordatorios_citas",
    sede ? { p_sede: sede } : {},
  );

  if (error) {
    return fallo("No se pudieron generar los recordatorios.");
  }

  revalidatePath("/recordatorios");
  return ok({ creados: data ?? 0 });
}
