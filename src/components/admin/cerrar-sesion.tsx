import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export function CerrarSesion() {
  return (
    <form
      action={async () => {
        "use server";

        await signOut({ redirectTo: "/ingresar" });
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        Salir
      </Button>
    </form>
  );
}
