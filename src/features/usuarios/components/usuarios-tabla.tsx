"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatearFecha } from "@/lib/fechas";
import type { Rol } from "@/lib/auth/roles";
import { activarDesactivar, cambiarRol } from "@/features/usuarios/actions";
import { ROLES } from "@/features/usuarios/schemas";
import { ROL_LABELS } from "@/features/usuarios/labels";
import type { UsuarioAdmin } from "@/features/usuarios/queries";

interface UsuariosTablaProps {
  usuarios: UsuarioAdmin[];
  actorId: string;
}

export function UsuariosTabla({ usuarios, actorId }: UsuariosTablaProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function onCambiarRol(usuarioId: string, rol: Rol) {
    startTransition(async () => {
      const r = await cambiarRol({ usuarioId, rol });
      if (r.ok) {
        toast.success("Rol actualizado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function onActivar(usuarioId: string, activo: boolean) {
    startTransition(async () => {
      const r = await activarDesactivar({ usuarioId, activo });
      if (r.ok) {
        toast.success(activo ? "Usuario activado" : "Usuario desactivado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Alta</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((u) => {
          const esYoMismo = u.id === actorId;
          return (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
              <TableCell className="text-muted-foreground">
                {u.email ?? "—"}
              </TableCell>
              <TableCell>
                <Select
                  value={u.rol}
                  onValueChange={(v) => onCambiarRol(u.id, v as Rol)}
                  disabled={pendiente}
                >
                  <SelectTrigger className="w-40" aria-label={`Rol de ${u.nombreCompleto}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {ROL_LABELS[rol]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={u.activo ? "default" : "secondary"}>
                  {u.activo ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatearFecha(u.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendiente || esYoMismo}
                  title={
                    esYoMismo
                      ? "No puedes cambiar el estado de tu propia cuenta"
                      : undefined
                  }
                  onClick={() => onActivar(u.id, !u.activo)}
                >
                  {u.activo ? "Desactivar" : "Activar"}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
