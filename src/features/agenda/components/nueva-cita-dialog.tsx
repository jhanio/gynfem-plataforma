"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buscarPacientesAgenda, crearCita, type PacienteBusquedaAgenda } from "@/features/agenda/actions";
import { crearCitaSchema, type CrearCitaInput } from "@/features/agenda/schemas";
import type { ProfesionalAgenda } from "@/features/agenda/queries";

interface ServicioAgenda {
  id: string;
  nombre: string;
  duracionMin: number;
}

interface NuevaCitaDialogProps {
  servicios: ServicioAgenda[];
  profesionales: ProfesionalAgenda[];
  fechaPorDefecto: string;
  profesionalPorDefecto?: string;
}

const LONGITUD_MINIMA_BUSQUEDA = 2;
const DEBOUNCE_BUSQUEDA_MS = 300;

export function NuevaCitaDialog({
  servicios,
  profesionales,
  fechaPorDefecto,
  profesionalPorDefecto,
}: NuevaCitaDialogProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [comboAbierto, setComboAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<PacienteBusquedaAgenda[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<PacienteBusquedaAgenda | null>(null);
  const [pendiente, startTransition] = useTransition();

  const form = useForm<CrearCitaInput>({
    resolver: zodResolver(crearCitaSchema),
    defaultValues: {
      pacienteId: "",
      servicioId: servicios[0]?.id ?? "",
      profesionalId: profesionalPorDefecto ?? profesionales[0]?.id ?? "",
      fecha: fechaPorDefecto,
      hora: "",
      notasAdmin: "",
    },
  });

  useEffect(() => {
    if (query.trim().length < LONGITUD_MINIMA_BUSQUEDA) {
      return;
    }
    const id = setTimeout(() => {
      void buscarPacientesAgenda(query).then(setResultados);
    }, DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(id);
  }, [query]);

  const resultadosVisibles = query.trim().length < LONGITUD_MINIMA_BUSQUEDA ? [] : resultados;

  function onSeleccionarPaciente(paciente: PacienteBusquedaAgenda) {
    setPacienteSeleccionado(paciente);
    form.setValue("pacienteId", paciente.id, { shouldValidate: true });
    setComboAbierto(false);
  }

  function onSubmit(values: CrearCitaInput) {
    startTransition(async () => {
      const r = await crearCita(values);
      if (r.ok) {
        toast.success("Cita registrada");
        cerrar(false);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function cerrar(nuevoEstado: boolean) {
    setAbierto(nuevoEstado);
    if (!nuevoEstado) {
      form.reset();
      setPacienteSeleccionado(null);
      setQuery("");
      setResultados([]);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nueva cita
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
          <DialogDescription>
            Busca a la paciente, elige el servicio, el profesional y el
            horario. La hora se interpreta en horario de Lima.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Paciente</Label>
            <Popover open={comboAbierto} onOpenChange={setComboAbierto}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboAbierto}
                  className="justify-start font-normal"
                  disabled={pendiente}
                >
                  {pacienteSeleccionado
                    ? pacienteSeleccionado.etiqueta
                    : "Buscar por documento, nombre o apellido…"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar paciente…"
                    value={query}
                    onValueChange={setQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {query.trim().length < LONGITUD_MINIMA_BUSQUEDA
                        ? "Escribe al menos 2 caracteres"
                        : "Sin resultados"}
                    </CommandEmpty>
                    <CommandGroup>
                      {resultadosVisibles.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => onSeleccionarPaciente(p)}
                        >
                          {p.etiqueta}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.pacienteId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.pacienteId.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nueva-cita-servicio">Servicio</Label>
            <Select
              defaultValue={form.getValues("servicioId")}
              onValueChange={(v) => form.setValue("servicioId", v, { shouldValidate: true })}
              disabled={pendiente}
            >
              <SelectTrigger id="nueva-cita-servicio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre} ({s.duracionMin} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nueva-cita-profesional">Profesional</Label>
            <Select
              defaultValue={form.getValues("profesionalId")}
              onValueChange={(v) => form.setValue("profesionalId", v, { shouldValidate: true })}
              disabled={pendiente}
            >
              <SelectTrigger id="nueva-cita-profesional">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombreCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nueva-cita-fecha">Fecha</Label>
              <Input
                id="nueva-cita-fecha"
                type="date"
                {...form.register("fecha")}
                disabled={pendiente}
              />
              {form.formState.errors.fecha ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fecha.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nueva-cita-hora">Hora</Label>
              <Input
                id="nueva-cita-hora"
                type="time"
                {...form.register("hora")}
                disabled={pendiente}
              />
              {form.formState.errors.hora ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.hora.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nueva-cita-notas">Notas administrativas (opcional)</Label>
            <Textarea id="nueva-cita-notas" {...form.register("notasAdmin")} disabled={pendiente} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Crear cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
