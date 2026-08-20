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

const BORDE: Record<EstadoCuota, string> = {
  ACTIVO: "border-l-emerald-600",
  PROXIMO_A_VENCER: "border-l-amber-500",
  EN_PERIODO_DE_PAGO: "border-l-orange-600",
  VENCIDO: "border-l-red-600",
};

const CHIP: Record<EstadoCuota, string> = {
  ACTIVO: "bg-emerald-600 text-white",
  PROXIMO_A_VENCER: "bg-amber-500 text-amber-950",
  EN_PERIODO_DE_PAGO: "bg-orange-600 text-white",
  VENCIDO: "bg-red-600 text-white",
};

export function TarjetaSocio({ socio }: { socio: SocioConCuota }) {
  return (
    <li
      className={cn(
        "space-y-3 rounded-lg border border-l-4 p-4",
        BORDE[socio.cuota.estado],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/socios/${socio.id}`}
            className="font-medium hover:underline"
          >
            {socio.apellido}, {socio.nombre}
          </Link>
          <p className="text-sm text-muted-foreground tabular-nums">
            DNI {socio.dni}
            {socio.estado === "INACTIVO" ? " · dado de baja" : null}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
            CHIP[socio.cuota.estado],
          )}
        >
          {socio.ultimoPago === null
            ? "Sin pagos"
            : ETIQUETAS_PLANILLA[socio.cuota.estado]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Plan</dt>
          <dd>
            {socio.ultimoPago
              ? ETIQUETAS_TIPO_PASE[socio.ultimoPago.tipo_pase]
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Vence</dt>
          <dd className="tabular-nums">
            {socio.cuota.fechaVencimiento
              ? formatearFecha(socio.cuota.fechaVencimiento)
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Último pago</dt>
          <dd className="tabular-nums">
            {socio.ultimoPago
              ? `${formatearPesos(socio.ultimoPago.monto)} · ${formatearFecha(socio.ultimoPago.fecha_pago)}`
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Facturado</dt>
          <dd className="tabular-nums">
            {formatearPesos(socio.totalFacturado)}
            <span className="ml-1 text-xs text-muted-foreground">
              ({socio.cantidadDePagos})
            </span>
          </dd>
        </div>
      </dl>

      <BotonPago
        usuarioId={socio.id}
        tienePagoAnterior={socio.ultimoPago !== null}
        nombre={socio.nombre}
      />
    </li>
  );
}
