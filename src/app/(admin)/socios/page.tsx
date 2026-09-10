import type { Metadata } from "next";
import Link from "next/link";
// Agregamos ChevronLeft y ChevronRight para los botones de la paginación
import { Users, UserPlus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

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
import { ETIQUETAS_PLANILLA, type EstadoCuota } from "@/lib/cuota";
import { formatearFecha, formatearPesos } from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { listarSocios, type SocioConCuota } from "@/lib/socios";
import { cn } from "@/lib/utils";

import { BotonPago } from "./boton-pago";
import { TarjetaSocio } from "./tarjeta-socio";
import { exigirPanel } from "@/lib/sede";

export const metadata: Metadata = { title: "Socios · Total Fit" };

export const dynamic = "force-dynamic";

const ELEMENTOS_POR_PAGINA = 15;

const FILTROS = [
  { clave: "todos", texto: "Todos" },
  { clave: "deben", texto: "Deben pagar" },
  { clave: "por-vencer", texto: "Por vencer" },
  { clave: "al-dia", texto: "Al día" },
  { clave: "sin-pagos", texto: "Sin pagos" },
] as const;

type Filtro = (typeof FILTROS)[number]["clave"];

const COLOR_FILA: Record<EstadoCuota, string> = {
  ACTIVO: "",
  PROXIMO_A_VENCER: "bg-amber-50/50 dark:bg-amber-500/5",
  EN_PERIODO_DE_PAGO: "bg-orange-50/50 dark:bg-orange-500/5",
  VENCIDO: "bg-red-50/50 dark:bg-red-500/5",
};

const COLOR_ESTADO: Record<EstadoCuota, string> = {
  ACTIVO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 ring-emerald-500/20",
  PROXIMO_A_VENCER: "bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-amber-500/20",
  EN_PERIODO_DE_PAGO: "bg-orange-500/10 text-orange-600 dark:text-orange-500 ring-orange-500/20",
  VENCIDO: "bg-red-500/10 text-red-600 dark:text-red-500 ring-red-500/20",
};

function aplicarFiltro(socios: SocioConCuota[], filtro: Filtro) {
  switch (filtro) {
    case "deben":
      return socios.filter((socio) => socio.cuota.debePagar);
    case "por-vencer":
      return socios.filter(
        (socio) => socio.cuota.estado === "PROXIMO_A_VENCER",
      );
    case "al-dia":
      return socios.filter((socio) => !socio.cuota.debePagar);
    case "sin-pagos":
      return socios.filter((socio) => socio.ultimoPago === null);
    default:
      return socios;
  }
}

export default async function PaginaSocios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string; page?: string }>;
}) {
  const { q, filtro: filtroCrudo, page: pageCruda } = await searchParams;

  const filtro: Filtro = FILTROS.some((f) => f.clave === filtroCrudo)
    ? (filtroCrudo as Filtro)
    : "todos";

  const ctx = await exigirPanel();
  const todos = await listarSocios(ctx.sedeId, q);
  const sociosFiltrados = aplicarFiltro(todos, filtro);

  // Lógica de Paginación
  const paginaActual = pageCruda ? Math.max(1, parseInt(pageCruda, 10)) : 1;
  const totalPaginas = Math.ceil(sociosFiltrados.length / ELEMENTOS_POR_PAGINA) || 1;
  
  // Evitar que el usuario ponga ?page=999 y rompa la vista
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  
  const indiceInicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA;
  const indiceFin = indiceInicio + ELEMENTOS_POR_PAGINA;
  const sociosPaginados = sociosFiltrados.slice(indiceInicio, indiceFin);

  const facturadoVisible = sociosFiltrados.reduce(
    (total, socio) => total + socio.totalFacturado,
    0,
  );
  const crearUrlPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filtro !== "todos") params.set("filtro", filtro);
    if (nuevaPagina > 1) params.set("page", nuevaPagina.toString());
    return `/socios${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-8 pb-10">
      
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/40 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <Users className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Socios</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-2">
              Mostrando {sociosFiltrados.length} de {todos.length}
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-500">{formatearPesos(facturadoVisible)} facturado</span>
            </p>
          </div>
        </div>

        <Button 
          render={<Link href="/socios/nuevo" />} 
          nativeButton={false}
          className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm gap-2"
        >
          <UserPlus className="size-4" />
          Nuevo socio
        </Button>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/20 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        
        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((opcion) => {
            const parametros = new URLSearchParams();

            if (q) parametros.set("q", q);
            if (opcion.clave !== "todos") parametros.set("filtro", opcion.clave);

            const cantidad = aplicarFiltro(todos, opcion.clave).length;
            const esActivo = filtro === opcion.clave;

            return (
              <Button
                key={opcion.clave}
                nativeButton={false}
                render={
                  <Link
                    href={`/socios${parametros.size ? `?${parametros}` : ""}`}
                  />
                }
                size="sm"
                variant={esActivo ? "default" : "outline"}
                className={cn(
                  "rounded-lg transition-colors gap-1.5",
                  esActivo 
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-sm" 
                    : "hover:bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {opcion.texto}
                <span className={cn(
                  "tabular-nums text-[10px] px-1.5 py-0.5 rounded-md",
                  esActivo ? "bg-white/20" : "bg-muted text-muted-foreground"
                )}>
                  {cantidad}
                </span>
              </Button>
            );
          })}
        </div>

        <form className="flex w-full gap-2 xl:max-w-sm">
          {filtro !== "todos" ? (
            <input type="hidden" name="filtro" value={filtro} />
          ) : null}

          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar por DNI, nombre..."
              className="w-full rounded-xl bg-background/50 pl-9 border-border/50 focus-visible:ring-red-500"
            />
          </div>
          <Button type="submit" variant="outline" className="rounded-xl border-border/50 hover:bg-muted/50">
            Buscar
          </Button>
          {q ? (
            <Button 
              render={<Link href="/socios" />} 
              variant="ghost" 
              size="icon"
              nativeButton={false}
              className="rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
              title="Limpiar búsqueda"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </form>
      </div>

      {sociosFiltrados.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/20 text-center">
          <Users className="mb-2 size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay socios que coincidan con la búsqueda o filtro.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {sociosPaginados.map((socio) => (
              <TarjetaSocio key={socio.id} socio={socio} />
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-medium text-muted-foreground">Socio</TableHead>
                  <TableHead className="font-medium text-muted-foreground">DNI</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Plan</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Último pago</TableHead>
                  <TableHead className="font-medium text-muted-foreground text-right">Facturado</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Vence</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Estado</TableHead>
                  <TableHead className="font-medium text-muted-foreground text-center">Cobrar</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border/40">
                {sociosPaginados.map((socio) => (
                  <TableRow
                    key={socio.id}
                    className={cn(
                      "border-border/40 transition-colors hover:bg-muted/30",
                      COLOR_FILA[socio.cuota.estado]
                    )}
                  >
                    <TableCell>
                      <Link
                        href={`/socios/${socio.id}`}
                        className="font-semibold text-foreground hover:text-red-500 transition-colors"
                      >
                        {socio.apellido}, {socio.nombre}
                      </Link>
                      {socio.estado === "INACTIVO" ? (
                        <span className="ml-2 text-xs font-medium text-red-500/80 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                          Baja
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell className="tabular-nums font-medium text-muted-foreground">{socio.dni}</TableCell>

                    <TableCell className="font-medium text-foreground">
                      {socio.ultimoPago
                        ? ETIQUETAS_TIPO_PASE[socio.ultimoPago.tipo_pase]
                        : "—"}
                    </TableCell>

                    <TableCell className="tabular-nums">
                      {socio.ultimoPago ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{formatearPesos(socio.ultimoPago.monto)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatearFecha(socio.ultimoPago.fecha_pago)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-emerald-600 dark:text-emerald-500">
                          {formatearPesos(socio.totalFacturado)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {socio.cantidadDePagos} pagos
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="tabular-nums font-medium">
                      {socio.cuota.fechaVencimiento
                        ? formatearFecha(socio.cuota.fechaVencimiento)
                        : "—"}
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ring-1 ring-inset",
                          COLOR_ESTADO[socio.cuota.estado],
                        )}
                      >
                        {socio.ultimoPago === null
                          ? "Sin pagos"
                          : ETIQUETAS_PLANILLA[socio.cuota.estado]}
                      </span>
                    </TableCell>

                    <TableCell className="align-middle text-center">
                      <BotonPago
                        usuarioId={socio.id}
                        tienePagoAnterior={socio.ultimoPago !== null}
                        nombre={socio.nombre}
                        montoSugerido={socio.ultimoPago?.monto}
                        tipoPaseSugerido={socio.ultimoPago?.tipo_pase}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Controles de Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 bg-muted/10 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{paginaSegura}</span> de <span className="font-semibold text-foreground">{totalPaginas}</span>
                </p>
                <div className="flex items-center gap-2">
                  {paginaSegura > 1 ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      nativeButton={false} 
                      render={<Link href={crearUrlPagina(paginaSegura - 1)} />}
                      className="rounded-lg hover:bg-muted/50"
                    >
                      <ChevronLeft className="mr-1 size-4" /> Anterior
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="rounded-lg">
                      <ChevronLeft className="mr-1 size-4" /> Anterior
                    </Button>
                  )}

                  {paginaSegura < totalPaginas ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      nativeButton={false} 
                      render={<Link href={crearUrlPagina(paginaSegura + 1)} />}
                      className="rounded-lg hover:bg-muted/50"
                    >
                      Siguiente <ChevronRight className="ml-1 size-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="rounded-lg">
                      Siguiente <ChevronRight className="ml-1 size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Controles de Paginación para Celular (aparece solo si hay más de 1 pág y en móvil) */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm md:hidden mt-4">
              <Button 
                variant="outline" 
                size="icon"
                disabled={paginaSegura === 1}
                nativeButton={paginaSegura === 1}
                render={paginaSegura > 1 ? <Link href={crearUrlPagina(paginaSegura - 1)} /> : undefined}
                className="rounded-lg h-9 w-9"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <p className="text-sm text-muted-foreground font-medium">
                Pág. {paginaSegura} de {totalPaginas}
              </p>
              <Button 
                variant="outline" 
                size="icon"
                disabled={paginaSegura === totalPaginas}
                nativeButton={paginaSegura === totalPaginas}
                render={paginaSegura < totalPaginas ? <Link href={crearUrlPagina(paginaSegura + 1)} /> : undefined}
                className="rounded-lg h-9 w-9"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <p className="text-sm font-medium text-muted-foreground bg-muted/40 p-4 rounded-xl border border-border/30">
        <strong className="text-foreground font-semibold">Tip:</strong> El botón &quot;Pagó&quot; (en la tabla) registra un pago rápido copiando el plan, método y monto del último registro. Para editar esos datos o ver el historial completo, ingresá al perfil del socio.
      </p>
    </div>
  );
}