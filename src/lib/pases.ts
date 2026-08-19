import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

import type { TipoPase } from "@/generated/prisma/enums";

import { ZONA_HORARIA } from "./cuota";

/**
 * Tipos de pase y su vigencia en días.
 *
 * PENDIENTE de confirmar con el gimnasio: en la planilla "medio pase" ≈ $40.000
 * y "pase libre" ≈ $45.000, pero no está registrado a cuántos días vence cada
 * uno. Hasta que lo confirmen, ambos duran 30 días.
 */
export const DIAS_POR_PASE: Record<TipoPase, number> = {
  MEDIO: 30,
  LIBRE: 30,
};

export const ETIQUETAS_TIPO_PASE: Record<TipoPase, string> = {
  MEDIO: "Medio pase",
  LIBRE: "Pase libre",
};

/**
 * Calcula el vencimiento de un pago: fecha de pago + los días del pase.
 *
 * Suma días de calendario en zona argentina, para que un pago hecho un día de
 * cambio de horario no corra el vencimiento.
 */
export function calcularFechaVencimiento(
  fechaPago: Date,
  tipoPase: TipoPase,
): Date {
  const dias = DIAS_POR_PASE[tipoPase];
  const vencimiento = addDays(new TZDate(fechaPago, ZONA_HORARIA), dias);

  return new Date(vencimiento.getTime());
}
