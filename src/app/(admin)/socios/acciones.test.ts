import { addDays, startOfDay } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { guardarRutina } from "@/lib/rutinas";
import { exigirPanel } from "@/lib/sede";

import {
  crearSocio,
  editarSocio,
  registrarPago,
  repetirUltimoPago,
  subirRutina,
  trasladarSocio,
} from "./acciones";

vi.mock("@/lib/sede", () => ({ exigirPanel: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pago: { findFirst: vi.fn(), create: vi.fn() },
    usuario: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rutinas", () => ({
  guardarRutina: vi.fn(),
  borrarRutina: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirigido a /ingresar");
  }),
}));

const contexto = vi.mocked(exigirPanel);
const buscarPago = vi.mocked(prisma.pago.findFirst);
const crearPago = vi.mocked(prisma.pago.create);
const buscarUsuario = vi.mocked(prisma.usuario.findFirst);
const buscarPorDni = vi.mocked(prisma.usuario.findUnique);
const actualizarUsuario = vi.mocked(prisma.usuario.update);
const crearUsuario = vi.mocked(prisma.usuario.create);
const subirArchivo = vi.mocked(guardarRutina);

const SEDE = "sede_san_martin";
const OTRA_SEDE = "sede_godoy_cruz";

const ADMIN = {
  usuarioId: "admin_1",
  usuarioNombre: "Fernando Profe",
  rol: "ADMIN" as const,
  esDuenio: false,
  sedeId: SEDE,
  sedeNombre: "San Martín",
};

function formulario(usuarioId: string) {
  const datos = new FormData();
  datos.set("usuario_id", usuarioId);

  return datos;
}

beforeEach(() => {
  vi.clearAllMocks();
  contexto.mockResolvedValue(ADMIN);
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
    // `exigirPanel` corta con un redirect a quien no es personal; acá se
    // simula como un throw para poder assertear que la acción no siguió.
    contexto.mockRejectedValue(new Error("redirigido a /ingresar"));

    await expect(repetirUltimoPago({}, formulario("socio_1"))).rejects.toThrow(
      "redirigido a /ingresar",
    );

    expect(buscarPago).not.toHaveBeenCalled();
    expect(crearPago).not.toHaveBeenCalled();
  });

  it("rechaza a quien no tiene sesión", async () => {
    contexto.mockRejectedValue(new Error("redirigido a /ingresar"));

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

// Corregir el DNI es el caso que destraba la importación de la planilla: los
// socios entran con un DNI provisorio y se arregla cuando la persona aparece.
describe("editarSocio", () => {
  function formularioDeEdicion(cambios: Record<string, string> = {}) {
    const datos = new FormData();
    datos.set("usuario_id", "socio_1");
    datos.set("dni", "30123456");
    datos.set("nombre", "Ana");
    datos.set("apellido", "Gómez");
    datos.set("sede_id", "sede_1");

    for (const [campo, valor] of Object.entries(cambios)) {
      datos.set(campo, valor);
    }

    return datos;
  }

  it("guarda los datos nuevos y vuelve a la ficha", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1", dni: "30123456" } as never);

    await expect(
      editarSocio({}, formularioDeEdicion({ telefono: "2364112345" })),
    ).rejects.toThrow("redirigido");

    const { data } = actualizarUsuario.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };

    expect(data.telefono).toBe("2364112345");
    expect(data.nombre).toBe("Ana");
  });

  it("deja cambiar el DNI si nadie más lo tiene", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1", dni: "900000001" } as never);
    buscarPorDni.mockResolvedValue(null);

    await expect(
      editarSocio({}, formularioDeEdicion({ dni: "30123456" })),
    ).rejects.toThrow("redirigido");

    const { data } = actualizarUsuario.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };

    expect(data.dni).toBe("30123456");
  });

  // Regla de Oro 1: el DNI no se puede duplicar ni corrigiendo.
  it("rechaza un DNI que ya tiene otra persona", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1", dni: "900000001" } as never);
    buscarPorDni.mockResolvedValue({
      nombre: "Bruno",
      apellido: "Álvarez",
    } as never);

    const resultado = await editarSocio({}, formularioDeEdicion({ dni: "30123456" }));

    expect(resultado.error).toContain("Álvarez");
    expect(actualizarUsuario).not.toHaveBeenCalled();
  });

  it("no consulta duplicados si el DNI no cambió", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1", dni: "30123456" } as never);

    await expect(editarSocio({}, formularioDeEdicion())).rejects.toThrow(
      "redirigido",
    );

    expect(buscarPorDni).not.toHaveBeenCalled();
  });

  it("rechaza a quien no es admin antes de tocar la base", async () => {
    // `exigirPanel` corta con un redirect a quien no es personal; acá se
    // simula como un throw para poder assertear que la acción no siguió.
    contexto.mockRejectedValue(new Error("redirigido a /ingresar"));

    await expect(editarSocio({}, formularioDeEdicion())).rejects.toThrow(
      "redirigido a /ingresar",
    );

    expect(actualizarUsuario).not.toHaveBeenCalled();
  });
});

