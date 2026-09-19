import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Cliente de Supabase para Server Components y Server Actions.
 * Lee y escribe las cookies de sesión del usuario. La autorización se resuelve
 * en la base de datos vía RLS usando el JWT del usuario (auth.uid()).
 *
 * En el servidor autoriza siempre con supabase.auth.getUser() (nunca getSession()).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` se llamó desde un Server Component. Es seguro ignorarlo
            // cuando el refresco de sesión lo maneja el middleware/proxy.
          }
        },
      },
    },
  );
}
