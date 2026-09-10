import type { Metadata } from "next";
// Sumamos ChevronDown para la flechita del desplegable
import { BriefcaseBusiness, UsersRound, UserPlus, ChevronDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";
import { listarPersonal } from "@/lib/personal";
import { listarSedes } from "@/lib/socios";
import { cn } from "@/lib/utils";

import { BotonEstado, CambiarPassword } from "./acciones-miembro";
import { FormularioPersonal } from "./formulario-personal";
import { TarjetaMiembro } from "./tarjeta-miembro";
import { exigirPanel } from "@/lib/sede";

export const metadata: Metadata = { title: "Personal · Total Fit" };

export const dynamic = "force-dynamic";

export default async function PaginaPersonal() {
  const ctx = await exigirPanel();

  const [sesion, personal, sedes] = await Promise.all([
    auth(),
    listarPersonal(ctx.sedeId),
    listarSedes(),
  ]);

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <BriefcaseBusiness className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Personal</h1>
        </div>
        <p className="text-sm font-medium text-muted-foreground pl-[52px] max-w-2xl">
          Administrá a los profesores y empleados con acceso al sistema. Todo pago registrado queda invariablemente asociado al usuario que lo cobró.
        </p>
      </header>

      {/* LISTA DEL EQUIPO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <UsersRound className="size-5 text-muted-foreground" />
            Equipo activo
            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
              {personal.length}
            </span>
          </h2>
        </div>

        {/* Celular: una tarjeta por persona. */}
        <ul className="flex flex-col gap-3 md:hidden">
          {personal.map((miembro) => (
            <TarjetaMiembro
              key={miembro.id}
              miembro={miembro}
              esUnoMismo={miembro.id === sesion?.user?.id}
            />
          ))}
        </ul>

        {/* Desktop: Tabla moderna */}
        <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm md:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Nombre y Apellido</TableHead>
                <TableHead className="font-medium text-muted-foreground">DNI</TableHead>
                <TableHead className="font-medium text-muted-foreground">Sede asignada</TableHead>
                <TableHead className="font-medium text-muted-foreground">Alta</TableHead>
                <TableHead className="font-medium text-muted-foreground">Cobros</TableHead>
                <TableHead className="font-medium text-muted-foreground text-center">Contraseña</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Acceso</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/40">
              {personal.map((miembro) => {
                const estaActivo = miembro.estado === "ACTIVO";
                const esUnoMismo = miembro.id === sesion?.user?.id;

                return (
                  <TableRow
                    key={miembro.id}
                    className={cn(
                      "border-border/40 transition-colors hover:bg-muted/30",
                      !estaActivo && "bg-muted/20 opacity-75 grayscale-[0.5]"
                    )}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn("font-semibold", estaActivo ? "text-foreground" : "text-muted-foreground")}>
                          {miembro.apellido}, {miembro.nombre}
                          {esUnoMismo && (
                            <span className="ml-2 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                              Vos
                            </span>
                          )}
                        </span>
                        {!estaActivo && (
                          <span className="text-xs font-medium text-destructive/80">
                            Cuenta suspendida
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="tabular-nums font-medium text-muted-foreground">
                      {miembro.dni}
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-border/50">
                        {miembro.sede.nombre}
                      </span>
                    </TableCell>

                    <TableCell className="tabular-nums font-medium text-muted-foreground">
                      {formatearFecha(miembro.fecha_registro)}
                    </TableCell>

                    <TableCell className="tabular-nums">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-500">
                        {miembro.pagosCobrados}
                      </span>
                    </TableCell>

                    <TableCell className="text-center align-middle">
                      <CambiarPassword
                        usuarioId={miembro.id}
                        nombre={miembro.nombre}
                      />
                    </TableCell>

                    <TableCell className="text-right align-middle">
                      <BotonEstado
                        usuarioId={miembro.id}
                        estaActivo={estaActivo}
                        esUnoMismo={esUnoMismo}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* FORMULARIO DE ALTA (Desplegable y Centrado) */}
      <section className="pt-8 border-t border-border/40">
        <details className="group mx-auto max-w-3xl rounded-2xl border border-border/40 bg-card/20 shadow-sm transition-all open:bg-card/40 [&_summary::-webkit-details-marker]:hidden">
          
          {/* Cabecera clickeable */}
          <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-red-500 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors group-open:bg-red-500/10 group-open:text-red-500">
                <UserPlus className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Dar de alta al personal</h2>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Desplegá este menú para agregar un nuevo profesor o empleado al sistema.
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/50 text-muted-foreground transition-transform duration-200 group-open:rotate-180 border border-border/50">
              <ChevronDown className="size-4" />
            </div>
          </summary>

          {/* Contenido del formulario */}
          <div className="border-t border-border/20 px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
            {sedes.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 bg-background/50 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No hay ninguna sede activa cargada en el sistema.
                </p>
              </div>
            ) : (
              <FormularioPersonal sedes={sedes} />
            )}
          </div>
          
        </details>
      </section>
      
    </div>
  );
}