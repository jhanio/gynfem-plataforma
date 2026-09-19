"use client";

import { useTransition } from "react";
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
} from "@/components/ui/dialog";
import { marcarNoAsistio } from "@/features/agenda/actions";

interface NoAsistioDialogProps {
  citaId: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}

export function NoAsistioDialog({
  citaId,
  abierto,
  onOpenChange,
}: NoAsistioDialogProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function onConfirmar() {
    startTransition(async () => {
      const r = await marcarNoAsistio({ id: citaId });
      if (r.ok) {
        toast.success("Cita marcada como no asistida");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar inasistencia</DialogTitle>
          <DialogDescription>
            La cita quedará registrada como no asistida.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pendiente}
          >
            Volver
          </Button>
          <Button onClick={onConfirmar} disabled={pendiente}>
            {pendiente ? "Guardando…" : "Confirmar inasistencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
