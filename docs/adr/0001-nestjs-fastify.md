# NestJS con Fastify para la API

Migramos la API de Express a NestJS para organizar las próximas capacidades del CMS mediante módulos y proveedores. Elegimos el adaptador Fastify porque el cambio solicitado excluye Express, que es el adaptador predeterminado de NestJS. Conservamos PostgreSQL, Drizzle y sus migraciones para evitar una conversión de datos innecesaria; el acceso administrativo se implementará después de verificar esta migración.
