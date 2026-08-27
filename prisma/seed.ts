import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { addDays } from "date-fns";
import { config as cargarEnv } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

cargarEnv({ path: ".env.local", quiet: true });

const RONDAS_BCRYPT = 12;

/** Sedes de la cadena. PENDIENTE de confirmar los nombres con el gimnasio. */
const SEDES_POR_DEFECTO = "San Martín,Ciudad,Godoy Cruz";

function requerido(nombre: string): string {
  const valor = process.env[nombre];

  if (!valor) {
    throw new Error(
      `Falta la variable ${nombre}. Completala en .env.local antes de correr el seed.`,
    );
  }

  return valor;
}

function claveMinima(nombre: string): string {
  const valor = requerido(nombre);

  if (valor.length < 8) {
    throw new Error(`${nombre} tiene que tener al menos 8 caracteres.`);
  }

  return valor;
}

async function main() {
  const connectionString = requerido("DATABASE_URL");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const nombresDeSede = (process.env.SEED_SEDES ?? SEDES_POR_DEFECTO)
      .split(",")
      .map((nombre) => nombre.trim())
      .filter(Boolean);

    // No hay clave natural para Sede, así que se busca por nombre: el seed se
    // tiene que poder correr dos veces sin duplicar sucursales.
    const sedes = [];

    for (const nombre of nombresDeSede) {
      const existente = await prisma.sede.findFirst({ where: { nombre } });

      sedes.push(existente ?? (await prisma.sede.create({ data: { nombre } })));
    }

    console.log(`Sedes: ${sedes.map((s) => s.nombre).join(" · ")}`);

    const sedePrincipal = sedes[0]!;

    // El dueño de la cadena. Ve las tres sedes y elige sobre cuál trabaja, así
    // que su `sede_id` es solo el punto de partida del selector.
    const duenio = await prisma.usuario.upsert({
      where: { dni: requerido("SEED_DUENIO_DNI") },
      update: {
        password: await hash(claveMinima("SEED_DUENIO_PASSWORD"), RONDAS_BCRYPT),
        rol: "DUENIO",
        estado: "ACTIVO",
      },
      create: {
        dni: requerido("SEED_DUENIO_DNI"),
        nombre: process.env.SEED_DUENIO_NOMBRE ?? "Dueño",
        apellido: process.env.SEED_DUENIO_APELLIDO ?? "Total Fit",
        password: await hash(claveMinima("SEED_DUENIO_PASSWORD"), RONDAS_BCRYPT),
        rol: "DUENIO",
        estado: "ACTIVO",
        sede_id: sedePrincipal.id_sede,
      },
    });

    console.log(`Dueño listo: DNI ${duenio.dni} (ve las ${sedes.length} sedes)`);

    // Un admin por sede. El DNI de cada uno sale del DNI base + su posición,
    // así el seed no necesita una variable por sucursal.
    const dniBase = Number(requerido("SEED_ADMIN_DNI"));
    const passwordAdmin = await hash(
      claveMinima("SEED_ADMIN_PASSWORD"),
      RONDAS_BCRYPT,
    );

    const admins = [];

    for (const [indice, sede] of sedes.entries()) {
      const dni = String(dniBase + indice);

      const admin = await prisma.usuario.upsert({
        where: { dni },
        // `sede_id` se reasigna a propósito: el seed afirma qué admin atiende
        // qué sucursal, así que volver a correrlo corrige una carga mal hecha.
        update: {
          password: passwordAdmin,
          rol: "ADMIN",
          estado: "ACTIVO",
          sede_id: sede.id_sede,
        },
        create: {
          dni,
          nombre: process.env.SEED_ADMIN_NOMBRE ?? "Admin",
          apellido: sede.nombre,
          password: passwordAdmin,
          rol: "ADMIN",
          estado: "ACTIVO",
          sede_id: sede.id_sede,
        },
      });

      admins.push(admin);
      console.log(`  Admin de ${sede.nombre}: DNI ${admin.dni}`);
    }

    // Doble condición a propósito. `SEED_DATOS_DEMO` suele quedar en `true` en
    // el .env.local de desarrollo, y el CLI lo carga de ahí aunque no esté en
    // la terminal: apuntar el seed a la base de producción alcanzaría para
    // meterle socios inventados. El candado real es la conexión, no la
    // variable — los datos de prueba solo entran en una base local.
    const esBaseLocal =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1");

    if (process.env.SEED_DATOS_DEMO === "true") {
      if (esBaseLocal) {
        await sembrarSociosDemo(prisma, sedes, admins);
      } else {
        console.log(
          "SEED_DATOS_DEMO está en true, pero esta base NO es local: los socios de prueba NO se cargan.",
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

interface SedeSembrada {
  id_sede: string;
  nombre: string;
}

/**
 * Socios de prueba, uno por cada color de la pantalla de recepción.
 *
 * Se reparten entre sedes a propósito: sin socios en más de una sucursal, el
 * aislamiento no se puede probar — todo se vería bien igual.
 *
 * Solo se cargan con SEED_DATOS_DEMO=true; nunca en producción.
 */
async function sembrarSociosDemo(
  prisma: PrismaClient,
  sedes: SedeSembrada[],
  admins: { id: string; sede_id: string }[],
) {
  const hoy = new Date();

  // Nombres comunes a propósito: si el apellido dijera el color del estado, la
  // planilla parecería estar escribiendo el color en la columna del nombre.
  const socios = [
    { dni: "10000001", nombre: "Ana", apellido: "Gómez", diasHastaVencer: 20, sede: 0 },
    { dni: "10000002", nombre: "Bruno", apellido: "Álvarez", diasHastaVencer: 3, sede: 0 },
    { dni: "10000003", nombre: "Carla", apellido: "Ibáñez", diasHastaVencer: -10, sede: 0 },
    // En otra sucursal: sirve para verificar que no aparece en el padrón de la
    // primera y que la puerta lo rechaza con "es de otra sede".
    { dni: "10000005", nombre: "Elena", apellido: "Ruiz", diasHastaVencer: 15, sede: 1 },
  ];

  for (const socio of socios) {
    const sede = sedes[socio.sede] ?? sedes[0]!;
    const admin = admins.find((a) => a.sede_id === sede.id_sede) ?? admins[0]!;

    const usuario = await prisma.usuario.upsert({
      where: { dni: socio.dni },
      // Los socios demo son un fixture reproducible, no datos reales: el seed
      // los devuelve a su sede aunque una corrida anterior los haya dejado en
      // otra. Sin esto, el reparto entre sucursales no se puede volver a armar.
      update: { sede_id: sede.id_sede },
      create: {
        dni: socio.dni,
        nombre: socio.nombre,
        apellido: socio.apellido,
        telefono: `11550000${socio.dni.slice(-2)}`,
        rol: "CLIENTE",
        estado: "ACTIVO",
        sede_id: sede.id_sede,
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
        registrado_por: admin.id,
        sede_id: sede.id_sede,
      },
    });
  }

  // Un socio sin ningún pago: también tiene que dar rojo. Y sin teléfono, para
  // probar que no puede crearse una clave.
  await prisma.usuario.upsert({
    where: { dni: "10000004" },
    update: { sede_id: sedes[0]!.id_sede },
    create: {
      dni: "10000004",
      nombre: "Diego",
      apellido: "Sosa",
      rol: "CLIENTE",
      estado: "ACTIVO",
      sede_id: sedes[0]!.id_sede,
    },
  });

  console.log("Socios demo cargados: 10000001 a 10000005.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
