/**
 * Inventario de SOLO LECTURA de los usuarios de la base.
 *
 * No modifica nada: son todos SELECT. Nunca imprime el hash de una contraseña,
 * solo si existe o no.
 *
 * Usa DIRECT_URL (puerto 5432) y no el pooler: es una consulta de una sola vez
 * y así se evita el `pgbouncer=true`, que es un flag de Prisma y no de `pg`.
 *
 *   npx tsx build/inventario.ts
 */
import { config as cargarEnv } from "dotenv";
import { Client } from "pg";

cargarEnv({ path: ".env.local", quiet: true });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  console.error("Falta DIRECT_URL (o DATABASE_URL) en .env.local.");
  process.exit(1);
}

const esProduccion = !/localhost|127\.0\.0\.1/.test(url);
const host = new URL(url).host;

async function main() {
  const cliente = new Client({
    connectionString: url,
    ssl: esProduccion ? { rejectUnauthorized: false } : undefined,
  });

  await cliente.connect();

  console.log(`\nBase: ${host}`);
  console.log(esProduccion ? "  >> PRODUCCION (datos reales del gimnasio)\n" : "  >> local\n");

  const sedes = await cliente.query(`
    SELECT s.id_sede, s.nombre, s.estado,
           COUNT(u.id) FILTER (WHERE u.rol = 'CLIENTE')  AS socios,
           COUNT(u.id) FILTER (WHERE u.rol <> 'CLIENTE') AS personal
      FROM "Sede" s
      LEFT JOIN "Usuario" u ON u.sede_id = s.id_sede
     GROUP BY s.id_sede, s.nombre, s.estado
     ORDER BY s.nombre
  `);

  console.log("=== SEDES ===");
  for (const s of sedes.rows) {
    console.log(
      `  ${s.nombre.padEnd(14)} ${String(s.estado).padEnd(8)} socios: ${String(s.socios).padStart(4)}   personal: ${s.personal}`,
    );
  }

  const personal = await cliente.query(`
    SELECT u.dni, u.nombre, u.apellido, u.rol, u.estado, s.nombre AS sede,
           (u.password IS NOT NULL) AS tiene_clave,
           (SELECT COUNT(*) FROM "Pago" p WHERE p.registrado_por = u.id) AS cobros
      FROM "Usuario" u
      JOIN "Sede" s ON s.id_sede = u.sede_id
     WHERE u.rol <> 'CLIENTE'
     ORDER BY u.rol, s.nombre, u.apellido
  `);

  console.log("\n=== PERSONAL (dueño y admins) ===");
  console.log("  DNI         ROL      SEDE           ESTADO    CLAVE  COBROS  NOMBRE");
  for (const u of personal.rows) {
    console.log(
      `  ${u.dni.padEnd(11)} ${String(u.rol).padEnd(8)} ${String(u.sede).padEnd(14)} ${String(u.estado).padEnd(9)} ${u.tiene_clave ? "si   " : "NO   "} ${String(u.cobros).padStart(6)}  ${u.apellido}, ${u.nombre}`,
    );
  }

  const resumenSocios = await cliente.query(`
    SELECT COUNT(*) AS total,
           COUNT(*) FILTER (WHERE password IS NOT NULL) AS con_clave,
           COUNT(*) FILTER (WHERE estado = 'ACTIVO')    AS activos
      FROM "Usuario" WHERE rol = 'CLIENTE'
  `);

  const r = resumenSocios.rows[0];
  console.log("\n=== SOCIOS ===");
  console.log(`  total: ${r.total}   activos: ${r.activos}   con clave propia: ${r.con_clave}`);

  if (Number(r.total) > 0 && Number(r.total) <= 30) {
    const socios = await cliente.query(`
      SELECT u.dni, u.nombre, u.apellido, u.estado, s.nombre AS sede,
             (u.password IS NOT NULL) AS tiene_clave,
             (SELECT COUNT(*) FROM "Pago" p WHERE p.usuario_id = u.id) AS pagos,
             (SELECT COUNT(*) FROM "Asistencia" a WHERE a.usuario_id = u.id) AS ingresos
        FROM "Usuario" u
        JOIN "Sede" s ON s.id_sede = u.sede_id
       WHERE u.rol = 'CLIENTE'
       ORDER BY u.apellido, u.nombre
    `);

    console.log("\n  DNI         SEDE           ESTADO    CLAVE  PAGOS  INGRESOS  NOMBRE");
    for (const u of socios.rows) {
      console.log(
        `  ${u.dni.padEnd(11)} ${String(u.sede).padEnd(14)} ${String(u.estado).padEnd(9)} ${u.tiene_clave ? "si   " : "NO   "} ${String(u.pagos).padStart(5)} ${String(u.ingresos).padStart(9)}  ${u.apellido}, ${u.nombre}`,
      );
    }
  }

  const totales = await cliente.query(`
    SELECT (SELECT COUNT(*) FROM "Pago")       AS pagos,
           (SELECT COUNT(*) FROM "Asistencia") AS asistencias,
           (SELECT COUNT(*) FROM "Rutina")     AS rutinas
  `);

  const t = totales.rows[0];
  console.log(
    `\n=== DATOS CARGADOS ===\n  pagos: ${t.pagos}   asistencias: ${t.asistencias}   rutinas: ${t.rutinas}`,
  );

  await cliente.end();
}

main().catch((error) => {
  console.error("\nFallo la consulta:", error instanceof Error ? error.message : error);
  process.exit(1);
});
