import Link from "next/link";
import { redirect } from "next/navigation";

import { CerrarSesion } from "@/components/admin/cerrar-sesion";
import { auth } from "@/lib/auth";

const SECCIONES = [
  { href: "/dashboard", texto: "Panel" },
  { href: "/socios", texto: "Socios" },
  { href: "/recepcion", texto: "Recepción" },
];

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  // El proxy ya redirige, pero se revalida acá: la doc de Next dice que el
  // proxy no es la capa de autorización (Regla de Oro 4).
  const sesion = await auth();

  if (sesion?.user?.rol !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 p-4">
          <Link href="/dashboard" className="font-bold tracking-tight">
            TOTAL <span className="text-emerald-600">FIT</span>
          </Link>

          <nav className="flex gap-4 text-sm">
            {SECCIONES.map((seccion) => (
              <Link
                key={seccion.href}
                href={seccion.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {seccion.texto}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{sesion.user.name}</span>
            <CerrarSesion />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
