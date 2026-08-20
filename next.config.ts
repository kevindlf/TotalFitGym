import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Antes había dos puertas separadas: /login para el personal y /mi-cuenta
    // para los socios. Ahora es una sola, /ingresar. Se redirige en vez de
    // borrarlas para no romper links viejos ni favoritos del navegador.
    return [
      { source: "/login", destination: "/ingresar", permanent: true },
      { source: "/mi-cuenta", destination: "/ingresar", permanent: true },
    ];
  },
};

export default nextConfig;
