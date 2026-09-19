import { randomBytes } from "node:crypto";

/**
 * Contraseña temporal para cuentas creadas por un admin (Server Action
 * `crearUsuario`) o por los scripts de datos de demo
 * (`crear-usuarios-demo.ts`, `seed-demo.ts`).
 *
 * El prefijo "Gy" y el sufijo "!9" son fijos a propósito: garantizan al
 * menos una mayúscula, una minúscula y un número sin depender de lo que
 * toque al azar, cumpliendo siempre la política de contraseñas de
 * Supabase Auth del proyecto (mínimo 10 caracteres, minúsculas,
 * mayúsculas y números) sin importar el resultado de `randomBytes`.
 * `randomBytes(9)` (no `Math.random()`, que no es criptográficamente
 * seguro) aporta la entropía y el largo.
 */
export function generarPasswordTemporal(): string {
  return `Gy${randomBytes(9).toString("base64url")}!9`;
}
