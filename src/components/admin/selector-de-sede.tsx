import { elegirSedeActiva } from "@/lib/sede";

/**
 * Con qué sucursal está trabajando el dueño.
 *
 * Solo se le renderiza a él, pero eso NO es la protección: `elegirSedeActiva`
 * vuelve a verificar el rol del lado del servidor. Esconder un control nunca es
 * un permiso.
 *
 * Es un `<form>` con acción de servidor y no un `<select onChange>` de cliente
 * para que ande sin JavaScript, igual que el resto del panel: la PC del
 * mostrador no siempre coopera.
 */
export function SelectorDeSede({
  sedes,
  sedeActual,
}: {
  sedes: { id_sede: string; nombre: string }[];
  sedeActual: string;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";

        const elegida = formData.get("sede_id");

        if (typeof elegida === "string") {
          await elegirSedeActiva(elegida);
        }
      }}
      className="flex items-center gap-1.5"
    >
      <label htmlFor="sede-activa" className="sr-only">
        Sede sobre la que trabajás
      </label>

      <select
        id="sede-activa"
        name="sede_id"
        defaultValue={sedeActual}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
      >
        {sedes.map((sede) => (
          <option key={sede.id_sede} value={sede.id_sede}>
            Sede {sede.nombre}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="h-8 rounded-md border border-input px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Cambiar
      </button>
    </form>
  );
}
