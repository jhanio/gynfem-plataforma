/**
 * Tablas cuyo trigger de auditoría se ejecuta en modo "solo_campos"
 * (ver migración inicial): son datos clínicos y RLS ya le niega a admin
 * el SELECT directo sobre ellas. La consulta de auditoría (queries.ts)
 * nunca debe traer datos_antes/datos_despues para estas tablas.
 */
export const TABLAS_CLINICAS = ["historias_clinicas", "atenciones", "adendas"] as const;

export function esTablaClinica(tabla: string): boolean {
  return (TABLAS_CLINICAS as readonly string[]).includes(tabla);
}

interface FilaConDatos {
  tabla: string;
  datosAntes: unknown;
  datosDespues: unknown;
}

/** Fuerza datosAntes/datosDespues a null cuando la fila pertenece a una tabla clínica. */
export function enmascararSiEsClinica<T extends FilaConDatos>(
  fila: T,
): T & { datosAntes: unknown; datosDespues: unknown } {
  if (!esTablaClinica(fila.tabla)) {
    return fila;
  }
  return { ...fila, datosAntes: null, datosDespues: null };
}
