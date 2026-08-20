import { ETIQUETAS_ESTADO_CUOTA, type EstadoCuota } from "@/lib/cuota";
import { cn } from "@/lib/utils";

/**
 * Mismos colores que la pantalla de recepción, para que el dueño y el
 * recepcionista hablen el mismo idioma. El texto va siempre: el color solo no
 * alcanza.
 */
const COLORES: Record<EstadoCuota, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  PROXIMO_A_VENCER: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  EN_PERIODO_DE_PAGO: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  VENCIDO: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function EstadoCuotaBadge({
  estado,
  className,
}: {
  estado: EstadoCuota;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        COLORES[estado],
        className,
      )}
    >
      {ETIQUETAS_ESTADO_CUOTA[estado]}
    </span>
  );
}
