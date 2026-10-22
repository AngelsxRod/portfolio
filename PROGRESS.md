# Progreso del portafolio

Este archivo registra el trabajo **verificado** del portafolio y su CMS. Actualízalo al terminar cada etapa; una casilla marcada debe corresponder a código o documentación existente, no a una intención.

## Estado actual

- **Etapa activa:** 2. Acceso administrativo.
- **Última revisión:** 2026-10-21.
- **Siguiente entrega:** mecanismo de autenticación y protección de rutas privadas, sin operaciones de contenido todavía.

### Base disponible

- [x] Monorepo con pnpm y Turborepo; web Next.js y API NestJS con Fastify.
- [x] PostgreSQL en Docker con comandos `pnpm db up` y `pnpm db down`.
- [x] Drizzle configurado con la tabla de proyectos y su migración inicial.
- [x] Tailwind CSS v4, shadcn/ui compartido y galería `/components`.
- [x] Dirección inicial de arquitectura en `docs/architecture.md` y skills locales en `.agents/skills`.
- [ ] Portafolio público real; la página principal sigue siendo una demostración de la API.
- [ ] Autenticación, panel administrativo y operaciones de contenido.

## Etapas

Trabajar **una etapa a la vez**. No empezar la siguiente hasta verificar la actual y actualizar este archivo. Si una decisión cambia el alcance, anotar el motivo antes de continuar.

### 1. Modelo inicial de proyectos — completada

- [x] Definir los campos mínimos de un proyecto y las reglas de borrador/publicación, siguiendo `docs/architecture.md`.
- [x] Implementar la tabla de proyectos en Drizzle con identificador no secuencial, slug único, estado, orden y fechas.
- [x] Generar y revisar la migración SQL, sin borrar datos ni aplicar cambios destructivos.
- [x] Verificar tipos, lint y generación de migraciones.
- [x] Registrar aquí las decisiones tomadas y cualquier pendiente.

**Criterio de cierre:** el esquema y la migración representan proyectos editables y publicables; aún no hay rutas de escritura abiertas al público.

**Decisiones:** un proyecto tiene UUID, título, slug, resumen de texto plano, descripción Markdown, enlaces opcionales de demo y código, tecnologías, posición, estado y fechas de creación/actualización. `draft` es el estado inicial; `published` exige resumen y descripción no vacíos. El slug es único entre todos los estados. Las imágenes se añaden en la etapa 5. La descripción se almacena como contenido no confiable; las futuras rutas validarán entradas y URL, y la vista pública deberá renderizar Markdown de forma segura y consultar solo `published`. Las futuras escrituras deberán actualizar `updatedAt`.

### Entrega técnica previa a la etapa 2 — migración a NestJS completada

El usuario solicitó migrar primero el backend de Express a NestJS y conservar Drizzle. La decisión está documentada en `docs/adr/0001-nestjs-fastify.md`.

- [x] Reemplazar Express por NestJS con Fastify y conservar las tres rutas existentes.
- [x] Mantener PostgreSQL, el esquema de proyectos y las migraciones Drizzle sin cambios.
- [x] Verificar tipos, lint, pruebas, compilación e imagen Docker con una instancia temporal.
- [x] Confirmar que los recuentos de proyectos y migraciones permanecen iguales.

**Verificación adicional:** `pnpm lint`, `pnpm test` y `pnpm build` pasan en el monorepo; los archivos modificados pasan Prettier. `pnpm check` se detiene en `format:check` por 21 archivos preexistentes fuera de esta entrega (skills locales y metadatos Drizzle); queda pendiente corregir ese formato global en una tarea separada.

### 2. Acceso administrativo

- [ ] Elegir y documentar el mecanismo de autenticación/sesión en `docs/adr/`.
- [ ] Implementar inicio y cierre de sesión para un administrador.
- [ ] Proteger en el servidor todas las rutas privadas y preparar la estructura del panel.
- [ ] Cubrir los casos de acceso permitido y denegado con pruebas de comportamiento.

**Criterio de cierre:** una persona sin sesión no puede leer ni modificar borradores.

### 3. Borradores de proyectos

- [ ] Crear rutas de API para crear, listar y editar borradores con validación y autorización.
- [ ] Construir la lista y el formulario de proyectos en el panel usando `@repo/ui`.
- [ ] Comprobar los flujos principales y los errores desde el navegador.

**Criterio de cierre:** un administrador puede guardar un borrador y recuperarlo para editarlo; el público no puede verlo.

### 4. Publicación y páginas públicas

- [ ] Añadir la acción de publicar o retirar un proyecto.
- [ ] Mostrar solo proyectos publicados en la web, con página de listado y detalle por slug.
- [ ] Resolver actualización de caché y estados vacíos.
- [ ] Probar que un borrador nunca aparece en las rutas públicas.

**Criterio de cierre:** un proyecto publicado aparece en la web y uno retirado deja de aparecer.

### 5. Medios de proyectos

- [ ] Elegir y documentar almacenamiento de imágenes en `docs/adr/`.
- [ ] Implementar carga, validación, texto alternativo y asociación con proyectos.
- [ ] Probar permisos, límites y visualización.

### 6. Resto del contenido

Implementar cada tipo en una entrega separada, con su esquema, edición, publicación y vista pública:

- [ ] Habilidades.
- [ ] Experiencia laboral.
- [ ] Educación: diversificado/bachillerato y universidad.
- [ ] Certificados y diplomas.
- [ ] Perfil, enlaces y datos de contacto públicos.

## Registro de entregas

| Fecha      | Etapa   | Resultado                                                                              | Verificación                                                                                                                                            | Pendientes                                                                                               |
| ---------- | ------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 2026-10-21 | Base    | Infraestructura, componentes y dirección de arquitectura disponibles.                  | Inspección del repositorio.                                                                                                                             | Iniciar etapa 1.                                                                                         |
| 2026-10-21 | 1       | Esquema y migración aditiva de proyectos implementados y aplicados a PostgreSQL local. | Tipos, lint y `drizzle-kit check` correctos; SQL revisado; restricciones probadas en transacción con `ROLLBACK` y tabla vacía.                          | Etapa 2: elegir y documentar autenticación, proteger rutas privadas y probar acceso permitido/denegado.  |
| 2026-10-21 | Técnica | API migrada a NestJS con Fastify; Drizzle y datos conservados.                         | Tipos, lint, 5 pruebas, compilación e imagen Docker correctos; tres rutas probadas en contenedor temporal; proyectos 0 y migraciones 1 antes y después. | Etapa 2: acceso administrativo con origen único; corregir formato global preexistente en tarea separada. |

## Reglas para futuras sesiones

1. Leer este archivo, `AGENTS.md` y `docs/architecture.md` antes de editar.
2. Trabajar solo en la etapa activa, salvo corrección explícita del usuario.
3. Mantener las casillas y el registro fieles a lo implementado y verificado.
4. No marcar una etapa como terminada si falta su criterio de cierre; anotar bloqueos concretos.
5. Conservar los cambios existentes del repositorio y no borrar datos de PostgreSQL.
