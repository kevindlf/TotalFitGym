import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";
import { UserCheck, ArrowLeft, ShieldCheck } from "lucide-react";

import { ConsultaDni } from "@/components/recepcion/consulta-dni";
import { exigirPanel } from "@/lib/sede";

const fuenteNormal = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fuenteLogo = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
});

export const metadata: Metadata = {
  title: "Recepción · Total Fit",
};

export default async function PaginaRecepcion() {
  const ctx = await exigirPanel();

  return (
    <div className={`flex min-h-svh flex-col bg-muted/20 text-foreground ${fuenteNormal.className}`}>
      
      {/* BARRA SUPERIOR MÁS FINA Y COMPACTA */}
      <nav className="flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <span className={`text-lg uppercase tracking-tighter ${fuenteLogo.className}`}>
            TOTAL <span className="text-red-600 dark:text-red-500">FIT</span>
          </span>
          <span className="hidden rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-500 ring-1 ring-inset ring-red-500/20 sm:inline-block">
            Sede {ctx.sedeNombre}
          </span>
        </div>
        
        <Link 
          href="/dashboard" 
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </nav>

      {/* CONTENEDOR CENTRAL: MÁS ANGOSTO Y CENTRADO VERTICALMENTE */}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 p-4 sm:p-6">
        
        {/* CABECERA REDUCIDA */}
        <header className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <UserCheck className="size-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Control de Acceso
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá el DNI para dar el presente.
          </p>
        </header>

        {/* TARJETA MÁS AJUSTADA PARA QUE EL RESULTADO ENTRE PERFECTO */}
        <div className="rounded-2xl border border-border/40 bg-background p-5 shadow-lg ring-1 ring-black/5 dark:ring-white/5 sm:p-6">
          <ConsultaDni />
        </div>

        {/* FOOTER PEQUEÑO */}
        <footer className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Atendido por <span className="font-semibold text-foreground">{ctx.usuarioNombre}</span>
        </footer>
      </main>
    </div>
  );
}