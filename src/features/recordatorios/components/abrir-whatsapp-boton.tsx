"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { marcarRecordatorioEnviado } from "@/features/recordatorios/actions";
import { construirUrlWhatsapp } from "@/features/recordatorios/dominio";

interface AbrirWhatsappBotonProps {
  recordatorioId: string;
  telefono: string | null;
  mensaje: string;
}

export function AbrirWhatsappBoton({ recordatorioId, telefono, mensaje }: AbrirWhatsappBotonProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const url = construirUrlWhatsapp(telefono, mensaje);

  if (!url) {
    return (
      <span className="text-sm text-destructive">
        Sin teléfono válido registrado
      </span>
    );
  }

  function onAbrir() {
    window.open(url ?? undefined, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      const r = await marcarRecordatorioEnviado({ id: recordatorioId });
      if (r.ok) {
        toast.success("Recordatorio marcado como enviado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Button size="sm" onClick={onAbrir} disabled={pendiente}>
      <MessageCircle />
      Abrir WhatsApp
    </Button>
  );
}
