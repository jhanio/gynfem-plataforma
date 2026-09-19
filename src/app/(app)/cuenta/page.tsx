import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPerfil } from "@/lib/auth/guards";
import { requiereMfa } from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/server";
import { ROL_LABELS } from "@/features/usuarios/labels";
import { MfaReinscribirButton } from "@/features/cuenta/components/mfa-reinscribir-button";

export default async function CuentaPage() {
  const perfil = await getPerfil();
  const necesitaMfa = requiereMfa(perfil.rol);

  let factorId: string | null = null;
  if (necesitaMfa) {
    const supabase = await createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    factorId = data?.totp.find((f) => f.status === "verified")?.id ?? null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Mi cuenta</h1>
          </CardTitle>
          <CardDescription>Datos de tu perfil en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nombre: </span>
            {perfil.nombreCompleto}
          </div>
          <div>
            <span className="text-muted-foreground">Correo: </span>
            {perfil.email ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Rol: </span>
            {ROL_LABELS[perfil.rol]}
          </div>
        </CardContent>
      </Card>

      {necesitaMfa ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Seguridad</h2>
            </CardTitle>
            <CardDescription>
              Tu rol exige verificación en dos pasos (MFA) para iniciar sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <Badge variant={factorId ? "default" : "secondary"}>
              {factorId ? "MFA activo" : "MFA sin inscribir"}
            </Badge>
            {factorId ? (
              <p className="text-sm text-muted-foreground">
                Si perdiste tu dispositivo o cambiaste de app de autenticación,
                puedes reinscribir un nuevo factor. Se te pedirá volver a
                verificarlo de inmediato.
              </p>
            ) : null}
            {factorId ? <MfaReinscribirButton factorId={factorId} /> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
