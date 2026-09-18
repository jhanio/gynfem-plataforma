import type { NextRequest } from "next/server";

import { actualizarSesion } from "@/lib/supabase/middleware";

/**
 * Proxy (middleware) de Next.js: refresca la sesión de Supabase en cada request
 * y redirige a /login cuando no hay usuario en rutas privadas.
 */
export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static, _next/image (assets)
     * - favicon.ico y archivos con extensión (imágenes, fuentes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
