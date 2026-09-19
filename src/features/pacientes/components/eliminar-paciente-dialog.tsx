"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { eliminarPaciente } from "@/features/pacientes/actions";

interface EliminarPacienteDialogProps {
  pacienteId: string;
  nombreCompleto: string;
}

export function EliminarPacienteDialog({
  pacienteId,
  nombreCompleto,
}: EliminarPacienteDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function onConfirmar() {
    startTransition(async () => {
      const r = await eliminarPaciente({ id: pacienteId });
      if (r.ok) {
        toast.success("Paciente marcada como eliminada");
        setAbierto(false);
        router.push("/pacientes");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Marcar como eliminada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar paciente como eliminada</DialogTitle>
          <DialogDescription>
            {nombreCompleto} dejará de aparecer en las búsquedas y listados.
            No se elimina físicamente ni se pierde su historial (ADR-06);
            solo admin puede revertirlo directamente en la base de datos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setAbierto(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmar}
            disabled={pendiente}
          >
            {pendiente ? "Eliminando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