describe("subirRutina", () => {
  function formularioDeRutina(extras?: Record<string, string>) {
    const datos = new FormData();
    datos.set("usuario_id", "socio_1");
    datos.set(
      "archivo",
      new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "rutina.pdf", {
        type: "application/pdf",
      }),
    );

    for (const [clave, valor] of Object.entries(extras ?? {})) {
      datos.set(clave, valor);
    }

    return datos;
  }

  it("guarda como autor al admin de la sesión, ignorando lo que venga en el formulario", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1", nombre: "Ana" } as never);
    subirArchivo.mockResolvedValue({ ok: true, nombre: "rutina.pdf" });

    // Un cliente malicioso manda otro admin en el form. No tiene que importar.
    await subirRutina({}, formularioDeRutina({ subida_por: "admin_falso" }));

    expect(subirArchivo).toHaveBeenCalledTimes(1);
    expect(subirArchivo.mock.calls[0]![0]).toMatchObject({
      usuarioId: "socio_1",
      adminId: "admin_1",
    });
  });

  it("rechaza a quien no es admin antes de tocar nada", async () => {
    // `exigirPanel` corta con un redirect a quien no es personal; acá se
    // simula como un throw para poder assertear que la acción no siguió.
    contexto.mockRejectedValue(new Error("redirigido a /ingresar"));

    await expect(subirRutina({}, formularioDeRutina())).rejects.toThrow(
      "redirigido a /ingresar",
    );

    expect(subirArchivo).not.toHaveBeenCalled();
  });

  it("no sube nada si el socio no existe", async () => {
    buscarUsuario.mockResolvedValue(null as never);

    const resultado = await subirRutina({}, formularioDeRutina());

    expect(resultado).toEqual({ error: "Ese socio no existe." });
    expect(subirArchivo).not.toHaveBeenCalled();
  });

  it("pide un archivo si no vino ninguno", async () => {
    const datos = new FormData();
    datos.set("usuario_id", "socio_1");

    expect(await subirRutina({}, datos)).toEqual({ error: "Elegí un archivo." });
    expect(subirArchivo).not.toHaveBeenCalled();
  });

  it("devuelve el error de validación sin explotar", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1", nombre: "Ana" } as never);
    subirArchivo.mockResolvedValue({
      ok: false,
      error: "Solo se aceptan PDF, JPG, PNG o WEBP.",
    });

    expect(await subirRutina({}, formularioDeRutina())).toEqual({
      error: "Solo se aceptan PDF, JPG, PNG o WEBP.",
    });
  });
});

