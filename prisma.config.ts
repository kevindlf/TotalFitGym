import { config as cargarEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js carga `.env.local` solo; el CLI de Prisma no carga nada por su cuenta.
// Lo cargamos acá para que haya una única fuente de verdad: `.env.local`.
cargarEnv({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Ojo con Supabase (Fase 2): el pooler (puerto 6543) no sirve para migrar.
    // `prisma.config.ts` 7.9 no acepta `directUrl`, así que el CLI usa DIRECT_URL
    // si está definida y cae a DATABASE_URL si no.
    url: process.env["DIRECT_URL"] || env("DATABASE_URL"),
  },
});
