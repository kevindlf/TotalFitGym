import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // El ingreso del personal era /login y ahora es /ingresar, la misma puerta
    // que usan los socios. Se redirige en vez de borrarla para no romper links
    // viejos ni favoritos del navegador.
    //
    // /mi-cuenta NO se redirige: es la pantalla del socio, y si no hay sesión
    // ella misma manda a /ingresar.
    return [{ source: "/login", destination: "/ingresar", permanent: true }];
  },
};

export default nextConfig;
