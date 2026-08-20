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

/**
 * Días de tolerancia DESPUÉS del vencimiento en los que el socio todavía entra,
 * aunque ya le corresponda pagar (naranja).
 *
 * Arranca en 0, o sea: el sistema se comporta exactamente como dice la Regla de
 * Oro 2 original (vencido = rojo, sin excepciones). Poner `DIAS_DE_GRACIA=5`
 * habilita la "ventana de pago" que pidió el gimnasio: pagás el 1° y tenés
 * hasta el 5 para renovar sin quedarte afuera.
 *
 * Esto es una decisión de negocio explícita: el gimnasio regala esos días de
 * acceso. Por eso está apagado por defecto.
 */
export const DIAS_DE_GRACIA_DEFAULT = 0;

export type EstadoCuota =
  | "ACTIVO"
  | "PROXIMO_A_VENCER"
  | "EN_PERIODO_DE_PAGO"
  | "VENCIDO";

export interface ResultadoCuota {
  estado: EstadoCuota;
  /** Verde, amarillo y naranja dejan pasar; solo el rojo deniega el acceso. */
  accesoPermitido: boolean;
  /** Si al socio ya le corresponde pagar (naranja o rojo). */
  debePagar: boolean;
  /** Días de calendario hasta el vencimiento. Negativo si ya venció. */
  diasRestantes: number | null;
  /** Días que le quedan de tolerancia. Solo tiene sentido en naranja. */
  diasDeGraciaRestantes: number | null;
  fechaVencimiento: Date | null;
}

export interface OpcionesCuota {
  /** Momento contra el que se compara. Inyectable para poder testear. */
  hoy?: Date;
  diasUmbral?: number;
  diasGracia?: number;
}

export const ETIQUETAS_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  ACTIVO: "Activo",
  PROXIMO_A_VENCER: "Próximo a vencer",
  EN_PERIODO_DE_PAGO: "En período de pago",
  VENCIDO: "Vencido",
};

/**
 * Los mismos estados, dichos como los decía la planilla: es el vocabulario con
 * el que el gimnasio ya trabaja. Se usan en la vista de tabla.
 */
export const ETIQUETAS_PLANILLA: Record<EstadoCuota, string> = {
  ACTIVO: "Pagado",
  PROXIMO_A_VENCER: "Por vencer",
  EN_PERIODO_DE_PAGO: "Falta pagar",
  VENCIDO: "Falta pagar",
};

function enteroNoNegativo(valor: string | undefined, porDefecto: number) {
  const numero = Number(valor);

  return Number.isInteger(numero) && numero >= 0 ? numero : porDefecto;
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
  const {
    hoy = new Date(),
    diasUmbral = enteroNoNegativo(
      process.env.DIAS_PROXIMO_A_VENCER,
      DIAS_PROXIMO_A_VENCER_DEFAULT,
    ),
    diasGracia = enteroNoNegativo(
      process.env.DIAS_DE_GRACIA,
      DIAS_DE_GRACIA_DEFAULT,
    ),
  } = opciones;

  // Sin pagos registrados no hay cobertura ni tolerancia que valga: es rojo.
  if (!fechaVencimiento) {
    return {
      estado: "VENCIDO",
      accesoPermitido: false,
      debePagar: true,
      diasRestantes: null,
      diasDeGraciaRestantes: null,
      fechaVencimiento: null,
    };
  }

  const diasRestantes = differenceInCalendarDays(
    new TZDate(fechaVencimiento, ZONA_HORARIA),
    new TZDate(hoy, ZONA_HORARIA),
  );

  const estado = clasificar(diasRestantes, diasUmbral, diasGracia);

  return {
    estado,
    accesoPermitido: estado !== "VENCIDO",
    debePagar: estado === "EN_PERIODO_DE_PAGO" || estado === "VENCIDO",
    diasRestantes,
    diasDeGraciaRestantes:
      estado === "EN_PERIODO_DE_PAGO" ? diasGracia + diasRestantes : null,
    fechaVencimiento,
  };
}

function clasificar(
  diasRestantes: number,
  diasUmbral: number,
  diasGracia: number,
): EstadoCuota {
  if (diasRestantes >= 0) {
    return diasRestantes <= diasUmbral ? "PROXIMO_A_VENCER" : "ACTIVO";
  }

  // Ya venció. Solo lo salva la ventana de pago, si está habilitada.
  return diasRestantes >= -diasGracia ? "EN_PERIODO_DE_PAGO" : "VENCIDO";
}

function plural(cantidad: number, singular: string, plural: string) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** "queda 1 día" / "quedan 3 días": el verbo también concuerda. */
function quedan(cantidad: number) {
  return `${cantidad === 1 ? "queda" : "quedan"} ${plural(cantidad, "día", "días")}`;
}

/**
 * Mensaje para el dueño o el recepcionista: directo y accionable.
 */
export function mensajeParaAdmin(cuota: ResultadoCuota, nombre: string): string {
  switch (cuota.estado) {
    case "ACTIVO":
      return `${nombre} está al día.`;

    case "PROXIMO_A_VENCER":
      return cuota.diasRestantes === 0
        ? `${nombre} entra en período de pago mañana.`
        : `${nombre} entra en período de pago en ${plural(cuota.diasRestantes!, "día", "días")}.`;

    case "EN_PERIODO_DE_PAGO":
      return `${nombre} tiene que pagar: le ${quedan(cuota.diasDeGraciaRestantes!)}.`;

    case "VENCIDO":
      return cuota.diasRestantes === null
        ? `${nombre} no tiene ningún pago registrado.`
        : `${nombre} está moroso hace ${plural(Math.abs(cuota.diasRestantes), "día", "días")}.`;
  }
}

/**
 * Mensaje para el socio. Mismo contenido, tono más amable: lo lee alguien que
 * viene a entrenar, no el que cobra.
 */
export function mensajeParaSocio(cuota: ResultadoCuota): string {
  switch (cuota.estado) {
    case "ACTIVO":
      return "Tu cuota está al día. ¡A entrenar!";

    case "PROXIMO_A_VENCER":
      return cuota.diasRestantes === 0
        ? "Tu cuota vence hoy. Podés renovarla en recepción."
        : `Te ${quedan(cuota.diasRestantes!)} de cuota. Podés renovarla en recepción.`;

    case "EN_PERIODO_DE_PAGO":
      return `Se te venció la cuota, pero tenés ${plural(cuota.diasDeGraciaRestantes!, "día", "días")} para renovarla y seguir entrenando.`;

    case "VENCIDO":
      return cuota.diasRestantes === null
        ? "Todavía no tenemos ningún pago tuyo registrado. Acercate a recepción."
        : "Tu cuota está vencida. Acercate a recepción para renovarla.";
  }
}
