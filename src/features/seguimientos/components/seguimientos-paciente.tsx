import { Badge } from "@/components/ui/badge";
import { formatearFechaISO } from "@/lib/fechas";
import {
  ESTADO_SEGUIMIENTO_LABELS,
  ESTADO_SEGUIMIENTO_VARIANTE,
  TIPO_SEGUIMIENTO_LABELS,
} from "@/features/seguimientos/labels";
import type { ResponsableSeguimiento, SeguimientoLista } from "@/features/seguimientos/queries";
import { CrearSeguimientoDialog } from "./crear-seguimiento-dialog";

interface SeguimientosPacienteProps {
  pacienteId: string;
  seguimientos: SeguimientoLista[];
  responsables: ResponsableSeguimiento[];
  puedeCrear: boolean;
}

export function SeguimientosPaciente({
  pacienteId,
  seguimientos,
  responsables,
  puedeCrear,
}: SeguimientosPacienteProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {puedeCrear ? (
        <div className="flex justify-end">
          <CrearSeguimientoDialog pacienteId={pacienteId} responsables={responsables} />
        </div>
      ) : null}

      {seguimientos.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Esta paciente no tiene seguimientos registrados.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {seguimientos.map((s) => (
            <li key={s.id} className="flex flex-col gap-1 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{TIPO_SEGUIMIENTO_LABELS[s.tipo]}</Badge>
                <Badge variant={ESTADO_SEGUIMIENTO_VARIANTE[s.estado]}>
                  {ESTADO_SEGUIMIENTO_LABELS[s.estado]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatearFechaISO(s.fechaObjetivo)}
                </span>
              </div>
              <p className="text-sm">{s.descripcion}</p>
              {s.responsable ? (
                <p className="text-xs text-muted-foreground">
                  Responsable: {s.responsable.nombreCompleto}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
