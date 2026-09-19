import type { NextRequest } from "next/server";

import { actualizarSesion } from "@/lib/supabase/middleware";
import { construirCsp, generarNonce } from "@/lib/seguridad/csp";

/**
 * Proxy (middleware) de Next.js: refresca la sesión de Supabase en cada
 * request, redirige a /login (o /mfa/*) cuando corresponde, y aplica una
 * Content-Security-Policy con nonce por request.
 *
 * La CSP solo se aplica en producción: `next dev` usa eval para Fast
 * Refresh y rompería con script-src sin 'unsafe-eval'. El Preview de
 * Vercel corre `next build && next start` (producción real), así que sí
 * queda cubierto.
 */
export async function proxy(request: NextRequest) {
  const nonce = generarNonce();
  const response = await actualizarSesion(request, nonce);

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", construirCsp(nonce));
  }

  return response;
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
