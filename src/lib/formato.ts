import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { ZONA_HORARIA } from "./cuota";

/** Formateo compartido, para que las fechas y los montos se vean igual en todo el sistema. */

const PESOS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatearPesos(monto: number): string {
  return PESOS.format(monto);
}

export function formatearFecha(fecha: Date | string): string {
  return format(new TZDate(new Date(fecha), ZONA_HORARIA), "dd/MM/yyyy", {
    locale: es,
  });
}

export function formatearFechaLarga(fecha: Date | string): string {
  return format(
    new TZDate(new Date(fecha), ZONA_HORARIA),
    "d 'de' MMMM 'de' yyyy",
    { locale: es },
  );
}

export function formatearFechaHora(fecha: Date | string): string {
  return format(new TZDate(new Date(fecha), ZONA_HORARIA), "dd/MM/yyyy HH:mm", {
    locale: es,
  });
}

/** Fecha de hoy en formato `yyyy-MM-dd`, para los `<input type="date">`. */
export function hoyParaInput(): string {
  return format(new TZDate(new Date(), ZONA_HORARIA), "yyyy-MM-dd");
}
