/**
 * Vacía la base de Supabase y la deja cargada como INSTANCIA DE DEMOSTRACIÓN.
 *
 * Sirve dos veces: la primera para sacar los datos del cliente que se cayó, y
 * después cada vez que una demostración deje la base desprolija — se vuelve a
 * correr y queda igual que al principio.
 *
 * Es destructivo e irreversible sobre una base remota, así que:
 *   - sin `--confirmar` no borra nada, solo muestra qué hay y qué haría;
 *   - si encuentra datos que no parecen de demostración (muchos socios, pagos
 *     viejos), se planta y pide `--igual-borrar`;
 *   - la credencial se lee de `.env.local` aunque esté comentada, y nunca se
 *     imprime.
 *
 *   npx tsx build/demo-reset.ts              # ensayo, no toca nada
 *   npx tsx build/demo-reset.ts --confirmar  # borra y siembra
 */
import { readFileSync } from "node:fs";
import { hash } from "bcryptjs";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const confirmar = process.argv.includes("--confirmar");
const igualBorrar = process.argv.includes("--igual-borrar");
/** Corre contra el Postgres local, para probar el script sin tocar Supabase. */
const enLocal = process.argv.includes("--local");

/**
 * Las claves de la demostración no van escritas acá: en este repo ninguna
 * contraseña se versiona, ni siquiera la de una cuenta de prueba. Se toman de
 * `DEMO_CLAVE_DUENIO` / `DEMO_CLAVE_ADMIN` si están, y si no se generan al azar
 * y se imprimen una sola vez al final.
 */
function claveDe(variable: string): string {
  const puesta = process.env[variable];
  if (puesta && puesta.length >= 8) return puesta;

  return `demo-${randomUUID().slice(0, 8)}`;
}

const CLAVE_DUENIO = claveDe("DEMO_CLAVE_DUENIO");
const CLAVE_ADMIN = claveDe("DEMO_CLAVE_ADMIN");
const RONDAS_BCRYPT = 12;

/** Más que esto no parece una demostración, parece un cliente de verdad. */
const LIMITE_SOCIOS_ESPERADOS = 40;

