import { TZDate } from "@date-fns/tz";
import { describe, expect, it } from "vitest";

import {
  DIAS_PROXIMO_A_VENCER_DEFAULT,
  ZONA_HORARIA,
  calcularEstadoCuota,
} from "./cuota";

/** Un instante concreto expresado en hora argentina. */
function enArgentina(texto: string): Date {
  return new Date(new TZDate(`${texto}`, ZONA_HORARIA).getTime());
}

/** Mediodía del 19/08/2026 en Junín: el "hoy" de referencia de los tests. */
const HOY = enArgentina("2026-08-19T12:00:00");

describe("calcularEstadoCuota", () => {
  it("marca VENCIDO cuando el socio no tiene ningún pago", () => {
    const resultado = calcularEstadoCuota(null, { hoy: HOY });

    expect(resultado.estado).toBe("VENCIDO");
    expect(resultado.accesoPermitido).toBe(false);
    expect(resultado.diasRestantes).toBeNull();
  });

  it("deja pasar el día entero a quien vence hoy", () => {
    // Caso borde de la Regla 2: fecha_vencimiento >= hoy habilita el ingreso.
    const resultado = calcularEstadoCuota(enArgentina("2026-08-19T00:00:00"), {
      hoy: HOY,
    });

    expect(resultado.estado).toBe("PROXIMO_A_VENCER");
    expect(resultado.accesoPermitido).toBe(true);
    expect(resultado.diasRestantes).toBe(0);
  });

  it("marca VENCIDO a partir del día siguiente al vencimiento", () => {
    const resultado = calcularEstadoCuota(enArgentina("2026-08-18T23:59:00"), {
      hoy: HOY,
    });

    expect(resultado.estado).toBe("VENCIDO");
    expect(resultado.accesoPermitido).toBe(false);
    expect(resultado.diasRestantes).toBe(-1);
  });

  it("marca PROXIMO_A_VENCER justo en el límite del umbral", () => {
    const resultado = calcularEstadoCuota(enArgentina("2026-08-26T08:00:00"), {
      hoy: HOY,
    });

    expect(resultado.diasRestantes).toBe(DIAS_PROXIMO_A_VENCER_DEFAULT);
    expect(resultado.estado).toBe("PROXIMO_A_VENCER");
    expect(resultado.accesoPermitido).toBe(true);
  });

  it("marca ACTIVO un día después del umbral", () => {
    const resultado = calcularEstadoCuota(enArgentina("2026-08-27T08:00:00"), {
      hoy: HOY,
    });

    expect(resultado.diasRestantes).toBe(DIAS_PROXIMO_A_VENCER_DEFAULT + 1);
    expect(resultado.estado).toBe("ACTIVO");
    expect(resultado.accesoPermitido).toBe(true);
  });

  it("marca ACTIVO un vencimiento lejano", () => {
    const resultado = calcularEstadoCuota(enArgentina("2026-09-18T10:00:00"), {
      hoy: HOY,
    });

    expect(resultado.estado).toBe("ACTIVO");
    expect(resultado.diasRestantes).toBe(30);
  });

  it("respeta un umbral distinto al default", () => {
    const vencimiento = enArgentina("2026-08-24T10:00:00"); // dentro de 5 días

    expect(calcularEstadoCuota(vencimiento, { hoy: HOY, diasUmbral: 3 }).estado).toBe(
      "ACTIVO",
    );
    expect(
      calcularEstadoCuota(vencimiento, { hoy: HOY, diasUmbral: 10 }).estado,
    ).toBe("PROXIMO_A_VENCER");
  });

  it("compara por día calendario argentino, no por instante UTC", () => {
    // 2026-08-19T02:00:00Z son todavía las 23:00 del 18/08 en Argentina.
    // Comparando timestamps UTC este socio daría VENCIDO; en hora local su
    // pase sigue vigente hasta el final del 19/08.
    const vencimiento = enArgentina("2026-08-19T00:00:00");
    const madrugadaUtc = new Date("2026-08-19T02:00:00.000Z");

    const resultado = calcularEstadoCuota(vencimiento, { hoy: madrugadaUtc });

    expect(resultado.diasRestantes).toBe(1);
    expect(resultado.accesoPermitido).toBe(true);
  });
});
