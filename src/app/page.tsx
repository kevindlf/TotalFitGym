import Link from "next/link";

import { Foto } from "@/components/publico/foto";
import { Button } from "@/components/ui/button";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";

/**
 * Página pública del gimnasio.
 *
 * Los datos de contacto, horarios y precios están hardcodeados a propósito:
 * cambian poco y no justifican una tabla en la base. Cuando el dueño quiera
 * editarlos solo, se saca de acá.
 */

const HORARIOS = [
  { dias: "Lunes a viernes", horas: "7:00 a 23:00" },
  { dias: "Sábados", horas: "9:00 a 14:00" },
  { dias: "Domingos y feriados", horas: "Cerrado" },
];

const PLANES = [
  {
    tipo: "MEDIO" as const,
    descripcion: "Tres días por semana, en la franja horaria que elijas.",
  },
  {
    tipo: "LIBRE" as const,
    descripcion: "Todos los días, sin límite de horario.",
  },
];

export default function PaginaPublica() {
  return (
    <div className="flex min-h-svh flex-col bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <span className="text-xl font-bold tracking-tight">
          TOTAL <span className="text-emerald-400">FIT</span>
        </span>

        <Button
          render={<Link href="/ingresar" />}
          variant="ghost"
          className="text-neutral-300"
        >
          Mi cuenta
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-balance">
              Entrenás vos.{" "}
              <span className="text-emerald-400">Del resto nos ocupamos.</span>
            </h1>

            <p className="text-lg text-neutral-400">
              Gimnasio Total Fit, Junín. Musculación, funcional y acompañamiento
              con rutina propia. Consultá el estado de tu cuota y descargá tu
              rutina cuando quieras.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/ingresar" />} size="lg">
                Ver mi cuota
              </Button>
              <Button
                render={<Link href="#planes" />}
                size="lg"
                variant="outline"
                className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900 hover:text-neutral-50"
              >
                Ver planes
              </Button>
            </div>
          </div>

          <Foto
            src="/fotos/portada.jpg"
            alt="Sala de musculación de Total Fit"
            className="aspect-4/3 w-full"
            prioridad
          />
        </section>

        <section id="planes" className="scroll-mt-8 space-y-6 py-12">
          <h2 className="text-3xl font-bold tracking-tight">Planes</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {PLANES.map((plan) => (
              <div
                key={plan.tipo}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <h3 className="text-xl font-semibold text-emerald-400">
                  {ETIQUETAS_TIPO_PASE[plan.tipo]}
                </h3>
                <p className="mt-2 text-neutral-400">{plan.descripcion}</p>
                <p className="mt-4 text-sm text-neutral-500">
                  Consultanos el precio actual en recepción.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 py-12 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Horarios</h2>

            <dl className="divide-y divide-neutral-800 border-y border-neutral-800">
              {HORARIOS.map((horario) => (
                <div
                  key={horario.dias}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-neutral-300">{horario.dias}</dt>
                  <dd className="font-medium tabular-nums">{horario.horas}</dd>
                </div>
              ))}
            </dl>

            <div className="pt-4">
              <h3 className="font-semibold">Dónde estamos</h3>
              <p className="text-neutral-400">
                Junín, Buenos Aires. Escribinos para coordinar tu primera clase.
              </p>
            </div>
          </div>

          <Foto
            src="/fotos/sala.jpg"
            alt="Zona de entrenamiento funcional"
            className="aspect-4/3 w-full"
          />
        </section>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 p-6 text-sm text-neutral-500">
          <span>Total Fit · Junín</span>
          <Link href="/ingresar" className="hover:text-neutral-300">
            Acceso del personal
          </Link>
        </div>
      </footer>
    </div>
  );
}
