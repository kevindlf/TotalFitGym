"use client";

import { useActionState, useState } from "react";
// Sumamos íconos para darle calidad al formulario compacto
import { 
  Check, 
  DollarSign, 
  Ticket, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_POR_PASE, ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import { cn } from "@/lib/utils";

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
  "flex h-9 w-full rounded-lg border border-border/50 bg-background/50 pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 transition-all";

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
      <form action={accionNueva} className="w-56 space-y-3 rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm backdrop-blur-sm">
        <input type="hidden" name="usuario_id" value={usuarioId} />

        <div className="space-y-1.5">
          <Label htmlFor={`monto-${usuarioId}`} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monto a cobrar
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
              className="h-9 rounded-lg bg-background/50 pl-8 text-xs font-medium tabular-nums border-border/50 focus-visible:ring-1 focus-visible:ring-red-500"
            />
          </div>
        </div>

        <div className="relative">
          <Ticket className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            name="tipo_pase"
            required
            defaultValue={tipoPaseSugerido ?? "LIBRE"}
            aria-label="Tipo de pase"
            className={CLASE_SELECT}
          >
            {Object.entries(ETIQUETAS_TIPO_PASE).map(([valor, texto]) => (
              <option key={valor} value={valor} className="bg-zinc-950 text-white dark:bg-zinc-900 text-sm">
                {texto} ({DIAS_POR_PASE[valor as keyof typeof DIAS_POR_PASE]}d)
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Wallet className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            name="metodo_pago"
            required
            defaultValue="EFECTIVO"
            aria-label="Método de pago"
            className={CLASE_SELECT}
          >
            {METODOS.map((metodo) => (
              <option key={metodo.valor} value={metodo.valor} className="bg-zinc-950 text-white dark:bg-zinc-900 text-sm">
                {metodo.texto}
              </option>
            ))}
          </select>
        </div>

        {estadoNuevo.error ? (
          <div role="alert" className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-red-500 border border-red-500/20">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-tight">{estadoNuevo.error}</p>
          </div>
        ) : null}

        {estadoNuevo.ok ? (
          <div role="status" className="flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-tight">{estadoNuevo.ok}</p>
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button 
            type="submit" 
            size="sm" 
            disabled={guardando}
            className={cn(
              "flex-1 h-8 rounded-lg text-xs transition-colors",
              guardando ? "" : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {guardando ? <Loader2 className="size-3.5 animate-spin" /> : "Cobrar"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setAbierto(false)}
            className="flex-1 h-8 rounded-lg text-xs hover:bg-muted/50"
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {tienePagoAnterior ? (
          <form action={accionRepetir} className="flex-1 min-w-0">
            <input type="hidden" name="usuario_id" value={usuarioId} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={repitiendo}
              aria-label={`Registrar que ${nombre} volvió a pagar lo mismo que la última vez`}
              className="w-full h-9 rounded-xl border-border/50 hover:bg-muted/50 gap-1.5 px-2"
            >
              {repitiendo ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="truncate">Pagó</span>
                </>
              )}
            </Button>
          </form>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant={tienePagoAnterior ? "ghost" : "default"}
          onClick={() => setAbierto(true)}
          className={cn(
            "h-9 rounded-xl px-3 flex-1 min-w-0 truncate transition-colors",
            !tienePagoAnterior && "bg-red-600 hover:bg-red-700 text-white"
          )}
        >
          {tienePagoAnterior ? "Modificar" : "Cobrar nuevo"}
        </Button>
      </div>

      {estadoRepetir.error ? (
        <p role="alert" className="max-w-[200px] text-[11px] font-medium text-red-500 text-center leading-tight">
          {estadoRepetir.error}
        </p>
      ) : null}

      {estadoRepetir.ok ? (
        <p role="status" className="max-w-[200px] text-[11px] font-medium text-emerald-600 dark:text-emerald-500 text-center leading-tight">
          {estadoRepetir.ok}
        </p>
      ) : null}
    </div>
  );
}