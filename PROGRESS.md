# Progreso del portafolio

Este archivo registra el trabajo **verificado** del portafolio y su CMS. Actualízalo al terminar cada etapa; una casilla marcada debe corresponder a código o documentación existente, no a una intención.

## Estado actual

- **Etapa activa:** 6. Resto del contenido — entrega 1 (Habilidades) completada; la etapa 5 quedó cerrada.
- **Última revisión:** 2026-10-23.
- **Siguiente entrega:** experiencia laboral (etapa 6, entrega 2). Educación, certificados y perfil siguen pendientes.

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
- [x] Habilidades con borrador, publicación y retirada, panel y sección pública.
- [x] Imágenes de proyectos en PostgreSQL, con carga administrativa, texto alternativo y entrega pública limitada a proyectos publicados.

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

### 5. Medios de proyectos — completada

- [x] Elegir y documentar almacenamiento de imágenes en `docs/adr/`.
- [x] Implementar carga, validación, texto alternativo y asociación con proyectos.
- [x] Integrar selección múltiple, drag and drop y pegado en creación y edición, con texto alternativo individual y reintentos sin perder el formulario.
- [x] Elegir destacada y mostrar vistas previas en portada/archivo y carrusel accesible en el detalle.
- [x] Probar permisos, límites, errores, destacada y visibilidad pública mediante API y Chrome.
- [x] Completar la carga manual de capturas pendientes y cerrar la etapa.

**Decisión:** `docs/adr/0003-project-media-storage.md` define PostgreSQL `bytea` para los binarios y metadatos asociados por UUID. La migración `0002_fancy_zaran.sql` crea solo `project_media`. La API acepta PNG, JPEG o WebP de hasta 5 MiB, comprueba tipo y firma, exige texto alternativo y sesión en el panel, y solo sirve binarios públicos cuando el proyecto está publicado. El panel permite cargar y eliminar imágenes de borradores o publicados; el detalle público muestra las imágenes sin rediseñar portada ni archivo.

**Verificación hasta ahora:** antes de la migración había seis proyectos publicados y dos migraciones; después hay seis y tres. `drizzle-kit check` y `pnpm check` pasaron. En una base temporal migrada pasaron 26 pruebas de API, incluidas nueve de persistencia que cubren carga, límites, origen, sesión, asociación, acceso privado, publicación y retirada; la base temporal se eliminó. Tras habilitar acceso a URL de archivo en la extensión de Chrome, se seleccionó un PNG desde el formulario, se escribió el texto alternativo y apareció «Imagen cargada». La vista previa privada y el detalle público mostraron la imagen, decodificada a 320 × 180; no hubo errores ni advertencias de consola. La nueva imagen temporal `fcf014c9-b4ef-4e33-9089-bca56def0ec1` sigue asociada a R&R Asociados mientras se espera la confirmación necesaria para eliminarla definitivamente. El cierre de la etapa y el recuento final de medios quedan pendientes de esa limpieza.

**Capturas listas para carga manual:** `capturas-proyectos/` contiene tres PNG de cada uno de los seis sitios públicos (18 en total), con un `README.md` que identifica la página o sección y propone texto alternativo. Se verificaron visualmente las 18 capturas: todas son distintas, miden 1440 × 900 px y pesan menos de 5 MiB. `pnpm check` pasó tras añadirlas: formato, lint, 17 pruebas de API y una de logger, y compilación; las nueve pruebas de persistencia se omitieron en esta ejecución porque no se definió `TEST_DATABASE_URL` (ya habían pasado con PostgreSQL temporal). El usuario indicó que las subirá desde el panel; esta preparación no cambió los medios almacenados en PostgreSQL.

