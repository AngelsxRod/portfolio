# Progreso del portafolio

Este archivo registra el trabajo **verificado** del portafolio y su CMS. Actualízalo al terminar cada etapa; una casilla marcada debe corresponder a código o documentación existente, no a una intención.

## Estado actual

- **Etapa activa:** 4. Publicación y páginas públicas — completada; identidad visual y portada entregadas.
- **Última revisión:** 2026-10-22.
- **Siguiente entrega:** etapa 5, medios de proyectos; pendiente de iniciar en otra entrega.

### Base disponible

- [x] Monorepo con pnpm y Turborepo; web Next.js y API NestJS con Fastify.
- [x] PostgreSQL en Docker con comandos `pnpm db up` y `pnpm db down`.
- [x] Drizzle configurado con la tabla de proyectos y su migración inicial.
- [x] Tailwind CSS v4, shadcn/ui compartido y galería `/components`.
- [x] Dirección inicial de arquitectura en `docs/architecture.md` y skills locales en `.agents/skills`.
- [x] Portada pública, archivo y detalle de proyectos con una identidad visual documentada en `DESIGN.md`.
- [x] Autenticación y estructura del panel administrativo.
- [x] Creación, consulta y edición de borradores de proyectos.
- [x] Publicación y retirada de proyectos con listado y detalle públicos.

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

**Estado posterior:** el formato global ya no bloquea `pnpm check`; el comando completo pasó el 2026-10-22 durante la etapa 2.

### 2. Acceso administrativo

- [x] Elegir y documentar el mecanismo de autenticación/sesión en `docs/adr/`.
- [x] Implementar inicio y cierre de sesión para un administrador.
- [x] Proteger en el servidor todas las rutas privadas y preparar la estructura del panel.
- [x] Cubrir los casos de acceso permitido y denegado con pruebas de comportamiento.

**Criterio de cierre:** una persona sin sesión no puede leer ni modificar borradores.

**Verificación:** el guard NestJS deniega por defecto las rutas no públicas; `GET /admin/session` responde `401` sin sesión y con una sesión vencida, y `200` con una vigente. En el navegador, `/admin` redirige al login sin sesión; el inicio válido abre el panel y el cierre revoca el acceso. Aún no existen rutas de borradores ni operaciones de contenido.

### 3. Borradores de proyectos

- [x] Crear rutas de API para crear, listar y editar borradores con validación y autorización.
- [x] Construir la lista y el formulario de proyectos en el panel usando `@repo/ui`.
- [x] Comprobar los flujos principales y los errores desde el navegador.

**Criterio de cierre:** un administrador puede guardar un borrador y recuperarlo para editarlo; el público no puede verlo.

**Decisiones:** la API ofrece `GET` y `POST /admin/projects/drafts`, y `GET` y `PUT /admin/projects/drafts/:id`; solo opera sobre `draft`. El guard global valida la sesión y las escrituras comprueban el origen. El formulario propone un slug editable; la API rechaza campos desconocidos y cambios de estado, valida los campos en tiempo de ejecución y devuelve errores por campo y `409` para slugs duplicados. La lista se ordena por posición, creación e ID. No se cambió el esquema ni se añadieron publicación, eliminación o vistas públicas.

**Verificación:** `pnpm check` completo pasó con `TEST_DATABASE_URL` apuntando a PostgreSQL temporal: 20 pruebas de API (incluidas 6 de persistencia HTTP) y la prueba del paquete logger. En Chromium, sobre la compilación de producción local: acceso sin sesión redirigido al login; creación de borrador incompleto con slug sugerido; edición, listado y recuperación de todos los campos guardados; errores de tecnologías y slug duplicado con el formulario conservado; cierre de sesión seguido de redirección en la edición y `401` al leer directamente el borrador desde la API. La base existente conservó 0 proyectos y 2 migraciones antes y después. Las pruebas de persistencia se habilitan con `TEST_DATABASE_URL`; el procedimiento está documentado en `README.md`.

### 4. Publicación y páginas públicas

- [x] Añadir la acción de publicar o retirar un proyecto.
- [x] Mostrar solo proyectos publicados en la web, con página de listado y detalle por slug.
- [x] Resolver actualización de caché y estados vacíos.
- [x] Probar que un borrador nunca aparece en las rutas públicas.

