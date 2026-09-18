"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activarDesactivarServicio } from "@/features/servicios/actions";
import { ServicioDialog } from "@/features/servicios/components/servicio-dialog";
import type { Servicio } from "@/features/servicios/queries";

interface ServiciosTablaProps {
  servicios: Servicio[];
}

export function ServiciosTabla({ servicios }: ServiciosTablaProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function onToggle(id: string, activo: boolean) {
    startTransition(async () => {
      const r = await activarDesactivarServicio({ id, activo });
      if (r.ok) {
        toast.success(activo ? "Servicio activado" : "Servicio desactivado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  if (servicios.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay servicios en el catálogo. Crea el primero.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="text-right">Duración</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicios.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.nombre}</TableCell>
            <TableCell className="text-muted-foreground">{s.categoria}</TableCell>
            <TableCell className="text-right">{s.duracionMin} min</TableCell>
            <TableCell className="text-right">
              {s.precioReferencial === null
                ? "—"
                : `S/ ${s.precioReferencial.toFixed(2)}`}
            </TableCell>
            <TableCell>
              <Badge variant={s.activo ? "default" : "secondary"}>
                {s.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2">
              <ServicioDialog
                servicio={s}
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil />
                    Editar
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                disabled={pendiente}
                onClick={() => onToggle(s.id, !s.activo)}
              >
                {s.activo ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
