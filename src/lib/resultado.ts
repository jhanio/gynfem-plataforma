/**
 * Envoltura estándar de resultado para Server Actions.
 * Los mensajes de error son en español y aptos para mostrar en la UI.
 */
export type Resultado<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): Resultado<T> {
  return { ok: true, data };
}

export function fallo(error: string): Resultado<never> {
  return { ok: false, error };
}
