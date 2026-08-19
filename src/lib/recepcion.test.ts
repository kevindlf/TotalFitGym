import { addDays, subDays } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "./prisma";
import { evaluarIngresoPorDni } from "./recepcion";

vi.mock("./prisma", () => ({
  prisma: {
    usuario: { findUnique: vi.fn() },
    asistencia: { create: vi.fn() },
  },
}));

const buscarUsuario = vi.mocked(prisma.usuario.findUnique);
const crearAsistencia = vi.mocked(prisma.asistencia.create);

type UsuarioDePuerta = {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  rol: "ADMIN" | "CLIENTE";
  estado: "ACTIVO" | "INACTIVO";
  pagos: { fecha_vencimiento: Date }[];
};

function socio(parcial: Partial<UsuarioDePuerta> = {}): UsuarioDePuerta {
  return {
    id: "usr_1",
    dni: "30123456",
    nombre: "Ana",
    apellido: "Pérez",
    rol: "CLIENTE",
    estado: "ACTIVO",
    pagos: [{ fecha_vencimiento: addDays(new Date(), 20) }],
    ...parcial,
  };
}

function devolver(usuario: UsuarioDePuerta | null) {
  buscarUsuario.mockResolvedValue(usuario as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("evaluarIngresoPorDni", () => {
  it("deja pasar al socio con cuota vigente y registra la asistencia", async () => {
    devolver(socio());

    const resultado = await evaluarIngresoPorDni("30123456");

    expect(resultado.estado).toBe("ACTIVO");
    expect(resultado.accesoPermitido).toBe(true);
    expect(resultado.socio?.apellido).toBe("Pérez");
    expect(resultado.asistenciaRegistrada).toBe(true);
    expect(crearAsistencia).toHaveBeenCalledWith({
      data: { usuario_id: "usr_1", metodo_registro: "DNI_MANUAL" },
    });
  });

  it("deja pasar al próximo a vencer y también registra la asistencia", async () => {
    devolver(socio({ pagos: [{ fecha_vencimiento: addDays(new Date(), 3) }] }));

    const resultado = await evaluarIngresoPorDni("30123456");

    expect(resultado.estado).toBe("PROXIMO_A_VENCER");
    expect(resultado.accesoPermitido).toBe(true);
    expect(crearAsistencia).toHaveBeenCalledOnce();
  });

  // Regla de Oro 3: la bitácora es de ingresos. Un rechazo no puede ensuciarla.
  it("NO registra asistencia cuando la cuota está vencida", async () => {
    devolver(socio({ pagos: [{ fecha_vencimiento: subDays(new Date(), 10) }] }));

    const resultado = await evaluarIngresoPorDni("30123456");

    expect(resultado.estado).toBe("VENCIDO");
    expect(resultado.accesoPermitido).toBe(false);
    expect(resultado.motivo).toBe("CUOTA_VENCIDA");
    expect(resultado.asistenciaRegistrada).toBe(false);
    expect(crearAsistencia).not.toHaveBeenCalled();
  });

  it("rechaza al socio sin ningún pago y no registra asistencia", async () => {
    devolver(socio({ pagos: [] }));

    const resultado = await evaluarIngresoPorDni("30123456");

    expect(resultado.estado).toBe("VENCIDO");
    expect(resultado.fechaVencimiento).toBeNull();
    expect(crearAsistencia).not.toHaveBeenCalled();
  });

  it("rechaza un DNI que no está en el sistema sin tocar la bitácora", async () => {
    devolver(null);

    const resultado = await evaluarIngresoPorDni("99999999");

    expect(resultado.motivo).toBe("DNI_NO_REGISTRADO");
    expect(resultado.socio).toBeNull();
    expect(crearAsistencia).not.toHaveBeenCalled();
  });

  it("rechaza el DNI de un admin: la puerta es para socios", async () => {
    devolver(socio({ rol: "ADMIN" }));

    const resultado = await evaluarIngresoPorDni("30123456");

    expect(resultado.motivo).toBe("DNI_NO_REGISTRADO");
    expect(crearAsistencia).not.toHaveBeenCalled();
  });

  it("rechaza al socio dado de baja aunque le quede cuota paga", async () => {
    devolver(socio({ estado: "INACTIVO" }));

    const resultado = await evaluarIngresoPorDni("30123456");

    expect(resultado.accesoPermitido).toBe(false);
    expect(resultado.motivo).toBe("CUENTA_INACTIVA");
    expect(crearAsistencia).not.toHaveBeenCalled();
  });

  it("evalúa el vencimiento más lejano, no el último pago cargado", async () => {
    // La consulta pide orderBy fecha_vencimiento desc + take 1, así que el
    // primer pago que llega ya es el más lejano.
    devolver(socio({ pagos: [{ fecha_vencimiento: addDays(new Date(), 25) }] }));

    await evaluarIngresoPorDni("30123456");

    expect(buscarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          pagos: expect.objectContaining({
            orderBy: { fecha_vencimiento: "desc" },
            take: 1,
          }),
        }),
      }),
    );
  });
});
