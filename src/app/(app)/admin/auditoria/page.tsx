import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRol } from "@/lib/auth/guards";
import { filtrosAuditoriaSchema } from "@/features/auditoria/schemas";
import { listarAuditoria, listarUsuariosParaFiltro } from "@/features/auditoria/queries";
import { AuditoriaFiltros } from "@/features/auditoria/components/auditoria-filtros";
import { AuditoriaTabla } from "@/features/auditoria/components/auditoria-tabla";

interface AdminAuditoriaPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// Bandeja de auditoría: siempre dinámica para reflejar registros recientes.
export const dynamic = "force-dynamic";

export default async function AdminAuditoriaPage({ searchParams }: AdminAuditoriaPageProps) {
  await requireRol("admin");

  const params = await searchParams;
  const parseo = filtrosAuditoriaSchema.safeParse({ ...params, pagina: params.page });
  const filtros = parseo.success ? parseo.data : { pagina: 1 };

  const [resultado, usuarios] = await Promise.all([
    listarAuditoria(filtros),
    listarUsuariosParaFiltro(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">Auditoría</h1>
        </CardTitle>
        <CardDescription>
          Quién hizo qué y cuándo. Las tablas clínicas no muestran valores: solo
          usuario, fecha, acción, tabla e id del registro.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AuditoriaFiltros filtros={filtros} usuarios={usuarios} />
        <AuditoriaTabla resultado={resultado} filtros={filtros} />
      </CardContent>
    </Card>
  );
}
