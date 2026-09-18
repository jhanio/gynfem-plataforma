import { Plus } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRol } from "@/lib/auth/guards";
import { listarServicios } from "@/features/servicios/queries";
import { ServicioDialog } from "@/features/servicios/components/servicio-dialog";
import { ServiciosTabla } from "@/features/servicios/components/servicios-tabla";

export default async function AdminServiciosPage() {
  await requireRol("admin");
  const servicios = await listarServicios();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Servicios</h1>
        </CardTitle>
        <CardDescription>
          Catálogo de servicios. Los servicios no se eliminan: se desactivan para
          conservar el historial.
        </CardDescription>
        <CardAction>
          <ServicioDialog
            trigger={
              <Button>
                <Plus />
                Nuevo servicio
              </Button>
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ServiciosTabla servicios={servicios} />
      </CardContent>
    </Card>
  );
}
