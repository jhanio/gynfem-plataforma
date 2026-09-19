"use server";

import { revalidatePath } from "next/cache";

import { requireRol } from "@/lib/auth/guards";
import { generarPasswordTemporal } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fallo, ok, type Resultado } from "@/lib/resultado";
import {
  activarUsuarioSchema,
  cambiarRolSchema,
  crearUsuarioSchema,
  restablecerMfaSchema,
} from "./schemas";
import {
  validarActivacion,
  validarCambioRol,
  validarRestablecerMfa,
} from "./anti-bloqueo";

/**
 * Crea un usuario interno con rol y contraseña temporal.
 * El rol se pasa en app_metadata (fuente del rol inicial en el trigger).
 * Devuelve la contraseña temporal para mostrarla una sola vez.
 */
export async function crearUsuario(
  input: unknown,
): Promise<Resultado<{ passwordTemporal: string }>> {
  await requireRol("admin");

  const parsed = crearUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Revisa los campos marcados.");
  }

  const passwordTemporal = generarPasswordTemporal();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: passwordTemporal,
    email_confirm: true,
    user_metadata: { nombre_completo: parsed.data.nombreCompleto },
    app_metadata: { rol: parsed.data.rol },
  });

  if (error) {
    if (
      error.code === "email_exists" ||
      error.status === 422 ||
      /already/i.test(error.message)
    ) {
      return fallo("Ya existe un usuario con ese correo.");
    }
    return fallo("No se pudo crear el usuario.");
  }

  // Defensa en profundidad: GoTrue aplica app_metadata (rol) en un UPDATE
  // posterior al INSERT, así que el trigger de creación pudo no verlo. La
  // migración sync_rol_perfil lo corrige en BD; esto lo garantiza también
  // aquí de forma idempotente (por si la migración no está aplicada aún).
  if (data.user) {
    await admin
      .from("profiles")
      .update({ rol: parsed.data.rol, activo: true })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/usuarios");
  return ok({ passwordTemporal });
}

/** Cambia el rol de un usuario (con la sesión del admin, para auditar el actor). */
export async function cambiarRol(input: unknown): Promise<Resultado<null>> {
  const actor = await requireRol("admin");

  const parsed = cambiarRolSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Datos no válidos.");
  }

  const guard = validarCambioRol({
    actorId: actor.id,
    objetivoId: parsed.data.usuarioId,
    nuevoRol: parsed.data.rol,
  });
  if (!guard.ok) {
    return guard;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ rol: parsed.data.rol })
    .eq("id", parsed.data.usuarioId);

  if (error) {
    return fallo("No se pudo cambiar el rol.");
  }

  revalidatePath("/admin/usuarios");
  return ok(null);
}

/** Activa o desactiva un usuario (con la sesión del admin, para auditar el actor). */
export async function activarDesactivar(
  input: unknown,
): Promise<Resultado<null>> {
  const actor = await requireRol("admin");

  const parsed = activarUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Datos no válidos.");
  }

  const guard = validarActivacion({
    actorId: actor.id,
    objetivoId: parsed.data.usuarioId,
    activo: parsed.data.activo,
  });
  if (!guard.ok) {
    return guard;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ activo: parsed.data.activo })
    .eq("id", parsed.data.usuarioId);

  if (error) {
    return fallo("No se pudo actualizar el estado del usuario.");
  }

  revalidatePath("/admin/usuarios");
  return ok(null);
}

/**
 * Restablece el MFA de otro usuario: elimina sus factores TOTP inscritos
 * (vía Auth Admin API, con la clave secreta) para que vuelva a pasar por
 * /mfa/activar en su próximo inicio de sesión. Es la única salida cuando
 * un usuario clínico pierde su dispositivo de autenticación: Supabase no
 * ofrece un flujo de "recuperación" de MFA para el propio usuario.
 */
export async function restablecerMfa(input: unknown): Promise<Resultado<null>> {
  const actor = await requireRol("admin");

  const parsed = restablecerMfaSchema.safeParse(input);
  if (!parsed.success) {
    return fallo("Datos no válidos.");
  }

  const guard = validarRestablecerMfa({
    actorId: actor.id,
    objetivoId: parsed.data.usuarioId,
  });
  if (!guard.ok) {
    return guard;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({
    userId: parsed.data.usuarioId,
  });
  if (error) {
    return fallo("No se pudo obtener los factores MFA del usuario.");
  }

  for (const factor of data.factors) {
    const { error: errorBorrado } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: parsed.data.usuarioId,
    });
    if (errorBorrado) {
      return fallo("No se pudo eliminar uno de los factores MFA del usuario.");
    }
  }

  // Con la sesión del admin (no con el cliente admin) para que auth.uid()
  // capture al actor real en la auditoría.
  const supabase = await createClient();
  await supabase.rpc("registrar_reset_mfa", { p_usuario_id: parsed.data.usuarioId });

  revalidatePath("/admin/usuarios");
  return ok(null);
}
