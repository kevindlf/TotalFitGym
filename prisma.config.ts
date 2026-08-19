import { config as cargarEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js carga `.env.local` solo; el CLI de Prisma no carga nada por su cuenta.
// Lo cargamos acá para que haya una única fuente de verdad: `.env.local`.
cargarEnv({ path: ".env.local", quiet: true });

// Ojo con Supabase (Fase 2): el pooler (puerto 6543) no sirve para migrar, hace
// falta la conexión directa. `prisma.config.ts` 7.9 no acepta `directUrl`, así
// que el CLI usa DIRECT_URL si está definida y cae a DATABASE_URL si no.
//
// Se lee con `process.env` y no con el helper `env()` a propósito: `env()` tira
// error apenas se carga el archivo, y eso rompe comandos que ni tocan la base
// (`prisma validate`, `prisma format`) cuando todavía no existe `.env.local`.
const urlBaseDeDatos = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: urlBaseDeDatos,
  },
});
