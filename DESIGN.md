# Dirección visual: angel.os

El sitio público es un escritorio de sistema operativo propio: una barra superior con reloj, ventanas que se arrastran, un dock con las secciones, una bandeja para recuperar ventanas y una cinta que corre al pie. Cada página es una metáfora de una herramienta conocida (bloc de notas, explorador, navegador, terminal, `git log`, carpeta, correo). Es oscuro siempre y no tiene selector de tema. El panel `/admin` usa la misma marca con una apariencia más sobria (ver al final).

La maqueta aprobada está en el lienzo de diseño «angel.os» (7 artboards `project/*.dc.html`). Sus textos y datos son de ejemplo: en la implementación todo sale del CMS.

## Principios

1. **Datos honestos.** Cada texto con información sale de un loader público (`getPublicProfile`, `getPublicProjects`, `getRelatedProjects`, `getPublicSkills`, `getPublicExperience`, `getPublicEducation`, `getPublicCertificates`). Si un campo no existe en el modelo (foto, «dato curioso», lugar de un puesto, empresa de un proyecto) no se muestra; si una lista está vacía, la ventana explica cuándo aparecerá contenido o se oculta.
2. **El juego no estorba.** Las ventanas, la cinta, las formas flotantes y el arranque son ornamento: el contenido es legible sin arrastrar nada, en el orden del DOM, con teclado y con lector de pantalla.
3. **Planos y duros.** Bordes de 1,5 px, sombras sólidas desplazadas, colores planos. Sin degradados, desenfoques ni violeta.
4. **Claro antes que ingenioso.** La metáfora es un guiño, no un requisito: cada ventana dice qué es en español llano y el nombre de archivo va detrás en gris. Nada de jerga que obligue a saber programar (sin hashes, `HEAD` ni «commits»). Acciones precisas: «Abrir ficha →», «Visitar ↗», «Intentar de nuevo».

## Tokens

Viven en `:root` de `packages/ui/src/styles/globals.css` como `--os-*` (independientes del tema del panel) y se exponen a Tailwind v4 como `--color-os-*` (`bg-os-surface`, `text-os-lime`…).

| Token            | Valor     | Uso                                                |
| ---------------- | --------- | -------------------------------------------------- |
| `--os-bg`        | `#0d0e12` | Fondo del escritorio, campos, terminal             |
| `--os-dot`       | `#2b2d36` | Retícula de puntos (`radial-gradient` cada 24 px)  |
| `--os-surface`   | `#17181f` | Cuerpo de las ventanas                             |
| `--os-surface-2` | `#22232c` | Hover y selección dentro de ventanas               |
| `--os-bone`      | `#f2efe8` | Texto principal, bordes, barra de título y dock    |
| `--os-bone-2`    | `#e2dfd6` | Hover sobre superficies hueso                      |
| `--os-text`      | `#d9d6ce` | Texto de lectura                                   |
| `--os-muted`     | `#a9a7a0` | Texto secundario y etiquetas                       |
| `--os-lime`      | `#c8f031` | Acento principal: acción primaria, activo, cinta   |
| `--os-orange`    | `#ff6a2b` | Acento secundario, notas, sombra alternativa, foco |
| `--os-stamp`     | `#d24a12` | Sello «EN CURSO» sobre papel hueso                 |
| `--os-rule`      | `#34353f` | Reglas y bordes internos, campos                   |

La clase `.os-theme` (en el contenedor público junto con `dark`) redefine los tokens de shadcn/ui (`--primary` lima, `--ring` naranja, `--border` y `--input` regla, `--radius` 0,5 rem) para que `Button`, `Badge`, `Tabs`, `ToggleGroup`, `Field`, `Input`, `Textarea` y `Dialog` tomen la identidad sin copias.

## Tipografía

