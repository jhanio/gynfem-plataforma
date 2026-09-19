import { Badge } from "@/components/ui/badge";
import { formatearHora } from "@/lib/fechas";
import { ESTADO_RECORDATORIO_LABELS, ESTADO_RECORDATORIO_VARIANTE } from "@/features/recordatorios/labels";
import type { RecordatorioHoy } from "@/features/recordatorios/queries";
import { AbrirWhatsappBoton } from "./abrir-whatsapp-boton";
import { GenerarAhoraBoton } from "./generar-ahora-boton";
import { MarcarFallidoDialog } from "./marcar-fallido-dialog";

interface RecordatoriosHoyProps {
  recordatorios: RecordatorioHoy[];
}

export function RecordatoriosHoy({ recordatorios }: RecordatoriosHoyProps) {
  const pendientes = recordatorios.filter((r) => r.estado === "pendiente");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {pendientes.length} pendiente(s) de {recordatorios.length} generado(s) hoy.
        </p>
        <GenerarAhoraBoton />
      </div>

      {recordatorios.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No hay recordatorios generados hoy.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recordatorios.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {r.paciente.apellidos}, {r.paciente.nombres}
                  </span>
                  <Badge variant={ESTADO_RECORDATORIO_VARIANTE[r.estado]}>
                    {ESTADO_RECORDATORIO_LABELS[r.estado]}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Programado: {formatearHora(r.programadoPara)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{r.mensaje}</p>
                {r.estado === "fallido" && r.error ? (
                  <p className="text-xs text-destructive">Motivo: {r.error}</p>
                ) : null}
              </div>

              {r.estado === "pendiente" ? (
                <div className="flex flex-wrap gap-2">
                  <AbrirWhatsappBoton
                    recordatorioId={r.id}
                    telefono={r.paciente.telefono}
                    mensaje={r.mensaje}
                  />
                  <MarcarFallidoDialog recordatorioId={r.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
