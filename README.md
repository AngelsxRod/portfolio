# Portfolio

Monorepo con Turborepo y pnpm, creado a partir del ejemplo `with-docker`.

## Estructura

- `apps/web`: aplicación Next.js (puerto 3000).
- `apps/api`: API NestJS con Fastify (puerto 3001).
- `packages/ui`, `logger`, `eslint-config`, `typescript-config` y `jest-presets`: paquetes compartidos.

Requiere Node.js 24.21 o superior y pnpm 11.25.0.

## Desarrollo

```sh
pnpm install --frozen-lockfile
pnpm db up
cp apps/api/.env.example apps/api/.env
pnpm dev
```

`pnpm dev` abre la TUI de Turborepo para consultar y seleccionar los registros de cada tarea.

PostgreSQL escucha en `localhost:55432` y conserva sus datos en el volumen Docker `postgres_data`. El API lee `DATABASE_URL` desde `apps/api/.env`. Para comprobar la conexión, consulta `GET /status/db`: responde `200` si la base está disponible y `503` si no lo está.

Para detener solo PostgreSQL, usa `pnpm db down`. Para iniciarlo de nuevo, usa `pnpm db up`. Ambos comandos conservan los datos del volumen.

El esquema de Drizzle está en `apps/api/src/db/schema.ts`. Después de definir tablas, genera y aplica las migraciones con:

```sh
pnpm --filter api db:generate
pnpm --filter api db:migrate
```

Para verificar el proyecto:

```sh
pnpm build
pnpm lint
pnpm test
```

`pnpm check` ejecuta formato, lint, pruebas y compilación. Las pruebas HTTP de borradores con persistencia se habilitan con `TEST_DATABASE_URL`, que debe apuntar a un PostgreSQL temporal con las migraciones aplicadas. Sin esa variable se ejecutan las pruebas habituales, incluida la denegación de acceso a todas las rutas de borradores. Para incluir la persistencia en el control completo:

```sh
DATABASE_URL="$TEST_DATABASE_URL" pnpm --filter api db:migrate
TEST_DATABASE_URL="$TEST_DATABASE_URL" pnpm check
```

Configura `TEST_DATABASE_URL` antes de esos comandos; usa una base aislada de los datos del portafolio. Las pruebas crean registros propios con slugs únicos y los eliminan al finalizar.

## Acceso administrativo

Inicia PostgreSQL y aplica la migración con `pnpm --filter api db:migrate`. En una terminal interactiva ejecuta `pnpm admin:hash`, usa una contraseña de al menos 12 caracteres y copia el hash resultante a `ADMIN_PASSWORD_HASH` en `apps/api/.env`; configura también `ADMIN_USERNAME` y `WEB_ORIGIN=http://localhost:3000`. Genera una cadena aleatoria de al menos 32 caracteres para `ADMIN_PROXY_SECRET` y configúrala con el mismo valor en `apps/api/.env` y `apps/web/.env`. La web usa `WEB_ORIGIN=http://localhost:3000` y `API_URL=http://localhost:3001` (ambos valores son los predeterminados locales). Abre `/admin/login`. La cookie vence después de ocho horas y el cierre de sesión la revoca en la API.

En Vercel, configura `WEB_ORIGIN` y el mismo `ADMIN_PROXY_SECRET` en ambos proyectos con el origen HTTPS exacto de `portfolio-web`; configura `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` únicamente en `portfolio-api`. Aplica la migración antes de habilitar el panel. Los despliegues de vista previa necesitan un `WEB_ORIGIN` propio. Consulta `docs/adr/0002-admin-access.md` para la decisión de seguridad.

La web usa `API_URL` del proyecto `portfolio-web` para comunicarse con el API desde una ruta del servidor. En otros entornos, configura `DATABASE_URL` con la URL de tu instancia PostgreSQL. La API conserva `GET /status`, `GET /status/db` y `GET /message/:name`; la conexión a PostgreSQL se abre al necesitarla.

Después de entrar, `/admin` muestra borradores y proyectos publicados. El formulario permite crear y editar borradores, propone un slug editable y conserva lo escrito cuando la API devuelve errores. El panel permite publicar un borrador con resumen y descripción, o retirar un proyecto publicado para volver a editarlo. El listado público está en `/projects` y cada detalle en `/projects/[slug]`; solo muestran proyectos publicados. Las operaciones y los límites están en `docs/architecture.md`.

