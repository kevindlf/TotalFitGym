import { CalendarCheck, Dumbbell, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BotonTema } from "@/components/ui/boton-tema";
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

import { CrearClave } from "./crear-clave";
import { DescargaRutina } from "./descarga-rutina";
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
  const sesion = await leerSesionDelSocio();

  if (!sesion) {
    redirect("/ingresar");
  }

  const socio = await obtenerDetalleDelSocio(sesion.usuarioId);

  if (!socio) {
    redirect("/ingresar");
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            TOTAL <span className="text-emerald-600 dark:text-emerald-400">FIT</span>
          </Link>

          <div className="flex items-center gap-1">
            <BotonTema />

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
                className="text-muted-foreground"
              >
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {socio.nombre}
          </h1>
          <p className="text-muted-foreground">
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

          <dl className="grid grid-cols-2 gap-4 border-t border-current/15 pt-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Tu plan</dt>
              <dd className="font-medium">
                {socio.planActual
                  ? ETIQUETAS_TIPO_PASE[
                      socio.planActual as keyof typeof ETIQUETAS_TIPO_PASE
                    ]
                  : "Sin plan activo"}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">Vence</dt>
              <dd className="font-medium tabular-nums">
                {socio.cuota.fechaVencimiento
                  ? formatearFecha(socio.cuota.fechaVencimiento)
                  : "—"}
              </dd>
            </div>
          </dl>

          {socio.cuota.cuentaDadaDeBaja ? (
            <p className="text-sm text-foreground/85">
              Tu cuenta figura dada de baja. Acercate a recepción para
              reactivarla.
            </p>
          ) : null}
        </section>

        {/* ---- rutina ---- */}
        <section className="rounded-xl border border-border bg-muted/50 p-5">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold">
            <Dumbbell
              className="size-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            Mi rutina
          </h2>

          {sesion.nivel === "COMPLETO" ? (
            <DescargaRutina rutina={socio.rutina} />
          ) : socio.tieneClave ? (
            <>
              <p className="mt-2 text-muted-foreground">
                Para ver tu rutina volvé a entrar poniendo tu clave. Tu rutina
                es tuya: no queremos que la vea cualquiera que sepa tu DNI.
              </p>
              <Button
                render={<Link href="/ingresar" />}
                variant="outline"
                className="mt-4"
              >
                Entrar con mi clave
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-muted-foreground">
                Creá una clave para poder descargar tu rutina. Con el DNI solo
                alcanza para ver tu cuota, pero un archivo tuyo no puede quedar
                detrás de un dato que cualquiera puede adivinar.
              </p>
              <CrearClave dni={socio.dni} />
            </>
          )}
        </section>

        {/* ---- historial de pagos ---- */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold">
            <FileText className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Mis pagos
          </h2>

          {socio.pagos.length === 0 ? (
            <p className="rounded-xl border border-border p-5 text-muted-foreground">
              Todavía no tenemos ningún pago tuyo registrado.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {socio.pagos.map((pago) => (
                <li
                  key={pago.id_pago}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4"
                >
                  <div>
                    <p className="font-medium tabular-nums">
                      {formatearPesos(pago.monto)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {
                        ETIQUETAS_TIPO_PASE[
                          pago.tipo_pase as keyof typeof ETIQUETAS_TIPO_PASE
                        ]
                      }
                    </p>
                  </div>

                  <div className="text-right text-sm text-muted-foreground tabular-nums">
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
            <CalendarCheck className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Mis ingresos
            <span className="text-sm font-normal text-muted-foreground tabular-nums">
              {socio.totalIngresos} en total
            </span>
          </h2>

          {socio.ultimosIngresos.length === 0 ? (
            <p className="rounded-xl border border-border p-5 text-muted-foreground">
              Todavía no registramos ningún ingreso tuyo.
            </p>
          ) : (
            <ul className="rounded-xl border border-border p-4 text-sm text-foreground/85 tabular-nums">
              {socio.ultimosIngresos.map((ingreso) => (
                <li key={ingreso} className="py-0.5">
                  {formatearFechaHora(ingreso)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-muted-foreground">
          Socio desde el {formatearFecha(socio.socioDesde)}.
        </p>
      </main>
    </div>
  );
}
