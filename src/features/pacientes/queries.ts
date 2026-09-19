import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { construirFiltroBusquedaPacientes } from "./busqueda";

export const PACIENTES_POR_PAGINA = 20;

type TipoDocumento = Database["public"]["Enums"]["tipo_documento"];
type CanalRecordatorio = Database["public"]["Enums"]["canal_recordatorio"];

export interface PacienteResumen {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  distrito: string | null;
}

export interface ListarPacientesResultado {
  pacientes: PacienteResumen[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

/**
 * Lista pacientes activas con búsqueda opcional (documento, nombre, teléfono)
 * y paginación en servidor. Filtra deleted_at explícitamente: aunque RLS ya
 * oculta las borradas a todos los roles salvo admin, este filtro garantiza
 * que el listado por defecto nunca mezcle duplicados marcados como eliminados,
 * incluido cuando quien consulta es admin.
 */
export async function listarPacientes(
  opciones: { q?: string; pagina?: number } = {},
): Promise<ListarPacientesResultado> {
  const pagina = Math.max(1, Math.trunc(opciones.pagina ?? 1) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("pacientes")
    .select(
      "id, tipo_documento, numero_documento, nombres, apellidos, telefono, distrito",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("apellidos", { ascending: true })
    .order("nombres", { ascending: true });

  const filtro = construirFiltroBusquedaPacientes(opciones.q ?? "");
  if (filtro) {
    query = query.or(filtro);
  }

  const desde = (pagina - 1) * PACIENTES_POR_PAGINA;
  const hasta = desde + PACIENTES_POR_PAGINA - 1;
  const { data, count, error } = await query.range(desde, hasta);

  if (error || !data) {
    return { pacientes: [], total: 0, pagina: 1, totalPaginas: 1 };
  }

  const total = count ?? 0;

  return {
    pacientes: data.map((p) => ({
      id: p.id,
      tipoDocumento: p.tipo_documento,
      numeroDocumento: p.numero_documento,
      nombres: p.nombres,
      apellidos: p.apellidos,
      telefono: p.telefono,
      distrito: p.distrito,
    })),
    total,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / PACIENTES_POR_PAGINA)),
  };
}

export interface PacienteDetalle {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  distrito: string | null;
  canalPreferido: CanalRecordatorio;
  aceptaRecordatorios: boolean;
  consentimientoDatos: boolean;
  consentimientoFecha: string | null;
  createdAt: string;
  updatedAt: string;
}

const SELECT_DETALLE =
  "id, tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento, telefono, email, direccion, distrito, canal_preferido, acepta_recordatorios, consentimiento_datos, consentimiento_fecha, created_at, updated_at";

/** Ficha de una paciente activa. Devuelve null si no existe o está borrada. */
export async function obtenerPaciente(
  id: string,
): Promise<PacienteDetalle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .select(SELECT_DETALLE)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    tipoDocumento: data.tipo_documento,
    numeroDocumento: data.numero_documento,
    nombres: data.nombres,
    apellidos: data.apellidos,
    fechaNacimiento: data.fecha_nacimiento,
    telefono: data.telefono,
    email: data.email,
    direccion: data.direccion,
    distrito: data.distrito,
    canalPreferido: data.canal_preferido,
    aceptaRecordatorios: data.acepta_recordatorios,
    consentimientoDatos: data.consentimiento_datos,
    consentimientoFecha: data.consentimiento_fecha,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Busca el id de la paciente activa con ese documento, para enlazar a su
 * ficha cuando el registro falla por duplicidad (23505).
 */
export async function buscarPacienteActivaPorDocumento(
  tipoDocumento: TipoDocumento,
  numeroDocumento: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pacientes")
    .select("id")
    .eq("tipo_documento", tipoDocumento)
    .eq("numero_documento", numeroDocumento)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.id ?? null;
}
