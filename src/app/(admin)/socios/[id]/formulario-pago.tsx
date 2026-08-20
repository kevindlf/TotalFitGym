"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_POR_PASE, ETIQUETAS_TIPO_PASE } from "@/lib/pases";

import { registrarPago, type EstadoFormulario } from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const METODOS = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "MERCADO_PAGO", texto: "Mercado Pago" },
  { valor: "QR", texto: "QR" },
];

const CLASE_SELECT =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm";

export function FormularioPago({
  usuarioId,
  hoy,
}: {
  usuarioId: string;
  hoy: string;
}) {
  const [estado, accion, enviando] = useActionState(
    registrarPago,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="usuario_id" value={usuarioId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monto">Monto *</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            min="1"
            step="any"
            required
            placeholder="45000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_pago">Fecha de pago *</Label>
          <Input
            id="fecha_pago"
            name="fecha_pago"
            type="date"
            defaultValue={hoy}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo_pase">Tipo de pase *</Label>
          <select
            id="tipo_pase"
            name="tipo_pase"
            required
            defaultValue="LIBRE"
            className={CLASE_SELECT}
          >
            {Object.entries(ETIQUETAS_TIPO_PASE).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto} ({DIAS_POR_PASE[valor as keyof typeof DIAS_POR_PASE]}{" "}
                días)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="metodo_pago">Método *</Label>
          <select
            id="metodo_pago"
            name="metodo_pago"
            required
            defaultValue="EFECTIVO"
            className={CLASE_SELECT}
          >
            {METODOS.map((metodo) => (
              <option key={metodo.valor} value={metodo.valor}>
                {metodo.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        El vencimiento lo calcula el sistema con la fecha de pago y el tipo de
        pase. El pago queda a tu nombre automáticamente.
      </p>

      {estado.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.error}
        </p>
      ) : null}

      {estado.ok ? (
        <p
          role="status"
          className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {estado.ok}
        </p>
      ) : null}

      <Button type="submit" disabled={enviando}>
        {enviando ? "Registrando…" : "Registrar pago"}
      </Button>
    </form>
  );
}
