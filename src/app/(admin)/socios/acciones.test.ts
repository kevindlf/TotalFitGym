import { addDays, startOfDay } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { registrarPago, repetirUltimoPago } from "./acciones";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pago: { findFirst: vi.fn(), create: vi.fn() },
    usuario: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirigido a /ingresar");
  }),
}));

const sesion = vi.mocked(auth);
const buscarPago = vi.mocked(prisma.pago.findFirst);
const crearPago = vi.mocked(prisma.pago.create);
const buscarUsuario = vi.mocked(prisma.usuario.findFirst);

const ADMIN = { user: { id: "admin_1", rol: "ADMIN" } };

function formulario(usuarioId: string) {
  const datos = new FormData();
  datos.set("usuario_id", usuarioId);

  return datos;
}

beforeEach(() => {
  vi.clearAllMocks();
  sesion.mockResolvedValue(ADMIN as never);
});

describe("repetirUltimoPago", () => {
  it("copia monto, plan y método del último pago, y pone fecha y admin del servidor", async () => {
    buscarPago.mockResolvedValue({
      monto: "45000",
      tipo_pase: "LIBRE",
      metodo_pago: "MERCADO_PAGO",
    } as never);

    const resultado = await repetirUltimoPago({}, formulario("socio_1"));

    expect(resultado.ok).toMatch(/^Pagado\. Vence el \d{2}\/\d{2}\/\d{4}\.$/);

    const { data } = crearPago.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };

    expect(data.monto).toBe("45000");
    expect(data.tipo_pase).toBe("LIBRE");
    expect(data.metodo_pago).toBe("MERCADO_PAGO");
    expect(data.usuario_id).toBe("socio_1");

    // Regla de Oro 4: el admin sale de la sesión, no del formulario.
    expect(data.registrado_por).toBe("admin_1");

    // El vencimiento lo calcula el servidor: hoy + los días del pase.
    const esperado = startOfDay(addDays(new Date(), 30));
    expect(startOfDay(data.fecha_vencimiento as Date)).toEqual(esperado);
  });

  it("no inventa un pago si el socio nunca pagó", async () => {
    buscarPago.mockResolvedValue(null);

    const resultado = await repetirUltimoPago({}, formulario("socio_nuevo"));

    expect(resultado.error).toContain("no tiene ningún pago anterior");
    expect(crearPago).not.toHaveBeenCalled();
  });

  it("rechaza a quien no es admin antes de tocar la base", async () => {
    sesion.mockResolvedValue({ user: { id: "x", rol: "CLIENTE" } } as never);

    await expect(repetirUltimoPago({}, formulario("socio_1"))).rejects.toThrow(
      "redirigido a /ingresar",
    );

    expect(buscarPago).not.toHaveBeenCalled();
    expect(crearPago).not.toHaveBeenCalled();
  });

  it("rechaza a quien no tiene sesión", async () => {
    sesion.mockResolvedValue(null as never);

    await expect(repetirUltimoPago({}, formulario("socio_1"))).rejects.toThrow(
      "redirigido a /ingresar",
    );

    expect(crearPago).not.toHaveBeenCalled();
  });
});

// El primer pago de un socio recién dado de alta se carga desde la planilla,
// sin pedir fecha: siempre es hoy.
describe("registrarPago sin fecha", () => {
  function formularioDePago() {
    const datos = new FormData();
    datos.set("usuario_id", "socio_nuevo");
    datos.set("monto", "45000");
    datos.set("tipo_pase", "MEDIO");
    datos.set("metodo_pago", "EFECTIVO");

    return datos;
  }

  it("toma la fecha de hoy y calcula el vencimiento en el servidor", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_nuevo" } as never);

    const resultado = await registrarPago({}, formularioDePago());

    expect(resultado.ok).toMatch(/vence el \d{2}\/\d{2}\/\d{4}/);

    const { data } = crearPago.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };

    expect(startOfDay(data.fecha_pago as Date)).toEqual(startOfDay(new Date()));
    expect(startOfDay(data.fecha_vencimiento as Date)).toEqual(
      startOfDay(addDays(new Date(), 30)),
    );
    expect(data.registrado_por).toBe("admin_1");
  });

  it("no acepta un monto en cero ni negativo", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_nuevo" } as never);

    const datos = formularioDePago();
    datos.set("monto", "0");

    const resultado = await registrarPago({}, datos);

    expect(resultado.error).toContain("mayor a cero");
    expect(crearPago).not.toHaveBeenCalled();
  });
});
