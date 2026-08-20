import type { NextAuthConfig } from "next-auth";

/**
 * Configuración de NextAuth SIN el provider de credenciales.
 *
 * Está separada de `auth.ts` a propósito: `proxy.ts` corre en el runtime edge,
 * donde no se pueden usar Prisma ni bcrypt. Esta mitad no importa ninguno de
 * los dos, así que sirve para verificar el JWT en el proxy; la mitad pesada
 * (consulta a la base + comparación del hash) vive solo en el servidor.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/ingresar" },
  providers: [],
  callbacks: {
    // Se ejecuta en el proxy. Solo ADMIN entra a las pantallas internas.
    authorized({ auth }) {
      return auth?.user?.rol === "ADMIN";
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.dni = user.dni;
        token.rol = user.rol;
        token.sede_id = user.sede_id;
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = token.id;
      session.user.dni = token.dni;
      session.user.rol = token.rol;
      session.user.sede_id = token.sede_id;

      return session;
    },
  },
} satisfies NextAuthConfig;
