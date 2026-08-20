import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsultaDni } from "@/components/recepcion/consulta-dni";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Recepción · Total Fit",
};

export default async function PaginaRecepcion() {
  // El proxy ya redirige a /ingresar, pero se vuelve a verificar acá: la doc de
  // Next dice explícitamente que el proxy no es la capa de autorización.
  const sesion = await auth();

  if (sesion?.user?.rol !== "ADMIN") {
    redirect("/ingresar");
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Recepción</h1>
        <p className="text-muted-foreground">
          Ingresá el DNI del socio para verificar el acceso.
        </p>
      </header>

      <ConsultaDni />

      <footer className="mt-auto text-sm text-muted-foreground">
        Atiende: {sesion.user.name}
      </footer>
    </main>
  );
}
