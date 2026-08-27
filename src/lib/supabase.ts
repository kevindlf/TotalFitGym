import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el Storage de rutinas.
 *
 * Entra con la `service_role` key, que saltea las políticas de RLS: la
 * autorización de quién puede ver qué archivo la hacen los route handlers
 * (`/api/mi-rutina` y `/api/rutina/[usuarioId]`), no la base.
 *
 * Por eso ninguna de estas variables lleva el prefijo `NEXT_PUBLIC_`. La
 * `service_role` key es acceso total al proyecto: si llegara al bundle del
 * navegador, cualquiera con el inspector abierto tendría la base entera. El
 * socio nunca habla con Supabase, siempre pasa por el servidor.
 */

const BUCKET_POR_DEFECTO = "rutinas";

function variable(nombre: string): string {
  const valor = process.env[nombre];

  if (!valor) {
    throw new Error(
      `Falta ${nombre}. Completá el bloque de Supabase en .env.local (ver .env.example).`,
    );
  }

  return valor;
}

export function nombreDelBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || BUCKET_POR_DEFECTO;
}

// Perezoso y cacheado, por el mismo motivo que `src/lib/prisma.ts`: si el
// cliente se construyera al importar el módulo, `next build` explotaría al
// recolectar rutas, porque en build no hay credenciales (ni hace falta).
let cache: SupabaseClient | undefined;

export function supabase(): SupabaseClient {
  cache ??= createClient(
    variable("SUPABASE_URL"),
    variable("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  return cache;
}
