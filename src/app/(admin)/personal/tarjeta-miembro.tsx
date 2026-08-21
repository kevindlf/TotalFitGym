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
    <li className={cn("space-y-3 rounded-lg border p-4", !estaActivo && "opacity-60")}>
      <div>
        <p className="font-medium">
          {miembro.apellido}, {miembro.nombre}
          {!estaActivo ? (
            <span className="ml-2 text-xs text-muted-foreground">
              (dado de baja)
            </span>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          DNI {miembro.dni} · {miembro.sede.nombre}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Desde</dt>
          <dd className="tabular-nums">
            {formatearFecha(miembro.fecha_registro)}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">Cobros</dt>
          <dd className="tabular-nums">{miembro.pagosCobrados}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-start gap-2">
        <CambiarPassword usuarioId={miembro.id} nombre={miembro.nombre} />
        <BotonEstado
          usuarioId={miembro.id}
          estaActivo={estaActivo}
          esUnoMismo={esUnoMismo}
        />
      </div>
    </li>
  );
}
