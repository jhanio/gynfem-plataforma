import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cerrarSesion } from "@/features/auth/actions";

export default function CuentaInactivaPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2 text-center">
          <CardTitle className="text-xl font-semibold text-primary">
            <h1>Cuenta pendiente de activación</h1>
          </CardTitle>
          <CardDescription>
            Tu cuenta aún no está activa. Comunícate con el administrador del
            sistema para habilitar tu acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={cerrarSesion}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
