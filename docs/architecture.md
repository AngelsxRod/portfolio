# Arquitectura del portafolio y CMS

## Estado actual

El repositorio tiene una web Next.js, una API NestJS con Fastify, PostgreSQL con Drizzle y componentes compartidos en `packages/ui`. Existen proyectos, autenticación administrativa, edición de borradores, publicación y páginas públicas. Existen imágenes de proyectos (etapa 5), habilidades (etapa 6, entrega 1), experiencia laboral (entrega 2), educación (entrega 3) y certificados (entrega 4) y perfil (entrega 5); el contenido previsto de la etapa 6 está completo.

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

Crear fija `status=draft`; el cliente no puede enviar estado, identificador ni fechas. Listar, recuperar y editar filtran por `draft`. Un UUID inexistente o de un proyecto publicado devuelve `404`; un identificador mal formado devuelve `400`. `PUT` reemplaza los campos editables y actualiza `updatedAt`. Un proyecto publicado se edita como cambios pendientes (ver «Cambios pendientes de lo publicado»); no existe eliminación.

La validación en tiempo de ejecución exige título de 1–200 caracteres y slug de 1–160 con letras ASCII minúsculas, números y guiones entre palabras. El slug es único entre todos los estados; un conflicto devuelve `409`. Resumen y descripción son opcionales, con máximos de 1.000 y 50.000 caracteres. Las URLs opcionales admiten HTTP(S), sin credenciales y hasta 2.048 caracteres. Se admiten hasta 30 tecnologías de 1–80 caracteres, sin duplicados exactos tras recortar espacios, y una posición entera entre 0 y 2.147.483.647. Los textos se recortan; los opcionales vacíos se guardan como `null`. Las tecnologías y la posición omitidas se restablecen a `[]` y `0`. Los errores de entrada devuelven `400` con un mapa `fields` para el formulario; los campos desconocidos se rechazan. La descripción se edita como texto Markdown, sin renderizar HTML.

## Publicación de proyectos

La API ofrece `GET /admin/projects/published`, `POST /admin/projects/:id/publish` y `POST /admin/projects/:id/unpublish`. Todas requieren sesión administrativa; las escrituras también exigen el `WEB_ORIGIN` exacto. Publicar solo acepta borradores con resumen y descripción no vacíos y devuelve `400` con `fields` si faltan. Retirar convierte un proyecto publicado en borrador editable. Las transiciones filtran por el estado de origen, devuelven `404` cuando no corresponde y actualizan `updatedAt`.

`GET /projects` y `GET /projects/:slug` son públicos y consultan únicamente el estado `published`, ordenando el listado por posición, creación e ID. Un slug inexistente o retirado devuelve `404`. `GET /projects/:slug/related` devuelve hasta tres proyectos publicados distintos del actual, ordenados por tecnologías compartidas (sin distinguir mayúsculas), luego por mismo tipo y por el orden habitual; si ninguno comparte tecnologías, devuelve los siguientes por orden. Responde `404` si el slug no está publicado. La web sirve `/projects` y `/projects/[slug]` con lecturas `no-store` y renderizado por petición; la API envía `Cache-Control: no-store`. La descripción se renderiza como Markdown sin HTML incrustado ni imágenes, y solo admite destinos seguros en los enlaces.

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

Las rutas privadas son `GET` y `POST /admin/skills`, `GET` y `PUT /admin/skills/:id`, y `POST /admin/skills/:id/publish` y `/unpublish`. Requieren sesión; las escrituras exigen el `WEB_ORIGIN` exacto. Crear fija `draft`; el cliente no envía estado ni fechas. Los campos desconocidos se rechazan y los errores devuelven `400` con `fields`. Como en proyectos, `PUT` solo opera sobre borradores (un publicado guarda los cambios como pendientes; ver «Cambios pendientes de lo publicado») y cada transición actualiza `updatedAt`. `GET /skills` es público, devuelve únicamente `id`, `name`, `categoryId`, `category` (nombre) y `position` de las publicadas, ordenadas por posición de categoría, nombre de categoría, posición de habilidad, nombre e ID, con `no-store`. La web las muestra en la sección `#habilidades` de la portada, agrupadas por categoría y con estado vacío; el panel las gestiona en `/admin/skills` (y las categorías en `/admin/skills/categories`) mediante rutas del mismo origen que comprueban `Origin`.

## Experiencia laboral

