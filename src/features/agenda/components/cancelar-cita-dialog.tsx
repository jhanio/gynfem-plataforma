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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelarCita } from "@/features/agenda/actions";

interface CancelarCitaDialogProps {
  citaId: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}

export function CancelarCitaDialog({
  citaId,
  abierto,
  onOpenChange,
}: CancelarCitaDialogProps) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [pendiente, startTransition] = useTransition();

  function onConfirmar() {
    startTransition(async () => {
      const r = await cancelarCita({ id: citaId, motivo: motivo.trim() || undefined });
      if (r.ok) {
        toast.success("Cita cancelada");
        onOpenChange(false);
        setMotivo("");
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
          <DialogTitle>Cancelar cita</DialogTitle>
          <DialogDescription>
            La cita quedará marcada como cancelada. Esta acción no se puede
            deshacer desde aquí.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo-cancelacion">Motivo (opcional)</Label>
          <Textarea
            id="motivo-cancelacion"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={pendiente}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pendiente}
          >
            Volver
          </Button>
          <Button variant="destructive" onClick={onConfirmar} disabled={pendiente}>
            {pendiente ? "Cancelando…" : "Cancelar cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
