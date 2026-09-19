import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GynFem",
  description: "Plataforma de seguimiento ginecológico inteligente",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Leer headers() fuerza renderizado dinámico en cada request: el nonce
  // de CSP (src/proxy.ts) cambia por request, así que esta ruta no puede
  // precalcularse en build. Next.js detecta el nonce en la cabecera
  // Content-Security-Policy de la respuesta y lo aplica automáticamente
  // a los scripts que él mismo inyecta.
  await headers();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
