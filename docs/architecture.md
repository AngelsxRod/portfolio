# Arquitectura del portafolio y CMS

## Estado actual

El repositorio tiene una web Next.js, una API NestJS con Fastify, PostgreSQL con Drizzle y componentes compartidos en `packages/ui`. Existen proyectos, autenticación administrativa, edición de borradores, publicación y páginas públicas. Existen imágenes de proyectos (etapa 5) y habilidades (etapa 6, entrega 1); experiencia, educación, certificados y perfil siguen pendientes.

## Responsabilidades

| Módulo            | Responsabilidad                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | Presentar el portafolio público y el panel administrativo. Los formularios envían datos a la API; la web no accede directamente a PostgreSQL. |
| `apps/api`        | Exponer rutas con NestJS y Fastify; validar entradas, autenticar, autorizar, aplicar reglas de publicación y leer o escribir contenido.       |
| `apps/api/src/db` | Definir el esquema y las consultas con Drizzle. Las migraciones son la fuente de cambios de estructura.                                       |
| `packages/ui`     | Componentes visuales reutilizables sin reglas del dominio ni acceso a datos.                                                                  |

Mantener módulos por capacidad del dominio: proyectos, habilidades, educación, certificados, experiencia y perfil. Cada capacidad debe exponer una interfaz pequeña para sus casos de uso y ocultar las consultas y reglas que los implementan. Crear adaptadores solo cuando haya una variación real, como dos proveedores de almacenamiento; no añadir capas que solo reenvían llamadas.

## Modelo de contenido previsto

- **Perfil:** nombre público, presentación, ubicación opcional, enlaces y datos de contacto públicos.
- **Proyecto:** título, slug único, resumen, descripción, enlaces, tecnologías, imágenes, posición y estado de publicación.
- **Habilidad:** nombre, categoría, posición y relación opcional con proyectos.
- **Experiencia:** organización, puesto, fechas, descripción, logros y posición.
- **Educación:** institución, nivel (diversificado o bachillerato, universidad u otro), programa, fechas y descripción.
- **Certificado:** nombre, emisor, fecha, enlace de verificación y archivo opcional.
- **Medio:** referencia a archivo, tipo, texto alternativo y metadatos necesarios para mostrarlo.

Los registros editables deben tener identificadores no secuenciales, `createdAt`, `updatedAt` y una distinción explícita entre borrador y publicado. El contenido público solo consulta elementos publicados. Definir el esquema exacto cuando implementemos la primera capacidad; evitar tablas genéricas de clave-valor que oculten estas reglas.

## Flujo de una edición

1. El panel envía una petición a la API con una sesión válida.
2. La API verifica identidad y permiso para la operación, valida los datos en tiempo de ejecución y aplica las reglas del dominio.
3. Drizzle ejecuta la escritura en PostgreSQL. Los cambios relacionados que deban ser atómicos usan una transacción.
4. La API devuelve el resultado o un error estable. La web muestra el estado sin asumir que un botón oculto equivale a autorización.
5. La vista pública lee únicamente la versión publicada. Al publicar, debe actualizarse o invalidarse cualquier caché que sirva ese contenido.

## Seguridad mínima para el panel

- Proteger cada ruta de escritura y lectura privada en el servidor; comprobar autorización sobre el recurso solicitado.
- Mantener secretos y credenciales solo en el servidor. No guardar tokens de sesión en almacenamiento accesible a JavaScript.
- Si se usan cookies de sesión, definir expiración, atributos adecuados y protección CSRF para peticiones que cambian estado.
- Restringir CORS a los orígenes necesarios y limitar tamaño de cuerpos y archivos; validar tipo y contenido de las subidas.
- Tratar descripciones, enlaces e imágenes como datos no confiables. Validar URLs y evitar HTML arbitrario sin sanitización.
- Registrar acciones administrativas relevantes sin incluir contraseñas, sesiones ni datos secretos.
- Usar la skill `security-best-practices` para revisar las referencias aplicables a Next.js, React y el servidor HTTP antes de implementar autenticación, archivos o nuevas rutas privadas.

## Borradores de proyectos