**Mejora del formulario y presentación (2026-10-22):** el mismo formulario crea/edita borradores y gestiona sus imágenes; en publicados mantiene los textos de solo lectura y permite editar medios. Admite selección múltiple, arrastre y pegado, texto alternativo obligatorio por imagen, eliminación al guardar con restauración previa y selección de destacada. Guarda primero el borrador y conserva el ID, archivos, textos y cargas confirmadas ante fallos parciales. Los encabezados UUID `Idempotency-Key` permiten reintentar creación/carga aunque la API haya guardado y se pierda la respuesta. La migración aditiva `0003_solid_warbird.sql` añade la marca de destacada y su índice único; sin elección se usa la primera imagen por fecha e ID. Portada/archivo muestran esa vista previa y el detalle usa el carrusel shadcn/ui con teclado, botones en español e indicador anunciado, sin reproducción automática ni transición animada.

**Verificación de esta mejora:** `pnpm check` completo pasó con PostgreSQL aislado: formato, lint, 36 pruebas de API (12 con persistencia), una de logger y compilación. Las pruebas cubren sesión ausente/revocada, origen, asociación, tipo/firma/tamaño, texto alternativo, destacada concurrente, alternativa al eliminarla, publicación/retirada y reintentos sin duplicación. En Chrome se verificaron creación y edición, selección de archivo, drag and drop mediante eventos `DataTransfer`, pegado real con Ctrl+V, guardado fallido, segunda carga fallida con dos cargas conservadas, reintento y pérdida de respuestas tras guardar tanto proyecto como imagen. Se comprobó edición de imágenes publicadas con contenido bloqueado, rechazo de SVG y más de 5 MiB, cambio y eliminación de destacada, vistas previas de portada/archivo, carrusel con botones/teclado, retirada y proyectos sin imágenes. Escritorio y 375 px no mostraron desbordamiento; la revisión final de consola mostró solo mensajes informativos de desarrollo y ningún error de ejecución.

**Rediseño del hero y grid:** el detalle integra título y resumen sobre un panel oscuro con una galería asimétrica de mayor tamaño y miniaturas seleccionables. La destacada abre el carrusel; en móvil la galería ocupa la primera fila. Archivo y selección de portada usan un grid de tres columnas en escritorio, dos en tamaño intermedio y una en móvil; los proyectos sin imagen muestran una composición tipográfica. Se actualizó `DESIGN.md`. Chrome verificó seis proyectos en el grid, portada, detalle con y sin imágenes, selección de miniaturas y teclado; escritorio y 375 px sin desbordamiento ni errores de ejecución registrados. `pnpm check` completo pasó: formato, lint, 24 pruebas de API y una de logger, y compilación. Las 12 pruebas de persistencia se omitieron en esta ejecución al no definir `TEST_DATABASE_URL`; ya habían pasado en la entrega funcional. Este rediseño no ejecutó escrituras de contenido ni cambios de esquema.

**Ajuste del carrusel:** se eliminó el pie de imagen visible y se conserva el atributo `alt` para accesibilidad. Flechas activas con fondo petróleo y símbolos blancos; estados deshabilitados sin transparencia, indicador de posición reforzado y miniatura activa con borde contrastado. Chrome verificó ausencia de pies, atributo alternativo presente, navegación y colores efectivos en escritorio; a 375 px no hubo desbordamiento. Formato y lint web correctos.

**Navegación circular (2026-10-23):** el carrusel con varias imágenes pasa de la última a la primera y viceversa. Chrome verificó ambos extremos con Cardo y ambas flechas habilitadas; formato y lint web correctos. No hay reproducción automática.

**Galería amplia y visor (2026-10-23):** se sustituyó el panel asimétrico por una imagen al ancho del detalle, con controles inferiores discretos y sin miniaturas. Clic abre un visor de toda la pantalla con shadcn/ui Dialog, imagen completa, navegación circular con botones/teclado, cierre mediante botón o Escape y retorno del foco a la imagen seleccionada. La galería de fondo queda inactiva mientras el visor está abierto. Chrome verificó escritorio y 375 px, visor de 375 × 812 px, ambas direcciones, cierre, foco y proyectos sin imágenes, sin desbordamientos ni errores de ejecución registrados. `pnpm check` pasó con 24 pruebas API y una de logger; las 12 de persistencia se omitieron por no definir `TEST_DATABASE_URL`. El ajuste final de accesibilidad se volvió a verificar con tipos, lint y compilación web. No hubo escrituras de contenido ni cambios de esquema.

