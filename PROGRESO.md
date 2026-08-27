# PROGRESO.md — Total Fit

> **Bitácora viva.** Este archivo es el punto de entrada para retomar el proyecto en una sesión nueva. Al terminar cada sesión actualizalo: qué se hizo, qué se decidió y por qué. El detalle técnico completo está en `CLAUDE.md`.

---

# ▶ EMPEZÁ ACÁ

**Última sesión: 19/08/2026.** El sistema funciona de punta a punta contra una base real. 25 commits en `github.com/kevindlf/TotalFitGym`, 50 tests, `build` y `lint` limpios.

### Lo primero: levantarlo

```powershell
cd "c:\Programación\TotalFit_Gimnasio"
npm run dev          # http://localhost:3000
```

La base local ya existe (`totalfit_dev` en el PostgreSQL 18 de la máquina) y `.env.local` ya está completo. Si algo no arranca, mirá la sección "Base de datos local" más abajo.

**Entrar al panel:** DNI `20000001`. La contraseña está en `.env.local`, en `SEED_ADMIN_PASSWORD`.

### Lo único que falta, y qué lo bloquea

| Falta | Bloqueado por | Quién |
|---|---|---|
| **Importar los 349 socios** de la planilla | El CSV de la planilla | Kevin |
| **Deploy** en Vercel + Supabase | Lo de arriba | Kevin |
| **Datos reales del gimnasio** en `src/lib/gimnasio.ts` | Dirección, teléfono, Instagram, mail | Kevin |
| **Las 3 fotos** en `public/fotos/` | `portada.jpg`, `sala.jpg`, `frente.jpg` | Kevin |

**No hay nada más que se pueda avanzar sin esas cinco cosas.** Todo lo demás del MVP está hecho.

### Si Kevin ya trajo lo que falta

Está todo planificado. El orden que destraba más rápido:

1. **Supabase primero** — habilita rutinas *y* deploy de una.
2. ~~**Rutinas** (bloque D)~~ — hecho el 27/08. Falta solo pegarle las credenciales y probarlo (ver la bitácora de ese día).
3. **Import** (bloque E): migración con `dni_provisorio`, script con modo `--simular`, filtro "DNI pendiente" en la planilla. Los detalles de las trampas de la planilla están en `CLAUDE.md` §7.
4. **Deploy** (bloque F): migrar a Supabase, conectar Vercel, `AUTH_SECRET` **nuevo** para producción, borrar los datos de prueba.

---

## Qué está hecho

| Superficie | Estado |
|---|---|
| Landing pública (`/`) | ✅ Completa. Faltan fotos y datos reales. |
| Ingreso unificado (`/ingresar`) | ✅ Socio con DNI · personal con DNI + contraseña. |
| Portal del socio (`/mi-cuenta`) | ✅ Cuota, plan, pagos, ingresos. Rutina pendiente. |
| Claves de socio | ✅ Se la crea el socio verificando su teléfono. |
| Recepción / la puerta | ✅ Verde, amarillo, naranja y rojo + asistencia inmutable. |
| Dashboard del dueño | ✅ Contadores derivados, caja del mes, morosos. |
| Socios — vista planilla | ✅ Filtros, historial desplegable, cobrar en un click. |
| Alta, ficha y edición de socio | ✅ Incluye corregir el DNI. |
| Registro de pagos | ✅ Con `registrado_por` del servidor. |
| Bitácora de ingresos (`/asistencias`) | ✅ Solo lectura, con filtros. |
| Personal (`/personal`) | ✅ Alta de profes, reset de clave, baja. |
| Modo claro / oscuro | ✅ Botón en las 4 superficies. |
| Responsive | ✅ Tarjetas en celular, tablas en escritorio. |
| **Rutinas** | ⏸️ Hecho pero **apagado** (`RUTINAS_HABILITADAS=false`): el gimnasio usa su QR. |
| **Import de la planilla** | ❌ Necesita el CSV. |
| **Deploy** | ❌ Necesita Supabase. |

### Las 4 Reglas de Oro, verificadas contra la base real

| Regla | Cómo se verificó | Resultado |
|---|---|---|
| 1 · DNI único | `INSERT` con un DNI repetido | rechazado por `Usuario_dni_key` ✅ |
| 2 · Puerta | Los 4 DNI demo + uno inexistente | verde / amarillo / rojo / rojo / rojo ✅ |
| 3 · Asistencias inmutables | Conteo tras las consultas | solo los 2 que pasaron tienen fila ✅ |
| 4 · Trazabilidad | `JOIN` de pagos con su admin | los 3 pagos con dueño, ninguno anónimo ✅ |

