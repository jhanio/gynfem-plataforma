import Link from "next/link";
import { Plus } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRol } from "@/lib/auth/guards";
import { listarPacientes } from "@/features/pacientes/queries";
import { PacientesBuscador } from "@/features/pacientes/components/pacientes-buscador";
import { PacientesTabla } from "@/features/pacientes/components/pacientes-tabla";

interface PacientesPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function PacientesPage({
  searchParams,
}: PacientesPageProps) {
  await requireRol("admin", "medico", "obstetra", "asistente");

  const params = await searchParams;
  const q = params.q ?? "";
  const pagina = Number.parseInt(params.page ?? "1", 10) || 1;
  const resultado = await listarPacientes({ q, pagina });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Pacientes</h1>
        </CardTitle>
        <CardDescription>
          Registro maestro: ficha única por documento de identidad.
        </CardDescription>
        <CardAction>
          <Button asChild>
            <Link href="/pacientes/nuevo">
              <Plus />
              Nueva paciente
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PacientesBuscador q={q} />
        <PacientesTabla resultado={resultado} q={q} />
      </CardContent>
    </Card>
  );
}
