import { AtSign, Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Encabezado } from "@/components/publico/encabezado";
import { Foto } from "@/components/publico/foto";
import { Button } from "@/components/ui/button";
import {
  ACTIVIDADES,
  DETALLE_PLANES,
  GIMNASIO,
  HORARIOS,
} from "@/lib/gimnasio";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";

/**
 * Página pública del gimnasio.
 *
 * Pensada para el celular primero: la mayoría de los socios va a entrar desde
 * el teléfono para ver si tiene la cuota al día. Todo arranca en una columna y
 * recién se abre a dos en pantallas grandes.
 *
 * Los datos del gimnasio salen de `src/lib/gimnasio.ts`, que es el único lugar
 * a editar cuando cambie un horario o un teléfono.
 */

const PLANES = ["MEDIO", "LIBRE"] as const;

export default function PaginaPublica() {
  const enlaceWhatsapp = `https://wa.me/${GIMNASIO.whatsapp}`;

  return (
    <div className="flex min-h-svh flex-col bg-neutral-950 text-neutral-100">
      <Encabezado />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Entrenás vos.{" "}
              <span className="text-emerald-400">Del resto nos ocupamos.</span>
            </h1>

            <p className="text-lg text-pretty text-neutral-400">
              {GIMNASIO.descripcion}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href="/ingresar" />}
                size="lg"
                className="h-12 text-base"
              >
                Ver el estado de mi cuota
              </Button>

              <Button
                render={
                  <a
                    href={enlaceWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                size="lg"
                variant="outline"
                className="h-12 border-neutral-700 bg-transparent text-base text-neutral-200 hover:bg-neutral-900 hover:text-neutral-50"
              >
                Escribinos
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

        {/* ---------------------------------------------------------------- */}
        <section
          id="nosotros"
          className="scroll-mt-16 border-t border-neutral-900 bg-neutral-900/40"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Qué vas a encontrar
              </h2>
              <p className="max-w-2xl text-pretty text-neutral-400">
                No somos una cadena. Somos un gimnasio de barrio donde el profe
                se sabe tu nombre y sabe en qué estás trabajando.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {ACTIVIDADES.map((actividad) => (
                <div
                  key={actividad.titulo}
                  className="rounded-xl border border-neutral-800 bg-neutral-950 p-5"
                >
                  <h3 className="font-semibold text-emerald-400">
                    {actividad.titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-neutral-400">
                    {actividad.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section id="planes" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight">Planes</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {PLANES.map((plan) => (
                <div
                  key={plan}
                  className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-6"
                >
                  <h3 className="text-xl font-semibold text-emerald-400">
                    {ETIQUETAS_TIPO_PASE[plan]}
                  </h3>
                  <p className="mt-1 text-neutral-400">
                    {DETALLE_PLANES[plan].subtitulo}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {DETALLE_PLANES[plan].incluye.map((item) => (
                      <li key={item} className="flex gap-2.5 text-neutral-300">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-emerald-400"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 border-t border-neutral-800 pt-4 text-sm text-neutral-500">
                    Consultanos el precio actual por WhatsApp o en recepción.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section
          id="horarios"
          className="scroll-mt-16 border-t border-neutral-900 bg-neutral-900/40"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12">
            <div className="space-y-5">
              <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
                <Clock className="size-7 text-emerald-400" aria-hidden />
                Horarios
              </h2>

              <dl className="divide-y divide-neutral-800 border-y border-neutral-800">
                {HORARIOS.map((horario) => (
                  <div
                    key={horario.dias}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <dt className="text-neutral-300">{horario.dias}</dt>
                    <dd className="font-medium tabular-nums">
                      {horario.horas}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <Foto
              src="/fotos/sala.jpg"
              alt="Zona de entrenamiento funcional"
              className="aspect-4/3 w-full"
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section id="donde" className="scroll-mt-16">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12">
            <div className="space-y-5">
              <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
                <MapPin className="size-7 text-emerald-400" aria-hidden />
                Dónde estamos
              </h2>

              <p className="text-lg text-neutral-300">{GIMNASIO.direccion}</p>

              <ul className="space-y-3 text-neutral-400">
                <li>
                  <a
                    href={enlaceWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-neutral-100"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden />
                    {GIMNASIO.telefono}
                  </a>
                </li>
                <li>
                  <a
                    href={`https://instagram.com/${GIMNASIO.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-neutral-100"
                  >
                    <AtSign className="size-4 shrink-0" aria-hidden />@
                    {GIMNASIO.instagram}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${GIMNASIO.email}`}
                    className="flex items-center gap-2.5 hover:text-neutral-100"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden />
                    {GIMNASIO.email}
                  </a>
                </li>
              </ul>
            </div>

            <Foto
              src="/fotos/frente.jpg"
              alt={`Frente del gimnasio en ${GIMNASIO.ciudad}`}
              className="aspect-4/3 w-full"
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-neutral-900 bg-linear-to-b from-neutral-900/40 to-neutral-950">
          <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-14 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-balance">
              ¿Ya sos socio?
            </h2>
            <p className="text-neutral-400">
              Consultá con tu DNI si tenés la cuota al día, sin llamar ni
              acercarte.
            </p>
            <Button
              render={<Link href="/ingresar" />}
              size="lg"
              className="h-12 w-full text-base sm:w-auto"
            >
              Ver mi cuota
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            {GIMNASIO.nombre} · {GIMNASIO.ciudad}
          </span>
          <Link href="/ingresar" className="hover:text-neutral-300">
            Acceso del personal
          </Link>
        </div>
      </footer>
    </div>
  );
}
