import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las acciones vienen capadas a 1 MB por defecto y una rutina en PDF los
      // pasa fácil. Se pone 10 y no 8 a propósito: el tope real son los 8 MB de
      // `validarArchivoDeRutina`, que devuelve un error explicado en castellano.
      // Si el corte lo hiciera Next, el profe vería un error críptico.
      bodySizeLimit: "10mb",
    },
  },

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
