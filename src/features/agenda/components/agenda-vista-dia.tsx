import type { CitaAgenda } from "@/features/agenda/queries";
import { CitaCard } from "./cita-card";

interface AgendaVistaDiaProps {
  citas: CitaAgenda[];
  mostrarProfesional?: boolean;
}

export function AgendaVistaDia({ citas, mostrarProfesional = false }: AgendaVistaDiaProps) {
  if (citas.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No hay citas registradas para este día.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {citas.map((cita) => (
        <CitaCard key={cita.id} cita={cita} mostrarProfesional={mostrarProfesional} />
      ))}
    </ul>
  );
}
