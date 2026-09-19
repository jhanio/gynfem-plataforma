"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PuntoAtencionesPorServicio } from "../dominio";

interface GraficoAtencionesServicioProps {
  datos: PuntoAtencionesPorServicio[];
}

const CONFIG: ChartConfig = {
  total: { label: "Atenciones firmadas", color: "var(--chart-2)" },
};

export function GraficoAtencionesServicio({ datos }: GraficoAtencionesServicioProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atenciones por servicio</CardTitle>
        <CardDescription>Solo conteos por tipo de servicio, sin datos de pacientes.</CardDescription>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay atenciones firmadas en el rango seleccionado.
          </p>
        ) : (
          <ChartContainer config={CONFIG}>
            <BarChart data={datos}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="servicio" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
