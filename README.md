# Total Fit — Sistema de gestión de gimnasio

Reemplaza la planilla de Google Sheets que Total Fit (Junín) usa hoy para socios, pagos y vencimientos.

**Tres superficies:**

- **Página pública** — el gimnasio, sus planes, horarios y ubicación.
- **Puerta / recepción** — se ingresa el DNI del socio y el sistema responde verde, amarillo, naranja o rojo, y registra la asistencia.
- **Panel del personal** — alta de socios, cobro de cuotas, control de vencimientos, métricas de caja y gestión de profes.

El socio consulta el estado de su cuota desde el celular con su DNI.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · PostgreSQL + Prisma 7 · NextAuth v5 · Vitest

## Arrancar el proyecto

Hace falta **Node 20+** y un **PostgreSQL** corriendo.

```bash
npm install
cp .env.example .env.local     # completar DATABASE_URL, AUTH_SECRET y el seed
npx prisma migrate deploy      # crea las tablas
npm run db:seed                # crea la sede y el primer admin
npm run dev                    # http://localhost:3000
```

Para generar `AUTH_SECRET`: `npx auth secret`.

Con `SEED_DATOS_DEMO=true` el seed carga además cuatro socios de prueba, uno por cada color de la pantalla de recepción.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | Build de producción |
| `npm run db:studio` | Explorador visual de la base |
| `npm run db:seed` | Carga la sede y el primer admin |

## Las Reglas de Oro

Cuatro reglas que el código no negocia. Están explicadas en detalle en [`CLAUDE.md`](CLAUDE.md), sección 4.

1. **El DNI es soberano.** Único e irrepetible en todo el sistema, con índice `unique` en la base.
2. **La puerta evalúa cobertura temporal.** El estado de cuota se **deriva** de `fecha_vencimiento` y se calcula al vuelo — nunca se guarda. Es lo que se pudría en la planilla, donde la columna "Estado" se escribía a mano.
3. **Las asistencias son inmutables.** Solo se crean y se leen. No existe `update` ni `delete` en ninguna parte del código.
4. **Toda la caja es trazable.** Cada pago guarda qué admin lo cobró, tomado de la sesión del servidor y nunca de un campo del formulario.

## Documentación

- [`CLAUDE.md`](CLAUDE.md) — modelo de datos, reglas de negocio, convenciones y notas de versiones. **Leerlo antes de tocar código.**
- [`PROGRESO.md`](PROGRESO.md) — bitácora: qué está hecho, qué falta y qué se decidió.

## Trabajo en equipo

`main` está protegida: se entra por Pull Request. Una rama por feature, con nombre descriptivo:

```bash
git switch -c feat/rutinas
# ...trabajar y commitear...
git push -u origin feat/rutinas
```

Antes de abrir el PR, que pasen las tres: `npm test`, `npm run lint`, `npm run build`.

**Nunca** commitear `.env.local` ni escribir contraseñas en archivos versionados, ni siquiera de cuentas de prueba.