- Con `next/font/google` en `apps/web/src/lib/os/fonts.ts`: **Syne 800** como `--font-display` para títulos y **JetBrains Mono** como `--font-mono` para toda la interfaz. Las variables se aplican solo al shell público; el layout raíz sigue cargando Sora para el panel.
- Títulos con interletrado `-0.035em` e interlínea `0.88–0.95`. El nombre de la portada calcula su tamaño por la palabra más larga para no partirla. Syne es ancha: los títulos grandes usan `clamp()` o un tamaño limitado por el ancho de la ventana.
- Interfaz en 12–14 px; texto de lectura en 14–17 px con interlínea 1,6.

## Ventanas y shell

- **Shell** (`components/os/os-shell.tsx`, montado por `app/(public)/layout.tsx` y por `app/not-found.tsx`): «Saltar al contenido», barra superior hueso de 44 px (isotipo y `angel.os`, con el punto naranja del isotipo latiendo, página activa, «Guatemala, GT» y reloj `America/Guatemala`), escritorio `main#contenido`, dock y cinta. El contenedor es flex en columna: el dock y la cinta llevan `order` para quedar al pie aunque la cinta la renderice cada página.
- **Ventana** (`components/os/window.tsx`): borde 1,5 px hueso, radio 8 px, sombra `8px 8px 0` lima (variante naranja), barra hueso de 48 px con un **título claro** («Proyectos recientes») seguido del nombre de archivo en gris como guiño técnico (`proyectos_recientes/`, oculto en móvil), y botones `_` (minimizar), `□` (volver a su lugar) y `×` (cerrar) de 40 px con descripción emergente. Cerrar y minimizar hacen lo mismo: la ventana se guarda en «Ventanas». Se arrastra desde la barra; un clic la trae al frente; aparece con animación `pop` escalonada por `--os-delay`.
- **Estado** (`lib/os/desktop.ts`, reductor puro probado; `DesktopProvider` lo comparte con la bandeja): cada ventana o elemento suelto (`DesktopItem`: notas y accesos directos) declara una **columna** (`stack`); los elementos de una columna se apilan según su alto real medido, así un texto largo del CMS nunca tapa al siguiente, y al ocultar uno los de abajo suben. Lo que se arrastra sale de la columna; `□` lo devuelve. También limita la posición al escritorio, ajusta las posiciones al ancho disponible, ofrece «Restaurar todo» y calcula el alto mínimo del escritorio. Si con el ancho disponible las columnas se pisarían (tabletas y portátiles pequeños), todo se apila en una sola columna en orden de registro. La columna reservada **`pie`** empieza debajo de la más baja de las demás y no cuenta para decidir si las columnas se pisan.
- **Menú lateral deslizante** (`components/os/dock.tsx`), en todo el escritorio (≥ 821 px): fijo a la izquierda y centrado en vertical, arranca oculto fuera del borde (`translateX(-100%)`) y solo asoma una **pestaña** hueso anclada a su borde derecho (`left: 100%`) con una flecha ›, «Menú» en vertical y, si hay ventanas ocultas, su número en una pastilla naranja. La pestaña (`aria-expanded`) alterna `.is-open`, que lo desliza a `translateX(0)` con `transition: transform 0.3s ease`; la pestaña se mueve con el panel y cambia a ‹. El contenedor tiene `pointer-events: none`: flota encima del escritorio sin desplazarlo ni bloquear clics o scroll. Dentro: seis destinos con iconos de trazo y texto (activo en lima con punto y `aria-current="page"`) y el botón **«Ventanas»** (`Collapsible` de shadcn), cuyo panel abre a la derecha de la pestaña para mostrar u ocultar ventanas o «Restaurar todo». Al abrir, el foco va a la sección actual; se cierra con Escape (el foco vuelve a la pestaña), con la propia pestaña, un clic fuera, al elegir una sección o al navegar. Cerrado, el panel es `inert`. Entre 821 y 1100 px la barra superior oculta «Guatemala, GT». La primera visita en escritorio muestra una **pista** que explica la pestaña «Menú» y las ventanas («Entendido» la guarda en `localStorage`).
- **Cinta**: lima, decorativa (`aria-hidden`), con datos de la página (tecnologías, títulos, organizaciones…); sin datos no se muestra.
- **Decoración**: círculo naranja, píldora lima y anillo hueso flotando lentamente; notas adhesivas naranjas giradas. Todo `aria-hidden` salvo el texto útil de la nota.

