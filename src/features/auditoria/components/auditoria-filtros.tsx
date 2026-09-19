"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCION_LABELS, TABLA_LABELS } from "../labels";
import {
  ACCIONES_AUDITORIA,
  FILTRO_TODOS as TODOS,
  TABLAS_AUDITADAS,
  type FiltrosAuditoria,
} from "../schemas";
import type { UsuarioParaFiltro } from "../queries";

interface AuditoriaFiltrosProps {
  filtros: FiltrosAuditoria;
  usuarios: UsuarioParaFiltro[];
}

export function AuditoriaFiltros({ filtros, usuarios }: AuditoriaFiltrosProps) {
  return (
    <form
      action="/admin/auditoria"
      method="get"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-usuario">Usuario</Label>
        <Select name="usuarioId" defaultValue={filtros.usuarioId ?? TODOS}>
          <SelectTrigger id="filtro-usuario" className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombreCompleto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-tabla">Tabla</Label>
        <Select name="tabla" defaultValue={filtros.tabla ?? TODOS}>
          <SelectTrigger id="filtro-tabla" className="w-full">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas</SelectItem>
            {TABLAS_AUDITADAS.map((tabla) => (
              <SelectItem key={tabla} value={tabla}>
                {TABLA_LABELS[tabla]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-accion">Acción</Label>
        <Select name="accion" defaultValue={filtros.accion ?? TODOS}>
          <SelectTrigger id="filtro-accion" className="w-full">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas</SelectItem>
            {ACCIONES_AUDITORIA.map((accion) => (
              <SelectItem key={accion} value={accion}>
                {ACCION_LABELS[accion]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-desde">Desde</Label>
        <Input id="filtro-desde" type="date" name="desde" defaultValue={filtros.desde ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-hasta">Hasta</Label>
        <Input id="filtro-hasta" type="date" name="hasta" defaultValue={filtros.hasta ?? ""} />
      </div>

      <div className="flex gap-2 lg:col-span-5">
        <Button type="submit">
          <Search />
          Filtrar
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/auditoria">Limpiar filtros</Link>
        </Button>
      </div>
    </form>
  );
}
