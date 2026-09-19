import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { PacienteFormulario } from "@/features/pacientes/components/paciente-formulario";

export default async function NuevaPacientePage() {
  await requireRol("admin", "medico", "obstetra", "asistente");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Nueva paciente</h1>
        </CardTitle>
        <CardDescription>
          Verifica primero el documento: si ya existe una ficha, el sistema
          te lo indicará al guardar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PacienteFormulario />
      </CardContent>
    </Card>
  );
}
