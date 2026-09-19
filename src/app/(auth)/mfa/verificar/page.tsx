import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requiereMfa } from "@/lib/auth/mfa";
import { rutaMfaPendiente } from "@/lib/auth/mfa-gate";
import { rutaInicialParaRol } from "@/lib/auth/roles";
import { MfaChallengeForm } from "@/features/auth/components/mfa-challenge-form";

export default async function MfaVerificarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil || !perfil.activo) {
    redirect("/cuenta-inactiva");
  }

  if (!requiereMfa(perfil.rol)) {
    redirect(rutaInicialParaRol(perfil.rol));
  }

  const ruta = await rutaMfaPendiente(supabase);
  if (ruta !== "/mfa/verificar") {
    redirect(ruta ?? rutaInicialParaRol(perfil.rol));
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2 text-center">
          <CardTitle className="text-xl font-semibold text-primary">
            <h1>Verificación en dos pasos</h1>
          </CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos de tu aplicación de autenticación
            para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaChallengeForm />
        </CardContent>
      </Card>
    </main>
  );
}
