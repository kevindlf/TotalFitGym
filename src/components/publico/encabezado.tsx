import Link from "next/link";
import Image from "next/image";
import { Montserrat, Inter } from "next/font/google";

import { BotonTema } from "@/components/ui/boton-tema";
import { Button } from "@/components/ui/button";

// Configuración de la fuente del logo (gruesa y llamativa)
const fuenteLogo = Montserrat({ 
  subsets: ["latin"], 
  weight: ["900"] 
});

// Configuración de la fuente normal (limpia y legible)
const fuenteNormal = Inter({ 
  subsets: ["latin"],
  weight: ["400", "500"] 
});

const SECCIONES = [
  { href: "#nosotros", texto: "El gimnasio" },
  { href: "#planes", texto: "Planes" },
  { href: "#horarios", texto: "Horarios" },
  { href: "#donde", texto: "Sedes" },
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
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        
        <Link href="/" className="flex items-center gap-2 text-lg tracking-tight sm:text-xl mr-50">
          <Image 
            src="/totalfit.jpg" 
            alt="Logo Total Fit" 
            width={48} 
            height={48} 
            className="rounded-full"
          />
          <span className={`${fuenteLogo.className} text-2xl uppercase tracking-tighter`}>
            TOTAL <span className="text-red-600 dark:text-red-500">FIT</span>
          </span>
        </Link>

        <nav className={`hidden gap-5 text-sm text-muted-foreground md:flex ${fuenteNormal.className}`}>
          {SECCIONES.map((seccion) => (
            <a
              key={seccion.href}
              href={seccion.href}
              className="hover:text-foreground font-medium transition-colors"
            >
              {seccion.texto}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <BotonTema />
        </div>

        <Button render={<Link href="/ingresar" />} className={`${fuenteNormal.className} font-medium`} nativeButton={false}>
          Ingresar
        </Button>
      </div>
    </header>
  );
}
