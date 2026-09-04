import type { Metadata } from "next";
import Link from "next/link";
import { 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  AlertOctagon, 
  DollarSign, 
  Users, 
  Building2,
  ArrowRight,
  Activity
} from "lucide-react";

import { EstadoCuotaBadge } from "@/components/admin/estado-cuota-badge";
import { Button } from "@/components/ui/button";
import { mensajeParaAdmin, type EstadoCuota } from "@/lib/cuota";
import { formatearPesos } from "@/lib/formato";
import { obtenerResumen, obtenerResumenPorSede } from "@/lib/metricas";
import type { SocioConCuota } from "@/lib/socios";
import { exigirPanel } from "@/lib/sede";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Panel · Total Fit" };
export const dynamic = "force-dynamic";

const TARJETAS: { estado: EstadoCuota; titulo: string; icon: React.ElementType; color: string; bg: string }[] = [
  { estado: "ACTIVO", titulo: "Al día", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { estado: "PROXIMO_A_VENCER", titulo: "Por vencer", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { estado: "EN_PERIODO_DE_PAGO", titulo: "Período de pago", icon: CreditCard, color: "text-orange-500", bg: "bg-orange-500/10" },
  { estado: "VENCIDO", titulo: "Vencidos", icon: AlertOctagon, color: "text-red-500", bg: "bg-red-500/10" },
];

export default async function PaginaDashboard() {
  const ctx = await exigirPanel();
  const resumen = await obtenerResumen(ctx.sedeId);
  const cadena = ctx.esDuenio ? await obtenerResumenPorSede() : null;

  return (
    <div className="space-y-10 pb-12">
      
      {/* HEADER ULTRA LIMPIO */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
              <Activity className="size-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sede {ctx.sedeNombre}
            </h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 pl-[52px]">
            {resumen.totalSocios} socios registrados
            {resumen.sociosInactivos > 0 && (
              <>
                <span>·</span>
                <span className="text-red-400/80">{resumen.sociosInactivos} inactivos</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 pl-[52px] md:pl-0">
          <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-4 py-2 shadow-sm">
            <Users className="size-4 text-emerald-500" />
            <p className="text-sm font-medium">
              <span className="text-foreground">{resumen.asistenciasDeHoy}</span>
              <span className="text-muted-foreground ml-1.5">ingresos hoy</span>
            </p>
          </div>

          <Button 
            render={<Link href="/recepcion" />} 
            variant="default" 
            nativeButton={false}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            Pantalla de puerta
          </Button>
        </div>
      </header>

      {/* CADENA (SI ES DUEÑO) */}
      {cadena ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="size-4" />
            Resumen Global de Cadena
          </h2>

          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/20 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 font-medium">Sucursal</th>
                  <th className="px-5 py-4 font-medium">Activos</th>
                  <th className="px-5 py-4 font-medium">Morosos</th>
                  <th className="px-5 py-4 font-medium text-right">Ingresos del mes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {cadena.map((sede) => (
                  <tr key={sede.id_sede} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">{sede.nombre}</td>
                    <td className="px-5 py-4 tabular-nums">{sede.socios}</td>
                    <td className="px-5 py-4 tabular-nums">
                      {sede.morosos > 0 ? (
                        <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500 ring-1 ring-inset ring-red-500/20">
                          {sede.morosos}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-right font-medium text-foreground">
                      {formatearPesos(sede.cobradoEsteMes)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-card/40 font-semibold border-t-2 border-border/60">
                  <td className="px-5 py-4 text-foreground">Total Cadena</td>
                  <td className="px-5 py-4 tabular-nums text-foreground">
                    {cadena.reduce((suma, sede) => suma + sede.socios, 0)}
                  </td>
                  <td className="px-5 py-4 tabular-nums text-red-500">
                    {cadena.reduce((suma, sede) => suma + sede.morosos, 0)}
                  </td>
                  <td className="px-5 py-4 tabular-nums text-right text-emerald-500">
                    {formatearPesos(cadena.reduce((suma, sede) => suma + sede.cobradoEsteMes, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* MÉTRICAS PRINCIPALES */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TARJETAS.map((tarjeta) => {
          const Icono = tarjeta.icon;
          return (
            <div key={tarjeta.estado} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-sm transition-all hover:bg-card/60 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{tarjeta.titulo}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {resumen.porEstado[tarjeta.estado]}
                  </p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tarjeta.bg)}>
                  <Icono className={cn("size-6", tarjeta.color)} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* MÉTRICAS FINANCIERAS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Recaudación del mes</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-500 tabular-nums">
              {formatearPesos(resumen.cobrosDelMes.total)}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Basado en <span className="text-foreground">{resumen.cobrosDelMes.cantidad}</span> cobros registrados
            </p>
          </div>
          <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <DollarSign className="size-7 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Alerta de morosidad</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {resumen.morosos.length} <span className="text-xl font-semibold text-muted-foreground">socios</span>
            </p>
            <p className="mt-1 text-sm font-medium text-red-500/80">
              Con la cuota actualmente vencida
            </p>
          </div>
          <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertOctagon className="size-7 text-red-500" />
          </div>
        </div>
      </section>

      {/* LISTAS INFERIORES */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListaDeSocios
          titulo="Próximos a vencer"
          vacio="Nadie vence en los próximos días."
          socios={resumen.porVencer}
        />

        <ListaDeSocios
          titulo="Requieren pago"
          vacio="Nadie debe cuota. Todo al día."
          socios={resumen.morosos}
        />
      </div>
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
    <section className="flex flex-col space-y-4 rounded-2xl border border-border/40 bg-card/20 p-1 sm:p-2">
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {titulo}
          <span className="ml-2 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {socios.length}
          </span>
        </h2>
        
        {socios.length > 15 ? (
          <Link 
            href="/socios" 
            className="group flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            Ver panel completo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>

      {socios.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl bg-card/40 border border-dashed border-border/50 mx-2 mb-2">
          <p className="text-sm font-medium text-muted-foreground">{vacio}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {socios.slice(0, 15).map((socio) => (
            <li key={socio.id}>
              <Link
                href={`/socios/${socio.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl p-3 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <EstadoCuotaBadge estado={socio.cuota.estado} />
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">
                      {socio.apellido}, {socio.nombre}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      DNI {socio.dni}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    {mensajeParaAdmin(socio.cuota, socio.nombre)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}