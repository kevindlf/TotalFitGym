"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { repetirUltimoPago, type EstadoFormulario } from "./acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

/**
 * El atajo de la planilla: un click y el socio queda pagado, repitiendo el
 * monto, el pase y el método de su último pago. Sin volver a tipear nada.
 */
export function BotonPago({
  usuarioId,
  tienePagoAnterior,
  nombre,
}: {
  usuarioId: string;
  tienePagoAnterior: boolean;
  nombre: string;
}) {
  // La acción se pasa directa (no envuelta en un closure) para que Next pueda
  // renderizar el formulario con progressive enhancement: en la PC del
  // mostrador el botón sigue andando aunque el JavaScript no haya cargado.
  const [estado, accion, enviando] = useActionState(
    repetirUltimoPago,
    ESTADO_INICIAL,
  );

  if (!tienePagoAnterior) {
    return (
      <span className="text-xs text-muted-foreground">
        Cargá el primer pago en su ficha
      </span>
    );
  }

  return (
    <form action={accion}>
      <input type="hidden" name="usuario_id" value={usuarioId} />

      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={enviando}
        aria-label={`Registrar que ${nombre} volvió a pagar`}
      >
        {enviando ? "Guardando…" : "Pagó"}
      </Button>

      {estado.error ? (
        <p role="alert" className="mt-1 max-w-52 text-xs text-destructive">
          {estado.error}
        </p>
      ) : null}

      {estado.ok ? (
        <p
          role="status"
          className="mt-1 max-w-52 text-xs text-emerald-700 dark:text-emerald-400"
        >
          {estado.ok}
        </p>
      ) : null}
    </form>
  );
}
