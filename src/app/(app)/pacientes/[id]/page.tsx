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
import { PacienteFormulario } from "@/features/pacientes/components/paciente-formulario";
import { PacienteTabs } from "@/features/pacientes/components/paciente-tabs";
import { EliminarPacienteDialog } from "@/features/pacientes/components/eliminar-paciente-dialog";
import { TIPO_DOCUMENTO_LABELS } from "@/features/pacientes/labels";

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
        />
      </CardContent>
    </Card>
  );
}
