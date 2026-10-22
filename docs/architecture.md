# Arquitectura del portafolio y CMS

## Estado actual

El repositorio tiene una web Next.js, una API NestJS con Fastify, PostgreSQL con Drizzle y componentes compartidos en `packages/ui`. Existe la tabla de proyectos y su migración; todavía no hay autenticación ni panel administrativo. Este documento distingue la base implementada de las capacidades futuras.

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

## Entrega por capacidades

La primera entrega completa debe permitir crear un proyecto como borrador, editarlo, publicarlo y verlo en la página pública. Esa trayectoria verifica el esquema, la autenticación, la autorización, la validación y las vistas de extremo a extremo. Luego se agregan habilidades, experiencia, educación y certificados con las mismas reglas de publicación. Las pruebas deben cubrir el comportamiento observable de cada trayectoria crítica; las migraciones deben revisarse antes de aplicarlas a datos existentes.

Antes de implementar el acceso administrativo y los archivos, registrar la elección concreta de proveedor o mecanismo de autenticación y almacenamiento en decisiones de arquitectura dentro de `docs/adr/`.
