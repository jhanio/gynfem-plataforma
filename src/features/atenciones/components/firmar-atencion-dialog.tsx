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
import { firmarAtencion } from "@/features/atenciones/actions";

interface FirmarAtencionDialogProps {
  atencionId: string;
}

export function FirmarAtencionDialog({ atencionId }: FirmarAtencionDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function onFirmar() {
    startTransition(async () => {
      const r = await firmarAtencion({ id: atencionId });
      if (r.ok) {
        toast.success("Atención firmada");
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button>Firmar atención</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Firmar atención</DialogTitle>
          <DialogDescription>
            Al firmar, la atención queda inmutable y la cita vinculada pasa a
            «atendida». Para corregir o complementar después solo podrás usar
            adendas. ¿Deseas continuar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pendiente}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={onFirmar} disabled={pendiente}>
            {pendiente ? "Firmando…" : "Firmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
