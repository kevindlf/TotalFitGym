import { AtSign, Check, Clock,MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";

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

const fuenteNormal = Inter({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const PLANES = ["MEDIO", "LIBRE"] as const;

const SEDES = [
  {
    id: "Junin",
    nombre: "Total Fit Junín",
    direccion: "(Centro comercial: La recova)",
    foto: "/sedeJunin.jpg.jpeg",
    telefono: "+54 11 4567-8901",
    instagram: "total_fit__",
  },
  {
    id: "San Martin",
    nombre: "Total Fit San Martín",
    direccion: "(Av. Lavalle 565) ",
    foto: "/sedeSanMartin.jpg.jpeg",
    telefono: "+54 11 4567-8902",
    instagram: "total_fit__",
  },
] as const;

export default function PaginaPublica() {
  const enlaceWhatsapp = `https://wa.me/${GIMNASIO.whatsapp}`;

  return (
    <div className={`flex min-h-svh flex-col bg-background text-foreground ${fuenteNormal.className}`}>
      <Encabezado />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Entrenás vos.{" "}
              {/* Texto en gris sutil en lugar de rojo */}
              <span className="text-muted-foreground">Del resto nos ocupamos nosotros.</span>
            </h1>


            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href="/ingresar" />}
                size="lg"
                nativeButton={false}
                // Botón neutro y elegante (se adapta al modo claro/oscuro automáticamente)
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
                nativeButton={false}
                className="h-12 border-input bg-transparent text-base text-foreground hover:bg-muted transition-colors"
              >
                Escribinos
              </Button>
            </div>
          </div>

         <Foto
            src="/totalfit.jpg"
            alt="Logo de Total Fit"
            className="aspect-square w-full max-w-sm mx-auto rounded-full object-cover shadow-lg"
            prioridad
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        <section
          id="nosotros"
          className="scroll-mt-16 border-t border-border bg-muted/40"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Qué vas a encontrar
              </h2>
              <p className="max-w-2xl text-pretty text-muted-foreground">
                No somos una cadena. Somos un gimnasio de barrio donde el profe
                se sabe tu nombre y sabe en qué estás trabajando.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {ACTIVIDADES.map((actividad) => (
                <div
                  key={actividad.titulo}
                  className="rounded-xl border border-border bg-background p-5 shadow-sm"
                >
                  {/* Título normal, sin colores agresivos */}
                  <h3 className="font-semibold text-foreground">
                    {actividad.titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-muted-foreground">
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
                  className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-foreground">
                    {ETIQUETAS_TIPO_PASE[plan]}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {DETALLE_PLANES[plan].subtitulo}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {DETALLE_PLANES[plan].incluye.map((item) => (
                      <li key={item} className="flex gap-2.5 text-foreground/85">
                        {/* El acento de color se mantiene solo en el icono */}
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-red-500"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
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
          className="scroll-mt-16 border-t border-border bg-muted/40"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12">
            <div className="space-y-5">
              <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
                {/* Icono con acento de color suave */}
                <Clock className="size-7 text-red-500" aria-hidden />
                Horarios
              </h2>

              <dl className="divide-y divide-border border-y border-border">
                {HORARIOS.map((horario) => (
                  <div
                    key={horario.dias}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <dt className="text-foreground/85">{horario.dias}</dt>
                    <dd className="font-medium tabular-nums">
                      {horario.horas}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

           
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
       <section id="donde" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="flex items-center gap-2.5 text-3xl font-bold tracking-tight">
                <MapPin className="size-7 text-red-500" aria-hidden />
                Sedes
              </h2>
              <p className="text-muted-foreground">
                Elegí la sucursal que te quede más cómoda y vení a entrenar.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {SEDES.map((sede) => (
                <div 
                  key={sede.id} 
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
                >
                  {/* Foto independiente para cada sede */}
                 <div className="w-full">
                    <Foto
                      src={sede.foto}
                      alt={`Foto de la ${sede.nombre}`}
                      // 1. Cambiamos a aspect-[4/3] para que sea un rectángulo más alto y parecido a tu foto.
                      // 2. Quitamos los trucos de object-contain para que la foto rellene todo el espacio sin bordes.
                      className="aspect-[3/3] w-full"
                    />
                  </div>

                  {/* Información de la sede */}
                  <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {sede.nombre}
                      </h3>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-red-500" />
                        {sede.direccion}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="size-4 shrink-0" />
                        {sede.telefono}
                      </span>
                      <a
                        href={enlaceWhatsapp} // Asegúrate de que esta variable exista arriba
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        Consultar por WhatsApp &rarr;
                      </a>
                    </div>
                    {/* Nuevo enlace a Instagram */}
                        {sede.instagram && (
                          <a
                            href={`https://instagram.com/${sede.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            // Le agregué hover:text-red-500 y hover:underline para que sea súper obvio que se puede hacer clic
                            className="text-muted-foreground hover:text-red-500 hover:underline flex items-center gap-2 transition-all"
                          >
                            <AtSign className="size-4 shrink-0 text-red-500" />
                            @{sede.instagram}
                          </a>
                        )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-border bg-linear-to-b from-muted/40 to-background">
          <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-14 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-balance">
              ¿Ya sos socio?
            </h2>
            <p className="text-muted-foreground">
              Consultá con tu DNI si tenés la cuota al día, sin llamar ni
              acercarte.
            </p>
            <Button
              render={<Link href="/ingresar" />}
              size="lg"
              nativeButton={false}
              // Botón neutro
              className="h-12 w-full text-base sm:w-auto"
            >
              Ver mi cuota
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            {GIMNASIO.nombre} · {GIMNASIO.ciudad}
          </span>
          
        </div>
      </footer>
    </div>
  );
}