También verificado: un socio no puede entrar al panel, una contraseña incorrecta no crea sesión, y una cookie de socio con el nivel editado a mano se rechaza.

---

## Rutas del sistema

| Ruta | Qué es |
|---|---|
| `/` | Landing: gimnasio, actividades, planes, horarios, ubicación |
| `/ingresar` | **Puerta única.** Socio con DNI · personal con DNI + contraseña |
| `/mi-cuenta` | Pantalla del socio: cuota, plan, pagos, ingresos, rutina |
| `/dashboard` | Panel del dueño: contadores, caja del mes, morosos |
| `/socios` | Vista planilla: filtros, estado al costado, cobrar en un click |
| `/socios/nuevo` | Alta de socio, con primer pago opcional |
| `/socios/[id]` | Ficha: pagos, ingresos, cobrar, clave, dar de baja |
| `/socios/[id]/editar` | Corregir datos, incluido el DNI |
| `/asistencias` | Bitácora de ingresos, solo lectura |
| `/personal` | Alta de profes/empleados, reset de contraseña, baja |
| `/recepcion` | La puerta. Se abre desde el dashboard |

Comandos: `npm run dev` · `npm test` (90) · `npm run lint` · `npm run build` · `npm run db:studio` · `npm run db:seed`

---

## Decisiones tomadas

### De negocio
- **Umbral "próximo a vencer":** 7 días (`DIAS_PROXIMO_A_VENCER`).
- **Ventana de pago:** implementada como cuarto estado naranja, **apagada por defecto** (`DIAS_DE_GRACIA=0`). Ver sección propia abajo.
- **Amarillo y naranja dejan pasar.** Solo el rojo deniega.
- **Socio con cuenta INACTIVA → rojo**, aunque le quede cuota paga.
- **El vencimiento que manda es el más lejano**, no el del último pago cargado.
- **La asistencia se registra solo si el acceso está permitido** — la bitácora es de ingresos, no de consultas.
- **Sin pagos parciales:** en el gimnasio se paga todo o no se paga.
- **ADMIN incluye al dueño y a los profes.** Cualquier ADMIN puede dar de alta a otro.

### Técnicas
- **Stack:** Next.js 16 + PostgreSQL/Prisma 7 + NextAuth v5 + Tailwind v4/shadcn.
- **DB de desarrollo:** PostgreSQL 18 local, rol `totalfit`, base `totalfit_dev`. Supabase para el deploy.
- **`tipo_pase`:** enum `MEDIO | LIBRE` + mapa a días en `src/lib/pases.ts` (30 y 30, provisorio).
- **Zona horaria fija** `America/Argentina/Buenos_Aires`: un pase que vence hoy es ACTIVO todo el día.
- **Estado de cuota derivado**, nunca guardado.
- **Sesión del socio con dos niveles** (`BASICO` / `COMPLETO`), en cookie propia firmada con HMAC y no en NextAuth — ver el desvío explicado en la bitácora del 19/08.
- **Datos del gimnasio en `src/lib/gimnasio.ts`**, no en la base.
- **Cloudinary: NO.** `public/` alcanza para la landing y Supabase Storage para las rutinas.

---

## Decisiones ABIERTAS

- [ ] **Los nombres reales de las tres sedes** y sus direcciones. Van por `SEED_SEDES` en `.env.local`, así cambiarlos no toca código.
- [ ] **¿La cuota vale en cualquier sucursal?** Hoy el aislamiento es estricto: socio de otra sede = rojo. Si el gimnasio dice que la cuota es de la cadena, es cambiar una condición en `evaluarIngresoPorDni`.
- [ ] **¿Auditar los traslados?** Hoy el rastro queda implícito en los `sede_id` de los pagos viejos. Si quieren saber quién movió a quién y cuándo, es una tabla más.

- [ ] **¿Se prende la ventana de pago?** Confirmar con el gimnasio cuántos días de tolerancia y poner ese número en `DIAS_DE_GRACIA`.
- [ ] **Días de vencimiento por tipo de pase.** Hoy ambos en 30. Confirmar.
- [ ] **Precios de los planes** para la landing (hoy dice "consultanos").
- [ ] **Qué era "no entregado".** Kevin mencionó ese estado; se interpretó como el socio que nunca pagó ("Sin pagos"). Si se refería a la **rutina no entregada**, es una columna aparte.
- [ ] **Anclar el vencimiento a un día fijo del mes** (`dia_de_cobro` por socio) en vez de `fecha_pago + 30`. La ventana de pago ya cubre casi todo el caso.

