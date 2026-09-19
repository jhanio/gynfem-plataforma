import "server-only";

import { createClient } from "@/lib/supabase/server";
import { combinarFechaHoraLima } from "@/lib/fechas";
import { enmascararSiEsClinica, esTablaClinica } from "./dominio";
import type { FiltrosAuditoria } from "./schemas";

export const AUDITORIA_POR_PAGINA = 20;

const SELECT_CABECERA = "id, tabla, registro_id, accion, usuario_id, created_at";

interface FilaCabecera {
  id: number;
  tabla: string;
  registro_id: string | null;
  accion: string;
  usuario_id: string | null;
  created_at: string;
}

export interface AuditoriaFila {
  id: number;
  tabla: string;
  registroId: string | null;
  accion: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  createdAt: string;
  esClinica: boolean;
  /** null cuando esClinica: RLS ya le niega a admin ese contenido. */
  datosAntes: unknown;
  datosDespues: unknown;
}

async function nombresUsuarios(ids: readonly string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre_completo")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.nombre_completo]));
}

interface ValoresAuditoria {
  datos_antes: unknown;
  datos_despues: unknown;
}

/**
 * Trae datos_antes/datos_despues SOLO para los ids de tablas no clínicas.
 * Los ids de tablas clínicas nunca entran al WHERE: la consulta no los toca.
 */
async function valoresNoClinicos(ids: readonly number[]): Promise<Map<number, ValoresAuditoria>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, datos_antes, datos_despues")
    .in("id", ids);
  return new Map((data ?? []).map((f) => [f.id, f]));
}

function mapearFila(fila: FilaCabecera, nombres: Map<string, string>, valores?: ValoresAuditoria): AuditoriaFila {
  const enmascarada = enmascararSiEsClinica({
    tabla: fila.tabla,
    datosAntes: valores?.datos_antes ?? null,
    datosDespues: valores?.datos_despues ?? null,
  });
  return {
    id: fila.id,
    tabla: fila.tabla,
    registroId: fila.registro_id,
    accion: fila.accion,
    usuarioId: fila.usuario_id,
    usuarioNombre: fila.usuario_id ? (nombres.get(fila.usuario_id) ?? null) : null,
    createdAt: fila.created_at,
    esClinica: esTablaClinica(fila.tabla),
    datosAntes: enmascarada.datosAntes,
    datosDespues: enmascarada.datosDespues,
  };
}

export interface ListarAuditoriaResultado {
  filas: AuditoriaFila[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

/**
 * Lista paginada de auditoría, con detalle ya resuelto por fila. Para
 * tablas clínicas (historias_clinicas, atenciones, adendas) la consulta de
 * datos_antes/datos_despues nunca se ejecuta sobre esos ids: RLS ya le
 * niega a admin ese contenido, y aquí se refuerza en el propio query.
 */
export async function listarAuditoria(
  filtros: FiltrosAuditoria,
): Promise<ListarAuditoriaResultado> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select(SELECT_CABECERA, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filtros.usuarioId) query = query.eq("usuario_id", filtros.usuarioId);
  if (filtros.tabla) query = query.eq("tabla", filtros.tabla);
  if (filtros.accion) query = query.eq("accion", filtros.accion);
  if (filtros.desde) {
    query = query.gte("created_at", combinarFechaHoraLima(filtros.desde, "00:00").toISOString());
  }
  if (filtros.hasta) {
    query = query.lte("created_at", combinarFechaHoraLima(filtros.hasta, "23:59").toISOString());
  }

  const desde = (filtros.pagina - 1) * AUDITORIA_POR_PAGINA;
  const hasta = desde + AUDITORIA_POR_PAGINA - 1;
  const { data, count, error } = await query.range(desde, hasta);

  if (error || !data) {
    return { filas: [], total: 0, pagina: 1, totalPaginas: 1 };
  }

  const idsUsuarios = Array.from(
    new Set(data.map((f) => f.usuario_id).filter((id): id is string => id !== null)),
  );
  const idsNoClinicos = data.filter((f) => !esTablaClinica(f.tabla)).map((f) => f.id);

  const [nombres, valoresPorId] = await Promise.all([
    nombresUsuarios(idsUsuarios),
    valoresNoClinicos(idsNoClinicos),
  ]);

  const total = count ?? 0;

  return {
    filas: data.map((f) => mapearFila(f, nombres, valoresPorId.get(f.id))),
    total,
    pagina: filtros.pagina,
    totalPaginas: Math.max(1, Math.ceil(total / AUDITORIA_POR_PAGINA)),
  };
}

export interface UsuarioParaFiltro {
  id: string;
  nombreCompleto: string;
}

/** Usuarios para el selector de filtro (incluye inactivos: pueden tener historial). */
export async function listarUsuariosParaFiltro(): Promise<UsuarioParaFiltro[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre_completo")
    .order("nombre_completo", { ascending: true });

  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, nombreCompleto: p.nombre_completo }));
}
