"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Rol } from "@/lib/auth/roles";

interface PacienteTabsProps {
  rol: Rol;
  datos: ReactNode;
  citas: ReactNode;
  historia?: ReactNode;
}

function PlaceholderTab({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-muted-foreground">{texto}</p>;
}

export function PacienteTabs({ rol, datos, citas, historia }: PacienteTabsProps) {
  const puedeVerHistoria = rol === "medico" || rol === "obstetra";

  return (
    <Tabs defaultValue="datos">
      <TabsList>
        <TabsTrigger value="datos">Datos</TabsTrigger>
        <TabsTrigger value="citas">Citas</TabsTrigger>
        {puedeVerHistoria ? (
          <TabsTrigger value="historia">Historia clínica</TabsTrigger>
        ) : null}
        <TabsTrigger value="seguimientos">Seguimientos</TabsTrigger>
      </TabsList>

      <TabsContent value="datos">{datos}</TabsContent>

      <TabsContent value="citas">{citas}</TabsContent>

      {puedeVerHistoria ? (
        <TabsContent value="historia">{historia}</TabsContent>
      ) : null}

      <TabsContent value="seguimientos">
        <PlaceholderTab texto="Los seguimientos se implementarán en la Fase 6." />
      </TabsContent>
    </Tabs>
  );
}
