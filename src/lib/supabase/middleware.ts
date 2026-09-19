import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";
import { requiereMfa } from "@/lib/auth/mfa";
import { rutaMfaPendiente } from "@/lib/auth/mfa-gate";

/** Rutas públicas que no requieren sesión. */
const RUTAS_PUBLICAS = ["/login", "/cuenta-inactiva"];

/** Rutas de MFA: requieren sesión (aal1 basta), pero no aal2 todavía. */
const RUTAS_MFA = ["/mfa/activar", "/mfa/verificar"];

function coincideConAlguna(pathname: string, rutas: readonly string[]): boolean {
  return rutas.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}

/**
 * Refresca la sesión de Supabase en cada request y protege las rutas privadas.
 * Si no hay usuario y la ruta no es pública, redirige a /login.
 *
 * Basado en la guía oficial de @supabase/ssr para Next.js.
 */
export async function actualizarSesion(
  request: NextRequest,
  nonce: string,
): Promise<NextResponse> {
  // Reenviamos x-nonce en la request para que Server Components lean el
  // mismo valor que la cabecera Content-Security-Policy de la respuesta
  // (ver src/lib/seguridad/csp.ts y src/proxy.ts).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no ejecutar código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaPublica = coincideConAlguna(pathname, RUTAS_PUBLICAS);

  if (!user) {
    if (!esRutaPublica) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (esRutaPublica || coincideConAlguna(pathname, RUTAS_MFA)) {
    return supabaseResponse;
  }

  // El rol es la fuente de verdad en public.profiles (no en
  // app_metadata): app_metadata puede llegar vacío para cuentas creadas
  // antes de que existiera ese flujo, y los cambios de rol posteriores
  // solo se aplican en profiles.
  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.activo) {
    const url = request.nextUrl.clone();
    url.pathname = "/cuenta-inactiva";
    return NextResponse.redirect(url);
  }

  if (requiereMfa(perfil.rol)) {
    const ruta = await rutaMfaPendiente(supabase);
    if (ruta) {
      const url = request.nextUrl.clone();
      url.pathname = ruta;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
