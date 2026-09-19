"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reprogramarCita } from "@/features/agenda/actions";
import { reprogramarCitaSchema, type ReprogramarCitaInput } from "@/features/agenda/schemas";

interface ReprogramarCitaDialogProps {
  citaId: string;
  fechaActual: string;
  horaActual: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}

export function ReprogramarCitaDialog({
  citaId,
  fechaActual,
  horaActual,
  abierto,
  onOpenChange,
}: ReprogramarCitaDialogProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  const form = useForm<ReprogramarCitaInput>({
    resolver: zodResolver(reprogramarCitaSchema),
    defaultValues: { id: citaId, fecha: fechaActual, hora: horaActual, motivo: "" },
  });

  function onSubmit(values: ReprogramarCitaInput) {
    startTransition(async () => {
      const r = await reprogramarCita(values);
      if (r.ok) {
        toast.success("Cita reprogramada");
        onOpenChange(false);
        form.reset();
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
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>
            Se creará una cita nueva enlazada a esta y la actual quedará como
            reprogramada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reprogramar-fecha">Nueva fecha</Label>
              <Input
                id="reprogramar-fecha"
                type="date"
                {...form.register("fecha")}
                disabled={pendiente}
              />
              {form.formState.errors.fecha ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fecha.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reprogramar-hora">Nueva hora</Label>
              <Input
                id="reprogramar-hora"
                type="time"
                {...form.register("hora")}
                disabled={pendiente}
              />
              {form.formState.errors.hora ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.hora.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reprogramar-motivo">Motivo</Label>
            <Textarea
              id="reprogramar-motivo"
              {...form.register("motivo")}
              disabled={pendiente}
            />
            {form.formState.errors.motivo ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.motivo.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pendiente}
            >
              Volver
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Reprogramando…" : "Reprogramar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
