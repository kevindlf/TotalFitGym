import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

/**
 * En Next.js 16 esto es lo que antes se llamaba `middleware.ts`.
 *
 * Hace un chequeo optimista: si no hay sesión de ADMIN, redirige a /login sin
 * tocar la base. NO es la capa de autorización real — la doc de Next lo dice
 * explícitamente — así que cada page y cada route handler vuelve a verificar la
 * sesión del lado del servidor (Regla de Oro 4).
 */
const { auth } = NextAuth(authConfig);

// Se exporta por default y no como `export const { auth: proxy }`: Next 16
// analiza este archivo estáticamente y no reconoce un destructuring como
// función.
export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/socios/:path*",
    "/pagos/:path*",
    "/asistencias/:path*",
    "/rutinas/:path*",
    "/recepcion/:path*",
    // Las APIs del panel. Se excluye /api/auth, que es el propio login.
    "/api/((?!auth).*)",
  ],
};