## Marca

- **Isotipo «Muesca K en bloque»**: un bloque lima redondeado (radio 12 sobre 64) con la K vaciada en negro al 72 % y un punto naranja en el hueco entre sus brazos. Sale de la inicial K de Angel Kaled y de la «muesca» como hueco; el bloque y la sombra lo atan a las ventanas del sitio. Se eligió entre 20 propuestas por leerse bien a 16 px.
- **Colores**: lima `#c8f031` (bloque), negro `#0d0e12` (K) y naranja `#ff6a2b` (punto). En un solo color, el bloque toma el color de la tinta y la K y el punto quedan calados (`mark-mono-dark.svg` sobre fondos claros, `mark-mono-light.svg` sobre oscuros).
- **Lockup**: isotipo a la izquierda de «angel.os», con el isotipo a la altura de la línea de texto o algo mayor y una separación de un tercio de su ancho. Área de respeto alrededor: un cuarto del ancho del isotipo. Tamaño mínimo: 16 px.
- **Archivos** (`apps/web/public/brand/`): `mark.svg` (fuente de verdad), `mark-mono-*.svg`, PNG transparentes de 64, 192, 512 y 1024 px y `mark-on-dark-1024.png` para avatares. Los PNG y `src/app/apple-icon.png` se regeneran con `pnpm --filter web brand:png` (usa `sharp`).
- **Avatar** (`apps/web/public/brand/avatar-kaled.svg`): retrato pixel art de Kaled con fondo transparente. Se muestra con `ProfileAvatar` (`components/os/avatar.tsx`, estilos en `styles/os/avatar.css`): marco hueso de 1,5 px, retícula de puntos, sombra sólida lima (naranja en la terminal), `image-rendering: pixelated` y un rebote lento solo CSS. Vive en la presentación del inicio y junto a `whoami` en «Sobre mí»; es un archivo de marca, no un dato del CMS.
- **En el sitio**: favicon `src/app/icon.svg`, icono de Apple de 180 px sobre negro, imagen para compartir `app/(public)/opengraph-image.tsx` (1200×630: isotipo, «angel.os» en Syne, nombre y título del perfil publicado, `kaled.dev` y la cinta lima) y `BrandMark` (`components/os/brand-mark.tsx`) en la barra superior y el menú del teléfono. La geometría vive en `lib/os/brand.ts`; una prueba comprueba que los SVG del disco coinciden con ella.

## Páginas

| Ruta               | Metáfora                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Arranque (primera visita de la sesión); «Presentación», «Proyectos recientes», «Datos de contacto», nota y accesos directos.                                                                                                                                                                                                                              |
| `/projects`        | «Explorador de proyectos» con filtros por `projectType` solo si un tipo agrupa 2 o más proyectos, y «Vista previa» que sigue al hover/foco.                                                                                                                                                                                                               |
| `/projects/[slug]` | «Así se ve…» (navegador con la URL de `demoUrl`, una pestaña por vista y visor a pantalla completa), «Ficha del proyecto» (`ficha.info`, título ajustado al ancho sin cortar palabras) y, a todo el ancho debajo de ambas, «De qué trata» (introducción con medida de lectura y una tarjeta por sección del Markdown) y «Otros proyectos» con miniaturas. |
| `/sobre-mi`        | Terminal «Sobre mí» con salidas legibles y enlaces claros, botón «Repetir animación», y «Habilidades» por categoría.                                                                                                                                                                                                                                      |
| `/experiencia`     | «Trayectoria»: un trabajo por fila con etiqueta «Actual», que se despliega con sus logros; «Línea de tiempo» con leyenda de colores.                                                                                                                                                                                                                      |
| `/educacion`       | «Estudios» con un icono por estudio rotulado con el programa y «Certificados»; «Detalle» en papel hueso con sello «EN CURSO».                                                                                                                                                                                                                             |
| `/contacto`        | «Escríbeme» con el formulario (RHF + Zod) y avión de papel al enviar; «Otros canales».                                                                                                                                                                                                                                                                    |
| Errores y 404      | Ventana naranja `error.log` / `404.log` con «Intentar de nuevo» o volver.                                                                                                                                                                                                                                                                                 |