**Cabecera integrada (2026-10-23):** el título vuelve a encabezar el detalle, con resumen y enlaces a la derecha en escritorio y la galería amplia justo debajo. En móvil se apilan título, resumen y galería. Chrome verificó el orden y ausencia de desbordamiento a 1440 y 375 px; formato, tipos y lint web correctos. Se conserva el visor ampliado.

**Tarjetas según referencia (2026-10-23):** listado y selección de portada usan dos columnas y tarjetas editoriales con imagen 2:1 sin marco, título compacto, resumen y enlace. Las tecnologías existentes, cuando las hay, se presentan como etiquetas sobre el título. La vista previa llena el marco y se alinea arriba; el detalle conserva la imagen completa y el visor. Chrome verificó seis tarjetas, dos columnas a 1440 px, una a 375 px, imágenes sin padding y sin desbordamiento. Formato, tipos y lint web correctos. No se añadieron autores, fechas ni categorías ficticias.

**Conservación de datos:** antes y después se verificaron seis proyectos publicados y tres medios originales. Todos los campos de los proyectos, asociaciones, textos alternativos, MIME, fechas y hashes de los binarios originales coinciden con la referencia inicial. Solo se eliminaron los dos proyectos y la sesión creados para esta verificación; no se inició Compose ni se reiniciaron servicios manualmente. La imagen temporal histórica `fcf014c9-b4ef-4e33-9089-bca56def0ec1` ya no estaba presente al comenzar esta mejora; esta entrega no la eliminó. La carga manual de las capturas restantes sigue pendiente y la etapa 6 no se inició.

**Cierre de la etapa (2026-10-23):** se verificó en PostgreSQL que los seis proyectos publicados tienen tres imágenes PNG cada uno (18 en total) y que el `md5` de los bytes coincide con los 18 archivos de `capturas-proyectos/`. Los textos alternativos eran nombres de archivo; por petición del usuario se sustituyeron por los textos sugeridos de `capturas-proyectos/README.md` mediante una única transacción SQL puntual (18 filas, identificadas por `md5(bytes)`, actualizando `updated_at`). Después se comprobó que IDs, hashes y destacadas no cambiaron y que siguen 6 proyectos y 18 medios. Cardo no tiene destacada explícita y usa la alternativa documentada. Esa corrección no pasó por la API porque el panel no ofrece edición masiva de textos.

### 6. Resto del contenido

Implementar cada tipo en una entrega separada, con su esquema, edición, publicación y vista pública:

- [x] Habilidades (entrega 1, 2026-10-23).
- [ ] Experiencia laboral.
- [ ] Educación: diversificado/bachillerato y universidad.
- [ ] Certificados y diplomas.
- [ ] Perfil, enlaces y datos de contacto públicos.

**Habilidades — decisiones y verificación (2026-10-23):** la migración aditiva `0004_fair_bushwacker.sql` crea `skill_status` y `skills` (UUID, nombre y categoría de hasta 80 caracteres, posición, estado, fechas, restricciones de no vacío, nombre único sin distinguir mayúsculas e índice por estado/posición). La categoría es texto libre y no hay relación con proyectos, niveles de dominio ni habilidades iniciales; la base real conserva 0 habilidades y la portada muestra el estado vacío. Como en proyectos, solo se editan borradores: una habilidad publicada se retira antes. Rutas `GET/POST /admin/skills`, `GET/PUT /admin/skills/:id`, `POST /admin/skills/:id/publish|unpublish` (sesión y origen válidos en escrituras) y `GET /skills` público con solo publicadas. Panel en `/admin/skills`; sección «Habilidades» en la portada (`#habilidades`), agrupada por categoría, con enlace en la cabecera.