## Antes de abrirlo al público

- [ ] Borrar los usuarios de prueba: `10000001` a `10000004` y `20000002`.
- [ ] Cambiar el DNI del admin `20000001` por el real de Kevin.
- [ ] `AUTH_SECRET` **distinto** en producción. El de desarrollo no se reusa nunca.
- [ ] Completar `src/lib/gimnasio.ts` (todo lo marcado `REVISAR`).
- [ ] Copiar las 3 fotos a `public/fotos/`.
- [ ] Proteger `main` en GitHub (Settings → Branches) y sumar al socio como colaborador.

---

## Ventana de pago mensual — implementada, apagada

El socio paga el 1° y tiene del 1 al 5 del mes siguiente para renovar sin quedarse afuera. Es un **cuarto estado** entre amarillo y rojo:

| Estado | Cuándo | ¿Entra? | Dueño ve | Socio ve |
|---|---|---|---|---|
| ACTIVO (verde) | Falta más que el umbral | Sí | — | "Cuota al día" |
| PRÓXIMO A VENCER (amarillo) | Faltan ≤ 7 días | Sí | "Entra en período de pago en N días" | "Te quedan N días" |
| **EN PERÍODO DE PAGO (naranja)** | Venció, dentro de la gracia | Sí | "Tiene que pagar: le quedan N días" | "Se te venció, tenés N días" |
| VENCIDO (rojo) | Se pasó la gracia | No | "Está moroso hace N días" | "Tu cuota está vencida" |

**Cómo se prende:** `DIAS_DE_GRACIA=5` en `.env.local`. Con `0` —el default— el sistema se comporta como la Regla de Oro 2 original: vencido es rojo y punto. Hay un test que fija ese comportamiento.

Está documentado en la **Regla de Oro 2 de `CLAUDE.md`**, no solo en el código: prenderlo significa que el gimnasio regala esos días de acceso, y eso es una decisión de negocio.

`mensajeParaAdmin()` y `mensajeParaSocio()` en `src/lib/cuota.ts` dan la misma información con dos tonos, y los reusan el dashboard y el portal.

**Los avisos automáticos por WhatsApp o mail siguen fuera del MVP.** Lo que sí entra es que el dueño vea la lista en el dashboard y el socio el mensaje en su portal.

---

## Base de datos local

PostgreSQL 18 local (servicio `postgresql-x64-18`), base `totalfit_dev`, rol dedicado `totalfit`. Migración aplicada y seed ejecutado.

**Cómo se llegó ahí**, por si hay que repetirlo en otra máquina: Docker no estaba instalado y la password del superusuario `postgres` es desconocida (se probaron varias, ninguna anduvo; no hay `pgpass.conf` ni `PGPASSWORD`). Como recargar la config de Postgres necesita permisos de Administrador, Kevin corrió un script elevado que hizo backup de `pg_hba.conf`, lo puso en `trust` unos segundos, creó rol y base, y lo restauró en un bloque `finally`.

Se creó un **rol dedicado** en vez de cambiar la password del superusuario: así nada más que use ese Postgres se rompe, y la app corre con permisos mínimos.

### Usuarios de prueba cargados

| DNI | Quién | Para qué |
|---|---|---|
| `20000001` | Kevin Admin | El usuario del panel |
| `20000002` | Fernando Profe | Personal de prueba |
| `10000001` | Ana Gómez | Al día → verde |
| `10000002` | Bruno Álvarez | Vence en 3 días → amarillo |
| `10000003` | Carla Ibáñez | Venció hace 10 días → rojo |
| `10000004` | Diego Sosa | Nunca pagó → rojo. **Sin teléfono a propósito**, para probar que no pueda crear clave |

Las contraseñas están en `.env.local`, que está gitignoreado.

> **Regla del repo:** ninguna contraseña se escribe en un archivo versionado, ni siquiera de una cuenta de prueba.

---

## Deuda técnica

