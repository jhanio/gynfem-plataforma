import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rol } from "@/lib/auth/roles";

export interface UsuarioAdmin {
  id: string;
  nombreCompleto: string;
  email: string | null;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  mfaActivo: boolean;
}

/**
 * Lista los usuarios internos con su correo.
 * Debe invocarse solo tras requireRol('admin'). El correo proviene de
 * auth.users vía la Auth Admin API (no está en public.profiles).
 */
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const supabase = await createClient();
  const { data: perfiles, error } = await supabase
    .from("profiles")
    .select("id, nombre_completo, rol, activo, created_at")
    .order("created_at", { ascending: true });

  if (error || !perfiles) {
    return [];
  }

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const usuariosPorId = new Map((data?.users ?? []).map((u) => [u.id, u]));

  return perfiles.map((p) => {
    const usuario = usuariosPorId.get(p.id);
    return {
      id: p.id,
      nombreCompleto: p.nombre_completo,
      email: usuario?.email ?? null,
      rol: p.rol,
      activo: p.activo,
      createdAt: p.created_at,
      mfaActivo: (usuario?.factors ?? []).some((f) => f.status === "verified"),
    };
  });
}
