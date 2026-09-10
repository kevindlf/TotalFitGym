import { formatearFecha } from "@/lib/formato";
import type { MiembroDelPersonal } from "@/lib/personal";
import { cn } from "@/lib/utils";

import { BotonEstado, CambiarPassword } from "./acciones-miembro";

/**
 * La misma fila de la tabla de personal, apilada para el celular.
 *
 * Siete columnas en un teléfono obligan a scrollear de costado para leer a una
 * sola persona.
 */
export function TarjetaMiembro({
  miembro,
  esUnoMismo,
}: {
  miembro: MiembroDelPersonal;
  esUnoMismo: boolean;
}) {
  const estaActivo = miembro.estado === "ACTIVO";

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors",
        estaActivo
          ? "bg-card/40 border-border/40"
          : "bg-muted/20 border-border/20 opacity-80 grayscale-[0.3]"
      )}
    >
      <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <p className={cn("font-semibold text-lg", estaActivo ? "text-foreground" : "text-muted-foreground")}>
            {miembro.apellido}, {miembro.nombre}
            {esUnoMismo && (
              <span className="ml-2 inline-flex items-center rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500 ring-1 ring-inset ring-red-500/20 align-middle">
                Vos
              </span>
            )}
          </p>
          {!estaActivo && (
             <span className="shrink-0 rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-500/80 ring-1 ring-inset ring-red-500/20">
               Suspendida
             </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground tabular-nums">
          <span>DNI {miembro.dni}</span>
          <span>·</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground ring-1 ring-inset ring-border/50">
            {miembro.sede.nombre}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Alta en sistema</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-foreground">
            {formatearFecha(miembro.fecha_registro)}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pagos cobrados</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-emerald-600 dark:text-emerald-500">
            {miembro.pagosCobrados} {miembro.pagosCobrados === 1 ? 'cobro' : 'cobros'}
          </dd>
        </div>
      </dl>

      <div className="mt-1 flex items-center gap-3 border-t border-border/40 pt-4 [&>*]:flex-1">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
           {/* Envolvemos los componentes para asegurarnos de que tomen el espacio correcto */}
           <div className="flex-1 min-w-[120px]">
             <CambiarPassword usuarioId={miembro.id} nombre={miembro.nombre} />
           </div>
           <div className="flex-1 min-w-[120px]">
             <BotonEstado
               usuarioId={miembro.id}
               estaActivo={estaActivo}
               esUnoMismo={esUnoMismo}
             />
           </div>
        </div>
      </div>
    </li>
  );
}