- `npm audit`: 3 vulnerabilidades **high** en `deepmerge-ts`, que entra por `@prisma/config` → `prisma` (CLI). Cadena de **devDependency**, no llega al runtime. El fix automático baja a Prisma 6 (breaking). Revisar cuando Prisma publique el bump.
- Los datos del gimnasio están en un archivo, no en la base. Si el dueño los quiere editar solo, hay que sacarlos a una tabla.
- **`prisma migrate dev` no corre en esta máquina.** El rol `totalfit` no tiene `CREATEDB` y Prisma necesita crear una base "shadow" temporal para cada migración: falla con `P3014`. Se destraba de una vez con `ALTER ROLE totalfit CREATEDB;` desde un superusuario — el mismo trámite del script elevado con `pg_hba.conf`. Hasta entonces, cada migración se genera a mano con los tres pasos que quedaron documentados en la bitácora del 27/08.
- Queda una rama local `respaldo-antes-de-limpiar` (nunca se sube) de la limpieza del historial. Se puede borrar: `git branch -D respaldo-antes-de-limpiar`.

---

## Bitácora

- **27/08/2026** — **Aislamiento por sede (`feature/03`).** Total Fit es una cadena de tres sucursales sobre un solo servidor y una sola base, pero cada una tiene que ver únicamente lo suyo.
  - **El hallazgo:** `sede_id` ya viajaba en el JWT y en `session.user` desde el día uno — y no se usaba en **ni una sola query**. El modelo multi-sede estaba declarado y nunca aplicado. El trabajo no fue rediseñar, fue hacerlo cumplir.
  - **Se descartó una tabla por sucursal.** Triplicaría cada query, rompería el DNI único, obligaría a migrar tres veces y a tocar código cada vez que abren una sede. El aislamiento sale igual filtrando por `sede_id`.
  - **`sedeId` es el primer parámetro obligatorio** de cada función de listado (`listarSocios`, `listarPersonal`, `obtenerResumen`, `listarAsistencias`, `evaluarIngresoPorDni`). Si se olvida, no compila. Es la diferencia entre "me acordé de filtrar" y "no puedo no filtrar". Al hacer el cambio, TypeScript listó solo las 9 llamadas que había que tocar.
  - **`Pago` y `Asistencia` se sellan con su propia sede.** Antes la deducían del socio; con el traslado, eso habría movido el historial entero con la persona y reescrito la caja pasada de las dos sedes. Un pago queda contado donde se cobró, para siempre.
  - **Desaparecen los `<select name="sede_id">`** del alta y de la edición de socio: eran campos de formulario comunes, o sea que un profe podía dar de alta —o mudar— un socio en la sucursal de al lado editando el HTML. Ahora la sede sale de la sesión y se muestra como texto fijo.
  - **Traslado de socio.** Si el DNI ya existe en otra sede, el alta no tira un error seco: muestra nombre y sucursal para que el profe confirme que es la misma persona, y ofrece traerla. Solo **hacia** la propia sede — un profe no puede sacar a nadie del padrón ajeno.
  - **Rol `DUENIO`.** Ve el total de la cadena en el dashboard y elige sucursal con un selector. Queda resuelta la decisión que estaba abierta sobre si hacía falta un rol separado.
  - **La puerta** rechaza al socio de otra sede aunque tenga la cuota al día, y no le escribe asistencia.
  - **El candado del último admin pasa a contarse por sede.** Era global: se podía dejar una sucursal sin nadie que pudiera entrar al panel porque quedaban admins en las otras.
  - **Rutinas apagadas** con `RUTINAS_HABILITADAS=false`: el gimnasio ya las reparte con su propio QR. El código y sus tests quedan enteros; el día de la entrega se prende la variable y se muestra andando.
  - Verificado contra la app corriendo y la base real: 10 chequeos end-to-end (el padrón no muestra al ajeno, su ficha da 404, la puerta lo rechaza, el dueño ve las tres sedes, el admin no). 90 tests, `lint` y `build` limpios.
  - **Ojo con el seed:** ahora reasigna `sede_id` al volver a correrlo. Antes no lo hacía, así que re-sembrar no podía corregir una sede mal cargada.
  - **Los datos demo no dependen de una variable.** `SEED_DATOS_DEMO=true` vive en el `.env.local` de desarrollo y el CLI de Prisma lo carga aunque no esté en la terminal — apuntar el seed a producción alcanzó para meterle 5 socios inventados a la base de Supabase el primer día. El candado ahora es la **cadena de conexión**: los socios de prueba solo entran si la base es `localhost`. Una variable de entorno no sirve de protección cuando su default vive en un archivo. Antes no lo hacía, así que re-sembrar no podía corregir una sede mal cargada.