function urlDeProduccion(): string {
  const lineas = readFileSync(".env.local", "utf8").split(/\r?\n/);
  const candidatas: string[] = [];

  for (const linea of lineas) {
    const match = linea.match(
      /^\s*#?\s*(DATABASE_URL|DIRECT_URL)\s*=\s*"?(postgres(?:ql)?:\/\/[^"\s]+)"?/,
    );
    if (!match) continue;

    const esLocal = /localhost|127\.0\.0\.1/.test(match[2]);
    const esSupabase = match[2].includes("supabase.com");

    // Con --local solo se aceptan las líneas activas (sin `#`) de localhost,
    // para que una prueba nunca pueda terminar apuntando a Supabase.
    if (enLocal && esLocal && !/^\s*#/.test(linea)) candidatas.push(match[2]);
    if (!enLocal && esSupabase) candidatas.push(match[2]);
  }

  const elegida = candidatas.find((u) => u.includes(":5432")) ?? candidatas[0];

  if (!elegida) {
    throw new Error(
      enLocal
        ? "No encontré una conexión activa a localhost en .env.local"
        : "No encontré la conexión a Supabase en .env.local",
    );
  }

  return elegida.replace(/\?.*$/, "");
}

/** Fecha a N días de hoy, a mediodía para que ningún huso la corra de día. */
function enDias(dias: number): Date {
  const fecha = new Date();
  fecha.setHours(12, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

/**
 * Los socios de la demostración, uno por cada color de la puerta.
 *
 * `vence` es a cuántos días de hoy vence su cuota, así la demostración se ve
 * igual el día que se corra: no hay fechas fijas que envejezcan.
 */
const SOCIOS_DEMO = [
  { dni: "30111001", nombre: "Ana",      apellido: "Gómez",    tel: "2604111001", vence: 24,  pase: "LIBRE", monto: 45000 },
  { dni: "30111002", nombre: "Bruno",    apellido: "Álvarez",  tel: "2604111002", vence: 3,   pase: "LIBRE", monto: 45000 },
  { dni: "30111003", nombre: "Carla",    apellido: "Ibáñez",   tel: "2604111003", vence: -12, pase: "MEDIO", monto: 40000 },
  { dni: "30111004", nombre: "Diego",    apellido: "Sosa",     tel: null,         vence: null, pase: "LIBRE", monto: 0 },
  { dni: "30111005", nombre: "Elena",    apellido: "Ruiz",     tel: "2604111005", vence: 18,  pase: "MEDIO", monto: 40000 },
  { dni: "30111006", nombre: "Facundo",  apellido: "Moyano",   tel: "2604111006", vence: 1,   pase: "LIBRE", monto: 47000 },
  { dni: "30111007", nombre: "Gabriela", apellido: "Páez",     tel: "2604111007", vence: -3,  pase: "LIBRE", monto: 45000 },
  { dni: "30111008", nombre: "Hernán",   apellido: "Quiroga",  tel: "2604111008", vence: 27,  pase: "LIBRE", monto: 45000 },
  { dni: "30111009", nombre: "Irina",    apellido: "Luna",     tel: "2604111009", vence: 6,   pase: "MEDIO", monto: 40000 },
  { dni: "30111010", nombre: "Joaquín",  apellido: "Brizuela", tel: "2604111010", vence: -45, pase: "MEDIO", monto: 38000 },
] as const;

const METODOS = ["EFECTIVO", "TRANSFERENCIA", "MERCADO_PAGO", "QR"] as const;

async function main() {
  const url = urlDeProduccion();
  const cliente = new Client({
    connectionString: url,
    ssl: enLocal ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  console.log(`\nBase: ${new URL(url).host}${enLocal ? "  (prueba local)" : ""}`);
  await cliente.connect();

  const { rows: antes } = await cliente.query(`
    SELECT (SELECT COUNT(*) FROM "Sede")                          AS sedes,
           (SELECT COUNT(*) FROM "Usuario" WHERE rol = 'CLIENTE') AS socios,
           (SELECT COUNT(*) FROM "Usuario" WHERE rol <> 'CLIENTE')AS personal,
           (SELECT COUNT(*) FROM "Pago")                          AS pagos,
           (SELECT COUNT(*) FROM "Asistencia")                    AS asistencias,
           (SELECT COUNT(*) FROM "Rutina")                        AS rutinas
  `);

  const a = antes[0];
  console.log("\n=== LO QUE HAY AHORA, Y SE VA A BORRAR ===");
  console.log(
    `  sedes: ${a.sedes}   personal: ${a.personal}   socios: ${a.socios}   pagos: ${a.pagos}   asistencias: ${a.asistencias}   rutinas: ${a.rutinas}`,
  );

  if (Number(a.socios) > LIMITE_SOCIOS_ESPERADOS && !igualBorrar) {
    console.error(
      `\n  >> FRENO: hay ${a.socios} socios, más de los ${LIMITE_SOCIOS_ESPERADOS} que esperaría de una demostración.` +
        `\n     Esto puede ser un cliente de verdad. Revisalo antes; si igual querés borrar, pasá --igual-borrar.`,
    );
    await cliente.end();
    process.exit(1);
  }

  if (!confirmar) {
    console.log(
      "\nEnsayo: NO se modificó nada.\n" +
        "Para borrar y sembrar la demostración: npx tsx build/demo-reset.ts --confirmar\n",
    );
    await cliente.end();
    return;
  }

  await cliente.query("BEGIN");

  try {
    // Orden obligado por las claves foráneas: lo que apunta primero.
    for (const tabla of ["Rutina", "Asistencia", "Pago", "Usuario", "Sede"]) {
      const r = await cliente.query(`DELETE FROM "${tabla}"`);
      console.log(`  borradas de ${tabla}: ${r.rowCount}`);
    }

    // --- Sedes -------------------------------------------------------------
    // Dos a propósito: con una sola no se puede mostrar el aislamiento entre
    // sucursales ni el selector del dueño, que es medio argumento de venta.
    const sedes = [
      { id: randomUUID(), nombre: "Centro", direccion: "Av. San Martín 450" },
      { id: randomUUID(), nombre: "Norte", direccion: "Perito Moreno 1820" },
    ];

    for (const sede of sedes) {
      await cliente.query(
        `INSERT INTO "Sede" (id_sede, nombre, direccion, estado) VALUES ($1, $2, $3, 'ACTIVA')`,
        [sede.id, sede.nombre, sede.direccion],
      );
    }

    const [centro, norte] = sedes;

    // --- Personal ----------------------------------------------------------
    const hashDuenio = await hash(CLAVE_DUENIO, RONDAS_BCRYPT);
    const hashAdmin = await hash(CLAVE_ADMIN, RONDAS_BCRYPT);

    const duenioId = randomUUID();
    const adminCentroId = randomUUID();
    const adminNorteId = randomUUID();

    const personal = [
      { id: duenioId,      dni: "20100001", nombre: "Marcela", apellido: "Duarte",  rol: "DUENIO", sede: centro.id, hash: hashDuenio },
      { id: adminCentroId, dni: "20100002", nombre: "Pablo",   apellido: "Herrera", rol: "ADMIN",  sede: centro.id, hash: hashAdmin },
      { id: adminNorteId,  dni: "20100003", nombre: "Lucía",   apellido: "Ferrari", rol: "ADMIN",  sede: norte.id,  hash: hashAdmin },
    ];

    for (const p of personal) {
      await cliente.query(
        `INSERT INTO "Usuario" (id, dni, sede_id, nombre, apellido, email, telefono, password, rol, estado, fecha_registro)
         VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, 'ACTIVO', NOW() - INTERVAL '8 months')`,
        [p.id, p.dni, p.sede, p.nombre, p.apellido, p.hash, p.rol],
      );
    }

    // --- Socios ------------------------------------------------------------
    // Los dos últimos van a la sede Norte: así la demostración puede mostrar
    // que un socio de otra sucursal da rojo en la puerta.
    let i = 0;
    for (const socio of SOCIOS_DEMO) {
      const enNorte = i >= SOCIOS_DEMO.length - 2;
      const sedeId = enNorte ? norte.id : centro.id;
      const cobrador = enNorte ? adminNorteId : adminCentroId;
      const socioId = randomUUID();

      await cliente.query(
        `INSERT INTO "Usuario" (id, dni, sede_id, nombre, apellido, email, telefono, password, rol, estado, fecha_registro)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, NULL, 'CLIENTE', 'ACTIVO', NOW() - INTERVAL '5 months')`,
        [socioId, socio.dni, sedeId, socio.nombre, socio.apellido, socio.tel],
      );

      if (socio.vence !== null) {
        // Dos pagos por socio: el vigente y el del mes anterior, para que el
        // historial no esté vacío y "Facturado" muestre un acumulado.
        const vencimientos = [socio.vence, socio.vence - 30];

        for (const [indice, vence] of vencimientos.entries()) {
          const fechaVencimiento = enDias(vence);
          const fechaPago = enDias(vence - 30);

          await cliente.query(
            `INSERT INTO "Pago" (id_pago, usuario_id, monto, fecha_pago, fecha_vencimiento, metodo_pago, tipo_pase, registrado_por, sede_id, creado_en)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $4)`,
            [
              randomUUID(),
              socioId,
              socio.monto,
              fechaPago,
              fechaVencimiento,
              METODOS[(i + indice) % METODOS.length],
              socio.pase,
              cobrador,
              sedeId,
            ],
          );
        }
      }

      // Asistencias solo de los que hoy pueden pasar: la bitácora es de
      // ingresos permitidos, no de consultas (Regla de Oro 3).
      if (socio.vence !== null && socio.vence >= 0) {
        for (const diasAtras of [1, 3, 6, 8]) {
          await cliente.query(
            `INSERT INTO "Asistencia" (id_asistencia, usuario_id, fecha_hora, metodo_registro, sede_id)
             VALUES ($1, $2, NOW() - ($3 || ' days')::interval, 'DNI_MANUAL', $4)`,
            [randomUUID(), socioId, String(diasAtras), sedeId],
          );
        }
      }

      i += 1;
    }

    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  }

  const { rows: despues } = await cliente.query(`
    SELECT (SELECT COUNT(*) FROM "Sede")                           AS sedes,
           (SELECT COUNT(*) FROM "Usuario" WHERE rol = 'CLIENTE')  AS socios,
           (SELECT COUNT(*) FROM "Usuario" WHERE rol <> 'CLIENTE') AS personal,
           (SELECT COUNT(*) FROM "Pago")                           AS pagos,
           (SELECT COUNT(*) FROM "Asistencia")                     AS asistencias
  `);

  const d = despues[0];
  console.log("\n=== QUEDÓ ASÍ ===");
  console.log(
    `  sedes: ${d.sedes}   personal: ${d.personal}   socios: ${d.socios}   pagos: ${d.pagos}   asistencias: ${d.asistencias}`,
  );

  console.log("\n=== PARA ENTRAR A LA DEMOSTRACION ===");
  console.log(`  Dueña  DNI 20100001   clave ${CLAVE_DUENIO}    (ve las dos sedes)`);
  console.log(`  Profe  DNI 20100002   clave ${CLAVE_ADMIN}     (sede Centro)`);
  console.log(`  Profe  DNI 20100003   clave ${CLAVE_ADMIN}     (sede Norte)`);
  console.log("\n=== SOCIOS PARA LA PUERTA ===");
  console.log("  30111001  verde, al dia          30111002  amarillo, vence en 3 dias");
  console.log("  30111003  rojo, vencido          30111004  rojo, nunca pago");
  console.log("  30111009  de la sede Norte: rojo en la puerta del Centro\n");

  await cliente.end();
}

main().catch((error) => {
  console.error("\nFalló:", error instanceof Error ? error.message : error);
  process.exit(1);
});
