"use client";

import { useTransition } from "react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iniciarAtencion } from "@/features/atenciones/actions";
import {
  iniciarAtencionSchema,
  type IniciarAtencionInput,
} from "@/features/atenciones/schemas";

interface IniciarAtencionDialogProps {
  citaId: string;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}

export function IniciarAtencionDialog({
  citaId,
  abierto,
  onOpenChange,
}: IniciarAtencionDialogProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  const form = useForm<IniciarAtencionInput>({
    resolver: zodResolver(iniciarAtencionSchema),
    defaultValues: { citaId, motivoConsulta: "" },
  });

  function onSubmit(values: IniciarAtencionInput) {
    startTransition(async () => {
      const r = await iniciarAtencion(values);
      if (r.ok) {
        toast.success("Atención iniciada");
        onOpenChange(false);
        router.push(`/atenciones/${r.data.id}`);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar atención</DialogTitle>
          <DialogDescription>
            Se creará un borrador de atención con la paciente y el servicio de la
            cita. Indica el motivo de consulta para comenzar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivoConsulta">Motivo de consulta</Label>
            <Textarea
              id="motivoConsulta"
              rows={3}
              {...form.register("motivoConsulta")}
              disabled={pendiente}
            />
            {form.formState.errors.motivoConsulta ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.motivoConsulta.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Iniciando…" : "Iniciar atención"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
