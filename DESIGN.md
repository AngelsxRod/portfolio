# Dirección visual: angel.os

El sitio público es un escritorio de sistema operativo propio: una barra superior con reloj, ventanas que se arrastran, un dock con las secciones, una bandeja para recuperar ventanas y una cinta que corre al pie. Cada página es una metáfora de una herramienta conocida (bloc de notas, explorador, navegador, terminal, `git log`, carpeta, correo). Es oscuro siempre y no tiene selector de tema. El panel `/admin` conserva su propia identidad (ver al final).

La maqueta aprobada está en el lienzo de diseño «angel.os» (7 artboards `project/*.dc.html`). Sus textos y datos son de ejemplo: en la implementación todo sale del CMS.

## Principios

1. **Datos honestos.** Cada texto con información sale de un loader público (`getPublicProfile`, `getPublicProjects`, `getRelatedProjects`, `getPublicSkills`, `getPublicExperience`, `getPublicEducation`, `getPublicCertificates`). Si un campo no existe en el modelo (foto, «dato curioso», lugar de un puesto, empresa de un proyecto) no se muestra; si una lista está vacía, la ventana explica cuándo aparecerá contenido o se oculta.
2. **El juego no estorba.** Las ventanas, la cinta, las formas flotantes y el arranque son ornamento: el contenido es legible sin arrastrar nada, en el orden del DOM, con teclado y con lector de pantalla.
3. **Planos y duros.** Bordes de 1,5 px, sombras sólidas desplazadas, colores planos. Sin degradados, desenfoques ni violeta.
4. **Voz útil.** Rótulos de sistema en minúsculas (`hola.txt`, `notas.md`, `otros_canales`) y acciones precisas: «Abrir ficha →», «Visitar ↗», «Intentar de nuevo».

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

- **Shell** (`components/os/os-shell.tsx`, montado por `app/(public)/layout.tsx` y por `app/not-found.tsx`): «Saltar al contenido», barra superior hueso de 44 px (logo `angel.os` con punto pulsante, página activa, «Guatemala, GT» y reloj `America/Guatemala`), escritorio `main#contenido`, dock y cinta. El contenedor es flex en columna: el dock y la cinta llevan `order` para quedar al pie aunque la cinta la renderice cada página.
- **Ventana** (`components/os/window.tsx`): borde 1,5 px hueso, radio 8 px, sombra `8px 8px 0` lima (variante naranja), barra hueso de 48 px con título y botones `_` (minimizar), `□` (restablecer posición) y `×` (cerrar) de 40 px. Se arrastra desde la barra con pointer events; un clic la trae al frente. Aparece con animación `pop`; `--os-delay` escalona las ventanas.
- **Estado** (`lib/os/desktop.ts`, reductor puro probado; `DesktopProvider` lo comparte con la bandeja): registro al montar, foco por z-index, posición limitada al escritorio, ajuste de las posiciones por defecto al ancho disponible (las ventanas que no se arrastraron vuelven a su sitio al ensanchar), minimizar/cerrar/restaurar/restablecer y alto mínimo del escritorio según la ventana más baja.
- **Dock**: seis destinos con iconos de trazo, rebote al pasar el cursor, activo en lima con punto y `aria-current="page"`. **Bandeja**: un chip por ventana (`aria-pressed`), discontinuo cuando está oculta.
- **Cinta**: lima, decorativa (`aria-hidden`), con datos de la página (tecnologías, títulos, organizaciones…); sin datos no se muestra.
- **Decoración**: círculo naranja, píldora lima y anillo hueso flotando lentamente; notas adhesivas naranjas giradas. Todo `aria-hidden` salvo el texto útil de la nota.

## Páginas

| Ruta               | Metáfora                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Arranque (solo la primera visita de la sesión), `hola.txt`, `proyectos_recientes/`, `sistema.info`, nota y accesos directos.          |
| `/projects`        | Explorador con filtros por `projectType` real (sin tipos, solo «Todos») y `vista_previa` que sigue al hover/foco.                     |
| `/projects/[slug]` | Navegador con la URL de `demoUrl`, una pestaña por captura y visor a pantalla completa; ficha `.info`; `notas.md` con el Markdown.    |
| `/sobre-mi`        | Terminal (`whoami`, `cat bio.txt`, `ls ~/trabajo`, «volver a ejecutar») y `paquetes_instalados` por categoría.                        |
| `/experiencia`     | `git log` con un commit por puesto que se despliega con `+ logros`, y línea de tiempo calculada con las fechas de trabajo y estudios. |
| `/educacion`       | Carpeta `~/estudios` con un archivo por estudio y `certificados/`; vista en papel hueso con sello «EN CURSO» si no hay fin.           |
| `/contacto`        | `nuevo_mensaje.eml` con el formulario (RHF + Zod), avión de papel al enviar, y `otros_canales`.                                       |
| Errores y 404      | Ventana naranja `error.log` / `404.log` con «Intentar de nuevo» o volver.                                                             |

Los estilos de cada página viven en `apps/web/src/styles/os/*.css` (sin capa, para prevalecer sobre las utilidades de los componentes shadcn que reciben esas clases) y se importan desde el shell o la página.

## Movimiento

- Animaciones solo CSS: aparición `pop`, flotación lenta de formas, rebote del dock, escritura de la terminal, crecimiento de barras, papel y sello, avión de papel, cinta continua.
- El arranque se decide antes del primer pintado con un script inline mínimo (`lib/os/boot.ts`) que marca `html[data-booted]` si `sessionStorage` ya lo registró; todo acceso al almacenamiento usa `try/catch`.
- `prefers-reduced-motion: reduce` desactiva todas las animaciones y transiciones del shell, oculta el arranque y muestra la terminal completa.

## Móvil y accesibilidad

- Por debajo de 820 px las ventanas pasan a flujo normal apiladas en el orden del DOM, sin arrastre ni formas flotantes; notas y accesos directos también se apilan. El escritorio recorta lo que sobresale para que no haya desplazamiento horizontal.
- Un `h1` por página (dentro de la ventana principal, que se nombra con él); las ventanas secundarias se titulan con `h2` en la barra. Las ventanas son `section` con nombre accesible.
- Foco visible de 3 px naranja (oscuro sobre superficies hueso). Al minimizar o cerrar, el foco pasa al chip de la bandeja; al restaurar, a la ventana.
- Los enlaces con forma de botón usan `buttonVariants` de shadcn sobre `<a>`/`Link` para conservar la semántica de enlace; las acciones usan `Button`.
- Áreas de toque de al menos 40–44 px. Comprobar 375 px y 1440 px, teclado y movimiento reducido antes de publicar cambios visuales.

## Panel administrativo

El panel no usa angel.os. Conserva la paleta anterior (Deep Purple `#433075`, Lavender `#a78bfa`, Soft White y Jet Black) con los tokens de `:root` y `.dark` de `globals.css`, Sora como `--font-display`, tema claro por defecto y selector Claro/Oscuro/Sistema en su cabecera (`ThemeToggle`, `next-themes`). Sobriedad de herramienta de trabajo: barra lateral fija agrupada (en móvil, `Sheet`), títulos de `1.875rem`, estados `Publicado`/`Borrador` siempre con texto, listados con búsqueda y filtro, formularios por secciones con barra de acciones fija y confirmación al retirar.
