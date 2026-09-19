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
import { MfaEnrollForm } from "@/features/auth/components/mfa-enroll-form";

export default async function MfaActivarPage() {
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
  if (ruta !== "/mfa/activar") {
    redirect(ruta ?? rutaInicialParaRol(perfil.rol));
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center gap-2 text-center">
          <CardTitle className="text-xl font-semibold text-primary">
            <h1>Activa la verificación en dos pasos</h1>
          </CardTitle>
          <CardDescription>
            Tu rol requiere un segundo factor de seguridad. Agrega esta cuenta
            a una aplicación de autenticación (Google Authenticator, Authy,
            1Password, etc.) y confirma el código para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaEnrollForm />
        </CardContent>
      </Card>
    </main>
  );
}
