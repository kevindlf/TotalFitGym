import Link from "next/link";
import { notFound } from "next/navigation";

import { EstadoCuotaBadge } from "@/components/admin/estado-cuota-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mensajeParaAdmin } from "@/lib/cuota";
import {
  formatearFecha,
  formatearFechaHora,
  formatearPesos,
  hoyParaInput,
} from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { obtenerSocio } from "@/lib/socios";

import { cambiarEstadoSocio } from "../acciones";
import { ClaveSocio } from "./clave-socio";
import { FormularioPago } from "./formulario-pago";
import { RutinaSocio } from "./rutina-socio";

export const dynamic = "force-dynamic";

const ETIQUETAS_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  QR: "QR",
  MERCADO_PAGO: "Mercado Pago",
};

export default async function PaginaSocio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const socio = await obtenerSocio(id);

  if (!socio) {
    notFound();
  }

  const estaDadoDeBaja = socio.estado === "INACTIVO";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link
          href="/socios"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver a socios
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {socio.nombre} {socio.apellido}
          </h1>
          <EstadoCuotaBadge estado={socio.cuota.estado} />
          {estaDadoDeBaja ? (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              Cuenta dada de baja
            </span>
          ) : null}
        </div>

        <p className="text-muted-foreground">
          {mensajeParaAdmin(socio.cuota, socio.nombre)}
        </p>

        <Button
          render={<Link href={`/socios/${socio.id}/editar`} />}
          variant="outline"
          size="sm"
        >
          Editar datos
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato titulo="DNI" valor={socio.dni} />
        <Dato titulo="Teléfono" valor={socio.telefono ?? "—"} />
        <Dato titulo="Sede" valor={socio.sede.nombre} />
        <Dato
          titulo="Vencimiento"
          valor={
            socio.cuota.fechaVencimiento
              ? formatearFecha(socio.cuota.fechaVencimiento)
              : "Sin pagos"
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrar pago</CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioPago usuarioId={socio.id} hoy={hoyParaInput()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            {socio.asistencias.length === 0 ? (
              <p className="text-muted-foreground">
                Todavía no registró ningún ingreso.
              </p>
            ) : (
              <ul className="space-y-1 text-sm tabular-nums">
                {socio.asistencias.map((asistencia) => (
                  <li key={asistencia.id_asistencia}>
                    {formatearFechaHora(asistencia.fecha_hora)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Historial de pagos{" "}
          <span className="text-muted-foreground tabular-nums">
            ({socio.pagos.length})
          </span>
        </h2>

        {socio.pagos.length === 0 ? (
          <p className="rounded-lg border p-6 text-muted-foreground">
            No hay pagos registrados.
          </p>
        ) : (
          <>
            {/* Celular: una tarjeta por pago. */}
            <ul className="space-y-3 md:hidden">
              {socio.pagos.map((pago) => (
                <li key={pago.id_pago} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-lg font-medium tabular-nums">
                      {formatearPesos(pago.monto)}
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {formatearFecha(pago.fecha_pago)}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Pase</dt>
                      <dd>{ETIQUETAS_TIPO_PASE[pago.tipo_pase]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Método</dt>
                      <dd>
                        {ETIQUETAS_METODO[pago.metodo_pago] ?? pago.metodo_pago}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Vence</dt>
                      <dd className="tabular-nums">
                        {formatearFecha(pago.fecha_vencimiento)}
                      </dd>
                    </div>
                    <div>
                      {/* Regla de Oro 4: siempre se sabe quién cobró. */}
                      <dt className="text-muted-foreground">Cobró</dt>
                      <dd>
                        {pago.admin.nombre} {pago.admin.apellido}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pagó</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Pase</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Cobró</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {socio.pagos.map((pago) => (
                  <TableRow key={pago.id_pago}>
                    <TableCell className="tabular-nums">
                      {formatearFecha(pago.fecha_pago)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatearPesos(pago.monto)}
                    </TableCell>
                    <TableCell>{ETIQUETAS_TIPO_PASE[pago.tipo_pase]}</TableCell>
                    <TableCell>
                      {ETIQUETAS_METODO[pago.metodo_pago] ?? pago.metodo_pago}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatearFecha(pago.fecha_vencimiento)}
                    </TableCell>
                    {/* Regla de Oro 4: siempre se sabe quién cobró. */}
                    <TableCell className="text-muted-foreground">
                      {pago.admin.nombre} {pago.admin.apellido}
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Rutina</h2>
          <div className="mt-2">
            <RutinaSocio
              usuarioId={socio.id}
              nombre={socio.nombre}
              rutina={socio.rutina}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Clave para la rutina
          </h2>
          <div className="mt-2">
            <ClaveSocio
              usuarioId={socio.id}
              nombre={socio.nombre}
              tieneClave={socio.tieneClave}
            />
          </div>
        </div>

        <form
          action={async () => {
            "use server";

            await cambiarEstadoSocio(
              socio.id,
              estaDadoDeBaja ? "ACTIVO" : "INACTIVO",
            );
          }}
        >
          <Button type="submit" variant={estaDadoDeBaja ? "outline" : "destructive"}>
            {estaDadoDeBaja ? "Reactivar socio" : "Dar de baja"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Dar de baja no borra nada: los pagos y las asistencias quedan. El
            socio deja de poder entrar por la puerta.
          </p>
        </form>
      </section>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="font-medium tabular-nums">{valor}</p>
    </div>
  );
}
