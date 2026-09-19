"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldOff } from "lucide-react";

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
import { restablecerMfa } from "@/features/usuarios/actions";

interface RestablecerMfaDialogProps {
  usuarioId: string;
  nombreCompleto: string;
}

export function RestablecerMfaDialog({
  usuarioId,
  nombreCompleto,
}: RestablecerMfaDialogProps) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function onConfirmar() {
    startTransition(async () => {
      const r = await restablecerMfa({ usuarioId });
      if (r.ok) {
        toast.success("MFA restablecido. El usuario deberá inscribirlo de nuevo al ingresar.");
        setAbierto(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldOff />
          Restablecer MFA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer MFA de {nombreCompleto}</DialogTitle>
          <DialogDescription>
            Se eliminará el factor de verificación en dos pasos inscrito por
            este usuario. En su próximo inicio de sesión deberá inscribir uno
            nuevo antes de poder usar la plataforma. Úsalo solo si perdió su
            dispositivo de autenticación.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAbierto(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmar}
            disabled={pendiente}
          >
            {pendiente ? "Restableciendo…" : "Sí, restablecer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
