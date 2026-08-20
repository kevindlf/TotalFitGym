import type { Metadata } from "next";
import Link from "next/link";

import { FormularioIngreso } from "./formulario-ingreso";

export const metadata: Metadata = { title: "Ingresar · Total Fit" };

export default function PaginaIngresar() {
  return (
    <div className="flex min-h-svh flex-col bg-neutral-950 text-neutral-100">
      <header className="mx-auto w-full max-w-md p-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TOTAL <span className="text-emerald-400">FIT</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-8 px-6 pb-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ingresar</h1>
          <p className="text-neutral-400">
            Con tu DNI ves el estado de tu cuota. Si trabajás en el gimnasio,
            entrás al panel con tu contraseña.
          </p>
        </div>

        <FormularioIngreso />
      </main>
    </div>
  );
}
