# Bienvenido al proyecto

> Si acabás de entrar al repo, leé esto primero. En 15 minutos tenés el proyecto corriendo y sabés qué tocar.

---

## 1. Qué es esto

Un sistema de gestión para el gimnasio **Total Fit**, en Junín. Reemplaza la planilla de Google Sheets que usan hoy para llevar ~349 socios, sus pagos y sus vencimientos.

Tiene tres caras:

| Cara | Quién la usa | Para qué |
|---|---|---|
| **Landing pública** | Cualquiera | Ver el gimnasio, planes, horarios, ubicación |
| **La puerta** | El profe en el mostrador | Escribe el DNI → 🟢 pasa / 🟡 por vencer / 🔴 no pasa |
| **El panel** | El dueño y los profes | Socios, cobros, caja, personal |

Y el socio entra desde su celular con el DNI para ver si tiene la cuota al día.

**Estado:** el sistema funciona de punta a punta contra una base real. 50 tests, 24 commits.

---

## 2. Arrancarlo en tu máquina

Necesitás **Node 20+** y **PostgreSQL** corriendo local.

```bash
git clone https://github.com/kevindlf/TotalFitGym.git
cd TotalFitGym
npm install
```

Creá la base y el archivo de entorno:

```bash
# 1. Creá una base vacía en tu Postgres, por ejemplo:
createdb totalfit_dev

# 2. Copiá la plantilla de variables
cp .env.example .env.local
```

Abrí `.env.local` y completá:

- `DATABASE_URL` → tu conexión a Postgres (usuario, contraseña, nombre de la base)
- `AUTH_SECRET` → generalo con `npx auth secret`
- `SEED_ADMIN_DNI` y `SEED_ADMIN_PASSWORD` → los inventás vos, es tu usuario admin
- `SEED_DATOS_DEMO="true"` → **importante**, carga socios de prueba

Después:

```bash
npx prisma migrate deploy   # crea las tablas
npm run db:seed             # crea la sede, tu admin y los socios de prueba
npm run dev                 # http://localhost:3000
```

### Usuarios para probar

Con `SEED_DATOS_DEMO="true"` te quedan cargados estos socios, uno por cada color:

| DNI | Estado | Para qué sirve |
|---|---|---|
| `10000001` | 🟢 Al día | Ver el verde |
| `10000002` | 🟡 Vence en 3 días | Ver el amarillo |
| `10000003` | 🔴 Vencido | Ver el rojo |
| `10000004` | 🔴 Nunca pagó | Ver el caso "sin pagos" |

Para entrar al panel usá el DNI y la contraseña que pusiste en `SEED_ADMIN_*`.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Los 50 tests |
| `npm run lint` | ESLint |
| `npm run build` | Build de producción |
| `npm run db:studio` | Explorador visual de la base |

---

## 3. Qué está hecho

Estas son todas las pantallas que existen. Son las que tenés para trabajar.

| Ruta | Qué es |
|---|---|
| `/` | **Landing pública.** Hero, actividades, planes, horarios, ubicación |
| `/ingresar` | **Puerta única.** Socio con DNI · personal con DNI + contraseña |
| `/mi-cuenta` | **Pantalla del socio.** Su cuota, plan, pagos, ingresos y (pronto) su rutina |
| `/dashboard` | **Panel del dueño.** Contadores, caja del mes, morosos |
| `/socios` | **Vista planilla.** Filtros, estado al costado, cobrar en un click |
| `/socios/nuevo` | Alta de socio, con primer pago opcional |
| `/socios/[id]` | Ficha: pagos con quién cobró, ingresos, cobrar, dar de baja |
| `/socios/[id]/editar` | Corregir datos, incluido el DNI |
| `/asistencias` | Bitácora de ingresos, solo lectura |
| `/personal` | Alta de profes/empleados, reset de contraseña |
| `/recepcion` | **La puerta.** DNI → verde/amarillo/rojo. Se abre desde el dashboard |

También está hecho: **modo claro y oscuro** con botón en las 4 superficies, y **responsive** en todas las pantallas (tarjetas en celular, tablas en escritorio).

---

## 4. Qué falta

| Falta | Bloqueado por |
|---|---|
| **Rutinas** (el profe sube el PDF, el socio lo baja) | Cuenta de Supabase |
| **Importar los 349 socios** de la planilla | El CSV de la planilla |
| **Deploy** en Vercel + Supabase | Lo anterior |
| **Datos reales del gimnasio** | Dirección, teléfono, Instagram, mail |
| **Las 3 fotos** del gimnasio | `portada.jpg`, `sala.jpg`, `frente.jpg` |

⚠️ Los datos del gimnasio que se ven hoy en la landing (dirección, teléfono) **son inventados**, están marcados con `REVISAR` en el código.

---

## 5. Estilos: dónde tocar

### 🎨 `src/app/globals.css` — el centro de todo

Acá está la paleta completa, en variables CSS:

- **Línea ~51, `:root`** → los colores del **modo claro**
- **Línea ~86, `.dark`** → los colores del **modo oscuro**
- **Línea ~75, `--radius`** → el redondeo de todo el sistema

Los tokens que importan:

```css
--background      /* fondo de la página */
--foreground      /* texto principal */
--card            /* fondo de tarjetas */
--muted           /* fondos secundarios */
--muted-foreground /* texto secundario */
--border          /* bordes */
--primary         /* color de los botones principales */
```

**Cambiar un token acá repinta toda la app, en las dos versiones de tema.** Es el lugar más eficiente para trabajar. Los colores están en formato `oklch()`, que es lo que usa Tailwind v4.

### 🧱 `src/components/ui/` — los componentes base

