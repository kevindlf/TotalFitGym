import Link from "next/link";

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
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight sm:text-xl">
          TOTAL <span className="text-emerald-400">FIT</span>
        </Link>

        <nav className="hidden gap-5 text-sm text-neutral-400 md:flex">
          {SECCIONES.map((seccion) => (
            <a
              key={seccion.href}
              href={seccion.href}
              className="hover:text-neutral-100"
            >
              {seccion.texto}
            </a>
          ))}
        </nav>

        <Button render={<Link href="/ingresar" />} className="ml-auto">
          Ingresar
        </Button>
      </div>
    </header>
  );
}