**Criterio de cierre:** un proyecto publicado aparece en la web y uno retirado deja de aparecer.

**Decisiones:** `POST /admin/projects/:id/publish` y `POST /admin/projects/:id/unpublish` requieren sesión administrativa y origen válido. Publicar exige resumen y descripción no vacíos; ambas transiciones actualizan `updatedAt`. El panel separa borradores y publicados; un proyecto retirado vuelve a ser borrador editable. `GET /projects` y `GET /projects/:slug` filtran por `published`; la web usa `/projects` y `/projects/[slug]`. Las lecturas públicas usan `no-store` y páginas dinámicas. El Markdown omite HTML, imágenes y destinos de enlace inseguros. La portada de demostración permanece hasta una etapa posterior; no se cambió el esquema ni se avanzó a medios.

**Verificación:** `pnpm check` completo pasó con PostgreSQL temporal migrado: 25 pruebas de API y la prueba del paquete logger, además de formato, lint y compilación. En Chromium sobre la compilación de producción local, el borrador no apareció en el listado y su detalle devolvió `404`; el intento de publicar incompleto mostró errores de resumen y descripción; tras completar y publicar, apareció en listado y detalle con Markdown seguro; al retirarlo desapareció de ambos y volvió a borradores. La página 404 personalizada conservó el estado HTTP `404`. La base existente mantuvo 0 proyectos y 2 migraciones.

**Ajuste local verificado:** se configuraron archivos `.env` ignorados por Git para conectar la API de desarrollo a PostgreSQL y habilitar el administrador local. `GET /status/db`, `GET /projects` y la página `/projects` responden `200` en los puertos habituales. El inicio y cierre de sesión funcionan en Chromium; un error de acceso aparece como toast de shadcn/ui. `pnpm check` volvió a pasar después del ajuste de interfaz (17 pruebas de API sin `TEST_DATABASE_URL`; las 8 pruebas de persistencia ya habían pasado en la verificación de la etapa).

**Entrega visual posterior a la etapa 4:** `DESIGN.md` define el folio técnico, sus tokens, tipografía, composición, interacción, accesibilidad y criterios móviles. La portada de prueba se sustituyó por una portada pública que lee los proyectos publicados; archivo, detalle, estado vacío, error y 404 comparten esa identidad. Los tokens y componentes compartidos de shadcn/ui se ajustaron sin cambiar los flujos del panel. No se modificaron el esquema, las rutas de publicación ni los datos.

**Verificación de la entrega visual:** `pnpm check` completo pasó: formato, lint, 17 pruebas de API y la prueba de logger, y compilación. Las 8 pruebas de persistencia permanecieron omitidas porque esta ejecución no definió `TEST_DATABASE_URL`. En Chrome local se comprobó R&R Asociados en portada, archivo, detalle y panel; navegación entre páginas, 404, foco visible y enlace para saltar al contenido. A 375 px, portada, archivo y detalle no presentaron desplazamiento horizontal; también se revisaron en escritorio. Una sesión nueva no registró errores ni advertencias de consola durante la navegación. Los estados vacío y de error se implementaron, pero no se reprodujeron en esta verificación con la base que contiene el proyecto publicado.

**Carga de proyectos propios:** se añadieron y publicaron desde el CMS El Master (`el-master`), Lourdes Gómez (`lourdes-gomez`) y Cardo (`cardo`) en posiciones 1, 2 y 3, conservando R&R Asociados en la posición 0. Los textos describen secciones visibles de los sitios enlazados; tecnologías y enlaces de código quedaron vacíos por falta de datos confirmados. En Chrome se verificaron los cuatro proyectos en `/projects`, el detalle y la URL externa de cada proyecto nuevo; no aparecieron errores ni advertencias de consola. No se cambió el esquema ni se inició la etapa 5.

**Proyectos a cargo durante el trabajo en Bold:** se añadieron y publicaron QuincenaToGo (`quincena-to-go`) y Loginsa (`loginsa`) en posiciones 4 y 5. Sus resúmenes y detalles indican, según la información del usuario, que estuvieron a su cargo durante su trabajo en Bold; el detalle enlaza a `https://www.bold.gt/`. Las funciones descritas se comprobaron en los sitios públicos. Tecnologías, fechas, puesto y resultados no se añadieron. En Chrome se verificaron los seis proyectos en `/projects`, los dos nuevos detalles, los enlaces a los sitios y a Bold, y la consola sin errores ni advertencias. La sección de experiencia de la etapa 6 y los medios de la etapa 5 siguen pendientes.

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

