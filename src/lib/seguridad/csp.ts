/**
 * Content-Security-Policy con nonce por request (patrón oficial de
 * Next.js App Router: https://nextjs.org/docs/app/guides/content-security-policy).
 *
 * No usamos next.config.ts para esto porque el nonce cambia en cada
 * request; una CSP estática no podría incluirlo. Este módulo se usa
 * desde src/proxy.ts, que sí puede generar un valor distinto por
 * request y setearlo tanto en la respuesta (cabecera) como en la
 * request reenviada (para que el árbol de Server Components la lea vía
 * headers() y Next.js aplique el mismo nonce a los scripts que inyecta).
 *
 * Sin 'unsafe-eval' ni 'unsafe-inline' en script-src: 'strict-dynamic'
 * permite que los scripts con el nonce correcto carguen a su vez los
 * chunks de JS divididos por código, sin necesitar un nonce en cada uno.
 */
export function generarNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function construirCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const conectaCon = ["'self'", supabaseUrl].filter(Boolean).join(" ");

  // El Preview de Vercel inyecta su barra de feedback (vercel.live) en
  // un iframe. Solo la permitimos ahí: en producción (VERCEL_ENV no
  // definido o "production") no tiene por qué cargarse ese script.
  const esPreview = process.env.VERCEL_ENV === "preview";
  const frameSrc = esPreview ? "frame-src https://vercel.live" : "frame-src 'none'";

  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // 'unsafe-inline' en style-src: Radix UI/shadcn fijan estilos en
    // línea vía JS (posicionamiento de popovers, etc.); no hay forma
    // práctica de noncear esos estilos dinámicos.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src ${conectaCon}`,
    frameSrc,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}
