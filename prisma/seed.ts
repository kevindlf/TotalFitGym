import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { addDays } from "date-fns";
import { config as cargarEnv } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

cargarEnv({ path: ".env.local", quiet: true });

const RONDAS_BCRYPT = 12;

function requerido(nombre: string): string {
  const valor = process.env[nombre];

  if (!valor) {
    throw new Error(
      `Falta la variable ${nombre}. Completala en .env.local antes de correr el seed.`,
    );
  }

  return valor;
}

async function main() {
  const connectionString = requerido("DATABASE_URL");
  const dni = requerido("SEED_ADMIN_DNI");
  const password = requerido("SEED_ADMIN_PASSWORD");

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD tiene que tener al menos 8 caracteres.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const nombreSede = process.env.SEED_SEDE_NOMBRE ?? "Junín";

    // No hay clave natural para Sede, así que se busca por nombre para que el
    // seed se pueda correr dos veces sin duplicarla.
    const sedeExistente = await prisma.sede.findFirst({
      where: { nombre: nombreSede },
    });

    const sede =
      sedeExistente ??
      (await prisma.sede.create({ data: { nombre: nombreSede } }));

    const passwordHasheada = await hash(password, RONDAS_BCRYPT);

    // Idempotente por DNI, que es la clave de negocio (Regla de Oro 1).
    const admin = await prisma.usuario.upsert({
      where: { dni },
      update: {
        password: passwordHasheada,
        rol: "ADMIN",
        estado: "ACTIVO",
      },
      create: {
        dni,
        nombre: process.env.SEED_ADMIN_NOMBRE ?? "Admin",
        apellido: process.env.SEED_ADMIN_APELLIDO ?? "Total Fit",
        password: passwordHasheada,
        rol: "ADMIN",
        estado: "ACTIVO",
        sede_id: sede.id_sede,
      },
    });

    console.log(`Sede lista: ${sede.nombre} (${sede.id_sede})`);
    console.log(`Admin listo: DNI ${admin.dni}`);

    if (process.env.SEED_DATOS_DEMO === "true") {
      await sembrarSociosDemo(prisma, sede.id_sede, admin.id);
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Tres socios de prueba, uno por cada color de la pantalla de recepción.
 * Solo se cargan con SEED_DATOS_DEMO=true; nunca en producción.
 */
async function sembrarSociosDemo(
  prisma: PrismaClient,
  sedeId: string,
  adminId: string,
) {
  const hoy = new Date();

  // Nombres comunes a propósito: si el apellido dijera el color del estado, la
  // planilla parecería estar escribiendo el color en la columna del nombre.
  const socios = [
    { dni: "10000001", nombre: "Ana", apellido: "Gómez", diasHastaVencer: 20 },
    {
      dni: "10000002",
      nombre: "Bruno",
      apellido: "Álvarez",
      diasHastaVencer: 3,
    },
    {
      dni: "10000003",
      nombre: "Carla",
      apellido: "Ibáñez",
      diasHastaVencer: -10,
    },
  ];

  for (const socio of socios) {
    const usuario = await prisma.usuario.upsert({
      where: { dni: socio.dni },
      update: {},
      create: {
        dni: socio.dni,
        nombre: socio.nombre,
        apellido: socio.apellido,
        rol: "CLIENTE",
        estado: "ACTIVO",
        sede_id: sedeId,
      },
    });

    const yaTienePago = await prisma.pago.findFirst({
      where: { usuario_id: usuario.id },
    });

    if (yaTienePago) {
      continue;
    }

    const fechaVencimiento = addDays(hoy, socio.diasHastaVencer);

    await prisma.pago.create({
      data: {
        usuario_id: usuario.id,
        monto: "45000",
        fecha_pago: addDays(fechaVencimiento, -30),
        fecha_vencimiento: fechaVencimiento,
        metodo_pago: "EFECTIVO",
        tipo_pase: "LIBRE",
        registrado_por: adminId,
      },
    });
  }

  // Un cuarto socio sin ningún pago: también tiene que dar rojo.
  await prisma.usuario.upsert({
    where: { dni: "10000004" },
    update: {},
    create: {
      dni: "10000004",
      nombre: "Diego",
      apellido: "Sosa",
      rol: "CLIENTE",
      estado: "ACTIVO",
      sede_id: sedeId,
    },
  });

  console.log("Socios demo cargados: 10000001 a 10000004.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