Son los primitivos de shadcn/ui: `button.tsx`, `input.tsx`, `card.tsx`, `table.tsx`, `badge.tsx`, `label.tsx`, `select.tsx`, `separator.tsx`.

Si tocás `button.tsx`, cambian **todos** los botones del sistema. Es el segundo lugar más eficiente.

> ⚠️ Este shadcn está construido sobre **Base UI, no Radix**. No existe la prop `asChild`. Para que un botón sea un link va `render={<Link href="..." />}`.

### 📝 `src/lib/gimnasio.ts` — los textos de la landing

Nombre, descripción, dirección, teléfono, horarios, actividades y qué incluye cada plan. **No hace falta entrar al JSX para cambiar un horario o un texto.**

### 📄 Las páginas

Si necesitás cambiar la estructura, están en `src/app/`. La landing es `src/app/page.tsx`.

**Regla importante:** las páginas usan **tokens, no colores fijos**.

```tsx
✅ className="bg-background text-muted-foreground border-border"
❌ className="bg-neutral-950 text-neutral-400"
```

Si escribís un color fijo, **rompés el modo claro** — ese elemento va a quedar oscuro siempre. Ya pasó una vez y hubo que migrar toda la parte pública.

---

## 6. Lo que no se puede romper

Son tres cosas. Cada una tiene un porqué concreto.

### 🚦 Los 4 colores de estado son semánticos

Verde, amarillo, naranja y rojo **no son decoración**: son lo que el profe lee de lejos, de reojo, con alguien esperando del otro lado del mostrador.

| Color | Significa |
|---|---|
| 🟢 Verde | Al día, pasa |
| 🟡 Amarillo | Por vencer, pasa |
| 🟠 Naranja | Venció pero está en período de pago, pasa y le avisa |
| 🔴 Rojo | No pasa |

Podés cambiar **el tono** (un verde más lindo, un rojo menos chillón). No cambies **el significado ni el orden**.

Viven en:
- `src/components/recepcion/resultado-acceso.tsx` ← la pantalla de la puerta
- `src/components/admin/estado-cuota-badge.tsx`
- `src/app/(admin)/socios/page.tsx` y `tarjeta-socio.tsx`

### 👁️ El color nunca comunica solo

Cada estado lleva **además** un ícono y un texto explícito ("PUEDE PASAR" / "NO PUEDE PASAR"). No saques ninguno de los dos: un recepcionista daltónico tiene que poder usar la pantalla de la puerta.

### 📱 Mobile primero

Esto se usa **más desde el celular que desde la computadora**. El socio consulta su cuota desde el teléfono y el profe cobra parado en el mostrador.

Toda pantalla arranca en una columna y recién se abre en `sm:` / `md:`.

Las tablas de más de 4 columnas **están duplicadas**:

```tsx
<ul className="md:hidden">        {/* tarjetas, para el celular */}
<div className="hidden md:block"> {/* tabla, para pantalla grande */}
```

**Si tocás una, tocá la otra.** Están en socios, personal, asistencias y la ficha del socio.

Probá siempre achicando la ventana a 360px de ancho. El `body` nunca tiene que scrollear de costado.

---

## 7. Git, paso a paso

### La primera vez

1. Kevin te manda una invitación de colaborador → **aceptala** (te llega por mail o en github.com/notifications)
2. Cloná el repo:

```bash
git clone https://github.com/kevindlf/TotalFitGym.git
cd TotalFitGym
```

### Cada vez que vayas a trabajar

```bash
# 1. Traé lo último de main
git switch main
git pull

# 2. Creá tu rama (nombre descriptivo)
git switch -c estilo/paleta-nueva

# 3. Trabajá y commiteá
git add .
git commit -m "estilo: nueva paleta de colores"

# 4. Antes de subir, que pasen las tres
npm test
npm run lint
npm run build

# 5. Subí tu rama
git push -u origin estilo/paleta-nueva
```

6. Andá a GitHub → te va a aparecer un botón **"Compare & pull request"** → abrí el PR y pedile a Kevin que lo revise.

### Reglas

- **`main` está protegida.** No se pushea directo, se entra por Pull Request.
- **Una rama por tarea.** Nombres tipo `estilo/`, `feat/`, `fix/`.
- Si tu rama quedó vieja, actualizala: `git switch main && git pull && git switch tu-rama && git merge main`

---

## 8. Reglas del repo

- 🔒 **Nunca commitear `.env.local`.** Tiene contraseñas. Ya está en `.gitignore`, no lo saques.
- 🔒 **Nunca escribir contraseñas en archivos versionados**, ni siquiera de cuentas de prueba. Van en `.env.local`.
- 📖 **Si vas a tocar lógica** (no estilos), leé `CLAUDE.md` primero. Tiene 4 reglas de negocio que el código no negocia.
- 💬 Código y nombres en **español**: socio, pago, cuota, sede, rutina.

---

## 9. Dónde seguir leyendo

| Archivo | Qué tiene |
|---|---|
| [`README.md`](README.md) | Arranque rápido y las 4 Reglas de Oro resumidas |
| [`CLAUDE.md`](CLAUDE.md) | **La fuente de verdad.** Modelo de datos, reglas de negocio, convenciones y notas de versiones |
| [`PROGRESO.md`](PROGRESO.md) | La bitácora: qué se hizo cada día, qué se decidió y por qué |

Si algo del código te parece raro, fijate primero si tiene un comentario arriba explicando por qué está así. Casi siempre lo tiene.

---

**¿Dudas?** Preguntale a Kevin. Y si encontrás algo roto, anotalo — mejor eso que arreglarlo por las tuyas si no estás seguro de por qué está así.
