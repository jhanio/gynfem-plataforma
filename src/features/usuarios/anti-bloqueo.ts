import { fallo, ok, type Resultado } from "@/lib/resultado";
import type { Rol } from "@/lib/auth/roles";

/**
 * Reglas anti-bloqueo: evitan que un administrador pierda su propio acceso.
 * Son lógica de aplicación; RLS no distingue "a sí mismo".
 */

export function validarCambioRol(params: {
  actorId: string;
  objetivoId: string;
  nuevoRol: Rol;
}): Resultado<null> {
  const { actorId, objetivoId, nuevoRol } = params;
  if (actorId === objetivoId && nuevoRol !== "admin") {
    return fallo("No puedes quitarte a ti mismo el rol de administrador.");
  }
  return ok(null);
}

export function validarActivacion(params: {
  actorId: string;
  objetivoId: string;
  activo: boolean;
}): Resultado<null> {
  const { actorId, objetivoId, activo } = params;
  if (actorId === objetivoId && !activo) {
    return fallo("No puedes desactivar tu propia cuenta.");
  }
  return ok(null);
}
