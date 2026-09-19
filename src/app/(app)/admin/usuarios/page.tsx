import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { listarUsuarios } from "@/features/usuarios/queries";
import { CrearUsuarioDialog } from "@/features/usuarios/components/crear-usuario-dialog";
import { UsuariosTabla } from "@/features/usuarios/components/usuarios-tabla";

export default async function AdminUsuariosPage() {
  const actor = await requireRol("admin");
  const usuarios = await listarUsuarios();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Usuarios</h1>
        </CardTitle>
        <CardDescription>
          Gestiona el acceso del personal: crea cuentas, cambia roles y activa o
          desactiva usuarios.
        </CardDescription>
        <CardAction>
          <CrearUsuarioDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        <UsuariosTabla usuarios={usuarios} actorId={actor.id} />
      </CardContent>
    </Card>
  );
}
