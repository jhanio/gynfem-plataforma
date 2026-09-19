import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { requiereDesafioMfa, requiereInscripcionMfa } from "./mfa";

export type RutaMfaPendiente = "/mfa/activar" | "/mfa/verificar" | null;

/**
 * ¿Falta completar MFA para esta sesión? Devuelve la ruta a la que
 * redirigir, o null si ya está en aal2.
 *
 * Importante: pasamos explícitamente `session.access_token` a
 * `getAuthenticatorAssuranceLevel()`. Sin ese argumento, el método usa
 * `getSession()` internamente (lectura local de la cookie, sin
 * verificar la firma contra el servidor de Auth) — exactamente lo que
 * `CLAUDE.md` prohíbe para decisiones de autorización. Al pasar el
 * token, la librería hace además un `getUser(jwt)` verificado antes de
 * confiar en los claims `aal`/`amr` decodificados.
 */
export async function rutaMfaPendiente(
  supabase: SupabaseClient<Database>,
): Promise<RutaMfaPendiente> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return "/mfa/activar";
  }

  const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(
    session.access_token,
  );

  if (error || !aal) {
    return "/mfa/activar";
  }

  if (requiereInscripcionMfa(aal)) {
    return "/mfa/activar";
  }

  if (requiereDesafioMfa(aal)) {
    return "/mfa/verificar";
  }

  return null;
}
