import type { Metadata } from "next";
import Link from "next/link";
import { MarcaAppGym, NombreAppGym } from "@/components/publico/logo";
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

export const metadata: Metadata = { title: "Ingresar · AppGym" };

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
            <MarcaAppGym className="size-16 drop-shadow-sm" />
            <span className={`text-2xl uppercase tracking-tighter ${fuenteLogo.className}`}>
              <NombreAppGym />
            </span>
          </Link>
        </div>

        <FormularioIngreso />
      </main>
    </div>
  );
}