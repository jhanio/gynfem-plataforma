import { desplazarFechaISO } from "@/features/agenda/dominio";
import type { CitaAgenda } from "@/features/agenda/queries";
import { obtenerFechaISOLima } from "@/lib/fechas";
import { CitaCard } from "./cita-card";

interface AgendaVistaSemanaProps {
  inicioSemanaISO: string;
  citas: CitaAgenda[];
  puedeAtender?: boolean;
}

const NOMBRES_DIA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function AgendaVistaSemana({
  inicioSemanaISO,
  citas,
  puedeAtender = false,
}: AgendaVistaSemanaProps) {
  const dias = Array.from({ length: 7 }, (_, i) => desplazarFechaISO(inicioSemanaISO, i));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
      {dias.map((diaISO, i) => {
        const citasDelDia = citas.filter((c) => obtenerFechaISOLima(c.inicio) === diaISO);
        return (
          <div key={diaISO} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {NOMBRES_DIA[i]} {diaISO.slice(8, 10)}/{diaISO.slice(5, 7)}
            </p>
            {citasDelDia.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin citas</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {citasDelDia.map((cita) => (
                  <CitaCard key={cita.id} cita={cita} puedeAtender={puedeAtender} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
