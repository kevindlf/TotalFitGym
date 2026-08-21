import type { Metadata } from "next";
import Link from "next/link";

import { BotonTema } from "@/components/ui/boton-tema";

import { FormularioIngreso } from "./formulario-ingreso";

export const metadata: Metadata = { title: "Ingresar · Total Fit" };

export default function PaginaIngresar() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-md items-center justify-between p-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TOTAL{" "}
          <span className="text-emerald-600 dark:text-emerald-400">FIT</span>
        </Link>

        <BotonTema />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-8 px-6 pb-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ingresar</h1>
          <p className="text-muted-foreground">
            Con tu DNI ves el estado de tu cuota. Si trabajás en el gimnasio,
            entrás al panel con tu contraseña.
          </p>
        </div>

        <FormularioIngreso />
      </main>
    </div>
  );
}
