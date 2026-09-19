/**
 * Sanitización del término de búsqueda de pacientes antes de construir
 * filtros PostgREST (.or() / .ilike()). Sin esto, un término como
 * "a,id.neq.0" podría inyectar condiciones adicionales en el filtro
 * (la coma separa condiciones y el punto separa columna.operador.valor
 * en la mini-sintaxis de PostgREST).
 */
const CAMPOS_BUSQUEDA_PACIENTES = [
  "numero_documento",
  "nombres",
  "apellidos",
  "telefono",
] as const;

const LONGITUD_MAXIMA_TERMINO = 80;

export function sanitizarTerminoBusqueda(termino: string): string {
  const sinCaracteresDeControlPostgrest = termino
    .trim()
    .slice(0, LONGITUD_MAXIMA_TERMINO)
    .replace(/[,()."'`]/g, "");

  // Escapa los comodines de ILIKE (%, _) y la barra invertida para que
  // el término se trate como texto literal, no como patrón.
  return sinCaracteresDeControlPostgrest.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Construye la cláusula .or() para buscar por documento, nombres,
 * apellidos o teléfono. Devuelve null si no hay término utilizable
 * (para que el listado no filtre y muestre todo, paginado).
 */
export function construirFiltroBusquedaPacientes(
  termino: string,
): string | null {
  const limpio = sanitizarTerminoBusqueda(termino);
  if (!limpio) return null;

  return CAMPOS_BUSQUEDA_PACIENTES.map(
    (campo) => `${campo}.ilike.%${limpio}%`,
  ).join(",");
}