NestJS expone `GET` y `POST /admin/projects/drafts`, y `GET` y `PUT /admin/projects/drafts/:id`. Todas requieren una sesión administrativa vigente. Las escrituras también exigen el `WEB_ORIGIN` exacto. Next.js lee los borradores desde el servidor y recibe las escrituras en rutas del mismo origen, comprueba `Origin` y reenvía la cookie a la API. Las lecturas y respuestas privadas usan `no-store`.

Crear fija `status=draft`; el cliente no puede enviar estado, identificador ni fechas. Listar, recuperar y editar filtran por `draft`. Un UUID inexistente o de un proyecto publicado devuelve `404`; un identificador mal formado devuelve `400`. `PUT` reemplaza los campos editables y actualiza `updatedAt`. Un proyecto publicado debe retirarse antes de volver a editarse como borrador; no existe eliminación.

La validación en tiempo de ejecución exige título de 1–200 caracteres y slug de 1–160 con letras ASCII minúsculas, números y guiones entre palabras. El slug es único entre todos los estados; un conflicto devuelve `409`. Resumen y descripción son opcionales, con máximos de 1.000 y 50.000 caracteres. Las URLs opcionales admiten HTTP(S), sin credenciales y hasta 2.048 caracteres. Se admiten hasta 30 tecnologías de 1–80 caracteres, sin duplicados exactos tras recortar espacios, y una posición entera entre 0 y 2.147.483.647. Los textos se recortan; los opcionales vacíos se guardan como `null`. Las tecnologías y la posición omitidas se restablecen a `[]` y `0`. Los errores de entrada devuelven `400` con un mapa `fields` para el formulario; los campos desconocidos se rechazan. La descripción se edita como texto Markdown, sin renderizar HTML.

## Publicación de proyectos

La API ofrece `GET /admin/projects/published`, `POST /admin/projects/:id/publish` y `POST /admin/projects/:id/unpublish`. Todas requieren sesión administrativa; las escrituras también exigen el `WEB_ORIGIN` exacto. Publicar solo acepta borradores con resumen y descripción no vacíos y devuelve `400` con `fields` si faltan. Retirar convierte un proyecto publicado en borrador editable. Las transiciones filtran por el estado de origen, devuelven `404` cuando no corresponde y actualizan `updatedAt`.

`GET /projects` y `GET /projects/:slug` son públicos y consultan únicamente el estado `published`, ordenando el listado por posición, creación e ID. Un slug inexistente o retirado devuelve `404`. La web sirve `/projects` y `/projects/[slug]` con lecturas `no-store` y renderizado por petición; la API envía `Cache-Control: no-store`. La descripción se renderiza como Markdown sin HTML incrustado ni imágenes, y solo admite destinos seguros en los enlaces.

## Medios de proyectos

La decisión de almacenamiento está en `docs/adr/0003-project-media-storage.md`. `project_media` asocia imágenes a proyectos por UUID; almacena bytes, MIME, texto alternativo obligatorio y fechas. `GET` y `POST /admin/projects/:id/media`, `DELETE /admin/projects/:id/media/:mediaId` y `GET /admin/projects/:id/media/:mediaId/file` requieren sesión. Las escrituras exigen origen válido. El binario privado también comprueba que el medio pertenezca al proyecto indicado. `GET /projects/media/:mediaId` solo sirve la imagen cuando su proyecto está publicado. Los listados y detalles públicos incluyen metadatos de medios, nunca los bytes. Retirar un proyecto oculta inmediatamente sus imágenes públicas.

### Formulario integrado y destacada

`GET /admin/projects/:id` devuelve el proyecto y sus metadatos de medios para el formulario integrado. Los borradores permiten editar contenido e imágenes; los publicados muestran el contenido de solo lectura y permiten gestionar sus imágenes. La URL administrativa anterior de medios redirige al mismo formulario. Las rutas de borradores siguen rechazando proyectos publicados.

