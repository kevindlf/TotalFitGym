import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 exige un driver adapter para Postgres; el cliente ya no abre la
// conexión por su cuenta.
function crearCliente() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copiá .env.example a .env.local y completá la conexión a Postgres.",
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

type ClientePrisma = ReturnType<typeof crearCliente>;

// En desarrollo el hot reload re-evalúa este módulo en cada cambio. Sin el
// singleton global se abriría un pool de conexiones nuevo cada vez, hasta
// agotar la base.
const cacheGlobal = globalThis as unknown as { prismaTotalFit?: ClientePrisma };

function obtenerCliente(): ClientePrisma {
  cacheGlobal.prismaTotalFit ??= crearCliente();

  return cacheGlobal.prismaTotalFit;
}

/**
 * Cliente perezoso: recién se construye en el primer uso real.
 *
 * Si se construyera al importar el módulo, `next build` explotaría al recolectar
 * las rutas, porque en build no hay DATABASE_URL (ni hace falta que la haya).
 */
export const prisma = new Proxy({} as ClientePrisma, {
  get(_destino, propiedad) {
    const cliente = obtenerCliente();
    const valor = Reflect.get(cliente, propiedad, cliente);

    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});
