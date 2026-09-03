"use client";

import { useState } from "react";
import { formatearFechaHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";

const ITEMS_INICIALES = 2;

export function ListaIngresosDinamica({ ultimosIngresos }: { ultimosIngresos: (string | Date)[] }) {
  const [itemsVisibles, setItemsVisibles] = useState<number>(ITEMS_INICIALES);

  if (ultimosIngresos.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">
        Todavía no registramos ningún ingreso tuyo.
      </p>
    );
  }

  const ingresosAMostrar = ultimosIngresos.slice(0, itemsVisibles);

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300">
        {ingresosAMostrar.map((ingreso) => (
          <li key={ingreso.toString()} className="p-3 font-medium flex items-center justify-between hover:bg-muted/30 transition-colors rounded-md tabular-nums">
            <span>Ingreso registrado</span>
            <span className="text-muted-foreground">{formatearFechaHora(ingreso)}</span>
          </li>
        ))}
      </ul>

      {/* Botón dinámico: Alterna entre Ver más y Ver menos */}
      {ultimosIngresos.length > ITEMS_INICIALES && (
        <div className="flex justify-center pt-2">
          {itemsVisibles < ultimosIngresos.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(ultimosIngresos.length)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors font-semibold"
            >
              Ver historial completo &darr;
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(ITEMS_INICIALES)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver menos &uarr;
            </Button>
          )}
        </div>
      )}
    </div>
  );
}