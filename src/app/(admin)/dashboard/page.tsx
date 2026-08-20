import type { Metadata } from "next";
import Link from "next/link";

import { EstadoCuotaBadge } from "@/components/admin/estado-cuota-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mensajeParaAdmin, type EstadoCuota } from "@/lib/cuota";
import { formatearPesos } from "@/lib/formato";
import { obtenerResumen } from "@/lib/metricas";
import type { SocioConCuota } from "@/lib/socios";

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
  const resumen = await obtenerResumen();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel</h1>
          <p className="text-muted-foreground">
            {resumen.totalSocios} socios cargados
            {resumen.sociosInactivos > 0
              ? ` · ${resumen.sociosInactivos} dados de baja`
              : null}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {resumen.asistenciasDeHoy} ingresos hoy
        </p>
      </header>

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
