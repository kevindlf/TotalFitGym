import Link from "next/link";

import { ETIQUETAS_PLANILLA, type EstadoCuota } from "@/lib/cuota";
import { formatearFecha, formatearPesos } from "@/lib/formato";
import { ETIQUETAS_TIPO_PASE } from "@/lib/pases";
import type { SocioConCuota } from "@/lib/socios";
import { cn } from "@/lib/utils";

import { BotonPago } from "./boton-pago";


/**
 * La misma fila de la planilla, pero apilada para el celular.
 *
 * En un teléfono una tabla de ocho columnas obliga a scrollear de costado para
 * leer un solo socio. Acá cada socio es una tarjeta: se ve entero de un vistazo
 * y el botón de cobrar queda al alcance del pulgar.
 */

// Usamos fondos translúcidos sutiles en lugar del borde lateral grueso
const FONDO_TARJETA: Record<EstadoCuota, string> = {
  ACTIVO: "bg-card/40 border-border/40",
  PROXIMO_A_VENCER: "bg-amber-50/50 dark:bg-amber-500/5 border-amber-500/20",
  EN_PERIODO_DE_PAGO: "bg-orange-50/50 dark:bg-orange-500/5 border-orange-500/20",
  VENCIDO: "bg-red-50/50 dark:bg-red-500/5 border-red-500/20",
};

// Insignias estilo cristal/premium (iguales a la tabla desktop)
const CHIP: Record<EstadoCuota, string> = {
  ACTIVO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 ring-emerald-500/20",
  PROXIMO_A_VENCER: "bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-amber-500/20",
  EN_PERIODO_DE_PAGO: "bg-orange-500/10 text-orange-600 dark:text-orange-500 ring-orange-500/20",
  VENCIDO: "bg-red-500/10 text-red-600 dark:text-red-500 ring-red-500/20",
};

export function TarjetaSocio({ socio }: { socio: SocioConCuota }) {
  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors",
        FONDO_TARJETA[socio.cuota.estado],
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <Link
            href={`/socios/${socio.id}`}
            className="font-semibold text-foreground hover:text-red-500 transition-colors text-lg"
          >
            {socio.apellido}, {socio.nombre}
          </Link>
          <p className="mt-0.5 text-sm font-medium text-muted-foreground tabular-nums">
            DNI {socio.dni}
            {socio.estado === "INACTIVO" ? (
              <span className="ml-2 rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-500/80">
                Baja
              </span>
            ) : null}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ring-1 ring-inset",
            CHIP[socio.cuota.estado],
          )}
        >
          {socio.ultimoPago === null
            ? "Sin pagos"
            : ETIQUETAS_PLANILLA[socio.cuota.estado]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Plan</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {socio.ultimoPago
              ? ETIQUETAS_TIPO_PASE[socio.ultimoPago.tipo_pase]
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vence</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-foreground">
            {socio.cuota.fechaVencimiento
              ? formatearFecha(socio.cuota.fechaVencimiento)
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Último pago</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-foreground">
            {socio.ultimoPago ? (
              <div className="flex flex-col">
                <span className="font-semibold">{formatearPesos(socio.ultimoPago.monto)}</span>
                <span className="text-xs text-muted-foreground">{formatearFecha(socio.ultimoPago.fecha_pago)}</span>
              </div>
            ) : (
              "—"
            )}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Facturado</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-foreground">
            <div className="flex flex-col">
              <span className="font-semibold text-emerald-600 dark:text-emerald-500">
                {formatearPesos(socio.totalFacturado)}
              </span>
              <span className="text-xs text-muted-foreground">
                {socio.cantidadDePagos} {socio.cantidadDePagos === 1 ? 'pago' : 'pagos'}
              </span>
            </div>
          </dd>
        </div>
      </dl>

      <BotonPago
        usuarioId={socio.id}
        tienePagoAnterior={socio.ultimoPago !== null}
        nombre={socio.nombre}
        montoSugerido={socio.ultimoPago?.monto}
        tipoPaseSugerido={socio.ultimoPago?.tipo_pase}
      />
    </li>
  );
}