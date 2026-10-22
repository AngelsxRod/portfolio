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

La web usa `API_URL` del proyecto `portfolio-web` para comunicarse con el API desde una ruta del servidor. En otros entornos, configura `DATABASE_URL` con la URL de tu instancia PostgreSQL. La API conserva `GET /status`, `GET /status/db` y `GET /message/:name`; la conexión a PostgreSQL se abre al necesitarla.

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

La web estará en http://localhost:3000 y la API en http://localhost:3001/status. Compose inicia PostgreSQL antes que el API. Para detener los contenedores:

```sh
docker compose down
```
