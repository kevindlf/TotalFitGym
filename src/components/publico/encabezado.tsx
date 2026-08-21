import Link from "next/link";

import { BotonTema } from "@/components/ui/boton-tema";
import { Button } from "@/components/ui/button";

const SECCIONES = [
  { href: "#nosotros", texto: "El gimnasio" },
  { href: "#planes", texto: "Planes" },
  { href: "#horarios", texto: "Horarios" },
  { href: "#donde", texto: "Dónde estamos" },
];

/**
 * Barra superior de la página pública.
 *
 * Queda fija arriba porque en el celular la persona scrollea largo y el botón
 * de ingresar tiene que estar siempre a un toque. Los links a secciones se
 * ocultan en pantallas chicas: ahí el scroll es más rápido que un menú.
 */
export function Encabezado() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight sm:text-xl">
          TOTAL <span className="text-emerald-600 dark:text-emerald-400">FIT</span>
        </Link>

        <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
          {SECCIONES.map((seccion) => (
            <a
              key={seccion.href}
              href={seccion.href}
              className="hover:text-foreground"
            >
              {seccion.texto}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <BotonTema />
        </div>

        <Button render={<Link href="/ingresar" />}>
          Ingresar
        </Button>
      </div>
    </header>
  );
}
