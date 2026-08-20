import type { Metadata } from "next";
import Link from "next/link";

import { EstadoCuotaBadge } from "@/components/admin/estado-cuota-badge";
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
import { formatearFecha } from "@/lib/formato";
import { listarSocios } from "@/lib/socios";

export const metadata: Metadata = { title: "Socios · Total Fit" };

export const dynamic = "force-dynamic";

export default async function PaginaSocios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const socios = await listarSocios(q);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Socios</h1>
          <p className="text-muted-foreground">
            {socios.length}{" "}
            {socios.length === 1 ? "socio encontrado" : "socios encontrados"}
          </p>
        </div>

        <Button render={<Link href="/socios/nuevo" />}>Nuevo socio</Button>
      </header>

      {/* Búsqueda por GET: la query queda en la URL y el resultado se puede compartir. */}
      <form className="flex gap-2">
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
          <Button render={<Link href="/socios" />} variant="ghost">
            Limpiar
          </Button>
        ) : null}
      </form>

      {socios.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          No hay socios que coincidan.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {socios.map((socio) => (
                <TableRow key={socio.id}>
                  <TableCell>
                    <Link
                      href={`/socios/${socio.id}`}
                      className="font-medium hover:underline"
                    >
                      {socio.apellido}, {socio.nombre}
                    </Link>
                    {socio.estado === "INACTIVO" ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (dado de baja)
                      </span>
                    ) : null}
                  </TableCell>

                  <TableCell className="tabular-nums">{socio.dni}</TableCell>

                  <TableCell>
                    <EstadoCuotaBadge estado={socio.cuota.estado} />
                  </TableCell>

                  <TableCell className="tabular-nums text-muted-foreground">
                    {socio.cuota.fechaVencimiento
                      ? formatearFecha(socio.cuota.fechaVencimiento)
                      : "Sin pagos"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {socio.telefono ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