- **27/08/2026** — **Rutinas (bloque D).** El profe sube un PDF o una foto desde la ficha del socio; el socio la descarga desde `/mi-cuenta`, y solo si entró con su clave. Tres decisiones que valen más que el código:
  - **Route handler en vez de signed URL.** El plan original decía signed URL de corta duración. Se cambió: esa URL *es* la credencial, y una URL se reenvía por WhatsApp, queda en el historial y se filtra por el `Referer`. Ahora el servidor baja el archivo del bucket privado y lo pasa, después de verificar la cookie firmada. Mismo criterio que "el socio nunca viaja en la URL".
  - **Se valida por *magic bytes*, no por `Content-Type`.** El tipo que declara el navegador y la extensión del nombre los elige quien sube el archivo: un `.exe` renombrado a `.pdf` viaja con `application/pdf` sin chistar. Se mira el prefijo real del archivo (`%PDF`, `FF D8 FF`, `89 50 4E 47`, `RIFF…WEBP`). Hay un test que sube justamente ese `.exe` disfrazado.
  - **`subida_por` en el modelo.** Regla de Oro 4 aplicada a rutinas: queda registrado qué profe le cargó la rutina a quién, tomado de la sesión del servidor. Hay un test que manda un `subida_por` falso en el formulario y verifica que se ignora.
  - La ruta del socio (`/api/mi-rutina`) hubo que **sacarla del matcher de `proxy.ts`**: ese matcher exigía sesión de ADMIN para todo `/api/*`, así que el socio habría recibido un redirect al login en vez de su archivo. La del admin (`/api/rutina/[usuarioId]`) sí queda cubierta, y además revalida por su cuenta.
  - Cada subida deja una fila nueva; la anterior queda como histórico.
  - **Lo que falta para darlo por cerrado:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_STORAGE_BUCKET` en `.env.local`, y el bucket `rutinas` creado **privado** en el panel. Sin eso no se pudo probar contra el storage real. Todo lo anterior sí: 71 tests, `lint` y `build` limpios.
  - **Migración a mano.** `prisma migrate dev` falló con `P3014` (ver Deuda técnica). La migración `20260827014719_rutina_trazabilidad` se generó con `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`, se aplicó con `prisma db execute --file` y se registró con `prisma migrate resolve --applied`. `prisma migrate status` quedó consistente. Ojo: los flags cambiaron en Prisma 7, `--from-schema-datasource` ya no existe.
- **19/08/2026** — **Guía de entrada para el compañero.** `BIENVENIDO.md` junta en un lugar el arranque, las pantallas que existen, qué falta, dónde tocar los estilos, qué no romper y el flujo con git. El README apunta ahí desde la primera línea. Publicado también como página web para pasarle el link sin que clone.
- **19/08/2026** — **Editar socio y bitácora de ingresos.** `/socios/[id]/editar` permite corregir nombre, apellido, teléfono, email, sede y **el DNI**. Eso último destraba el import: los 349 socios entran con DNI provisorio y se corrige cuando la persona aparece por la puerta. El DNI sigue siendo único, se chequea antes de guardar. La clave y el estado se editan aparte, para que un error tipeando no deje a nadie afuera. Además `/asistencias`: filtros por hoy, 7 y 30 días, búsqueda y conteo de personas distintas. Solo lectura (Regla 3): en `src/lib/asistencias.ts` no hay ninguna función que modifique.
- **19/08/2026** — **Claves de socio.** El socio se crea su clave verificando los **últimos 4 dígitos del teléfono** que ya tenemos: es el segundo dato que un desconocido con solo el DNI no tiene. Con 349 socios, ponerlas de a una era inviable. La sesión pasa a tener dos niveles: `BASICO` (DNI solo) ve cuota, plan, pagos e ingresos; `COMPLETO` (con clave) va a ser el único que descargue la rutina. El nivel viaja dentro de lo firmado con HMAC — verificado que una cookie con el nivel cambiado a mano se rechaza. Sin teléfono cargado no se deja crear clave.
  - **Desvío deliberado del plan:** decía reemplazar `sesion-socio.ts` por NextAuth. Se mantuvo la cookie propia porque el modelo de dos niveles se expresa mejor ahí y la propiedad de seguridad es la misma. Meter a los socios en NextAuth sumaba un provider y el riesgo de que una sesión de socio pase por algún chequeo pensado para admins, a cambio de nada.
- **19/08/2026** — **Modo claro/oscuro y responsive completo.** `next-themes` estaba instalado pero sin conectar: el panel era siempre claro y la parte pública siempre oscura. Ahora hay `ProveedorTema` en el layout raíz y `BotonTema` en las cuatro superficies. El botón dibuja los dos íconos y deja que CSS muestre el que va, en vez de usar estado de "ya monté": sale igual del servidor y del cliente, sin parpadeo. Las páginas públicas dejan de tener `bg-neutral-950` hardcodeado y pasan a tokens. Además: el historial desplegado ya no tapa el tinte de la fila, y las dos tablas que faltaban tienen tarjetas en celular.
- **19/08/2026** — **Cobro desde la planilla y pantalla propia del socio.** El botón de cobrar sirve también para el socio que nunca pagó: abre un formulario corto en el lugar. El alta suma un primer pago opcional, porque lo normal es que el socio pague el mismo día que se anota. `/mi-cuenta` pasa a ser una pantalla completa con cuota, plan, historial de pagos, ingresos y el lugar reservado para la rutina. El socio se identifica con cookie firmada, no con el DNI en la URL: una URL se comparte, queda en el historial y se filtra por el `Referer`.
- **19/08/2026** — **Tres correcciones.** (1) **Bug de ingreso:** el campo de contraseña se ocultaba con CSS pero seguía en el DOM y se enviaba igual; bastaba que el navegador lo autocompletara para que un socio recibiera "DNI o contraseña incorrectos" sin entender por qué. Ahora no se renderiza. (2) **Historial desplegable** en la planilla, cargado a pedido. (3) **Recepción sale del menú** y se abre desde el dashboard: es la pantalla de la PC de la puerta, no una tarea de administración.
- **19/08/2026** — **Repo publicado y limpio.** Antes del primer push se escaneó el historial buscando secretos: apareció la contraseña de una cuenta de prueba en tres commits. Se reescribió el historial con `git filter-branch` y **se rotó igual esa contraseña**, porque una credencial expuesta se rota aunque se borre el rastro.
- **19/08/2026** — **Landing, mobile-first y puerta única.** La página pública pasa a landing completa con los datos saliendo de `src/lib/gimnasio.ts`. `/ingresar` gana el selector "Soy socio / Trabajo acá". **Mobile-first como convención** (`CLAUDE.md` §9): las tablas grandes se duplican en tarjetas para el celular. Nota: lucide v1 sacó los íconos de marcas, Instagram se dibuja con `AtSign`.
- **19/08/2026** — **Planilla editable.** `/socios` pasa a ser la planilla que el gimnasio ya sabe leer, con filtros, la fila pintada según el estado, el vocabulario viejo (Pagado / Por vencer / Falta pagar / Sin pagos) y el botón "Pagó" que repite el último pago en un click.
- **19/08/2026** — **Base andando y todo verificado end-to-end** contra datos reales. Ver la tabla de las Reglas de Oro más arriba.
- **19/08/2026** — **Gestión del personal.** Alta con contraseña obligatoria (bcrypt 12 rondas), reset y baja. Dos candados anti-lockout: nadie se da de baja a sí mismo y no se puede desactivar al último admin activo.
- **19/08/2026** — **Panel del dueño y portal del cliente.** Dashboard con contadores derivados, `/socios` con búsqueda y ficha completa. Todas las acciones pasan por `exigirAdmin()`; el formulario de pago no manda ni el admin ni el vencimiento.
- **19/08/2026** — **Ventana de pago.** Cuarto estado `EN_PERIODO_DE_PAGO`, apagado por defecto.
- **19/08/2026** — **Página pública** y descubrimiento de que este shadcn está sobre **Base UI y no Radix**: no hay `asChild`, va `render={<Link/>}`.
- **19/08/2026** — **Auth y recepción.** NextAuth v5 con config partida (`auth.config.ts` edge-safe para `proxy.ts`). Mensaje de error único y comparación contra un hash descartable cuando el DNI no existe, para no filtrar por tiempo de respuesta quién está registrado.
- **19/08/2026** — **Schema y cálculo de cuota.** Las 5 entidades, `dni` unique, FK de `Asistencia` en RESTRICT para que borrar un socio no arrastre su bitácora. `src/lib/cuota.ts` con la única implementación del estado, comparando por día calendario argentino.
- **19/08/2026** — **Scaffolding.** Next.js 16, Tailwind v4, App Router, `src/`.
- **18/08/2026** — Creados `CLAUDE.md` y `PROGRESO.md` a partir del modelo de datos y la planilla real.
