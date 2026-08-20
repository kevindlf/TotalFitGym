import type { Metadata } from "next";
import Link from "next/link";

import { ConsultaCuota } from "./consulta-cuota";

export const metadata: Metadata = { title: "Mi cuenta · Total Fit" };

export default function PaginaMiCuenta() {
  return (
    <div className="flex min-h-svh flex-col bg-neutral-950 text-neutral-100">
      <header className="mx-auto w-full max-w-xl p-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TOTAL <span className="text-emerald-400">FIT</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 space-y-8 px-6 pb-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Mi cuota</h1>
          <p className="text-neutral-400">
            Consultá con tu DNI si tenés la cuota al día.
          </p>
        </div>

        <ConsultaCuota />

        <p className="border-t border-neutral-800 pt-6 text-sm text-neutral-500">
          La descarga de tu rutina va a estar disponible más adelante, cuando
          cada socio tenga su clave.
        </p>
      </main>
    </div>
  );
}
