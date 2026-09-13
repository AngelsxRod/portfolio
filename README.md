# Portfolio

Base del portafolio profesional de Angel Rodriguez. Es un único monorepositorio con dos
aplicaciones desplegadas de forma independiente en Vercel.

## Arquitectura

- `apps/web`: Next.js 16, React 19 y Tailwind CSS 4.
- `apps/api`: NestJS 11 desplegado como Vercel Function.
- `packages/database`: Drizzle ORM y Neon Postgres.
- `packages/contracts`: contratos Zod compartidos.
- `packages/ui`: componentes React compartidos.

## Requisitos

- Node.js 24
- pnpm 11.18
- Docker, únicamente para PostgreSQL local

## Desarrollo local

```bash
corepack enable
pnpm install
docker compose up -d postgres
cp .env.example apps/api/.env.local
printf 'API_URL=http://localhost:3001\n' > apps/web/.env.local
pnpm db:push
pnpm dev
```

Después de crear los archivos de entorno por primera vez, el flujo diario puede iniciarse con:

```bash
pnpm dev:local
```

El comando levanta PostgreSQL, sincroniza el esquema local y arranca API y web. Para
detener únicamente los servicios Docker usa `pnpm dev:services:down`.

- Web: <http://localhost:3000>
- API: <http://localhost:3001/api/health>
- Swagger: <http://localhost:3001/docs>

## Comprobaciones

```bash
pnpm check
```

## Despliegue

Importa este mismo repositorio dos veces en Vercel:

1. `portfolio-api`, con Root Directory `apps/api`.
2. `portfolio-web`, con Root Directory `apps/web` y `API_URL` apuntando a la URL estable
   del proyecto API.

Conecta una base Neon exclusiva al proyecto API. Neon inyectará `DATABASE_URL` y
`DATABASE_URL_UNPOOLED`. Los previews de ambas aplicaciones se generan desde el mismo commit,
pero el preview web usa inicialmente la API estable de producción.
