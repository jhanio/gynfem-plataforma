"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
import { formatearFechaISO } from "@/lib/fechas";
import type { PuntoCitasPorDia } from "../dominio";

interface GraficoCitasDiaProps {
  datos: PuntoCitasPorDia[];
}

const CONFIG: ChartConfig = {
  total: { label: "Citas", color: "var(--chart-1)" },
};

export function GraficoCitasDia({ datos }: GraficoCitasDiaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Citas por día</CardTitle>
        <CardDescription>Solo conteos: ningún punto identifica pacientes.</CardDescription>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay citas registradas en el rango seleccionado.
          </p>
        ) : (
          <ChartContainer config={CONFIG}>
            <LineChart data={datos}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => formatearFechaISO(v)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(v) => formatearFechaISO(String(v))} />}
              />
              <Line dataKey="total" type="monotone" stroke="var(--color-total)" strokeWidth={2} dot />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
