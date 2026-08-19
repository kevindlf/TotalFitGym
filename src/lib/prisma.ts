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

// En desarrollo el hot reload re-evalúa este módulo en cada cambio. Sin el
// singleton global se abriría un pool de conexiones nuevo cada vez hasta agotar
// la base.
const globalParaPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof crearCliente>;
};

export const prisma = globalParaPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}