La tabla `experiences` guarda `id` (UUID), `organization` y `title` (1–120 caracteres, recortados), `start_date` y `end_date` (`date`, siempre el día 1: la API recibe y devuelve `AAAA-MM`), `description` (texto plano opcional de hasta 2.000 caracteres, `null` si queda vacío), `achievements` (`text[]`, hasta 10 textos de 1–300 caracteres, sin repetir tras recortar), `position`, `status` (`draft` o `published`) y fechas de creación y actualización. Restricciones en base de datos: organización, puesto y descripción no vacíos, `end_date IS NULL OR end_date >= start_date`, como máximo 10 logros e índice por estado y posición. No hay relación con proyectos.

Un cargo actual es el que no tiene fecha de fin; la web lo muestra como «Actual». Si el fin es anterior al inicio, la API responde `400` con `fields.endDate`. Los años válidos van de 1900 a 2099.

Las rutas privadas son `GET` y `POST /admin/experience`, `GET` y `PUT /admin/experience/:id`, y `POST /admin/experience/:id/publish` y `/unpublish`. Requieren sesión y las escrituras exigen el `WEB_ORIGIN` exacto. Crear fija `draft`; los campos desconocidos se rechazan y los errores devuelven `400` con `fields`. Como en habilidades y proyectos, `PUT` solo opera sobre borradores (un publicado guarda los cambios como pendientes; ver «Cambios pendientes de lo publicado») y cada transición actualiza `updatedAt`; un UUID mal formado devuelve `400`. `GET /experience` es público, devuelve solo `id`, `organization`, `title`, `startDate`, `endDate`, `description`, `achievements` y `position` de las publicadas, ordenadas por posición, inicio descendente e ID, con `no-store`.

La web muestra la sección `#experiencia` en la portada (con estado vacío y enlace en la cabecera) y el panel gestiona los cargos en `/admin/experience` mediante rutas del mismo origen que comprueban `Origin`. El formulario captura un logro por línea.

## Educación

La tabla `education` guarda `id` (UUID), `institution` y `program` (1–120 caracteres, recortados), `level` (enum `secondary` = diversificado/bachillerato, `university` o `other`), `start_date` y `end_date` (`date`, siempre el día 1: la API recibe y devuelve `AAAA-MM`), `description` (texto plano opcional de hasta 2.000 caracteres, `null` si queda vacío), `position`, `status` (`draft` o `published`) y fechas de creación y actualización. Restricciones en base de datos: institución, programa y descripción no vacíos, `end_date IS NULL OR end_date >= start_date` e índice por estado y posición. Obligatorios: institución, nivel, programa e inicio; un registro sin fin se muestra como «En curso». Los años válidos van de 1900 a 2099 y un fin anterior al inicio devuelve `400` con `fields.endDate`. No hay campo adicional para el nivel «otro» (lo describe el programa) ni relación con otros tipos.

Las rutas privadas son `GET` y `POST /admin/education`, `GET` y `PUT /admin/education/:id`, y `POST /admin/education/:id/publish` y `/unpublish`, con las mismas reglas que experiencia: sesión obligatoria, `WEB_ORIGIN` exacto en escrituras, estado fijado por el servidor, campos desconocidos rechazados, `400` con `fields`, `PUT` solo sobre borradores (un publicado guarda los cambios como pendientes; ver «Cambios pendientes de lo publicado») y UUID mal formado `400`. `GET /education` es público, devuelve solo `id`, `institution`, `level`, `program`, `startDate`, `endDate`, `description` y `position` de las publicadas, ordenadas por posición, inicio descendente e ID, con `no-store`.

La web muestra la sección `#educacion` en la portada (con estado vacío y enlace en la cabecera) y el panel gestiona los registros en `/admin/education` mediante rutas del mismo origen que comprueban `Origin`. El formulario usa `Select` para el nivel y `MonthPicker` para las fechas.

## Certificados

La tabla `certificates` guarda `id` (UUID), `name` (1–160 caracteres) y `issuer` (1–120), `issue_date` (`date`, siempre el día 1: la API recibe y devuelve `AAAA-MM`, años 1900–2099), `verification_url` (opcional, HTTP o HTTPS sin credenciales, hasta 2.048 caracteres; `null` si queda vacío), `description` (texto plano opcional de hasta 2.000), `position`, `status` (`draft` o `published`) y fechas de creación y actualización. Restricciones en base de datos: nombre, emisor, URL y descripción no vacíos e índice por estado y posición. Obligatorios: nombre, emisor y fecha de emisión. Por decisión del usuario esta entrega **no incluye archivos** (PDF o imagen): quedan como entrega posterior y, si se añaden, deberán seguir el ADR 0003 de medios.

