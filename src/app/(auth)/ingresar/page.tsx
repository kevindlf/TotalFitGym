import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Inter, Montserrat } from "next/font/google";

import { BotonTema } from "@/components/ui/boton-tema";
import { FormularioIngreso } from "./formulario-ingreso";

const fuenteNormal = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fuenteLogo = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
});

export const metadata: Metadata = { title: "Ingresar · Total Fit" };

export default function PaginaIngresar() {
  return (
    <div className={`relative flex min-h-svh flex-col items-center justify-center bg-muted/20 p-4 text-foreground ${fuenteNormal.className}`}>
      
      <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
        <BotonTema />
      </div>

      <main className="w-full max-w-md space-y-8 rounded-3xl bg-background px-6 py-10 shadow-xl ring-1 ring-border sm:px-10 sm:py-12">
        
        {/* Solo dejamos el logo centrado acá */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex flex-col items-center gap-3 transition-transform hover:scale-105">
            <Image 
              src="/totalfit.jpg" 
              alt="Logo Total Fit" 
              width={64} 
              height={64} 
              className="rounded-full object-cover shadow-sm ring-2 ring-background"
            />
            <span className={`text-2xl uppercase tracking-tighter ${fuenteLogo.className}`}>
              TOTAL <span className="text-red-600 dark:text-red-500">FIT</span>
            </span>
          </Link>
        </div>

        <FormularioIngreso />
      </main>
    </div>
  );
}