"use client";

import { useActionState } from "react";
import { 
  DollarSign, 
  CalendarIcon, 
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

import { registrarPago, type EstadoFormulario } from "../acciones";

const ESTADO_INICIAL: EstadoFormulario = {};

const METODOS = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "MERCADO_PAGO", texto: "Mercado Pago" },
  { valor: "QR", texto: "QR" },
];

const CLASE_SELECT =
  "flex h-11 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 transition-all";

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
    <form action={accion} className="flex flex-col gap-5">
      <input type="hidden" name="usuario_id" value={usuarioId} />

      <div className="grid gap-5 sm:grid-cols-2">
        {/* CAMPO: MONTO */}
        <div className="space-y-1.5">
          <Label htmlFor="monto" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Monto *
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="monto"
              name="monto"
              type="number"
              min="1"
              step="any"
              required
              placeholder="45000"
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
            />
          </div>
        </div>

        {/* CAMPO: FECHA */}
        <div className="space-y-1.5">
          <Label htmlFor="fecha_pago" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Fecha de pago *
          </Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
            <Input
              id="fecha_pago"
              name="fecha_pago"
              type="date"
              defaultValue={hoy}
              required
              className="h-11 rounded-xl bg-background/50 pl-10 border-border/50 focus-visible:ring-red-500 font-medium tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* CAMPO: TIPO DE PASE */}
        <div className="space-y-1.5">
          <Label htmlFor="tipo_pase" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Tipo de pase *
          </Label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              id="tipo_pase"
              name="tipo_pase"
              required
              defaultValue="LIBRE"
              className={CLASE_SELECT}
            >
              {Object.entries(ETIQUETAS_TIPO_PASE).map(([valor, texto]) => (
                <option key={valor} value={valor} className="bg-zinc-950 text-white dark:bg-zinc-900">
                  {texto} ({DIAS_POR_PASE[valor as keyof typeof DIAS_POR_PASE]} días)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CAMPO: MÉTODO DE PAGO */}
        <div className="space-y-1.5">
          <Label htmlFor="metodo_pago" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Método de pago *
          </Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              id="metodo_pago"
              name="metodo_pago"
              required
              defaultValue="EFECTIVO"
              className={CLASE_SELECT}
            >
              {METODOS.map((metodo) => (
                <option key={metodo.valor} value={metodo.valor} className="bg-zinc-950 text-white dark:bg-zinc-900">
                  {metodo.texto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs font-medium text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/30 leading-relaxed">
        El vencimiento lo calcula el sistema automáticamente según el tipo de pase. El pago quedará registrado a tu nombre.
      </p>

      {/* MENSAJES DE ESTADO */}
      {estado.error ? (
        <div 
          role="alert" 
          className="flex items-start gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 border border-red-500/20"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p className="font-medium">{estado.error}</p>
        </div>
      ) : null}

      {estado.ok ? (
        <div 
          role="status" 
          className="flex items-start gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 border border-emerald-500/20"
        >
          <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          <p className="font-medium">{estado.ok}</p>
        </div>
      ) : null}

      <Button 
        type="submit" 
        disabled={enviando}
        className={cn(
          "w-full h-12 rounded-xl text-base font-semibold transition-all mt-2",
          enviando 
            ? "bg-muted text-muted-foreground" 
            : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
        )}
      >
        {enviando ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            Registrando pago...
          </>
        ) : (
          "Confirmar y registrar pago"
        )}
      </Button>
    </form>
  );
}