Las rutas privadas son `GET` y `POST /admin/certificates`, `GET` y `PUT /admin/certificates/:id`, y `POST /admin/certificates/:id/publish` y `/unpublish`, con las mismas reglas que experiencia y educación (sesión, `WEB_ORIGIN` exacto en escrituras, estado fijado por el servidor, campos desconocidos rechazados, `400` con `fields`, `PUT` solo sobre borradores y UUID mal formado `400`). `GET /certificates` es público, devuelve solo `id`, `name`, `issuer`, `issueDate`, `verificationUrl`, `description` y `position` de los publicados, ordenados por posición, emisión descendente e ID, con `no-store`. La portada muestra la sección `#certificados` con el enlace «Verificar certificado» (`target="_blank"`, `rel="noopener noreferrer"`) y el panel gestiona los registros en `/admin/certificates`.

## Perfil

El perfil es un único registro con dos versiones, no una lista. La tabla `profile` usa `version` (`draft` o `published`) como clave primaria y guarda `display_name` (1–120 caracteres), `headline` (título profesional opcional, hasta 120, p. ej. «Junior Frontend Developer»; migración 0012), `presentation` (texto plano de 1–2.000), `location` (opcional, hasta 120), `email` (opcional, formato válido, hasta 254), `links` (`jsonb`, hasta 10 objetos `{label, url}` con etiqueta de 1–40 caracteres y URL HTTP(S) sin credenciales, sin repetir) y fechas. Restricciones en base de datos: nombre, presentación, ubicación y correo no vacíos y `links` como arreglo de como máximo 10 elementos. Decisión del usuario: borrador y publicado separados, para que el perfil público no se oculte ni cambie mientras se edita; los datos de contacto son solo correo y enlaces (sin teléfono).

Las rutas privadas son `GET /admin/profile` (devuelve `draft`, `published` y `hasUnpublishedChanges`), `PUT /admin/profile` (crea o reemplaza el borrador), `POST /admin/profile/publish` (copia el borrador a la versión publicada en una transacción; sin borrador devuelve `400`) y `POST /admin/profile/unpublish` (elimina solo la versión publicada y conserva el borrador; `404` si no hay). Requieren sesión; las escrituras exigen el `WEB_ORIGIN` exacto. Los campos desconocidos se rechazan y los errores devuelven `400` con `fields`; los de los enlaces se reportan en `fields.links` con el número del enlace. `GET /profile` es público y devuelve únicamente `displayName`, `presentation`, `location`, `email` y `links` de la versión publicada, con `no-store`; sin perfil publicado responde `404`.

La portada presenta el perfil en el hero (`#perfil`, enlazado desde la cabecera): ubicación, nombre como titular, título profesional como subtítulo, presentación y contacto; sin perfil publicado conserva el hero genérico. El correo como `mailto:` y los enlaces con `target="_blank"` y `rel="noopener noreferrer"`. El panel edita el borrador en `/admin/profile` con la lista de enlaces gestionada con `useFieldArray`; muestra si hay cambios sin publicar y permite publicar los cambios o retirar el perfil.

## Cambios pendientes de lo publicado

Proyectos, habilidades, experiencia, educación y certificados se pueden editar sin retirarlos. Cada tabla tiene una columna `pending` (`jsonb`, nula por defecto; migración aditiva 0011) con la última versión editada. Mientras `pending` no sea nula, las columnas normales conservan la versión publicada y es la única que ven las rutas públicas.

- `PUT` sobre un registro **publicado** valida la entrada como siempre y la guarda en `pending` (no toca la versión visible). Sobre un borrador sigue reemplazando sus campos.
- `POST /admin/<recurso>/:id/publish` sobre un publicado aplica `pending` a las columnas y la vacía (`404` si no hay cambios pendientes). Se vuelven a aplicar las restricciones de la base: slug único y nombre único, y en proyectos resumen y descripción no vacíos (`400` con `fields`; `409` en conflictos).
- `POST /admin/<recurso>/:id/discard` borra `pending` y deja intacta la versión publicada (`404` si no hay).
- `POST /admin/<recurso>/:id/unpublish` aplica `pending`, si existe, al volver a borrador: el borrador es la última versión en la que se trabajó.
- Las lecturas de administración devuelven `pending`; las públicas nunca lo incluyen (en proyectos se elimina explícitamente). El perfil mantiene su propio modelo de dos versiones.
- Las imágenes de un proyecto no pasan por `pending`: se guardan al instante, como antes.

