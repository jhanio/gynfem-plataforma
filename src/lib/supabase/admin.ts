import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Cliente administrativo de Supabase con la CLAVE SECRETA (service_role).
 * Omite RLS: úsalo SOLO para operaciones que la Auth Admin API requiere
 * (crear usuarios, listar auth.users). Nunca lo importes en código de cliente.
 *
 * La autorización de negocio (¿es admin?) debe verificarse ANTES de usarlo,
 * con requireRol('admin') sobre la sesión del usuario.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY no está configurada");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
