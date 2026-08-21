import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  crearClaveDelSocio,
  verificarClaveDelSocio,
  buscarSocioPorDni,
} from "./portal";
import { prisma } from "./prisma";

vi.mock("./prisma", () => ({
  prisma: {
    usuario: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

const buscar = vi.mocked(prisma.usuario.findUnique);
const actualizar = vi.mocked(prisma.usuario.update);

type SocioEnBase = {
  id: string;
  rol: "ADMIN" | "CLIENTE";
  password: string | null;
  telefono: string | null;
};

function devolver(socio: Partial<SocioEnBase> | null) {
  buscar.mockResolvedValue(
    socio === null
      ? null
      : ({
          id: "socio_1",
          rol: "CLIENTE",
          password: null,
          telefono: "+54 9 236 411-2345",
          ...socio,
        } as never),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verificarClaveDelSocio", () => {
  it("acepta la clave correcta", async () => {
    devolver({ password: await hash("miClave123", 4) });

    expect(await verificarClaveDelSocio("30123456", "miClave123")).toEqual({
      id: "socio_1",
    });
  });

  it("rechaza la clave incorrecta", async () => {
    devolver({ password: await hash("miClave123", 4) });

    expect(await verificarClaveDelSocio("30123456", "otraCosa")).toBeNull();
  });

  it("rechaza al socio que todavía no tiene clave", async () => {
    devolver({ password: null });

    expect(await verificarClaveDelSocio("30123456", "loQueSea")).toBeNull();
  });

  it("no deja que un admin entre por la puerta del socio", async () => {
    devolver({ rol: "ADMIN", password: await hash("miClave123", 4) });

    expect(await verificarClaveDelSocio("20000001", "miClave123")).toBeNull();
  });

  it("rechaza un DNI que no existe", async () => {
    devolver(null);

    expect(await verificarClaveDelSocio("99999999", "loQueSea")).toBeNull();
  });
});

describe("crearClaveDelSocio", () => {
  it("crea la clave cuando los 4 dígitos coinciden", async () => {
    devolver({ telefono: "+54 9 236 411-2345" });

    const resultado = await crearClaveDelSocio("30123456", "2345", "claveNueva1");

    expect(resultado).toEqual({ ok: true, id: "socio_1" });

    // Se guarda hasheada, nunca en claro.
    const { data } = actualizar.mock.calls[0]![0] as {
      data: { password: string };
    };
    expect(data.password).not.toBe("claveNueva1");
    expect(data.password).toMatch(/^\$2[aby]\$/);
  });

  it("ignora los símbolos del teléfono al comparar", async () => {
    devolver({ telefono: "(236) 15-411-2345" });

    expect(
      await crearClaveDelSocio("30123456", "2345", "claveNueva1"),
    ).toMatchObject({ ok: true });
  });

  it("rechaza si los 4 dígitos no coinciden", async () => {
    devolver({ telefono: "+54 9 236 411-2345" });

    const resultado = await crearClaveDelSocio("30123456", "9999", "claveNueva1");

    expect(resultado).toMatchObject({ ok: false });
    expect(actualizar).not.toHaveBeenCalled();
  });

  // Sin teléfono no hay segundo dato: cualquiera que sepa el DNI se quedaría
  // con la cuenta ajena.
  it("no deja crear clave si el socio no tiene teléfono cargado", async () => {
    devolver({ telefono: null });

    const resultado = await crearClaveDelSocio("30123456", "2345", "claveNueva1");

    expect(resultado).toMatchObject({ ok: false });
    expect(actualizar).not.toHaveBeenCalled();
  });

  it("no pisa la clave de alguien que ya tiene una", async () => {
    devolver({ password: await hash("laVieja123", 4) });

    const resultado = await crearClaveDelSocio("30123456", "2345", "claveNueva1");

    expect(resultado).toMatchObject({ ok: false });
    expect(actualizar).not.toHaveBeenCalled();
  });

  it("no le crea clave de socio a un admin", async () => {
    devolver({ rol: "ADMIN" });

    const resultado = await crearClaveDelSocio("20000001", "2345", "claveNueva1");

    expect(resultado).toMatchObject({ ok: false });
    expect(actualizar).not.toHaveBeenCalled();
  });
});

describe("buscarSocioPorDni", () => {
  it("informa si el socio ya tiene clave", async () => {
    devolver({ password: await hash("algo", 4) });

    expect(await buscarSocioPorDni("30123456")).toEqual({
      id: "socio_1",
      tieneClave: true,
    });
  });

  it("no devuelve al personal", async () => {
    devolver({ rol: "ADMIN" });

    expect(await buscarSocioPorDni("20000001")).toBeNull();
  });
});
