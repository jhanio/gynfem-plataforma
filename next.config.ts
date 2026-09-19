import type { NextConfig } from "next";

// La Content-Security-Policy (con nonce por request) se aplica en
// src/proxy.ts, no aquí: necesita un valor distinto en cada respuesta y
// headers() es estático. Estas cabeceras sí son constantes.
const CABECERAS_SEGURIDAD = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: CABECERAS_SEGURIDAD,
      },
    ];
  },
};

export default nextConfig;
