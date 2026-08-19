# PROGRESO.md — Total Fit

> Bitácora viva del proyecto. Claude Code: actualizá este archivo al final de cada sesión (qué se hizo, qué sigue, qué se decidió). El detalle técnico completo está en `CLAUDE.md`.

## Estado actual
**Fase 1 — en curso.** Scaffolding, schema de Prisma y cálculo de estado de cuota listos. `npm run build`, `npm run lint` y `npm test` (8/8) pasan.

> ⚠️ **Bloqueante para seguir:** falta crear `.env.local` (copia de `.env.example`) con la password del usuario `postgres`. Sin eso no se puede crear la base `totalfit_dev` ni aplicar la migración. La migración inicial ya está **escrita** en `prisma/migrations/`, solo falta correr `npx prisma migrate deploy`.

## Decisiones ya tomadas
- **Stack:** Next.js (App Router) + **PostgreSQL + Prisma (Supabase)** + NextAuth + Tailwind/shadcn. Archivos de rutina en Supabase Storage. Deploy en Vercel + Supabase. _(Postgres por modelo relacional + ecosistema Supabase ya usado en las tiendas.)_
- **Rutina del cliente:** el admin/profe **sube un archivo (PDF/imagen)** y el socio lo ve/descarga. Editor estructurado de ejercicios = fase 2.
- **Portal cliente en v1:** SÍ, versión mínima (ver estado de cuota + descargar rutina).
- **Umbral "próximo a vencer":** 7 días (configurable vía `DIAS_PROXIMO_A_VENCER`).
- **Alcance de sedes:** un gimnasio (Total Fit) con varias **sedes**. Vender a otros gimnasios = fase posterior (instancia separada).
- **Estado de cuota derivado:** ACTIVO / PRÓXIMO A VENCER / VENCIDO se calculan desde `fecha_vencimiento`, no se guardan.
- **Método de pago:** se agrega `MERCADO_PAGO` al enum.
- **Asistencias inmutables** y **trazabilidad de caja** (registrado_por server-side): reglas duras.

### Decisiones de la sesión del 19/08/2026
- **DB de desarrollo:** PostgreSQL 18 **local** (servicio `postgresql-x64-18`, ya instalado en la máquina de Kevin), base `totalfit_dev`. Docker descartado (no está instalado). Supabase queda para el deploy.
- **`tipo_pase`:** enum `MEDIO | LIBRE` en Prisma + mapa `tipo_pase → días` en `src/lib/pases.ts` (default 30). Sin tabla configurable en v1.
- **`/recepcion` requiere sesión ADMIN.** La PC de la puerta queda logueada; evita exponer datos de socios y ensuciar la bitácora inmutable.
- **Amarillo = puede pasar.** Solo el rojo (VENCIDO o DNI inexistente) deniega el acceso.
- **La asistencia se registra solo si el acceso está permitido** — la bitácora es de ingresos, no de consultas.
- **Zona horaria fija** `America/Argentina/Buenos_Aires` para comparar días: un pase que vence hoy es ACTIVO todo el día.
- **Socio con cuenta INACTIVA → rojo**, aunque le quede cuota paga. Una baja es una baja. ⚠️ Esto no está en `CLAUDE.md`: **confirmar con Kevin**.
- **El vencimiento que manda es el más lejano**, no el del último pago cargado: si el admin registra un pago viejo después de uno nuevo, el socio no pierde la cobertura que ya pagó.
- **`/prisma` va en la raíz** del repo (default de Prisma), no dentro de `/src` como sugería el diagrama de `CLAUDE.md` §6.

## Decisiones ABIERTAS (no bloquean empezar)
- [ ] **DNI en la migración.** La planilla no tiene DNI (que es la clave). Se resuelve al escribir el script de import (cargar DNI real vs. provisorio). No frena construir la app.
- [ ] **Días de vencimiento por tipo de pase.** En la planilla: "medio"/"medio pase" ≈ $40.000 y "libre"/"pase libre" ≈ $45.000. Por ahora ambos vencen a +30 días en `src/lib/pases.ts`; confirmar con el gimnasio.
- [ ] **Si el socio exige MongoDB** en vez de Postgres, avisar (cambia solo la capa de datos). _Nota: Prisma 7 ya no tiene conector MongoDB._

## Deuda técnica anotada
- `npm audit`: 3 vulnerabilidades **high** en `deepmerge-ts`, que entra por `@prisma/config` → `prisma` (CLI). Es cadena de **devDependency**, no llega al runtime de la app. El fix automático baja a Prisma 6 (breaking). Se revisa cuando Prisma publique el bump.

---

## Fase 1 — pasos

