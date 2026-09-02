import type { Metadata } from "next";
import Link from "next/link";

import { EstadoCuotaBadge } from "@/components/admin/estado-cuota-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mensajeParaAdmin, type EstadoCuota } from "@/lib/cuota";
import { formatearPesos } from "@/lib/formato";
import { obtenerResumen, obtenerResumenPorSede } from "@/lib/metricas";
import type { SocioConCuota } from "@/lib/socios";
import { exigirPanel } from "@/lib/sede";

export const metadata: Metadata = { title: "Panel · Total Fit" };

// Métricas siempre frescas: son plata y vencimientos del día.
export const dynamic = "force-dynamic";

const TARJETAS: { estado: EstadoCuota; titulo: string }[] = [
  { estado: "ACTIVO", titulo: "Al día" },
  { estado: "PROXIMO_A_VENCER", titulo: "Por vencer" },
  { estado: "EN_PERIODO_DE_PAGO", titulo: "En período de pago" },
  { estado: "VENCIDO", titulo: "Vencidos" },
];

export default async function PaginaDashboard() {
  const ctx = await exigirPanel();
  const resumen = await obtenerResumen(ctx.sedeId);

  // El dueño ve además el total de la cadena. Va abajo del resumen de la sede
  // activa y no en vez de él: la pantalla sigue siendo la de una sucursal.
  const cadena = ctx.esDuenio ? await obtenerResumenPorSede() : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Panel · Sede {ctx.sedeNombre}
          </h1>
          <p className="text-muted-foreground">
            {resumen.totalSocios} socios cargados
            {resumen.sociosInactivos > 0
              ? ` · ${resumen.sociosInactivos} dados de baja`
              : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {resumen.asistenciasDeHoy} ingresos hoy
          </p>

          {/* La pantalla de la puerta se abre desde acá y no desde el menú: es
              para la PC del mostrador, no una tarea de administración. */}
          <Button render={<Link href="/recepcion" />} variant="outline" nativeButton={false}>
            Abrir pantalla de puerta
          </Button>
        </div>
      </header>

      {/* Solo el dueño ve la cadena entera. Va debajo del resumen de la sede
          activa y no en lugar de él: esta sigue siendo la pantalla de una
          sucursal, y mezclar padrones es justo lo que confundiría al profe. */}
      {cadena ? (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
            Toda la cadena
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Sede</th>
                  <th className="py-1.5 pr-4 font-medium">Socios</th>
                  <th className="py-1.5 pr-4 font-medium">Morosos</th>
                  <th className="py-1.5 font-medium">Cobrado este mes</th>
                </tr>
              </thead>
              <tbody>
                {cadena.map((sede) => (
                  <tr key={sede.id_sede} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{sede.nombre}</td>
                    <td className="py-1.5 pr-4 tabular-nums">{sede.socios}</td>
                    <td className="py-1.5 pr-4 tabular-nums">{sede.morosos}</td>
                    <td className="py-1.5 tabular-nums">
                      {formatearPesos(sede.cobradoEsteMes)}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5 pr-4">Total</td>
                  <td className="py-1.5 pr-4 tabular-nums">
                    {cadena.reduce((suma, sede) => suma + sede.socios, 0)}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums">
                    {cadena.reduce((suma, sede) => suma + sede.morosos, 0)}
                  </td>
                  <td className="py-1.5 tabular-nums">
                    {formatearPesos(
                      cadena.reduce(
                        (suma, sede) => suma + sede.cobradoEsteMes,
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TARJETAS.map((tarjeta) => (
          <Card key={tarjeta.estado}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tarjeta.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tabular-nums">
                {resumen.porEstado[tarjeta.estado]}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobrado este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {formatearPesos(resumen.cobrosDelMes.total)}
            </p>
            <p className="text-sm text-muted-foreground">
              {resumen.cobrosDelMes.cantidad}{" "}
              {resumen.cobrosDelMes.cantidad === 1 ? "pago" : "pagos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deben pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {resumen.morosos.length}
            </p>
            <p className="text-sm text-muted-foreground">
              socios con la cuota vencida
            </p>
          </CardContent>
        </Card>
      </section>

      <ListaDeSocios
        titulo="Entran en período de pago"
        vacio="Nadie vence en los próximos días."
        socios={resumen.porVencer}
      />

      <ListaDeSocios
        titulo="Tienen que pagar"
        vacio="Nadie debe cuota. Todo al día."
        socios={resumen.morosos}
      />
    </div>
  );
}

function ListaDeSocios({
  titulo,
  vacio,
  socios,
}: {
  titulo: string;
  vacio: string;
  socios: SocioConCuota[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">
        {titulo}{" "}
        <span className="text-muted-foreground tabular-nums">
          ({socios.length})
        </span>
      </h2>

      {socios.length === 0 ? (
        <p className="text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {socios.slice(0, 15).map((socio) => (
            <li key={socio.id}>
              <Link
                href={`/socios/${socio.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-muted/50"
              >
                <EstadoCuotaBadge estado={socio.cuota.estado} />

                <span className="font-medium">
                  {socio.apellido}, {socio.nombre}
                </span>

                <span className="text-sm text-muted-foreground tabular-nums">
                  DNI {socio.dni}
                </span>

                <span className="ml-auto text-sm text-muted-foreground">
                  {mensajeParaAdmin(socio.cuota, socio.nombre)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {socios.length > 15 ? (
        <p className="text-sm text-muted-foreground">
          Se muestran los 15 primeros.{" "}
          <Link href="/socios" className="underline">
            Ver todos los socios
          </Link>
        </p>
      ) : null}
    </section>
  );
}
