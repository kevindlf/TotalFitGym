import type { DefaultSession } from "next-auth";
// El import vacío es necesario: sin él TypeScript no engancha la ampliación de
// la interfaz JWT al módulo real.
import "next-auth/jwt";

import type { Rol } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    dni: string;
    rol: Rol;
    sede_id: string;
  }

  interface Session {
    user: {
      id: string;
      dni: string;
      rol: Rol;
      sede_id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    dni: string;
    rol: Rol;
    sede_id: string;
  }
}
