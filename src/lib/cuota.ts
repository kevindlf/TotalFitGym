import { TZDate } from "@date-fns/tz";
import { differenceInCalendarDays } from "date-fns";

/**
 * Estado de cuota de un socio (CLAUDE.md §4, Regla de Oro 2).
 *
 * ÚNICA implementación del cálculo en todo el proyecto: la usan recepción, el
 * dashboard y el portal del cliente. Si hay que cambiar la regla, se cambia acá
 * y en ningún otro lado.
 *
 * El estado es DERIVADO de `fecha_vencimiento` y se calcula al vuelo. Nunca se
 * guarda en la base (eso es justamente lo que se rompió en la planilla, donde
 * la columna "Estado" se escribía a mano y quedaba desactualizada).
 */

/** El gimnasio está en Junín, Buenos Aires. Sin horario de verano. */
export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

/** Días de anticipación con los que se avisa el vencimiento (amarillo). */
export const DIAS_PROXIMO_A_VENCER_DEFAULT = 7;

export type EstadoCuota = "ACTIVO" | "PROXIMO_A_VENCER" | "VENCIDO";

export interface ResultadoCuota {
  estado: EstadoCuota;
  /** Verde y amarillo dejan pasar; solo el rojo deniega el acceso. */
  accesoPermitido: boolean;
  /** Días de calendario hasta el vencimiento. Negativo si ya venció. */
  diasRestantes: number | null;
  fechaVencimiento: Date | null;
}

export interface OpcionesCuota {
  /** Momento contra el que se compara. Inyectable para poder testear. */
  hoy?: Date;
  diasUmbral?: number;
}

export const ETIQUETAS_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  ACTIVO: "Activo",
  PROXIMO_A_VENCER: "Próximo a vencer",
  VENCIDO: "Vencido",
};

function umbralPorDefecto(): number {
  const configurado = Number(process.env.DIAS_PROXIMO_A_VENCER);

  return Number.isInteger(configurado) && configurado >= 0
    ? configurado
    : DIAS_PROXIMO_A_VENCER_DEFAULT;
}

/**
 * Calcula el estado de cuota a partir del vencimiento más lejano que tenga el
 * socio.
 *
 * La comparación es por DÍA DE CALENDARIO en zona argentina, no por instante:
 * un pase que vence hoy habilita el ingreso durante todo el día. Comparar
 * timestamps daría rojo a quien viene a la mañana de su último día.
 *
 * @param fechaVencimiento vencimiento más lejano del socio, o `null` si nunca pagó.
 */
export function calcularEstadoCuota(
  fechaVencimiento: Date | null | undefined,
  opciones: OpcionesCuota = {},
): ResultadoCuota {
  const { hoy = new Date(), diasUmbral = umbralPorDefecto() } = opciones;

  // Sin pagos registrados no hay cobertura: es rojo, igual que un vencido.
  if (!fechaVencimiento) {
    return {
      estado: "VENCIDO",
      accesoPermitido: false,
      diasRestantes: null,
      fechaVencimiento: null,
    };
  }

  const diasRestantes = differenceInCalendarDays(
    new TZDate(fechaVencimiento, ZONA_HORARIA),
    new TZDate(hoy, ZONA_HORARIA),
  );

  const estado: EstadoCuota =
    diasRestantes < 0
      ? "VENCIDO"
      : diasRestantes <= diasUmbral
        ? "PROXIMO_A_VENCER"
        : "ACTIVO";

  return {
    estado,
    accesoPermitido: estado !== "VENCIDO",
    diasRestantes,
    fechaVencimiento,
  };
}
