"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatearFechaHora } from "@/lib/formato";

const ITEMS_INICIALES = 3;

type AsistenciaSocio = {
  id_asistencia: string;
  fecha_hora: string | Date;
};

export function HistorialIngresos({ asistencias }: { asistencias: AsistenciaSocio[] }) {
  const [itemsVisibles, setItemsVisibles] = useState<number>(ITEMS_INICIALES);

  if (asistencias.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">Todavía no registró ningún ingreso.</p>
      </div>
    );
  }

  const asistenciasAMostrar = asistencias.slice(0, itemsVisibles);

  return (
    <div className="flex h-full flex-col">
      <ul className="flex flex-col gap-2">
        {asistenciasAMostrar.map((asistencia) => (
          <li 
            key={asistencia.id_asistencia}
            className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-2.5 text-sm font-medium tabular-nums text-foreground transition-colors hover:bg-muted/60"
          >
            <span>Ingreso a la sede</span>
            <span className="text-muted-foreground">{formatearFechaHora(asistencia.fecha_hora)}</span>
          </li>
        ))}
      </ul>

      {/* Botón Ver Más / Ver Menos */}
      {asistencias.length > ITEMS_INICIALES && (
        <div className="mt-auto flex justify-center pt-4">
          {itemsVisibles < asistencias.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(asistencias.length)}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 font-semibold"
            >
              Ver {asistencias.length - ITEMS_INICIALES} ingresos más &darr;
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(ITEMS_INICIALES)}
              className="text-muted-foreground hover:text-foreground"
            >
              Ver menos &uarr;
            </Button>
          )}
        </div>
      )}
    </div>
  );
}