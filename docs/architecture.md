# Arquitectura del portafolio y CMS

## Estado actual

El repositorio tiene una web Next.js, una API NestJS con Fastify, PostgreSQL con Drizzle y componentes compartidos en `packages/ui`. Existen la tabla de proyectos, la autenticación de un administrador, la edición de borradores, la publicación y las páginas públicas de proyectos. Los medios y los demás tipos de contenido siguen pendientes.

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

`GET /projects` y `GET /projects/:slug` son públicos y consultan únicamente el estado `published`, ordenando el listado por posición, creación e ID. Un slug inexistente o retirado devuelve `404`. La web sirve `/projects` y `/projects/[slug]` con lecturas `no-store` y renderizado por petición; la API envía `Cache-Control: no-store`. La descripción se renderiza como Markdown sin HTML incrustado ni imágenes, y solo admite destinos seguros en los enlaces. Los medios se incorporarán en la etapa 5.

## Entrega por capacidades

La primera entrega completa debe permitir crear un proyecto como borrador, editarlo, publicarlo y verlo en la página pública. Esa trayectoria verifica el esquema, la autenticación, la autorización, la validación y las vistas de extremo a extremo. Luego se agregan habilidades, experiencia, educación y certificados con las mismas reglas de publicación. Las pruebas deben cubrir el comportamiento observable de cada trayectoria crítica; las migraciones deben revisarse antes de aplicarlas a datos existentes.

Antes de implementar el acceso administrativo y los archivos, registrar la elección concreta de proveedor o mecanismo de autenticación y almacenamiento en decisiones de arquitectura dentro de `docs/adr/`.