`pnpm check` completo pasó con PostgreSQL temporal migrado (contenedor aislado ya eliminado): formato, lint, 64 pruebas de API (incluidas las de `skills.test.ts` y la matriz 401 ampliada) y compilación. En Chrome, sobre la compilación de producción con API y web apuntando a esa base temporal (para no crear datos de prueba reales): acceso sin sesión redirige al login; creación y recuperación de un borrador; nombre duplicado en otra capitalización con error en el campo y toast; el borrador no aparece en la portada; publicar lo muestra; la publicada abre en solo lectura; retirar la devuelve a borrador y restablece el estado vacío. A 375 px se detectó y corrigió un desbordamiento de la cabecera causado por el nuevo enlace; tras el ajuste, portada y lista del panel no desbordan. La migración real pasó de 4 a 5 con 6 proyectos y 18 medios intactos. Verificación complementaria: con el registro de consola activo antes de cargar `/admin/skills/new`, la carga completa no registró mensajes; el envío del formulario vacío (con la validación nativa del navegador desactivada para la prueba) mostró «Usa entre 1 y 80 caracteres.» en nombre y categoría, un toast y el formulario conservado, sin mensajes de consola.

## Registro de entregas

| Fecha      | Etapa     | Resultado                                                                                                                             | Verificación                                                                                                                                                                                  | Pendientes                                                                                                   |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-10-21 | Base      | Infraestructura, componentes y dirección de arquitectura disponibles.                                                                 | Inspección del repositorio.                                                                                                                                                                   | Iniciar etapa 1.                                                                                             |
| 2026-10-21 | 1         | Esquema y migración aditiva de proyectos implementados y aplicados a PostgreSQL local.                                                | Tipos, lint y `drizzle-kit check` correctos; SQL revisado; restricciones probadas en transacción con `ROLLBACK` y tabla vacía.                                                                | Etapa 2: elegir y documentar autenticación, proteger rutas privadas y probar acceso permitido/denegado.      |
| 2026-10-21 | Técnica   | API migrada a NestJS con Fastify; Drizzle y datos conservados.                                                                        | Tipos, lint, 5 pruebas, compilación e imagen Docker correctos; tres rutas probadas en contenedor temporal; proyectos 0 y migraciones 1 antes y después.                                       | Etapa 2: acceso administrativo con origen único; corregir formato global preexistente en tarea separada.     |
| 2026-10-22 | 2         | Sesiones administrativas revocables, guard privado por defecto y panel inicial.                                                       | `pnpm check` completo; 10 pruebas de API; `drizzle-kit check`; migración aditiva aplicada; navegador: acceso denegado, inicio válido y cierre; API real: sesión vencida `401`, vigente `200`. | Etapa 3: borradores; configurar credenciales y origen en cada despliegue antes de habilitar el panel.        |
| 2026-10-22 | 3         | Rutas privadas de borradores y lista/formulario con `@repo/ui`, validación y errores por campo.                                       | `pnpm check`; 20 pruebas de API con PostgreSQL temporal; navegador: crear, editar, recuperar, errores y acceso denegado sin sesión; base existente sin cambios (0 proyectos, 2 migraciones).  | Etapa 4 pendiente: publicación y páginas públicas.                                                           |
| 2026-10-22 | 4         | Publicación y retirada desde el panel; listado y detalle públicos con Markdown seguro.                                                | `pnpm check` con PostgreSQL temporal: 25 pruebas de API; Chromium: borrador oculto, publicación visible, retirada y 404; base existente: 0 proyectos y 2 migraciones.                         | Etapa 5 pendiente: medios de proyectos; portada pública completa aún pendiente.                              |
| 2026-10-22 | 4 visual  | `DESIGN.md`, portada de portafolio y rediseño de archivo, detalle y estados; tokens compartidos.                                      | `pnpm check`; Chrome: R&R Asociados en portada, archivo, detalle y panel; 375 px y escritorio, teclado, navegación, 404 y consola sin errores nuevos.                                         | Etapa 5 pendiente; estados vacío y error aún sin reproducción en navegador con esta base.                    |
| 2026-10-22 | Contenido | El Master, Lourdes Gómez y Cardo creados y publicados con texto basado en sus sitios.                                                 | Chrome: cuatro proyectos en `/projects`; detalles y enlaces externos de los tres nuevos; consola sin errores ni advertencias.                                                                 | Etapa 5 pendiente; completar tecnologías o enlaces de código solo con datos confirmados.                     |
| 2026-10-22 | Contenido | QuincenaToGo y Loginsa publicados con contexto de trabajo en Bold.                                                                    | Chrome: seis proyectos en `/projects`; ambos detalles, enlaces a sitios y Bold; consola sin errores ni advertencias.                                                                          | Etapas 5 y 6 pendientes; no se añadieron medios ni sección de experiencia.                                   |
| 2026-10-22 | 5 parcial | Medios en PostgreSQL; carga y asociación privadas; entrega pública filtrada por publicación; ADR y migración aditiva.                 | `drizzle-kit check`; `pnpm check`; 26 pruebas de API con base temporal; Chrome: selección y carga directa, vista previa y detalle público; seis proyectos conservados.                        | Añadir capturas de los seis sitios y resolver la imagen temporal de prueba antes de cerrar la etapa.         |
| 2026-10-22 | 5 parcial | Tres capturas PNG por cada uno de los seis proyectos guardadas en `capturas-proyectos/`, con fuentes y textos alternativos sugeridos. | Revisión visual de las 18 capturas; PNG de 1440 × 900 px, cada uno por debajo de 5 MiB.                                                                                                       | El usuario subirá las imágenes; resolver la imagen temporal y cerrar la etapa después de verificar la carga. |

