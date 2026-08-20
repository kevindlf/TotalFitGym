import { CalendarCheck, Dumbbell, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { EstadoCuota } from "@/lib/cuota";
import {
  formatearFecha,
  formatearFechaHora,
  formatearPesos,
} from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { obtenerDetalleDelSocio } from "@/lib/portal";
import { cerrarSesionDelSocio, leerSesionDelSocio } from "@/lib/sesion-socio";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi cuenta · Total Fit" };

export const dynamic = "force-dynamic";

const PANEL: Record<EstadoCuota, string> = {
  ACTIVO: "border-emerald-500/40 bg-emerald-500/10",
  PROXIMO_A_VENCER: "border-amber-500/40 bg-amber-500/10",
  EN_PERIODO_DE_PAGO: "border-orange-500/40 bg-orange-500/10",
  VENCIDO: "border-red-500/40 bg-red-500/10",
};

export default async function PaginaMiCuenta() {
  const usuarioId = await leerSesionDelSocio();

  if (!usuarioId) {
    redirect("/ingresar");
  }

  const socio = await obtenerDetalleDelSocio(usuarioId);

  if (!socio) {
    redirect("/ingresar");
  }

  return (
    <div className="flex min-h-svh flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            TOTAL <span className="text-emerald-400">FIT</span>
          </Link>

          <form
            action={async () => {
              "use server";

              await cerrarSesionDelSocio();
              redirect("/");
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-neutral-400"
            >
              Salir
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {socio.nombre}
          </h1>
          <p className="text-neutral-400">
            {socio.apellido} · DNI {socio.dni} · Sede {socio.sede}
          </p>
        </div>

        {/* ---- estado de la cuota ---- */}
        <section
          className={cn(
            "space-y-3 rounded-xl border p-5 sm:p-6",
            PANEL[socio.cuota.estado],
          )}
        >
          <p className="text-xl font-semibold text-pretty sm:text-2xl">
            {socio.cuota.mensaje}
          </p>

          <dl className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm">
            <div>
              <dt className="text-neutral-400">Tu plan</dt>
              <dd className="font-medium">
                {socio.planActual
                  ? ETIQUETAS_TIPO_PASE[
                      socio.planActual as keyof typeof ETIQUETAS_TIPO_PASE
                    ]
                  : "Sin plan activo"}
              </dd>
            </div>

            <div>
              <dt className="text-neutral-400">Vence</dt>
              <dd className="font-medium tabular-nums">
                {socio.cuota.fechaVencimiento
                  ? formatearFecha(socio.cuota.fechaVencimiento)
                  : "—"}
              </dd>
            </div>
          </dl>

          {socio.cuota.cuentaDadaDeBaja ? (
            <p className="text-sm text-neutral-300">
              Tu cuenta figura dada de baja. Acercate a recepción para
              reactivarla.
            </p>
          ) : null}
        </section>

        {/* ---- rutina (todavía no) ---- */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold">
            <Dumbbell className="size-5 text-emerald-400" aria-hidden />
            Mi rutina
          </h2>
          <p className="mt-2 text-neutral-400">
            Todavía no está disponible. Cuando tu profe la cargue, la vas a
            poder ver y descargar desde acá.
          </p>
        </section>

        {/* ---- historial de pagos ---- */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold">
            <FileText className="size-5 text-emerald-400" aria-hidden />
            Mis pagos
          </h2>

          {socio.pagos.length === 0 ? (
            <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">
              Todavía no tenemos ningún pago tuyo registrado.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
              {socio.pagos.map((pago) => (
                <li
                  key={pago.id_pago}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4"
                >
                  <div>
                    <p className="font-medium tabular-nums">
                      {formatearPesos(pago.monto)}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {
                        ETIQUETAS_TIPO_PASE[
                          pago.tipo_pase as keyof typeof ETIQUETAS_TIPO_PASE
                        ]
                      }
                    </p>
                  </div>

                  <div className="text-right text-sm text-neutral-400 tabular-nums">
                    <p>Pagaste el {formatearFecha(pago.fecha_pago)}</p>
                    <p>Cubrió hasta {formatearFecha(pago.fecha_vencimiento)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- asistencias ---- */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold">
            <CalendarCheck className="size-5 text-emerald-400" aria-hidden />
            Mis ingresos
            <span className="text-sm font-normal text-neutral-500 tabular-nums">
              {socio.totalIngresos} en total
            </span>
          </h2>

          {socio.ultimosIngresos.length === 0 ? (
            <p className="rounded-xl border border-neutral-800 p-5 text-neutral-400">
              Todavía no registramos ningún ingreso tuyo.
            </p>
          ) : (
            <ul className="rounded-xl border border-neutral-800 p-4 text-sm text-neutral-300 tabular-nums">
              {socio.ultimosIngresos.map((ingreso) => (
                <li key={ingreso} className="py-0.5">
                  {formatearFechaHora(ingreso)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-neutral-500">
          Socio desde el {formatearFecha(socio.socioDesde)}.
        </p>
      </main>
    </div>
  );
}
