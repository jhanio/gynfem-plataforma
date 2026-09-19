"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cambiarEstadoSeguimiento } from "@/features/seguimientos/actions";
import type { EstadoSeguimiento } from "@/features/seguimientos/dominio";
import { puedeCambiarEstadoSeguimiento } from "@/features/seguimientos/dominio";
import { ESTADO_SEGUIMIENTO_LABELS } from "@/features/seguimientos/labels";
import { ESTADOS_SEGUIMIENTO } from "@/features/seguimientos/schemas";

interface CambiarEstadoSeguimientoDialogProps {
  seguimientoId: string;
  estadoActual: EstadoSeguimiento;
}

export function CambiarEstadoSeguimientoDialog({
  seguimientoId,
  estadoActual,
}: CambiarEstadoSeguimientoDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<EstadoSeguimiento>(estadoActual);
  const [notas, setNotas] = useState("");
  const [pendiente, startTransition] = useTransition();

  const opciones = ESTADOS_SEGUIMIENTO.filter((e) =>
    puedeCambiarEstadoSeguimiento(estadoActual, e),
  );

  function onGuardar() {
    startTransition(async () => {
      const r = await cambiarEstadoSeguimiento({
        id: seguimientoId,
        estado,
        notas: notas.trim() || undefined,
      });
      if (r.ok) {
        toast.success("Seguimiento actualizado");
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  if (opciones.length === 0) {
    return null;
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Cambiar estado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado del seguimiento</DialogTitle>
          <DialogDescription>
            Estado actual: {ESTADO_SEGUIMIENTO_LABELS[estadoActual]}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cambiar-estado-select">Nuevo estado</Label>
            <Select
              value={estado}
              onValueChange={(v) => setEstado(v as EstadoSeguimiento)}
              disabled={pendiente}
            >
              <SelectTrigger id="cambiar-estado-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_SEGUIMIENTO_LABELS[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cambiar-estado-notas">Nota (opcional)</Label>
            <Textarea
              id="cambiar-estado-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={pendiente}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pendiente}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={onGuardar} disabled={pendiente}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