| 2026-10-22 | 5 mejora | Formulario con archivos/arrastre/pegado, alternativas individuales, destacada, reintentos, carrusel y vistas previas; migración aditiva aplicada. | `pnpm check`: 36 pruebas API y una de logger; Chrome: creación/edición, cargas y errores, reintentos con respuestas perdidas, teclado, 375 px y escritorio; seis publicados y tres medios originales sin cambios. | Completar capturas manuales restantes; etapa 5 sigue activa. |

| 2026-10-22 | 5 visual | Hero asimétrico con galería y miniaturas; grid de proyectos en archivo y portada; diseño documentado. | `pnpm check`; Chrome: seis proyectos, escritorio y 375 px, miniaturas, teclado y estados sin imágenes; 24 pruebas API y una de logger, 12 de persistencia omitidas. | Completar las capturas manuales pendientes; etapa 5 activa. |

| 2026-10-23 | 5 cierre | Capturas verificadas en PostgreSQL y textos alternativos sustituidos por los descriptivos del README. | 18 hashes coinciden con los archivos; 18 filas actualizadas en una transacción; 6 proyectos y 18 medios sin cambios. | Ninguno; etapa cerrada. |

| 2026-10-23 | 6 habilidades | Modelo, migración 0004, API, panel y sección pública de habilidades. | `pnpm check`: 64 pruebas API con PostgreSQL temporal; Chrome: ciclo borrador → publicado → retirado, errores por campo, solo lectura de publicadas, escritorio y 375 px; base real 6/18/5 migraciones. | Experiencia laboral, educación, certificados y perfil; añadir las habilidades reales desde el panel. |

## Reglas para futuras sesiones

1. Leer este archivo, `AGENTS.md` y `docs/architecture.md` antes de editar.
2. Trabajar solo en la etapa activa, salvo corrección explícita del usuario.
3. Mantener las casillas y el registro fieles a lo implementado y verificado.
4. No marcar una etapa como terminada si falta su criterio de cierre; anotar bloqueos concretos.
5. Conservar los cambios existentes del repositorio y no borrar datos de PostgreSQL.
