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
import { Textarea } from "@/components/ui/textarea";
import { marcarRecordatorioFallido } from "@/features/recordatorios/actions";

interface MarcarFallidoDialogProps {
  recordatorioId: string;
}

export function MarcarFallidoDialog({ recordatorioId }: MarcarFallidoDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pendiente, startTransition] = useTransition();

  function onGuardar() {
    startTransition(async () => {
      const r = await marcarRecordatorioFallido({ id: recordatorioId, motivo });
      if (r.ok) {
        toast.success("Recordatorio marcado como fallido");
        setAbierto(false);
        setMotivo("");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Marcar fallido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar recordatorio como fallido</DialogTitle>
          <DialogDescription>
            Indica el motivo (por ejemplo, &quot;número equivocado&quot; o
            &quot;no responde&quot;).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="recordatorio-motivo">Motivo</Label>
          <Textarea
            id="recordatorio-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={pendiente}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pendiente}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={onGuardar} disabled={pendiente || motivo.trim().length === 0}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
