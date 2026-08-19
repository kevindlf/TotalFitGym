import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

/**
 * Hash descartable de un password que no existe.
 *
 * Cuando el DNI no está o el usuario no es admin igual comparamos contra este
 * hash antes de rechazar. Sin eso, un login con DNI inexistente responde mucho
 * más rápido que uno con DNI válido y password errónea, y esa diferencia de
 * tiempo permite averiguar qué DNIs están registrados en el gimnasio.
 */
const HASH_INEXISTENTE =
  "$2b$12$eB8Q1Ck2u0Yf7Y6ZK1t1jePeVKf9m0z1sVJqk0aQ6HxJqfQyRfC2i";

const esquemaCredenciales = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "El DNI debe tener entre 6 y 12 dígitos"),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        dni: { label: "DNI", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credenciales) {
        const parseado = esquemaCredenciales.safeParse(credenciales);

        if (!parseado.success) {
          return null;
        }

        const { dni, password } = parseado.data;
        const usuario = await prisma.usuario.findUnique({ where: { dni } });

        // Solo entran admins activos con password. Un CLIENTE no puede loguearse
        // al panel aunque tenga password cargada (CLAUDE.md §2).
        const puedeIntentar =
          usuario !== null &&
          usuario.rol === "ADMIN" &&
          usuario.estado === "ACTIVO" &&
          usuario.password !== null;

        const passwordOk = await compare(
          password,
          puedeIntentar ? usuario.password! : HASH_INEXISTENTE,
        );

        if (!puedeIntentar || !passwordOk) {
          // Un solo motivo de error para todos los casos: no le decimos a nadie
          // si el DNI existe, si está inactivo o si es cliente.
          return null;
        }

        return {
          id: usuario.id,
          name: `${usuario.nombre} ${usuario.apellido}`,
          email: usuario.email,
          dni: usuario.dni,
          rol: usuario.rol,
          sede_id: usuario.sede_id,
        };
      },
    }),
  ],
});