Los estilos de cada página viven en `apps/web/src/styles/os/*.css` (sin capa, para prevalecer sobre las utilidades de los componentes shadcn que reciben esas clases) y se importan desde el shell o la página.

## Movimiento

- Animaciones solo CSS: aparición `pop`, flotación lenta de formas, rebote del dock, escritura de la terminal, crecimiento de barras, papel y sello, avión de papel, cinta continua.
- El arranque se decide antes del primer pintado con un script inline mínimo (`lib/os/boot.ts`) que marca `html[data-booted]` si `sessionStorage` ya lo registró; todo acceso al almacenamiento usa `try/catch`.
- `prefers-reduced-motion: reduce` desactiva todas las animaciones y transiciones del shell, oculta el arranque y muestra la terminal completa.

## Móvil y accesibilidad

- **Teléfono (≤ 820 px):** el dock desaparece y la barra superior queda fija con un botón **«Menú»** que abre un menú lateral (`Sheet` de shadcn, desde la izquierda) con las seis secciones y, si hay ventanas ocultas, «Mostrar ventanas ocultas». Las ventanas pasan a flujo normal apiladas en el orden del DOM, sin arrastre ni controles de ventana, sin formas flotantes ni pista; la vista previa del explorador se oculta (cada tarjeta ya abre su ficha) y las tarjetas van a una columna por debajo de 480 px. El escritorio recorta lo que sobresale para que no haya desplazamiento horizontal.
- Un `h1` por página (dentro de la ventana principal, que se nombra con él); las ventanas secundarias se titulan con `h2` en la barra. Las ventanas son `section` con nombre accesible.
- Foco visible de 3 px naranja (oscuro sobre superficies hueso). Al minimizar o cerrar, el foco pasa al botón «Ventanas»; al restaurar, a la ventana.
- Los enlaces con forma de botón usan `buttonVariants` de shadcn sobre `<a>`/`Link` para conservar la semántica de enlace; las acciones usan `Button`.
- Áreas de toque de al menos 40–44 px. Comprobar 375 px y 1440 px, teclado y movimiento reducido antes de publicar cambios visuales.

## Panel administrativo

El panel comparte la marca angel.os, pero como herramienta de trabajo: sin ventanas ni dock. Los colores salen de los tokens de `:root` (tema claro derivado) y `.dark` (tema por defecto) de `packages/ui/src/styles/globals.css`, que el sitio público sobrescribe con `.os-theme`.

- **Oscuro (por defecto)**: los mismos valores que el sitio: fondo `--os-bg`, tarjetas `--os-surface`, texto hueso, acción principal lima con texto negro, bordes `--os-rule` y foco naranja.
- **Claro (derivado)**: fondo hueso `#f2efe8`, tarjetas `#fbfaf6`, texto `#0d0e12`, el mismo botón lima con texto negro, grises `#5a5850` (6,2:1 sobre el fondo) y foco naranja oscuro `#d24a12` (3,9:1). El selector Claro/Oscuro/Sistema se conserva en la cabecera (`ThemeToggle`, `next-themes`).
- **Letra**: Syne 800 en los `h1` (`--font-display`) y JetBrains Mono en todo lo demás, cargadas desde `lib/os/fonts.ts` en el layout raíz. Sora ya no se usa.
- **Detalles** (`styles/admin.css`): las tarjetas llevan borde de 1,5 px y la sombra dura de las ventanas (lima en oscuro, negra en claro).
- **Logo**: el isotipo junto a «Panel del portafolio» en la barra lateral y sobre el título del acceso.
- **Estructura**: barra lateral fija agrupada (en móvil, `Sheet`), listados con búsqueda y filtro, formularios por secciones con barra de acciones fija, estados `Publicado`/`Borrador` siempre con texto y confirmación al retirar.
