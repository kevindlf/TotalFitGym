import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Ingresos</h1>
        <p className="text-muted-foreground">
          Quién entró al gimnasio y cuándo. Esta bitácora no se edita ni se
          borra: se escribe sola desde la pantalla de la puerta.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums">{total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Socios distintos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums">{sociosDistintos}</p>
            <p className="text-sm text-muted-foreground">
              alguno puede haber entrado más de una vez
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {RANGOS.map((opcion) => {
          const parametros = new URLSearchParams();

          if (q) parametros.set("q", q);
          if (opcion.clave !== "hoy") parametros.set("rango", opcion.clave);

          return (
            <Button
              key={opcion.clave}
              render={
                <Link
                  href={`/asistencias${parametros.size ? `?${parametros}` : ""}`}
                />
              }
              size="sm"
              variant={rango === opcion.clave ? "default" : "outline"}
            >
              {opcion.texto}
            </Button>
          );
        })}
      </div>

      <form className="flex gap-2">
        {rango !== "hoy" ? (
          <input type="hidden" name="rango" value={rango} />
        ) : null}

        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por DNI, nombre o apellido"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        {q ? (
          <Button render={<Link href="/asistencias" />} variant="ghost">
            Limpiar
          </Button>
        ) : null}
      </form>

      {ingresos.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          No hay ingresos registrados en este período.
        </p>
      ) : (
        <>
          {/* Celular: una tarjeta por ingreso. */}
          <ul className="space-y-2 md:hidden">
            {ingresos.map((ingreso) => (
              <li
                key={ingreso.id_asistencia}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border p-3"
              >
                <Link
                  href={`/socios/${ingreso.socio.id}`}
                  className="font-medium hover:underline"
                >
                  {ingreso.socio.apellido}, {ingreso.socio.nombre}
                </Link>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatearFechaHora(ingreso.fecha_hora)}
                </span>
                <span className="w-full text-xs text-muted-foreground tabular-nums">
                  DNI {ingreso.socio.dni}
                </span>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Entró</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {ingresos.map((ingreso) => (
                  <TableRow key={ingreso.id_asistencia}>
                    <TableCell>
                      <Link
                        href={`/socios/${ingreso.socio.id}`}
                        className="font-medium hover:underline"
                      >
                        {ingreso.socio.apellido}, {ingreso.socio.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {ingreso.socio.dni}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatearFechaHora(ingreso.fecha_hora)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {hayMas ? (
        <p className="text-sm text-muted-foreground">
          Se muestran los 200 más recientes de {total}. Afiná con la búsqueda o
          elegí un período más corto.
        </p>
      ) : null}
    </div>
  );
}
