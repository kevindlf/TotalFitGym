"use client";

import { useState } from "react";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { formatearFecha, formatearPesos } from "@/lib/formato";
import { Button } from "@/components/ui/button";

interface Pago {
  id_pago: string;
  monto: number;
  tipo_pase: string;
  fecha_pago: string | Date;
  fecha_vencimiento: string | Date;
}

const ITEMS_INICIALES = 2;

export function ListaPagosDinamica({ pagos }: { pagos: Pago[] }) {
  const [itemsVisibles, setItemsVisibles] = useState<number>(ITEMS_INICIALES);

  if (pagos.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">
        Todavía no tenemos ningún pago tuyo registrado.
      </p>
    );
  }

  const pagosAMostrar = pagos.slice(0, itemsVisibles);

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300">
        {pagosAMostrar.map((pago) => (
          <li
            key={pago.id_pago}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-5 hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="font-semibold text-base tabular-nums">
                {formatearPesos(pago.monto)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                {ETIQUETAS_TIPO_PASE[pago.tipo_pase as keyof typeof ETIQUETAS_TIPO_PASE]}
              </p>
            </div>

            <div className="text-right text-sm text-muted-foreground tabular-nums bg-muted/40 p-2.5 rounded-lg space-y-0.5">
              <p>Pagaste el <span className="font-medium text-foreground">{formatearFecha(pago.fecha_pago)}</span></p>
              <p>Cubrió hasta <span className="font-medium text-foreground">{formatearFecha(pago.fecha_vencimiento)}</span></p>
            </div>
          </li>
        ))}
      </ul>

      {/* Botón dinámico: Alterna entre Ver más y Ver menos */}
      {pagos.length > ITEMS_INICIALES && (
        <div className="flex justify-center pt-2">
          {itemsVisibles < pagos.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemsVisibles(pagos.length)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors font-semibold"
            >
              Ver {pagos.length - ITEMS_INICIALES} pagos más &darr;
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