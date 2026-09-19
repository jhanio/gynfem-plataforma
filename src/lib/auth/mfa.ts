import type { Rol } from "./roles";

/** Roles que deben completar el segundo factor (TOTP) para operar. */
const ROLES_CON_MFA_OBLIGATORIO: readonly Rol[] = ["admin", "medico", "obstetra"];

export function requiereMfa(rol: Rol): boolean {
  return ROLES_CON_MFA_OBLIGATORIO.includes(rol);
}

// El SDK de Supabase tipa el nivel AAL como una unión abierta
// ('aal1' | 'aal2' | string) para admitir niveles futuros; aquí solo
// nos importa si es exactamente 'aal2' o no.
export type NivelAal = string | null;

export interface EstadoAal {
  currentLevel: NivelAal;
  nextLevel: NivelAal;
}

/** ¿La sesión no tiene ningún factor MFA verificado y debe inscribirse? */
export function requiereInscripcionMfa(estado: EstadoAal): boolean {
  return estado.nextLevel !== "aal2";
}

/** ¿Existe un factor MFA inscrito pero esta sesión no completó el desafío? */
export function requiereDesafioMfa(estado: EstadoAal): boolean {
  return estado.nextLevel === "aal2" && estado.currentLevel !== "aal2";
}
