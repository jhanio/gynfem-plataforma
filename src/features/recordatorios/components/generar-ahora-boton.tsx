"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generarRecordatoriosAhora } from "@/features/recordatorios/actions";

export function GenerarAhoraBoton() {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function onGenerar() {
    startTransition(async () => {
      const r = await generarRecordatoriosAhora();
      if (r.ok) {
        toast.success(
          r.data.creados > 0
            ? `Se generaron ${r.data.creados} recordatorio(s)`
            : "No hay recordatorios nuevos por generar",
        );
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Button variant="outline" onClick={onGenerar} disabled={pendiente}>
      <RefreshCw />
      {pendiente ? "Generando…" : "Generar ahora"}
    </Button>
  );
}
