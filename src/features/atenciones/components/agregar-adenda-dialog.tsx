"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agregarAdenda } from "@/features/atenciones/actions";
import {
  adendaSchema,
  type AdendaFormInput,
  type AdendaInput,
} from "@/features/atenciones/schemas";

interface AgregarAdendaDialogProps {
  atencionId: string;
}

export function AgregarAdendaDialog({ atencionId }: AgregarAdendaDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<AdendaFormInput, unknown, AdendaInput>({
    resolver: zodResolver(adendaSchema),
    defaultValues: { atencionId, contenido: "" },
  });

  function onSubmit(values: AdendaInput) {
    startTransition(async () => {
      const r = await agregarAdenda(values);
      if (r.ok) {
        toast.success("Adenda registrada");
        setAbierto(false);
        form.reset({ atencionId, contenido: "" });
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline">Agregar adenda</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar adenda</DialogTitle>
          <DialogDescription>
            Una adenda corrige o complementa la atención firmada sin alterar el
            registro original. Queda inmutable una vez guardada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contenido">Contenido</Label>
            <Textarea
              id="contenido"
              rows={5}
              {...form.register("contenido")}
              disabled={pendiente}
            />
            {form.formState.errors.contenido ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.contenido.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Guardar adenda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