describe("aislamiento por sede", () => {
  function formularioDeAlta(extras?: Record<string, string>) {
    const datos = new FormData();
    datos.set("dni", "30123456");
    datos.set("nombre", "Ana");
    datos.set("apellido", "Gómez");

    for (const [clave, valor] of Object.entries(extras ?? {})) {
      datos.set(clave, valor);
    }

    return datos;
  }

  it("crearSocio ignora la sede que venga en el formulario y usa la de la sesión", async () => {
    buscarPorDni.mockResolvedValue(null as never);
    crearUsuario.mockResolvedValue({ id: "socio_nuevo" } as never);

    // Un profe que edita el HTML e intenta dar de alta en la otra sucursal.
    await crearSocio({}, formularioDeAlta({ sede_id: OTRA_SEDE })).catch(
      () => {},
    );

    expect(crearUsuario.mock.calls[0]![0]!.data).toMatchObject({
      sede_id: SEDE,
    });
  });

  it("registrarPago no encuentra al socio de otra sede y no cobra nada", async () => {
    // La query lleva `sede_id` en el where, así que la base no devuelve nada.
    buscarUsuario.mockResolvedValue(null as never);

    const datos = formulario("socio_de_otra_sede");
    datos.set("monto", "45000");
    datos.set("tipo_pase", "LIBRE");
    datos.set("metodo_pago", "EFECTIVO");

    const resultado = await registrarPago({}, datos);

    expect(resultado).toEqual({ error: "Ese socio no existe." });
    expect(crearPago).not.toHaveBeenCalled();

    // Lo que hace que no lo encuentre: la sede va en el `where`.
    expect(buscarUsuario.mock.calls[0]![0]!.where).toMatchObject({
      sede_id: SEDE,
    });
  });

  it("el pago queda sellado con la sede donde se cobró", async () => {
    buscarUsuario.mockResolvedValue({ id: "socio_1" } as never);

    const datos = formulario("socio_1");
    datos.set("monto", "45000");
    datos.set("tipo_pase", "LIBRE");
    datos.set("metodo_pago", "EFECTIVO");

    await registrarPago({}, datos);

    expect(crearPago.mock.calls[0]![0].data).toMatchObject({
      sede_id: SEDE,
      registrado_por: "admin_1",
    });
  });

  it("un DNI de otra sede ofrece traslado en vez de un error seco", async () => {
    buscarPorDni.mockResolvedValue({
      id: "socio_de_alla",
      nombre: "Elena",
      apellido: "Ruiz",
      rol: "CLIENTE",
      sede_id: OTRA_SEDE,
      sede: { nombre: "Godoy Cruz" },
    } as never);

    const resultado = await crearSocio({}, formularioDeAlta());

    expect(resultado.error).toBeUndefined();
    expect(resultado.traslado).toMatchObject({
      usuarioId: "socio_de_alla",
      apellido: "Ruiz",
      sedeNombre: "Godoy Cruz",
    });
    expect(crearUsuario).not.toHaveBeenCalled();
  });

  it("un DNI del personal no ofrece traslado", async () => {
    buscarPorDni.mockResolvedValue({
      id: "profe_1",
      nombre: "Fernando",
      apellido: "Profe",
      rol: "ADMIN",
      sede_id: OTRA_SEDE,
      sede: { nombre: "Godoy Cruz" },
    } as never);

    const resultado = await crearSocio({}, formularioDeAlta());

    expect(resultado.traslado).toBeUndefined();
    expect(resultado.error).toContain("personal");
  });

  it("trasladarSocio lo trae a la sede propia", async () => {
    buscarUsuario.mockResolvedValue({
      id: "socio_de_alla",
      nombre: "Elena",
      apellido: "Ruiz",
      sede_id: OTRA_SEDE,
    } as never);

    await trasladarSocio({}, formulario("socio_de_alla")).catch(() => {});

    expect(actualizarUsuario.mock.calls[0]![0].data).toEqual({
      sede_id: SEDE,
    });
  });

  it("trasladar a alguien que ya es de la sede no hace nada", async () => {
    buscarUsuario.mockResolvedValue({
      id: "socio_1",
      nombre: "Ana",
      apellido: "Gómez",
      sede_id: SEDE,
    } as never);

    const resultado = await trasladarSocio({}, formulario("socio_1"));

    expect(resultado.error).toContain("ya es socio de esta sede");
    expect(actualizarUsuario).not.toHaveBeenCalled();
  });

  it("editarSocio ya no puede mover a nadie de sucursal", async () => {
    buscarUsuario.mockResolvedValue({
      id: "socio_1",
      dni: "30123456",
    } as never);

    const datos = formulario("socio_1");
    datos.set("dni", "30123456");
    datos.set("nombre", "Ana");
    datos.set("apellido", "Gómez");
    datos.set("sede_id", OTRA_SEDE);

    await editarSocio({}, datos).catch(() => {});

    // El `data` del update no incluye sede: cambiar de sucursal es un traslado,
    // no una corrección de datos.
    expect(actualizarUsuario.mock.calls[0]![0].data).not.toHaveProperty(
      "sede_id",
    );
  });
});
