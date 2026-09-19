import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { combinarFechaHoraLima, obtenerFechaISOLima, obtenerFinDiaLima } from "@/lib/fechas";
import { desplazarFechaISO, inicioSemanaISO } from "@/features/agenda/dominio";
import {
  listarCitasHoy,
  listarCitasRango,
  listarProfesionalesAgenda,
} from "@/features/agenda/queries";
import { listarServicios } from "@/features/servicios/queries";
import { AgendaVistaDia } from "@/features/agenda/components/agenda-vista-dia";
import { AgendaVistaSemana } from "@/features/agenda/components/agenda-vista-semana";
import { NavegacionFecha, type VistaAgenda } from "@/features/agenda/components/navegacion-fecha";
import { NuevaCitaDialog } from "@/features/agenda/components/nueva-cita-dialog";
import { SelectorProfesional } from "@/features/agenda/components/selector-profesional";

const VISTAS: readonly VistaAgenda[] = ["dia", "semana", "hoy"];

function parsearVista(valor: string | undefined): VistaAgenda {
  return VISTAS.includes(valor as VistaAgenda) ? (valor as VistaAgenda) : "dia";
}

function parsearFecha(valor: string | undefined): string {
  return valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : obtenerFechaISOLima(new Date());
}

interface AgendaPageProps {
  searchParams: Promise<{ vista?: string; fecha?: string; profesionalId?: string }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  await requireRol("admin", "medico", "obstetra", "asistente");

  const params = await searchParams;
  const vista = parsearVista(params.vista);
  const fecha = parsearFecha(params.fecha);

  const [profesionales, servicios] = await Promise.all([
    listarProfesionalesAgenda(),
    listarServicios(),
  ]);
  const serviciosActivos = servicios.filter((s) => s.activo);

  const profesionalIdSemana = params.profesionalId || profesionales[0]?.id;

  let contenido: React.ReactNode;

  if (vista === "hoy") {
    const citas = await listarCitasHoy();
    contenido = <AgendaVistaDia citas={citas} mostrarProfesional />;
  } else if (vista === "semana") {
    const lunes = inicioSemanaISO(fecha);
    if (!profesionalIdSemana) {
      contenido = (
        <p className="py-8 text-center text-muted-foreground">
          No hay profesionales activos para mostrar la agenda semanal.
        </p>
      );
    } else {
      const desde = combinarFechaHoraLima(lunes, "00:00");
      const hasta = obtenerFinDiaLima(combinarFechaHoraLima(desplazarFechaISO(lunes, 6), "00:00"));
      const citas = await listarCitasRango(desde, hasta, profesionalIdSemana);
      contenido = <AgendaVistaSemana inicioSemanaISO={lunes} citas={citas} />;
    }
  } else {
    const desde = combinarFechaHoraLima(fecha, "00:00");
    const hasta = obtenerFinDiaLima(desde);
    const citas = await listarCitasRango(desde, hasta, params.profesionalId);
    contenido = (
      <AgendaVistaDia citas={citas} mostrarProfesional={!params.profesionalId} />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Agenda</h1>
        </CardTitle>
        <CardDescription>
          Agenda integrada por profesional, sin cruces de horario.
        </CardDescription>
        <CardAction>
          <NuevaCitaDialog
            servicios={serviciosActivos}
            profesionales={profesionales}
            fechaPorDefecto={fecha}
            profesionalPorDefecto={params.profesionalId}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <NavegacionFecha fecha={fecha} vista={vista} />
          {vista !== "hoy" ? (
            <SelectorProfesional
              profesionales={profesionales}
              profesionalId={vista === "semana" ? profesionalIdSemana : params.profesionalId}
              permitirTodos={vista === "dia"}
            />
          ) : null}
        </div>
        {contenido}
      </CardContent>
    </Card>
  );
}
