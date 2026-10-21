# Portfolio

Monorepo con Turborepo y pnpm, creado a partir del ejemplo `with-docker`.

## Estructura

- `apps/web`: aplicación Next.js (puerto 3000).
- `apps/api`: API Express (puerto 3001).
- `packages/ui`, `logger`, `eslint-config`, `typescript-config` y `jest-presets`: paquetes compartidos.

Requiere Node.js 24.21 o superior y pnpm 11.25.0.

## Desarrollo

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Para verificar el proyecto:

```sh
pnpm build
pnpm lint
pnpm test
```

El API usa `DATABASE_URL` para conectarse a Neon. En producción, esa variable la proporciona la integración Neon del proyecto `portfolio-api` en Vercel. Para probar la conexión sin exponer credenciales, consulta `GET /status/db`; responde `200` cuando la base está disponible y `503` cuando no lo está. La web usa `API_URL` del proyecto `portfolio-web` para comunicarse con el API desde una ruta del servidor.

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

La web estará en http://localhost:3000 y la API en http://localhost:3001/status. Compose crea la red interna automáticamente. Para detener los contenedores:

```sh
docker compose down
```
