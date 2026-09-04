import type { Metadata } from "next";
import Link from "next/link";
// Sumamos íconos para seguir con la identidad visual
import { CalendarCheck, Users, Search, X, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listarAsistencias,
  type RangoDeAsistencias,
} from "@/lib/asistencias";
import { formatearFechaHora } from "@/lib/formato";
import { exigirPanel } from "@/lib/sede";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ingresos · Total Fit" };

export const dynamic = "force-dynamic";

const RANGOS = [
  { clave: "hoy", texto: "Hoy" },
  { clave: "semana", texto: "Últimos 7 días" },
  { clave: "mes", texto: "Últimos 30 días" },
] as const;

export default async function PaginaAsistencias({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; q?: string }>;
}) {
  const { rango: rangoCrudo, q } = await searchParams;

  const rango: RangoDeAsistencias = RANGOS.some((r) => r.clave === rangoCrudo)
    ? (rangoCrudo as RangoDeAsistencias)
    : "hoy";

  const ctx = await exigirPanel();

  const { ingresos, total, sociosDistintos, hayMas } = await listarAsistencias(
    ctx.sedeId,
    rango,
    q,
  );

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER AL ESTILO PANEL */}
      <header className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <CalendarCheck className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ingresos</h1>
        </div>
        <p className="text-sm font-medium text-muted-foreground pl-[52px]">
          Quién entró al gimnasio y cuándo. Esta bitácora se escribe sola desde la pantalla de la puerta.
        </p>
      </header>

      {/* MÉTRICAS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm flex items-center justify-between transition-all hover:bg-card/60">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total de ingresos</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {total}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <LogIn className="size-6 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm flex items-center justify-between transition-all hover:bg-card/60">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Socios distintos</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {sociosDistintos}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Algunos pueden haber entrado más de una vez
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
            <Users className="size-6 text-red-500" />
          </div>
        </div>
      </section>

      {/* CONTROLES: FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/20 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        
        <div className="flex flex-wrap items-center gap-2">
          {RANGOS.map((opcion) => {
            const parametros = new URLSearchParams();

            if (q) parametros.set("q", q);
            if (opcion.clave !== "hoy") parametros.set("rango", opcion.clave);

            const esActivo = rango === opcion.clave;

            return (
              <Button
                key={opcion.clave}
                render={
                  <Link
                    href={`/asistencias${parametros.size ? `?${parametros}` : ""}`}
                  />
                }
                nativeButton={false} // ¡Solución al error de la consola!
                size="sm"
                variant={esActivo ? "default" : "outline"}
                className={cn(
                  "rounded-lg transition-colors",
                  esActivo 
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-sm" 
                    : "hover:bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {opcion.texto}
              </Button>
            );
          })}
        </div>

        <form className="flex w-full gap-2 sm:max-w-sm">
          {rango !== "hoy" ? (
            <input type="hidden" name="rango" value={rango} />
          ) : null}

          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar por DNI o nombre..."
              className="w-full rounded-xl bg-background/50 pl-9 border-border/50 focus-visible:ring-red-500"
            />
          </div>
          
          <Button type="submit" variant="outline" className="rounded-xl border-border/50 hover:bg-muted/50">
            Buscar
          </Button>
          
          {q ? (
            <Button 
              render={<Link href="/asistencias" />} 
              variant="ghost" 
              size="icon"
              nativeButton={false} // ¡Solución al error!
              className="rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
              title="Limpiar búsqueda"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </form>
      </div>

      {/* RESULTADOS */}
      {ingresos.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/20 text-center">
          <CalendarCheck className="mb-2 size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay ingresos registrados en este período.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Celular: Lista de tarjetas */}
          <ul className="flex flex-col gap-2 md:hidden">
            {ingresos.map((ingreso) => (
              <li
                key={ingreso.id_asistencia}
                className="flex flex-col gap-1 rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/socios/${ingreso.socio.id}`}
                    className="font-semibold text-foreground hover:text-red-500 transition-colors"
                  >
                    {ingreso.socio.apellido}, {ingreso.socio.nombre}
                  </Link>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums bg-muted/50 px-2 py-0.5 rounded-md">
                    {formatearFechaHora(ingreso.fecha_hora)}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  DNI {ingreso.socio.dni}
                </span>
              </li>
            ))}
          </ul>

          {/* Desktop: Tabla moderna */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-medium text-muted-foreground">Socio</TableHead>
                  <TableHead className="font-medium text-muted-foreground">DNI</TableHead>
                  <TableHead className="font-medium text-muted-foreground text-right">Horario de Ingreso</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/40">
                {ingresos.map((ingreso) => (
                  <TableRow 
                    key={ingreso.id_asistencia} 
                    className="border-border/40 hover:bg-muted/20 transition-colors"
                  >
                    <TableCell>
                      <Link
                        href={`/socios/${ingreso.socio.id}`}
                        className="font-semibold text-foreground hover:text-red-500 transition-colors"
                      >
                        {ingreso.socio.apellido}, {ingreso.socio.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums font-medium text-muted-foreground">
                      {ingreso.socio.dni}
                    </TableCell>
                    <TableCell className="tabular-nums text-right font-medium text-muted-foreground">
                      {formatearFechaHora(ingreso.fecha_hora)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {hayMas ? (
        <p className="text-center text-sm font-medium text-muted-foreground">
          Se muestran los <span className="text-foreground">200 más recientes</span> de {total}. Afiná con la búsqueda o
          elegí un período más corto.
        </p>
      ) : null}
    </div>
  );
}