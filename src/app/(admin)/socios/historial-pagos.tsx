"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { formatearFecha, formatearPesos } from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";

import {
  obtenerHistorialDePagos,
  type PagoDelHistorial,
} from "./acciones";

const ETIQUETAS_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  QR: "QR",
  MERCADO_PAGO: "Mercado Pago",
};

/**
 * Historial de pagos de un socio, desplegable desde la planilla.
 *
 * Se pide al servidor recién cuando se abre. Traerlo junto con el listado
 * significaría mover los pagos de los 349 socios para mostrar, casi siempre,
 * ninguno.
 */
export function HistorialPagos({
  usuarioId,
  nombre,
  cantidadDePagos,
}: {
  usuarioId: string;
  nombre: string;
  cantidadDePagos: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pagos, setPagos] = useState<PagoDelHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, empezarCarga] = useTransition();

  function alternar() {
    if (abierto) {
      setAbierto(false);

      return;
    }

    setAbierto(true);

    // Se pide una sola vez: al volver a abrirlo ya está en memoria.
    if (pagos === null) {
      empezarCarga(async () => {
        try {
          setPagos(await obtenerHistorialDePagos(usuarioId));
        } catch {
          setError("No se pudo cargar el historial.");
        }
      });
    }
  }

  if (cantidadDePagos === 0) {
    return <span className="text-xs text-muted-foreground">Sin pagos</span>;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={alternar}
        aria-expanded={abierto}
      >
        {abierto ? "Ocultar" : "Ver"} {cantidadDePagos}{" "}
        {cantidadDePagos === 1 ? "pago" : "pagos"}
      </Button>

      {abierto ? (
        <div className="rounded-md border bg-muted/30 p-3">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Historial de {nombre}
              </p>

              <ul className="space-y-1.5 text-sm">
                {pagos?.map((pago) => (
                  <li
                    key={pago.id_pago}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 tabular-nums"
                  >
                    <span className="font-medium">
                      {formatearFecha(pago.fecha_pago)}
                    </span>
                    <span>{formatearPesos(pago.monto)}</span>
                    <span className="text-muted-foreground">
                      {
                        ETIQUETAS_TIPO_PASE[
                          pago.tipo_pase as keyof typeof ETIQUETAS_TIPO_PASE
                        ]
                      }{" "}
                      · {ETIQUETAS_METODO[pago.metodo_pago] ?? pago.metodo_pago}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      hasta {formatearFecha(pago.fecha_vencimiento)} · cobró{" "}
                      {pago.cobro}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
