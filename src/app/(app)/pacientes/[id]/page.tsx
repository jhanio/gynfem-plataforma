import { notFound } from "next/navigation";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { obtenerPaciente } from "@/features/pacientes/queries";
import { listarCitasPaciente } from "@/features/agenda/queries";
import { cargarHistoriaClinica } from "@/features/historias/queries";
import { PacienteFormulario } from "@/features/pacientes/components/paciente-formulario";
import { PacienteTabs } from "@/features/pacientes/components/paciente-tabs";
import { EliminarPacienteDialog } from "@/features/pacientes/components/eliminar-paciente-dialog";
import { CitasPaciente } from "@/features/pacientes/components/citas-paciente";
import { HistoriaClinica } from "@/features/historias/components/historia-clinica";
import { TIPO_DOCUMENTO_LABELS } from "@/features/pacientes/labels";
import {
  listarResponsablesSeguimiento,
  listarSeguimientosPaciente,
} from "@/features/seguimientos/queries";
import { SeguimientosPaciente } from "@/features/seguimientos/components/seguimientos-paciente";

// La ficha registra acceso clínico para roles médicos: siempre dinámica.
export const dynamic = "force-dynamic";

interface FichaPacientePageProps {
  params: Promise<{ id: string }>;
}

export default async function FichaPacientePage({
  params,
}: FichaPacientePageProps) {
  const { rol } = await requireRol("admin", "medico", "obstetra", "asistente");
  const { id } = await params;

  const paciente = await obtenerPaciente(id);
  if (!paciente) {
    notFound();
  }

  const citas = await listarCitasPaciente(paciente.id);
  const puedeVerHistoria = rol === "medico" || rol === "obstetra";
  const historia = puedeVerHistoria ? (
    <HistoriaClinica
      pacienteId={paciente.id}
      carga={await cargarHistoriaClinica(paciente.id)}
    />
  ) : undefined;

  const [seguimientos, responsables] = await Promise.all([
    listarSeguimientosPaciente(paciente.id),
    listarResponsablesSeguimiento(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">
            {paciente.apellidos}, {paciente.nombres}
          </h1>
        </CardTitle>
        <CardDescription>
          {TIPO_DOCUMENTO_LABELS[paciente.tipoDocumento]}{" "}
          {paciente.numeroDocumento}
        </CardDescription>
        {rol === "admin" ? (
          <CardAction>
            <EliminarPacienteDialog
              pacienteId={paciente.id}
              nombreCompleto={`${paciente.nombres} ${paciente.apellidos}`}
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <PacienteTabs
          rol={rol}
          datos={<PacienteFormulario paciente={paciente} />}
          citas={<CitasPaciente citas={citas} />}
          historia={historia}
          seguimientos={
            <SeguimientosPaciente
              pacienteId={paciente.id}
              seguimientos={seguimientos}
              responsables={responsables}
              puedeCrear={puedeVerHistoria}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
