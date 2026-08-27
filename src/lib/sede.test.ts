import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "./auth";
import { prisma } from "./prisma";
import { contextoDelPanel } from "./sede";

// `cache()` de React memoriza por request y acá no hay request: se reemplaza
// por la identidad para poder llamar la función varias veces en un mismo test.
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

vi.mock("./auth", () => ({ auth: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

vi.mock("./prisma", () => ({
  prisma: {
    sede: { findUnique: vi.fn(), findFirst: vi.fn() },
  },
}));

const sesion = vi.mocked(auth);
const galletas = vi.mocked(cookies);
const buscarSede = vi.mocked(prisma.sede.findUnique);
const primeraSedeActiva = vi.mocked(prisma.sede.findFirst);

const PROPIA = { id_sede: "sede_san_martin", nombre: "San Martín" };
const AJENA = { id_sede: "sede_godoy_cruz", nombre: "Godoy Cruz" };

function conCookieDeSede(valor?: string) {
  galletas.mockResolvedValue({
    get: () => (valor ? { name: "totalfit_sede", value: valor } : undefined),
  } as never);
}

function entra(rol: "ADMIN" | "DUENIO" | "CLIENTE", sedeId = PROPIA.id_sede) {
  sesion.mockResolvedValue({
    user: { id: "usr_1", name: "Fernando Profe", rol, sede_id: sedeId },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  conCookieDeSede();
  buscarSede.mockResolvedValue(PROPIA as never);
  primeraSedeActiva.mockResolvedValue(PROPIA as never);
});

describe("quién entra al panel", () => {
  it("deja pasar a un admin", async () => {
    entra("ADMIN");

    const ctx = await contextoDelPanel();

    expect(ctx?.sedeId).toBe(PROPIA.id_sede);
    expect(ctx?.esDuenio).toBe(false);
  });

  it("deja pasar al dueño", async () => {
    entra("DUENIO");

    expect((await contextoDelPanel())?.esDuenio).toBe(true);
  });

  it("no deja pasar a un socio", async () => {
    entra("CLIENTE");

    expect(await contextoDelPanel()).toBeNull();
  });

  it("no deja pasar sin sesión", async () => {
    sesion.mockResolvedValue(null as never);

    expect(await contextoDelPanel()).toBeNull();
  });
});

describe("de dónde sale la sede", () => {
  it("la de un admin sale del JWT, no de la cookie", async () => {
    // El escenario que importa: alguien se falsifica la cookie para ver el
    // padrón de la otra sucursal.
    entra("ADMIN", PROPIA.id_sede);
    conCookieDeSede(AJENA.id_sede);

    const ctx = await contextoDelPanel();

    expect(ctx?.sedeId).toBe(PROPIA.id_sede);
    // La prueba de que la cookie ni se leyó: se consultó la sede del token.
    expect(buscarSede).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_sede: PROPIA.id_sede } }),
    );
  });

  it("la del dueño sí sale de la cookie", async () => {
    entra("DUENIO", PROPIA.id_sede);
    conCookieDeSede(AJENA.id_sede);
    buscarSede.mockResolvedValue(AJENA as never);

    const ctx = await contextoDelPanel();

    expect(ctx?.sedeId).toBe(AJENA.id_sede);
    expect(ctx?.sedeNombre).toBe("Godoy Cruz");
  });

  it("el dueño sin cookie arranca en la primera sede activa", async () => {
    entra("DUENIO");

    expect((await contextoDelPanel())?.sedeId).toBe(PROPIA.id_sede);
    expect(primeraSedeActiva).toHaveBeenCalled();
  });

  it("una cookie que apunta a una sede borrada no deja al dueño afuera", async () => {
    entra("DUENIO");
    conCookieDeSede("sede_que_ya_no_existe");
    buscarSede.mockResolvedValue(null as never);

    const ctx = await contextoDelPanel();

    expect(ctx?.sedeId).toBe(PROPIA.id_sede);
  });
});
