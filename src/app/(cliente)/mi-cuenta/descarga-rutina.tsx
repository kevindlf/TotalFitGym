import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatearFecha } from "@/lib/formato";

/**
 * Lo que ve el socio que ya entró con su clave (sesión `COMPLETO`).
 *
 * El archivo no se linkea al bucket: se pide a `/api/mi-rutina`, que vuelve a
 * verificar la cookie firmada antes de mandarlo. Ese chequeo es el que protege
 * la rutina — esconder este botón no protegería nada.
 *
 * El estado no se comunica solo con color (CLAUDE.md §9): el botón dice qué
 * hace y lleva ícono.
 */
export function DescargaRutina({
  rutina,
}: {
  rutina: { nombre: string; actualizadaEn: string } | null;
}) {
  if (!rutina) {
    return (
      <p className="mt-2 text-muted-foreground">
        Todavía no está disponible. Cuando tu profe la cargue, la vas a poder
        ver y descargar desde acá.
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-muted-foreground">
        Tu profe la actualizó el {formatearFecha(rutina.actualizadaEn)}.
      </p>

      <Button render={<a href="/api/mi-rutina" />} className="mt-4">
        <Download className="size-4" aria-hidden />
        Descargar mi rutina
      </Button>
    </>
  );
}