- [x] **1. Confirmar entendimiento** del modelo, reglas de oro y stack.
- [x] **2. Scaffolding.** Next.js 16 (App Router, TS, Tailwind v4, `src/`), shadcn/ui, Prisma 7 + `@prisma/adapter-pg`, NextAuth v5, zod, bcryptjs, date-fns, vitest. `git init`, `.env.example`, `prisma.config.ts`.
- [x] **3a. Schema de Prisma** (Sede, Usuario, Pago, Asistencia, Rutina) + SQL de la migración inicial + singleton `src/lib/prisma.ts`.
- [ ] **3b. Aplicar la migración** contra `totalfit_dev`. ⛔ Bloqueado: falta `.env.local`.
- [x] **4. `src/lib/cuota.ts`** — función única de estado de cuota (ACTIVO / PRÓXIMO A VENCER / VENCIDO, umbral 7 días) + `src/lib/pases.ts` + 8 tests con vitest.
- [x] **5. Auth de admin** con NextAuth credenciales (DNI + password), `proxy.ts` y seed del primer admin. _(Escrito y compilando; falta probarlo contra la base.)_
- [x] **6. Pantalla de recepción** — DNI → verde/amarillo/rojo + registro de asistencia inmutable. _(Escrita y compilando; falta probarla contra la base.)_
- [ ] **7. Verificación end-to-end** con la base andando: migración, seed, login y los tres colores en pantalla.

## Fase 2 — pendiente (resto del MVP)
1. [ ] CRUD de socios (Usuario rol CLIENTE).
2. [ ] Registro de pagos con `fecha_vencimiento` autocalculada y `registrado_por` automático.
3. [ ] Dashboard admin con contadores derivados, cobros del mes y morosos.
4. [ ] Portal cliente mínimo (estado de cuota + descarga de rutina).
5. [ ] Carga de rutinas a Supabase Storage.
6. [ ] Script de importación de la planilla (con limpieza de datos).
7. [ ] Repo en GitHub con `main` protegida + socio como colaborador.

## Bitácora
- **18/08/2026** — Creados `CLAUDE.md` y `PROGRESO.md` a partir del modelo de datos conceptual/lógico de Total Fit y de la planilla real de socios. Definido stack y reglas de oro. Pendiente resolver decisiones abiertas antes de codear.
- **19/08/2026** — **Pasos 5 y 6.** Auth de admin con NextAuth v5 (DNI + password, solo rol ADMIN activo), config partida en `auth.config.ts` (edge-safe, la usa `proxy.ts`) y `auth.ts` (Prisma + bcrypt). Mensaje de error único y comparación contra un hash descartable cuando el DNI no existe, para no filtrar por tiempo de respuesta qué socios están registrados. Seed idempotente del primer admin desde variables de entorno, con socios demo opcionales (`SEED_DATOS_DEMO=true`). Pantalla de recepción con `src/lib/recepcion.ts` como lógica de puerta (reusa `calcularEstadoCuota`, no la duplica), API `POST /api/recepcion` que verifica sesión ADMIN server-side, y panel verde/amarillo/rojo con ícono y texto además del color. `git grep` confirma que no existe ningún `asistencia.update`/`delete` en el proyecto.
- **19/08/2026** — **Pasos 3 y 4.** Schema de Prisma con las 5 entidades, `dni` unique, enums (incluye `MERCADO_PAGO`) e índices sobre las dos consultas calientes: `(usuario_id, fecha_vencimiento)` para la puerta y `(fecha_vencimiento)` para el dashboard. Las FK de `Asistencia` quedaron en RESTRICT (no CASCADE) para que borrar un socio no arrastre su bitácora. SQL de la migración generado sin conexión con `prisma migrate diff`; falta aplicarlo. `src/lib/cuota.ts` con la única implementación del estado de cuota (comparación por día calendario en zona argentina, para que quien vence hoy pueda entrar todo el día) + `src/lib/pases.ts` con el mapa `tipo_pase → días`. 8 tests en vitest cubriendo los bordes: sin pagos, vence hoy, vencido ayer, justo en el umbral, umbral+1, umbral custom y el caso UTC vs. hora local.
- **19/08/2026** — **Paso 2 (scaffolding).** Proyecto Next.js 16 creado con TypeScript, Tailwind v4, App Router y `src/`. Instalados Prisma 7 (+ driver adapter `@prisma/adapter-pg`), NextAuth v5, shadcn/ui (button, input, card, label, badge, sonner), zod, bcryptjs, date-fns/@date-fns/tz, vitest, tsx. `git init` + `.env.example`. `npm run build` pasa. Corregidos los pasos que todavía decían MongoDB/Mongoose (contradecían `CLAUDE.md`). Anotado en `CLAUDE.md` §10 que Next 16 renombró `middleware.ts` → `proxy.ts` y que Prisma 7 exige generator `prisma-client` con `output` + driver adapter.