En el panel, un publicado se edita en el mismo formulario: «Guardar borrador» guarda los cambios pendientes, «Publicar» los guarda y aplica, «Descartar cambios» los borra y «Retirar» sigue disponible. Los listados y la cabecera muestran «Cambios sin publicar».

## Estructura del panel

El panel vive en `apps/web/src/app/admin/(protected)` y comparte un único layout (`layout.tsx`): enlace «Saltar al contenido», `SidebarProvider` con la barra lateral, cabecera con rastro de migas y «Ver sitio», y una sola región `<main id="contenido">`. Las páginas no declaran su propio `main`. En escritorio la barra lateral es fija; por debajo de 768 px pasa a un `Sheet` con foco atrapado, cierre con Escape y retorno del foco al botón. Los destinos y etiquetas de la navegación están en `components/admin/admin-nav.ts`; la sección activa usa `aria-current="page"` por prefijo de ruta.

| Ruta                                                                                             | Contenido                                                                               |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `/admin`                                                                                         | Inicio: una tarjeta por sección con recuentos y últimos cambios (`Promise.allSettled`). |
| `/admin/projects`, `/skills`, `/skills/categories`, `/experience`, `/education`, `/certificates` | Listados con `ResourceList`.                                                            |
| `.../new`, `.../[id]/edit`, `/admin/profile`                                                     | Formularios con `FormPage`.                                                             |

`/admin` dejó de ser el listado de proyectos, que ahora está en `/admin/projects` (ruta nueva); el resto de URLs no cambió. El inicio solo reutiliza las listas que ya devuelve la API; no hay endpoints nuevos.

Componentes compartidos en `apps/web/src/components/admin`: `PageHeader`, `StatusBadge`, `ResourceList` (búsqueda y filtros en el cliente; tabla desde 768 px y tarjetas en móvil), `PublicationButton` (publica; retirar pide confirmación con `AlertDialog`; sustituye a las cinco acciones duplicadas) y `FormPage`, `FormSection`, `StickyActions` y `SaveMenu` (la cabecera de cada formulario es fija y lleva arriba a la derecha el menú «Guardar» con «Publicar» y «Guardar borrador»; en registros ya publicados añade «Descartar cambios» (si los hay) y «Retirar», ambos con confirmación; «Publicar» guarda los cambios y los publica, y si publicar falla el borrador queda guardado y se explica el motivo). `StickyActions` (barra inferior) solo la usa el perfil. El formulario de proyectos tiene una sección propia de tecnologías con `TagInput` (etiquetas que se añaden con Enter o coma, con atajos a las tecnologías de otros proyectos, calculadas por `getTechnologySuggestions`; el valor sigue siendo la misma lista separada por comas) y una sección de imágenes con zona de carga, tarjetas con vista previa, texto alternativo, «Destacada» y «Quitar». Los formularios siguen usando React Hook Form, Zod, `FormField`, `applyServerErrors` y `MonthPicker`. El perfil conserva su flujo propio (publicar cambios y retirar con confirmación, que conserva el borrador). Los tokens `--sidebar*` y la paleta de todo el sitio (Deep Purple, Lavender, Soft White y Jet Black, en claro y en oscuro) viven en `packages/ui/src/styles/globals.css`; el tema es opcional en todo el sitio: claro por defecto, con selector Claro/Oscuro/Sistema (`ThemeToggle`, en la cabecera pública y en la del panel; `next-themes` con `ThemeProvider` en el layout raíz y la preferencia en `localStorage` con la clave `theme`).

## Entrega por capacidades

La primera entrega completa debe permitir crear un proyecto como borrador, editarlo, publicarlo y verlo en la página pública. Esa trayectoria verifica el esquema, la autenticación, la autorización, la validación y las vistas de extremo a extremo. Luego se agregan habilidades, experiencia, educación y certificados con las mismas reglas de publicación. Las pruebas deben cubrir el comportamiento observable de cada trayectoria crítica; las migraciones deben revisarse antes de aplicarlas a datos existentes.

Antes de implementar el acceso administrativo y los archivos, registrar la elección concreta de proveedor o mecanismo de autenticación y almacenamiento en decisiones de arquitectura dentro de `docs/adr/`.
