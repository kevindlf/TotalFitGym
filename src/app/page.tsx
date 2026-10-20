import { AtSign, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";

import { Encabezado } from "@/components/publico/encabezado";
import { MarcaAppGym, NombreAppGym } from "@/components/publico/logo";
import { Button } from "@/components/ui/button";
import {
  CAPACIDADES,
  ESTADOS_PUERTA,
  PRODUCTO,
  REGLAS,
  TODAVIA_NO,
} from "@/lib/producto";

const fuenteNormal = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * Página pública de AppGym.
 *
 * Le habla al dueño de un gimnasio que hoy lleva todo en una planilla, no a un
 * socio: el socio entra por `/ingresar` y nunca pasa por acá. Por eso la página
 * no tiene horarios, actividades ni planes — eso era de cuando el sistema era
 * de un cliente.
 */
export default function PaginaPublica() {
  const enlaceWhatsapp = `https://wa.me/${PRODUCTO.whatsapp}`;

  return (
    <div
      className={`flex min-h-svh flex-col bg-background text-foreground ${fuenteNormal.className}`}
    >
      <Encabezado />

      <main className="flex-1">
        {/* --------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
          {/* La marca arriba del título y no al costado: en una captura apaisada
              una columna de texto sola queda desbalanceada, y un logo gigante al
              lado se come la mitad del cuadro sin decir nada. */}
          <div className="flex items-center gap-3">
            <MarcaAppGym className="size-12" />
            <NombreAppGym className="text-2xl font-black uppercase tracking-tighter" />
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            El sistema que reemplaza{" "}
            <span className="text-muted-foreground">
              la planilla del gimnasio.
            </span>
          </h1>

          <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
            El socio dice su DNI en el mostrador y la pantalla contesta si puede
            pasar. Atrás de eso queda registrado quién entró, quién debe y qué
            profe cobró cada peso.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              render={
                <a
                  href={enlaceWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              size="lg"
              nativeButton={false}
              className="h-12 text-base"
            >
              Escribinos por WhatsApp
            </Button>

            <Button
              render={<a href="#la-puerta" />}
              size="lg"
              variant="outline"
              nativeButton={false}
              className="h-12 border-input bg-transparent text-base text-foreground transition-colors hover:bg-muted"
            >
              Ver cómo funciona
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-4">
            {[
              { n: "4", que: "estados de cuota, con color e ícono" },
              { n: "1", que: "click para cobrar la renovación" },
              { n: "0", que: "pagos anónimos: todos con nombre" },
              { n: "90", que: "pruebas automáticas corriendo" },
            ].map((dato) => (
              <div key={dato.que} className="space-y-1">
                <dt className="text-3xl font-bold tabular-nums">{dato.n}</dt>
                <dd className="text-sm text-muted-foreground">{dato.que}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* --------------------------------------------------------------- */}
        <section
          id="el-problema"
          className="scroll-mt-16 border-t border-border bg-muted/40"
        >
          <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight">
              La planilla no te avisa nada
            </h2>

            <p className="max-w-2xl text-pretty text-muted-foreground">
              Una planilla guarda, pero no responde. Para saber quién debe hay
              que leerla fila por fila. Para saber si el que está parado en la
              puerta puede pasar, hay que buscarlo con el dedo mientras se le
              hace la cola atrás. Dos personas la editan el mismo día y una pisa
              a la otra. Y cuando falta plata en la caja, la planilla no sabe
              quién cobró.
            </p>

            <ul className="max-w-2xl space-y-2.5 text-foreground/85">
              {[
                "El estado —«al día», «debe»— se escribe a mano, así que envejece mal y nadie lo recalcula.",
                "No hay registro de quién entró al gimnasio ni cuándo.",
                "El socio no tiene forma de consultar su cuota sin preguntarle a un profe.",
                "Si hay dos locales, hay dos planillas que no se hablan.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red-500"
                    aria-hidden
                  />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section id="la-puerta" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Se ingresa el DNI y la pantalla contesta
              </h2>
              <p className="max-w-2xl text-pretty text-muted-foreground">
                Es la pantalla de la computadora del mostrador. El profe tipea el
                DNI, la pantalla se pinta entera de un color y vuelve sola al
                campo vacío para el que sigue. El estado no está guardado en
                ningún lado: se calcula en el momento con los pagos de esa
                persona.
              </p>
            </div>

            <ul className="space-y-3">
              {ESTADOS_PUERTA.map((estado) => (
                <li
                  key={estado.cartel + estado.glifo + estado.detalle}
                  className={`flex items-start gap-4 rounded-xl p-4 sm:p-5 ${estado.fondo}`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-current text-base font-bold ${estado.clase}`}
                    aria-hidden
                  >
                    {estado.glifo}
                  </span>

                  <div className="space-y-1">
                    <p
                      className={`text-lg font-bold uppercase tracking-tight ${estado.clase}`}
                    >
                      {estado.cartel}
                    </p>
                    <p className="text-pretty text-sm text-foreground/85">
                      {estado.detalle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="max-w-2xl border-l-2 border-border pl-4 text-sm text-muted-foreground">
              El color nunca comunica solo: cada estado lleva además ícono y
              texto. La pantalla se lee de lejos, de reojo y con gente esperando
              —y un recepcionista daltónico tiene que poder usarla.
            </div>

            <ul className="max-w-2xl space-y-2.5 text-foreground/85">
              {[
                "Debajo del cartel aparecen el nombre y la fecha: «Vence el 12/10/2026 (en 4 días)» o «Venció el 3/09/2026 (hace 14 días)».",
                "La asistencia se registra solo si el acceso está permitido. La bitácora es de ingresos, no de consultas.",
                "Una vez registrado un ingreso, nadie lo edita ni lo borra. Ni el dueño.",
                "Con cuánta anticipación aparece el aviso amarillo lo decide el gimnasio. Viene en 7 días.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red-500"
                    aria-hidden
                  />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section
          id="el-mostrador"
          className="scroll-mt-16 border-t border-border bg-muted/40"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Cobrar tiene que ser más rápido que anotar
              </h2>
              <p className="max-w-2xl text-pretty text-muted-foreground">
                El profe cobra parado, con el socio enfrente. Todo lo que hace
                queda a su nombre.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CAPACIDADES.map((capacidad) => (
                <article
                  key={capacidad.titulo}
                  className="rounded-xl border border-border bg-background p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-foreground">
                    {capacidad.titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-sm text-muted-foreground">
                    {capacidad.detalle}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section id="el-socio" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Que pregunte la pantalla, no el profe
              </h2>
              <p className="max-w-2xl text-pretty text-muted-foreground">
                El socio entra desde su celular con el DNI y ve lo que hoy le
                contestarían por teléfono en recepción: si está al día y hasta
                cuándo, qué plan tiene, sus últimos pagos y sus últimos ingresos.
              </p>
            </div>

            <ul className="max-w-2xl space-y-2.5 text-foreground/85">
              {[
                "Le habla en su idioma: «Te quedan 3 días de cuota. Podés renovarla en recepción.» Al socio nunca se le dice «moroso»; esa palabra es para el panel del dueño.",
                "Puede crearse una clave solo, verificando los últimos 4 números del teléfono que el gimnasio ya tiene cargado. Nadie tiene que cargar claves de a una.",
                "Consultar la cuota desde el celular no cuenta como entrar al gimnasio: no registra asistencia.",
                "Su DNI nunca viaja en la dirección del navegador, así que no se filtra al compartir un link.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red-500"
                    aria-hidden
                  />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section
          id="sucursales"
          className="scroll-mt-16 border-t border-border bg-muted/40"
        >
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                Cada sucursal ve lo suyo
              </h2>
              <p className="max-w-2xl text-pretty text-muted-foreground">
                Un gimnasio con un local y uno con tres usan el mismo sistema.
                Abrir otra sucursal no necesita desarrollo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  titulo: "El encargado",
                  detalle:
                    "Ve el padrón, la caja y la puerta de su local. La ficha de un socio de otra sucursal le responde que no existe. No es una cuestión de confianza: no hay forma de pedirla.",
                },
                {
                  titulo: "El dueño",
                  detalle:
                    "Ve el total de la cadena —socios, morosos y cobrado del mes por local— y elige con un selector sobre cuál sucursal trabajar. Adentro se comporta como el encargado de esa.",
                },
                {
                  titulo: "La plata no se muda",
                  detalle:
                    "Cada pago queda contado en el local donde se cobró, para siempre. Si el socio después se cambia de sucursal, la caja pasada de las dos no se reescribe.",
                },
                {
                  titulo: "El que se muda",
                  detalle:
                    "Si alguien aparece con un DNI que ya existe en otro local, el sistema muestra su nombre y su sucursal, y ofrece traerlo. Se trae hacia el local propio, nunca se empuja al de al lado.",
                },
              ].map((bloque) => (
                <article
                  key={bloque.titulo}
                  className="rounded-xl border border-border bg-background p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-foreground">
                    {bloque.titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-sm text-muted-foreground">
                    {bloque.detalle}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section id="las-reglas" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Cuatro reglas que el sistema no deja romper
            </h2>

            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {REGLAS.map((regla) => (
                <div key={regla.titulo} className="space-y-2 bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {regla.rotulo}
                  </p>
                  <h3 className="font-semibold text-foreground">
                    {regla.titulo}
                  </h3>
                  <p className="text-pretty text-sm text-muted-foreground">
                    {regla.detalle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section
          id="todavia-no"
          className="scroll-mt-16 border-t border-border bg-muted/40"
        >
          <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Lo que hoy no hace
            </h2>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Conviene saberlo antes que después. Nada de esto es imposible:
              está en la lista, y lo cotizamos aparte.
            </p>

            <ul className="flex flex-wrap gap-2">
              {TODAVIA_NO.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>

            <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
              Lo de no borrar es a propósito: un socio se da de baja y su
              historial queda. Un pago mal cargado se corrige agregando, no
              haciendo desaparecer el anterior.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section id="contacto" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-14 sm:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-balance">
                Se muestra andando, no en papel
              </h2>
              <p className="max-w-2xl text-pretty text-muted-foreground">
                La demostración se hace con la puerta abierta: se carga un socio,
                se le cobra, se ingresa su DNI y se ve el cartel. Toma quince
                minutos y se entiende sin explicación.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                render={
                  <a
                    href={enlaceWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                size="lg"
                nativeButton={false}
                className="h-12 text-base"
              >
                <Phone className="size-4" aria-hidden />
                Escribinos por WhatsApp
              </Button>

              <a
                href={`https://instagram.com/${PRODUCTO.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <AtSign className="size-4 shrink-0 text-red-500" aria-hidden />@
                {PRODUCTO.instagram}
              </a>

              <a
                href={`mailto:${PRODUCTO.email}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4 shrink-0 text-red-500" aria-hidden />
                {PRODUCTO.email}
              </a>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        <section className="border-t border-border bg-linear-to-b from-muted/40 to-background">
          <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-balance">
              ¿Sos socio de un gimnasio que usa {PRODUCTO.nombre}?
            </h2>
            <p className="text-muted-foreground">
              Consultá con tu DNI si tenés la cuota al día, sin llamar ni
              acercarte.
            </p>
            <Button
              render={<Link href="/ingresar" />}
              size="lg"
              variant="outline"
              nativeButton={false}
              className="h-12 w-full border-input bg-transparent text-base text-foreground hover:bg-muted sm:w-auto"
            >
              Ver mi cuota
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            {PRODUCTO.nombre} · {PRODUCTO.lema}
          </span>
          <a
            href={`https://instagram.com/${PRODUCTO.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            @{PRODUCTO.instagram}
          </a>
        </div>
      </footer>
    </div>
  );
}
