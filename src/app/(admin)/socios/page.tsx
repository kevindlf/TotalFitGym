import type { Metadata } from "next";
import Link from "next/link";

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
import { HistorialPagos } from "./historial-pagos";
import { TarjetaSocio } from "./tarjeta-socio";
import { exigirPanel } from "@/lib/sede";

export const metadata: Metadata = { title: "Socios · Total Fit" };

export const dynamic = "force-dynamic";

/** Filtros rápidos. Reemplazan al "filtrar columna" de la planilla. */
const FILTROS = [
  { clave: "todos", texto: "Todos" },
  { clave: "deben", texto: "Deben pagar" },
  { clave: "por-vencer", texto: "Por vencer" },
  { clave: "al-dia", texto: "Al día" },
  { clave: "sin-pagos", texto: "Sin pagos" },
] as const;

type Filtro = (typeof FILTROS)[number]["clave"];

/** Color de la fila entera: se lee de un vistazo, como la planilla pintada. */
const COLOR_FILA: Record<EstadoCuota, string> = {
  ACTIVO: "",
  PROXIMO_A_VENCER: "bg-amber-50 dark:bg-amber-950/30",
  EN_PERIODO_DE_PAGO: "bg-orange-50 dark:bg-orange-950/30",
  VENCIDO: "bg-red-50 dark:bg-red-950/30",
};

const COLOR_ESTADO: Record<EstadoCuota, string> = {
  ACTIVO: "bg-emerald-600 text-white",
  PROXIMO_A_VENCER: "bg-amber-500 text-amber-950",
  EN_PERIODO_DE_PAGO: "bg-orange-600 text-white",
  VENCIDO: "bg-red-600 text-white",
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
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  const { q, filtro: filtroCrudo } = await searchParams;

  const filtro: Filtro = FILTROS.some((f) => f.clave === filtroCrudo)
    ? (filtroCrudo as Filtro)
    : "todos";

  const ctx = await exigirPanel();
  const todos = await listarSocios(ctx.sedeId, q);
  const socios = aplicarFiltro(todos, filtro);

  const facturadoVisible = socios.reduce(
    (total, socio) => total + socio.totalFacturado,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Socios</h1>
          <p className="text-muted-foreground">
            {socios.length} de {todos.length} · {formatearPesos(facturadoVisible)}{" "}
            facturado
          </p>
        </div>

        <Button render={<Link href="/socios/nuevo" />} nativeButton={false}>Nuevo socio</Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((opcion) => {
          const parametros = new URLSearchParams();

          if (q) parametros.set("q", q);
          if (opcion.clave !== "todos") parametros.set("filtro", opcion.clave);

          const cantidad = aplicarFiltro(todos, opcion.clave).length;

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
              variant={filtro === opcion.clave ? "default" : "outline"}
            >
              {opcion.texto}{" "}
              <span className="tabular-nums opacity-70">{cantidad}</span>
            </Button>
          );
        })}
      </div>

      <form className="flex gap-2">
        {filtro !== "todos" ? (
          <input type="hidden" name="filtro" value={filtro} />
        ) : null}

        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por DNI, nombre o apellido"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" nativeButton={false}>
          Buscar
        </Button>
        {q ? (
          <Button render={<Link href="/socios" />} variant="ghost" nativeButton={false}>
            Limpiar
          </Button>
        ) : null}
      </form>

      {socios.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          No hay socios que coincidan.
        </p>
      ) : (
        <>
          {/* Celular: una tarjeta por socio. Ver abajo por qué. */}
          <ul className="space-y-3 md:hidden">
            {socios.map((socio) => (
              <TarjetaSocio key={socio.id} socio={socio} />
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Último pago</TableHead>
                <TableHead className="text-right">Facturado</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Historial</TableHead>
                <TableHead>Cobrar</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {socios.map((socio) => (
                <TableRow
                  key={socio.id}
                  className={cn(COLOR_FILA[socio.cuota.estado])}
                >
                  <TableCell>
                    <Link
                      href={`/socios/${socio.id}`}
                      className="font-medium hover:underline"
                    >
                      {socio.apellido}, {socio.nombre}
                    </Link>
                    {socio.estado === "INACTIVO" ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (baja)
                      </span>
                    ) : null}
                  </TableCell>

                  <TableCell className="tabular-nums">{socio.dni}</TableCell>

                  <TableCell>
                    {socio.ultimoPago
                      ? ETIQUETAS_TIPO_PASE[socio.ultimoPago.tipo_pase]
                      : "—"}
                  </TableCell>

                  <TableCell className="tabular-nums">
                    {socio.ultimoPago ? (
                      <>
                        {formatearPesos(socio.ultimoPago.monto)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatearFecha(socio.ultimoPago.fecha_pago)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {formatearPesos(socio.totalFacturado)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {socio.cantidadDePagos}
                    </span>
                  </TableCell>

                  <TableCell className="tabular-nums">
                    {socio.cuota.fechaVencimiento
                      ? formatearFecha(socio.cuota.fechaVencimiento)
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                        COLOR_ESTADO[socio.cuota.estado],
                      )}
                    >
                      {socio.ultimoPago === null
                        ? "Sin pagos"
                        : ETIQUETAS_PLANILLA[socio.cuota.estado]}
                    </span>
                  </TableCell>

                  <TableCell className="align-top">
                    <HistorialPagos
                      usuarioId={socio.id}
                      nombre={socio.nombre}
                      cantidadDePagos={socio.cantidadDePagos}
                    />
                  </TableCell>

                  <TableCell className="align-top">
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
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">
        &quot;Pagó&quot; registra un pago nuevo repitiendo el monto, el plan y el
        método del último. Para cambiar alguno de esos datos, entrá a la ficha
        del socio.
      </p>
    </div>
  );
}
