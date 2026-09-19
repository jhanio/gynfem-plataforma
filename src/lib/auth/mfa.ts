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

export interface FactorMfa {
  id: string;
  factor_type: string;
  status: string;
}

/**
 * IDs de factores TOTP sin verificar. Quedan de intentos de inscripción
 * abandonados (recarga a mitad del flujo, doble ejecución de un efecto
 * en modo estricto de React, dos pestañas abiertas) y bloquean un
 * `enroll()` nuevo con `mfa_factor_name_conflict` si se reutiliza el
 * mismo `friendlyName`. Hay que desinscribirlos antes de reintentar.
 */
export function idsFactoresTotpSinVerificar(factores: readonly FactorMfa[]): string[] {
  return factores
    .filter((f) => f.factor_type === "totp" && f.status !== "verified")
    .map((f) => f.id);
}

/** friendlyName único para enroll(): evita choques si igual queda un
 * factor sin limpiar (dos pestañas a la vez, error de red en el
 * unenroll previo, etc.). No incluye datos personales. */
export function nombreFactorMfa(fecha: Date = new Date()): string {
  return `GynFem ${fecha.toISOString()}`;
}

const MENSAJES_ERROR_MFA: Record<string, string> = {
  mfa_factor_name_conflict:
    "Había una inscripción pendiente sin terminar; se limpió automáticamente. Vuelve a intentarlo.",
  mfa_verification_failed:
    "Código incorrecto. Revisa la hora de tu dispositivo e intenta de nuevo.",
  mfa_verification_rejected:
    "El código fue rechazado. Genera uno nuevo desde tu aplicación de autenticación e intenta de nuevo.",
  mfa_challenge_expired: "El código expiró. Genera uno nuevo e intenta de nuevo.",
  mfa_ip_address_mismatch:
    "Por seguridad, completa la verificación desde la misma red donde iniciaste sesión.",
  mfa_factor_not_found: "No se encontró el factor de verificación. Recarga la página e intenta de nuevo.",
  too_many_enrolled_mfa_factors: "Ya tienes demasiados factores inscritos. Contacta al administrador.",
  over_request_rate_limit: "Demasiados intentos. Espera un momento antes de volver a intentarlo.",
};

/** Mensaje en español para el código de error de Supabase Auth MFA, sin
 * exponer datos personales. Cae a un mensaje genérico si el código no
 * está mapeado (por ejemplo, versiones futuras de la API). */
export function mensajeErrorMfa(codigo: string | undefined): string {
  if (codigo && codigo in MENSAJES_ERROR_MFA) {
    return MENSAJES_ERROR_MFA[codigo];
  }
  return "No se pudo completar la operación de verificación en dos pasos. Intenta de nuevo.";
}
