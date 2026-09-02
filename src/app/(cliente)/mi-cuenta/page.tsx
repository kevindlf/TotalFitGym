import { CalendarCheck, Dumbbell, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Inter, Montserrat } from "next/font/google";

import { BotonTema } from "@/components/ui/boton-tema";
import { Button } from "@/components/ui/button";
import type { EstadoCuota } from "@/lib/cuota";
import {
  formatearFecha,
} from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { obtenerDetalleDelSocio } from "@/lib/portal";
import { rutinasHabilitadas } from "@/lib/rutinas";
import { cerrarSesionDelSocio, leerSesionDelSocio } from "@/lib/sesion-socio";

// NUEVOS IMPORTACIONES
import { ListaPagosDinamica } from "./ListaPagosDinamica";
import { ListaIngresosDinamica } from "./ListaIngresosDinamica";

import { CrearClave } from "./crear-clave";
import { DescargaRutina } from "./descarga-rutina";
import { cn } from "@/lib/utils";

const fuenteNormal = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fuenteLogo = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
});

export const metadata: Metadata = { title: "Mi cuenta · Total Fit" };

export const dynamic = "force-dynamic";

// Mantenemos los colores semánticos: Verde = Al día, Ámbar = Próximo, Naranja = Pago, Rojo = Vencido
const PANEL: Record<EstadoCuota, string> = {
  ACTIVO: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500", // Mantenemos el verde para el estado ACTIVO
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
    // Aplicamos la fuente Inter a toda la página
    <div className={`flex min-h-svh flex-col bg-background text-foreground ${fuenteNormal.className}`}>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          
          {/* Logo actualizado: 'FIT' es ROJO para unificar con la marca */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <Image 
              src="/totalfit.jpg" 
              alt="Logo Total Fit" 
              width={28} 
              height={28} 
              className="rounded-full object-cover"
            />
            <span className={`text-xl uppercase tracking-tighter ${fuenteLogo.className}`}>
              TOTAL <span className="text-red-600 dark:text-red-500">FIT</span>
            </span>
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
                className="text-muted-foreground hover:text-foreground"
              >
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {socio.nombre}
          </h1>
          <p className="text-muted-foreground mt-1">
            {socio.apellido} · DNI {socio.dni} · Sede {socio.sede}
          </p>
        </div>

        {/* ---- estado de la cuota ----
             MANTENEMOS EL VERDE para indicar éxito semántico */}
        <section
          className={cn(
            "space-y-4 rounded-2xl border p-5 sm:p-6 shadow-sm",
            PANEL[socio.cuota.estado],
          )}
        >
          <p className="text-xl font-semibold text-pretty sm:text-2xl">
            {socio.cuota.mensaje}
          </p>

          <dl className="grid grid-cols-2 gap-4 border-t border-current/15 pt-4 text-sm">
            <div>
              <dt className="text-muted-foreground mb-1">Tu plan</dt>
              <dd className="font-semibold text-base">
                {socio.planActual
                  ? ETIQUETAS_TIPO_PASE[
                      socio.planActual as keyof typeof ETIQUETAS_TIPO_PASE
                    ]
                  : "Sin plan activo"}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground mb-1">Vence</dt>
              <dd className="font-semibold text-base tabular-nums">
                {socio.cuota.fechaVencimiento
                  ? formatearFecha(socio.cuota.fechaVencimiento)
                  : "—"}
              </dd>
            </div>
          </dl>

          {socio.cuota.cuentaDadaDeBaja ? (
            <p className="text-sm font-medium mt-4 bg-background/50 p-3 rounded-lg">
              Tu cuenta figura dada de baja. Acercate a recepción para
              reactivarla.
            </p>
          ) : null}
        </section>

        {/* ---- rutina ---- */}
        {rutinasHabilitadas() ? (
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
              {/* Ícono de Pesa en rojo corporativo */}
              <Dumbbell
                className="size-5 text-red-600 dark:text-red-500"
                aria-hidden
              />
              Mi rutina
            </h2>

            <div className="mt-4">
              {sesion.nivel === "COMPLETO" ? (
                <DescargaRutina rutina={socio.rutina} />
              ) : socio.tieneClave ? (
                <>
                  <p className="text-muted-foreground">
                    Para ver tu rutina volvé a entrar poniendo tu clave. Tu rutina
                    es tuya: no queremos que la vea cualquiera que sepa tu DNI.
                  </p>
                  <Button
                    render={<Link href="/ingresar" />}
                    variant="outline"
                    className="mt-4 h-11"
                  >
                    Entrar con mi clave
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Creá una clave para poder descargar tu rutina. Con el DNI solo
                    alcanza para ver tu cuota, pero un archivo tuyo no puede quedar
                    detrás de un dato que cualquiera puede adivinar.
                  </p>
                  <div className="mt-4">
                    <CrearClave dni={socio.dni} />
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {/* ---- historial de pagos: AHORA DINÁMICO ---- */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            {/* Ícono de Archivo en rojo corporativo */}
            <FileText className="size-5 text-red-600 dark:text-red-500" aria-hidden />
            Mis pagos
          </h2>

          {/* Reemplazamos la lógica vieja por el componente dinámico */}
          <ListaPagosDinamica pagos={socio.pagos} />
        </section>

        {/* ---- asistencias: AHORA DINÁMICO ---- */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            {/* Ícono de Calendario en blanco/gris */}
            <CalendarCheck className="size-5 text-foreground" aria-hidden />
            Mis ingresos
            <span className="ml-auto text-sm font-medium text-muted-foreground tabular-nums bg-muted/50 px-2.5 py-1 rounded-full">
              {socio.totalIngresos} total
            </span>
          </h2>

          {/* Reemplazamos la lógica vieja por el componente dinámico */}
          <ListaIngresosDinamica ultimosIngresos={socio.ultimosIngresos} />
        </section>

        <p className="text-center text-sm font-medium text-muted-foreground pt-4 pb-8">
          Socio desde el {formatearFecha(socio.socioDesde)}
        </p>
      </main>
    </div>
  );
}