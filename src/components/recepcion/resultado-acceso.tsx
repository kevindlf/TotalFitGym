import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";

import type { EstadoCuota } from "@/lib/cuota";
import type { MotivoRechazo, ResultadoIngreso } from "@/lib/recepcion";
import { cn } from "@/lib/utils";

/**
 * Panel de la puerta: verde, amarillo o rojo.
 *
 * El color nunca va solo. Cada estado lleva también un ícono y un texto
 * explícito ("PUEDE PASAR" / "NO PUEDE PASAR"), porque la pantalla se lee de
 * lejos y de reojo, y porque un recepcionista daltónico tiene que poder usarla.
 */

const ESTILOS: Record<
  EstadoCuota,
  { fondo: string; icono: typeof CircleCheck; titulo: string }
> = {
  ACTIVO: {
    fondo: "bg-emerald-600 text-white",
    icono: CircleCheck,
    titulo: "PUEDE PASAR",
  },
  PROXIMO_A_VENCER: {
    fondo: "bg-amber-500 text-amber-950",
    icono: TriangleAlert,
    titulo: "PUEDE PASAR",
  },
  // Ventana de pago: entra, pero ya le corresponde pagar.
  EN_PERIODO_DE_PAGO: {
    fondo: "bg-orange-600 text-white",
    icono: TriangleAlert,
    titulo: "PUEDE PASAR · DEBE PAGAR",
  },
  VENCIDO: {
    fondo: "bg-red-600 text-white",
    icono: CircleX,
    titulo: "NO PUEDE PASAR",
  },
};

const MENSAJES_RECHAZO: Record<MotivoRechazo, string> = {
  DNI_NO_REGISTRADO: "Ese DNI no está registrado como socio.",
  CUENTA_INACTIVA: "La cuenta del socio está dada de baja.",
  CUOTA_VENCIDA: "La cuota está vencida.",
};

function textoVencimiento(resultado: ResultadoIngreso): string {
  if (!resultado.fechaVencimiento) {
    return "Sin pagos registrados";
  }

  const fecha = format(
    new Date(resultado.fechaVencimiento),
    "d 'de' MMMM 'de' yyyy",
    { locale: es },
  );

  const dias = resultado.diasRestantes;

  if (dias === null) {
    return `Vence el ${fecha}`;
  }

  if (dias < 0) {
    const hace = Math.abs(dias);

    return `Venció el ${fecha} (hace ${hace} ${hace === 1 ? "día" : "días"})`;
  }

  if (dias === 0) {
    return `Vence hoy, ${fecha}`;
  }

  return `Vence el ${fecha} (en ${dias} ${dias === 1 ? "día" : "días"})`;
}

export function ResultadoAcceso({
  resultado,
  dniConsultado,
}: {
  resultado: ResultadoIngreso;
  dniConsultado: string;
}) {
  const estilo = ESTILOS[resultado.estado];
  const Icono = estilo.icono;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center",
        estilo.fondo,
      )}
    >
      <Icono className="size-20" aria-hidden />

      <p className="text-4xl font-bold tracking-tight">{estilo.titulo}</p>

      <div className="space-y-1">
        <p className="text-2xl font-semibold">
          {resultado.socio
            ? `${resultado.socio.nombre} ${resultado.socio.apellido}`
            : `DNI ${dniConsultado}`}
        </p>
        <p className="text-lg opacity-90">{textoVencimiento(resultado)}</p>
      </div>

      {resultado.motivo ? (
        <p className="text-lg font-medium">
          {MENSAJES_RECHAZO[resultado.motivo]}
        </p>
      ) : null}

      {resultado.estado === "EN_PERIODO_DE_PAGO" &&
      resultado.diasDeGraciaRestantes !== null ? (
        <p className="text-lg font-medium">
          {resultado.diasDeGraciaRestantes === 0
            ? "Último día para renovar la cuota."
            : `Le ${resultado.diasDeGraciaRestantes === 1 ? "queda 1 día" : `quedan ${resultado.diasDeGraciaRestantes} días`} para renovar la cuota.`}
        </p>
      ) : null}

      {resultado.asistenciaRegistrada ? (
        <p className="text-sm opacity-80">Asistencia registrada</p>
      ) : null}
    </div>
  );
}