## Sitio público y contacto

El sitio público tiene varias páginas: `/` (portada), `/projects`, `/sobre-mi` (presentación y habilidades), `/experiencia` (trayectoria con pestañas de experiencia, educación y certificados; `/educacion` redirige aquí) y `/contacto`.

El formulario de `/contacto` usa Cloudflare Turnstile (`@marsidev/react-turnstile`). El navegador envía el mensaje a `POST /api/contact` de la web, que lo reenvía a `POST /contact` de la API; la API valida los datos, comprueba el token de Turnstile en el servidor y entrega el mensaje. Configura `TURNSTILE_SITE_KEY` en `apps/web` y `TURNSTILE_SECRET_KEY` en `apps/api` (en local sirven las claves de prueba de Cloudflare indicadas en los `.env.example`). Sin `TURNSTILE_SITE_KEY` la página muestra que el formulario no está disponible.

**Resend.** `ContactMailer` (`apps/api/src/contact/contact.ts`) envía el mensaje con Resend, con `replyTo` hacia quien escribió. Necesita `RESEND_API_KEY` (una clave de acceso de envío), `CONTACT_TO_EMAIL` (destino) y `CONTACT_FROM_EMAIL` (remitente con un dominio verificado en Resend, por ejemplo `Portafolio <contacto@kaled.dev>`) en `portfolio-api`. Sin ellas la API responde `503` y ningún mensaje se pierde en silencio.

## Despliegue en Vercel

El repositorio está vinculado a dos proyectos Vercel: `portfolio-web` (directorio raíz `apps/web`, preset Next.js) y `portfolio-api` (directorio raíz `apps/api`, preset NestJS). Ambos usan Node.js 24 y se despliegan desde `main`.

- `portfolio-web` necesita `API_URL` con la URL pública de `portfolio-api`.
- `portfolio-api` necesita `DATABASE_URL` con la conexión de PostgreSQL del entorno correspondiente.
- Las migraciones de Drizzle se aplican explícitamente con `pnpm --filter api db:migrate` usando la conexión de destino; el despliegue no modifica el esquema automáticamente.

La compilación de la web usa Webpack para que `pnpm check` funcione también en entornos donde Turbopack no puede abrir su puerto interno.

## Interfaz

`apps/web` usa Tailwind CSS v4 y carga los estilos compartidos de `packages/ui/src/styles/globals.css`. El catálogo completo disponible mediante `shadcn add --all` está en `packages/ui/src/components`; los componentes se importan como `@repo/ui/components/button`. El layout ya incluye `TooltipProvider`.

Para añadir un componente nuevo del catálogo desde la raíz del repositorio:

```sh
pnpm dlx shadcn@canary add nombre-del-componente -c apps/web
```

El CLI usa los archivos `components.json` de la web y del paquete UI para colocar los componentes y sus dependencias en el workspace correcto.

## Arquitectura y skills

La dirección del portafolio con panel de administración está en `docs/architecture.md`. El avance y la siguiente etapa están en `PROGRESS.md`. Las skills del proyecto están copiadas en `.agents/skills` y sus orígenes se registran en `skills-lock.json`; están disponibles para Codex al trabajar en este repositorio. Incluyen revisión de arquitectura, diseño frontend, pruebas, navegación y prácticas de seguridad. Son guías para el desarrollo, no dependencias de la aplicación ni funciones del CMS.

## Calidad y commits

Al instalar dependencias, Husky activa estos hooks de Git:

- `pre-commit`: Prettier sobre los archivos preparados mediante lint-staged.
- `commit-msg`: exige Conventional Commits, por ejemplo `feat(api): connect Neon`.
- `pre-push`: ejecuta `pnpm check` (formato, lint, pruebas y compilación).

GitHub Actions ejecuta el mismo control en cada push a `main` y en los pull requests.

## Docker

```sh
docker compose up --build -d
```

Para habilitar el panel también en Compose, proporciona `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` y `ADMIN_PROXY_SECRET` como variables de entorno del proceso que ejecuta Compose. El servicio web usa `http://api:3001` dentro de la red de Docker.

La web estará en http://localhost:3000 y la API en http://localhost:3001/status. Compose inicia PostgreSQL antes que el API. Para detener los contenedores:

```sh
docker compose down
```