| Fecha      | Etapa     | Resultado                                                                                        | Verificación                                                                                                                                                                                  | Pendientes                                                                                               |
| ---------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 2026-10-21 | Base      | Infraestructura, componentes y dirección de arquitectura disponibles.                            | Inspección del repositorio.                                                                                                                                                                   | Iniciar etapa 1.                                                                                         |
| 2026-10-21 | 1         | Esquema y migración aditiva de proyectos implementados y aplicados a PostgreSQL local.           | Tipos, lint y `drizzle-kit check` correctos; SQL revisado; restricciones probadas en transacción con `ROLLBACK` y tabla vacía.                                                                | Etapa 2: elegir y documentar autenticación, proteger rutas privadas y probar acceso permitido/denegado.  |
| 2026-10-21 | Técnica   | API migrada a NestJS con Fastify; Drizzle y datos conservados.                                   | Tipos, lint, 5 pruebas, compilación e imagen Docker correctos; tres rutas probadas en contenedor temporal; proyectos 0 y migraciones 1 antes y después.                                       | Etapa 2: acceso administrativo con origen único; corregir formato global preexistente en tarea separada. |
| 2026-10-22 | 2         | Sesiones administrativas revocables, guard privado por defecto y panel inicial.                  | `pnpm check` completo; 10 pruebas de API; `drizzle-kit check`; migración aditiva aplicada; navegador: acceso denegado, inicio válido y cierre; API real: sesión vencida `401`, vigente `200`. | Etapa 3: borradores; configurar credenciales y origen en cada despliegue antes de habilitar el panel.    |
| 2026-10-22 | 3         | Rutas privadas de borradores y lista/formulario con `@repo/ui`, validación y errores por campo.  | `pnpm check`; 20 pruebas de API con PostgreSQL temporal; navegador: crear, editar, recuperar, errores y acceso denegado sin sesión; base existente sin cambios (0 proyectos, 2 migraciones).  | Etapa 4 pendiente: publicación y páginas públicas.                                                       |
| 2026-10-22 | 4         | Publicación y retirada desde el panel; listado y detalle públicos con Markdown seguro.           | `pnpm check` con PostgreSQL temporal: 25 pruebas de API; Chromium: borrador oculto, publicación visible, retirada y 404; base existente: 0 proyectos y 2 migraciones.                         | Etapa 5 pendiente: medios de proyectos; portada pública completa aún pendiente.                          |
| 2026-10-22 | 4 visual  | `DESIGN.md`, portada de portafolio y rediseño de archivo, detalle y estados; tokens compartidos. | `pnpm check`; Chrome: R&R Asociados en portada, archivo, detalle y panel; 375 px y escritorio, teclado, navegación, 404 y consola sin errores nuevos.                                         | Etapa 5 pendiente; estados vacío y error aún sin reproducción en navegador con esta base.                |
| 2026-10-22 | Contenido | El Master, Lourdes Gómez y Cardo creados y publicados con texto basado en sus sitios.            | Chrome: cuatro proyectos en `/projects`; detalles y enlaces externos de los tres nuevos; consola sin errores ni advertencias.                                                                 | Etapa 5 pendiente; completar tecnologías o enlaces de código solo con datos confirmados.                 |
| 2026-10-22 | Contenido | QuincenaToGo y Loginsa publicados con contexto de trabajo en Bold.                               | Chrome: seis proyectos en `/projects`; ambos detalles, enlaces a sitios y Bold; consola sin errores ni advertencias.                                                                          | Etapas 5 y 6 pendientes; no se añadieron medios ni sección de experiencia.                               |

## Reglas para futuras sesiones

1. Leer este archivo, `AGENTS.md` y `docs/architecture.md` antes de editar.
2. Trabajar solo en la etapa activa, salvo corrección explícita del usuario.
3. Mantener las casillas y el registro fieles a lo implementado y verificado.
4. No marcar una etapa como terminada si falta su criterio de cierre; anotar bloqueos concretos.
5. Conservar los cambios existentes del repositorio y no borrar datos de PostgreSQL.
