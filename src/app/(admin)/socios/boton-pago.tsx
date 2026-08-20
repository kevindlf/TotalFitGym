"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_POR_PASE, ETIQUETAS_TIPO_PASE } from "@/lib/pases";

import {
  registrarPago,
  repetirUltimoPago,
  type EstadoFormulario,
} from "./acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const METODOS = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "MERCADO_PAGO", texto: "Mercado Pago" },
  { valor: "QR", texto: "QR" },
];

const CLASE_SELECT =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm";

/**
 * Cobrar desde la planilla, sin salir de la pantalla.
 *
 * Dos caminos según el socio:
 *
 * - Si ya pagó alguna vez, "Pagó" repite el último pago en un click. Es el caso
 *   normal, mes a mes, y es lo que reemplaza al "poner OK en la planilla".
 * - Si nunca pagó — recién dado de alta — no hay de dónde copiar, así que
 *   aparece un formulario corto para cargar el primero acá mismo.
 *
 * En los dos casos la fecha es hoy y el vencimiento lo calcula el servidor.
 */
export function BotonPago({
  usuarioId,
  tienePagoAnterior,
  nombre,
  montoSugerido,
  tipoPaseSugerido,
}: {
  usuarioId: string;
  tienePagoAnterior: boolean;
  nombre: string;
  montoSugerido?: number;
  tipoPaseSugerido?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const [estadoRepetir, accionRepetir, repitiendo] = useActionState(
    repetirUltimoPago,
    ESTADO_INICIAL,
  );

  const [estadoNuevo, accionNueva, guardando] = useActionState(
    registrarPago,
    ESTADO_INICIAL,
  );

  if (abierto) {
    return (
      <form action={accionNueva} className="w-56 space-y-2">
        <input type="hidden" name="usuario_id" value={usuarioId} />

        <div className="space-y-1">
          <Label htmlFor={`monto-${usuarioId}`} className="text-xs">
            Monto que pagó {nombre}
          </Label>
          <Input
            id={`monto-${usuarioId}`}
            name="monto"
            type="number"
            min="1"
            step="any"
            required
            autoFocus
            defaultValue={montoSugerido}
            placeholder="45000"
            className="h-9"
          />
        </div>

        <select
          name="tipo_pase"
          required
          defaultValue={tipoPaseSugerido ?? "LIBRE"}
          aria-label="Tipo de pase"
          className={CLASE_SELECT}
        >
          {Object.entries(ETIQUETAS_TIPO_PASE).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto} ({DIAS_POR_PASE[valor as keyof typeof DIAS_POR_PASE]} días)
            </option>
          ))}
        </select>

        <select
          name="metodo_pago"
          required
          defaultValue="EFECTIVO"
          aria-label="Método de pago"
          className={CLASE_SELECT}
        >
          {METODOS.map((metodo) => (
            <option key={metodo.valor} value={metodo.valor}>
              {metodo.texto}
            </option>
          ))}
        </select>

        {estadoNuevo.error ? (
          <p role="alert" className="text-xs text-destructive">
            {estadoNuevo.error}
          </p>
        ) : null}

        {estadoNuevo.ok ? (
          <p
            role="status"
            className="text-xs text-emerald-700 dark:text-emerald-400"
          >
            {estadoNuevo.ok}
          </p>
        ) : null}

        <div className="flex gap-1.5">
          <Button type="submit" size="sm" disabled={guardando}>
            {guardando ? "Guardando…" : "Cobrar"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setAbierto(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {tienePagoAnterior ? (
          <form action={accionRepetir}>
            <input type="hidden" name="usuario_id" value={usuarioId} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={repitiendo}
              aria-label={`Registrar que ${nombre} volvió a pagar lo mismo que la última vez`}
            >
              {repitiendo ? "Guardando…" : "Pagó"}
            </Button>
          </form>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant={tienePagoAnterior ? "ghost" : "outline"}
          onClick={() => setAbierto(true)}
        >
          {tienePagoAnterior ? "Otro monto" : "Cobrar"}
        </Button>
      </div>

      {estadoRepetir.error ? (
        <p role="alert" className="max-w-52 text-xs text-destructive">
          {estadoRepetir.error}
        </p>
      ) : null}

      {estadoRepetir.ok ? (
        <p
          role="status"
          className="max-w-52 text-xs text-emerald-700 dark:text-emerald-400"
        >
          {estadoRepetir.ok}
        </p>
      ) : null}
    </div>
  );
}
