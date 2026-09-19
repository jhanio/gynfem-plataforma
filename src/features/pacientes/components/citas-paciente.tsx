import { Badge } from "@/components/ui/badge";
import { ESTADO_CITA_LABELS, ESTADO_CITA_VARIANTE } from "@/features/agenda/labels";
import type { CitaAgenda } from "@/features/agenda/queries";
import { formatearFecha, formatearHora } from "@/lib/fechas";

interface CitasPacienteProps {
  citas: CitaAgenda[];
}

export function CitasPaciente({ citas }: CitasPacienteProps) {
  if (citas.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Esta paciente no tiene citas registradas.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 py-2">
      {citas.map((cita) => (
        <li key={cita.id} className="flex flex-col gap-1 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <span className="font-medium tabular-nums">
              {formatearFecha(cita.inicio)} {formatearHora(cita.inicio)}
            </span>
            <Badge variant={ESTADO_CITA_VARIANTE[cita.estado]}>
              {ESTADO_CITA_LABELS[cita.estado]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {cita.servicio.nombre} · {cita.profesional.nombreCompleto}
          </p>
        </li>
      ))}
    </ul>
  );
}
