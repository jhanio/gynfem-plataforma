import { notFound } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { obtenerAtencion } from "@/features/atenciones/queries";
import { AtencionEditor } from "@/features/atenciones/components/atencion-editor";
import { AtencionDetalle } from "@/features/atenciones/components/atencion-detalle";
import { listarResponsablesSeguimiento } from "@/features/seguimientos/queries";

// Datos clínicos: siempre dinámico, sin caché compartida.
export const dynamic = "force-dynamic";

interface AtencionPageProps {
  params: Promise<{ id: string }>;
}

export default async function AtencionPage({ params }: AtencionPageProps) {
  const perfil = await requireRol("medico", "obstetra");
  const { id } = await params;

  const resultado = await obtenerAtencion(id);

  if (!resultado.ok && resultado.motivo === "no_encontrada") {
    notFound();
  }

  if (!resultado.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Atención</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-destructive">
            No se pudo registrar el acceso a la historia clínica; por seguridad no
            se muestran los datos. Intenta nuevamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { atencion } = resultado;
  const esBorradorPropio =
    atencion.estado === "borrador" && atencion.profesionalId === perfil.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">
            Atención · {atencion.paciente.apellidos}, {atencion.paciente.nombres}
          </h1>
        </CardTitle>
        <CardDescription>
          <Link
            href={`/pacientes/${atencion.pacienteId}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Ver ficha de la paciente
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {esBorradorPropio ? (
          <AtencionEditor atencion={atencion} />
        ) : (
          <AtencionDetalle
            atencion={atencion}
            responsables={await listarResponsablesSeguimiento()}
          />
        )}
      </CardContent>
    </Card>
  );
}