El formulario admite varios archivos, arrastre y pegado desde el portapapeles. Cada imagen exige su propio texto alternativo. Guardar crea o actualiza primero el borrador y después carga los archivos pendientes, actualiza los textos alternativos y selecciona la destacada. Si una operación falla, conserva el formulario, los archivos pendientes, el identificador del proyecto creado y los medios cuya carga fue confirmada. Un reintento actualiza el mismo borrador y omite las cargas ya confirmadas. Crear borradores y cargar imágenes admite el encabezado opcional `Idempotency-Key`, validado como UUID y reutilizado por el cliente mientras haya una respuesta pendiente de confirmar. La repetición recupera el registro guardado; una carga repetida exige el mismo proyecto, MIME y bytes. Así una respuesta perdida no duplica proyectos ni imágenes. Las imágenes quitadas se eliminan al guardar y se pueden restaurar antes de ello.

`PUT /admin/projects/:id/media/:mediaId` acepta únicamente `altText` de 1–300 caracteres tras recortar espacios. `PUT /admin/projects/:id/featured-media` acepta únicamente `mediaId`, un UUID perteneciente al proyecto. Ambas operaciones requieren sesión y origen válido. La selección usa una transacción con bloqueo del proyecto y un índice único parcial sobre `project_media.is_featured`; la eliminación comparte el bloqueo para evitar carreras con esa selección.

Los metadatos incluyen `isFeatured`; los proyectos públicos incluyen `featuredMediaId`. Si no hay destacada explícita, se elige la primera imagen por fecha de creación e ID; sin imágenes, se devuelve `null`. Esta alternativa permite mostrar medios existentes sin reescribirlos y se aplica también al eliminar la destacada. Portada y archivo usan esa vista previa; el detalle usa el carrusel accesible sin reproducción automática ni animación de transición.

## Habilidades

La tabla `skills` guarda `id` (UUID), `name` (1–80 caracteres, recortado), `category_id`, `position`, `status` (`draft` o `published`) y fechas. Restricciones: nombre no vacío y único sin distinguir mayúsculas (`409` con `fields.name`). No hay relación con proyectos ni niveles de dominio.

La categoría es una lista controlada: `skill_categories` guarda `id`, `name` (1–80 caracteres, único sin distinguir mayúsculas), `position` y fechas. `skills.category_id` la referencia con `ON DELETE RESTRICT`; un `categoryId` inexistente devuelve `400` con `fields.categoryId`. Se usa solo para habilidades; experiencia, educación y certificados no la comparten. No existe eliminación de categorías: se renombran o se reordenan, y renombrar actualiza todas sus habilidades. Rutas privadas `GET`/`POST /admin/skill-categories` y `GET`/`PUT /admin/skill-categories/:id` con sesión y origen válido; el listado incluye `skillCount`.

Las rutas privadas son `GET` y `POST /admin/skills`, `GET` y `PUT /admin/skills/:id`, y `POST /admin/skills/:id/publish` y `/unpublish`. Requieren sesión; las escrituras exigen el `WEB_ORIGIN` exacto. Crear fija `draft`; el cliente no envía estado ni fechas. Los campos desconocidos se rechazan y los errores devuelven `400` con `fields`. Como en proyectos, `PUT` solo opera sobre borradores (un publicado devuelve `404` hasta retirarlo) y cada transición actualiza `updatedAt`. `GET /skills` es público, devuelve únicamente `id`, `name`, `categoryId`, `category` (nombre) y `position` de las publicadas, ordenadas por posición de categoría, nombre de categoría, posición de habilidad, nombre e ID, con `no-store`. La web las muestra en la sección `#habilidades` de la portada, agrupadas por categoría y con estado vacío; el panel las gestiona en `/admin/skills` (y las categorías en `/admin/skills/categories`) mediante rutas del mismo origen que comprueban `Origin`.

## Entrega por capacidades

La primera entrega completa debe permitir crear un proyecto como borrador, editarlo, publicarlo y verlo en la página pública. Esa trayectoria verifica el esquema, la autenticación, la autorización, la validación y las vistas de extremo a extremo. Luego se agregan habilidades, experiencia, educación y certificados con las mismas reglas de publicación. Las pruebas deben cubrir el comportamiento observable de cada trayectoria crítica; las migraciones deben revisarse antes de aplicarlas a datos existentes.

Antes de implementar el acceso administrativo y los archivos, registrar la elección concreta de proveedor o mecanismo de autenticación y almacenamiento en decisiones de arquitectura dentro de `docs/adr/`.
