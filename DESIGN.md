# Dirección visual: folio técnico

Este portafolio presenta trabajo publicado sin atribuir biografía, especialidades ni resultados que todavía no estén documentados. Su carácter visual combina la precisión de una ficha de proyecto con la calma de un archivo bien editado. La forma memorable es un símbolo geométrico de líneas y disco en la portada; el resto de la interfaz deja hablar a los casos.

## Principios

1. **El trabajo es el contenido principal.** La portada lleva al archivo y muestra proyectos reales en el orden publicado. No crear casos, métricas ni testimonios de relleno.
2. **Jerarquía por escala y espacio.** Un título grande abre cada página; las divisiones señalan secciones reales. Evitar números decorativos, rótulos repetidos y tarjetas idénticas para todo.
3. **Una voz útil y neutral.** Nombrar acciones y estados con precisión: «Ver proyecto», «Proyecto no disponible», «Intentar de nuevo». Evitar frases biográficas o promesas no verificadas.
4. **Un gesto gráfico, no una colección de efectos.** El símbolo abstracto identifica la portada sin fingir ser una captura del proyecto.

## Tipografía

- Familia: `Avenir Next`, Avenir, `Segoe UI`, Arial, sans-serif. Se usa una pila local para evitar que la carga de una fuente remota bloquee la página.
- Títulos principales: peso 700–750, interletrado aproximado `-0.075em`, interlínea `0.94`, escala fluida de `3.2rem` en móvil a `8.4rem` en escritorio. Títulos de sección: `2.5–4.5rem` con `-0.055em`.
- Texto de lectura: `1.05–1.35rem`, interlínea `1.55–1.75`, ancho máximo de `44rem` para descripciones. Mantener menos de unas 80 letras por línea.
- Usar mayúsculas y minúsculas normales. No convertir cada subtítulo en una etiqueta de caja alta ni colorear una sola palabra del titular.

## Paleta y tokens

Los tokens compartidos viven en `packages/ui/src/styles/globals.css` y alimentan shadcn/ui, incluidas las vistas del panel.

| Papel    | Valor     | Uso                                  |
| -------- | --------- | ------------------------------------ |
| Tinta    | `#142d38` | Titulares, texto principal, pie      |
| Petróleo | `#145b68` | Acciones primarias, enlaces, símbolo |
| Bruma    | `#f4f7f7` | Fondo público                        |
| Blanco   | `#ffffff` | Superficies y estados                |
| Hielo    | `#e0edef` | Chips y bloques secundarios          |
| Regla    | `#aac2c8` | Divisiones del folio                 |

`--foreground`, `--primary`, `--secondary`, `--muted`, `--border` y `--ring` siguen esas funciones semánticas. Para texto secundario se usan `#395863` o `#526a72` sobre Bruma/Blanco. El foco usa `#08778a` con un contorno visible de 3 px. No usar Petróleo para texto pequeño sobre un fondo de color similar, ni sustituir reglas por sombras flotantes.

## Composición y espacio

- Marco máximo de `78rem`; márgenes laterales de `1.5rem` en escritorio y `1rem` en móvil.
- Portada en dos columnas: mensaje y navegación a la izquierda, símbolo a la derecha. El símbolo pasa debajo del texto en pantallas estrechas.
- Archivo y selección de portada como grid: dos columnas en escritorio y una hasta 640 px. Las tarjetas siguen la referencia editorial aportada: imagen rectangular sin marco ni radios, título compacto, resumen y enlace debajo. Cada proyecto tiene una vista previa de proporción 2:1, título, resumen, tecnologías presentes y enlace. Los proyectos sin imagen usan una composición tipográfica con su nombre e inicial; nunca capturas ficticias.
- Detalle con título destacado arriba a la izquierda, resumen y enlaces a su derecha y la imagen protagonista al ancho del marco justo debajo. En móvil la cabecera pasa a una columna antes de la galería. La galería no lleva panel contenedor ni miniaturas; las flechas y el indicador van en una barra discreta inferior. Clic en la imagen abre un visor de toda la pantalla con navegación circular, teclado y cierre con Escape; al cerrar, el foco vuelve a la imagen seleccionada. Las capturas se muestran completas, sin recortar contenido. Sin imágenes se conserva la cabecera tipográfica. La descripción continúa debajo, con ficha lateral únicamente cuando hay metadatos.
- Escala de espacio base: `0.5`, `0.75`, `1`, `1.5`, `2`, `3`, `4`, `5` y `7rem`. Entre secciones principales usar `4–7rem`; entre título y resumen, `0.8–2rem`. No comprimir varias funciones dentro de una tarjeta pequeña.

## Imágenes

La etapa de medios permite mostrar imágenes publicadas con texto alternativo. Cuando no hay imágenes, usar tipografía y color. No usar capturas ficticias de R&R Asociados ni imágenes de stock como si fueran el proyecto. Cuando lleguen medios, usar una imagen principal por caso con proporción estable, sin recortar información esencial; el texto alternativo debe describir lo visible, no repetir el título.

## Interacción y movimiento

- Las acciones usan el componente `Button` de shadcn/ui; las tecnologías usan `Badge`. Variantes primarias para la acción principal, contorno para la secundaria. Las filas tienen enlaces con nombre explícito y subrayado visible al pasar el cursor.
- Enlaces, botones y campos muestran un foco de alto contraste. El enlace «Saltar al contenido» aparece al recibir foco. `aria-current="page"` señala la navegación activa.
- Los cambios de color pueden durar cerca de `150ms`; evitar entradas automáticas en cascada, paralaje y movimiento ornamental. Respetar `prefers-reduced-motion`.
- Estado vacío: explicar cuándo aparecerá contenido. Error: nombrar el fallo y ofrecer reintentar. 404: ofrecer volver al archivo. Evitar mensajes vagos como «Algo salió mal».

## Móvil y accesibilidad

- La portada pasa a una columna desde `800px`; la galería del detalle adapta su proporción desde `600px`. El grid de proyectos usa dos columnas y pasa a una a `640px`. No esconder enlaces esenciales detrás de un menú que hoy no hace falta.
- Mantener áreas de toque cómodas, lectura sin desplazamiento horizontal y títulos que envuelvan palabras largas. El Markdown y los bloques de código deben poder desbordarse dentro de su región sin romper el marco.
- Usar `header`, `nav`, `main`, `section`, `article`, `aside` y `footer` según su función, un `h1` por página y encabezados en orden. El símbolo de portada es decorativo y se oculta a lectores de pantalla.
- Comprobar teclado, zoom, contraste y anchos de 375 px y escritorio antes de publicar cambios visuales.

## Para páginas futuras

Una página de perfil, cuando tenga datos reales, debería abrir con su información confirmada y continuar con secciones separadas por reglas. Un certificado se mostraría con emisor y fecha reales. Evitar la secuencia automática de hero con eslogan, cuatro tarjetas de métricas y carrusel de testimonios cuando esos datos no existan.

## Panel administrativo

El panel usa una paleta propia con la sobriedad de una herramienta de trabajo: violeta (`#6d28d9` en claro, `#a78bfa` en oscuro) como acento de la acción primaria, el foco y la sección activa, sobre superficies en grises neutros —sin fondos teñidos de lila— y reglas finas en lugar de sombras. Se define en `globals.css` con `body:has(.admin-shell)`, así que no afecta al sitio público, que conserva el petróleo. Los títulos de página miden `1.875rem` (peso 700, interletrado `-0.025em`), no la escala de la portada.

- **Navegación:** barra lateral fija agrupada en «Contenido» y «Sitio»; en móvil, `Sheet`. Cabecera con migas y «Ver sitio».
- **Estados:** `Publicado` en petróleo sólido y `Borrador` en Hielo, siempre con texto.
- **Listados:** título, descripción y acción principal arriba; búsqueda y filtro de estado; tabla en escritorio y tarjetas bajo 768 px. Retirar siempre pide confirmación.
- **Formularios:** secciones con título y descripción a la izquierda y campos a la derecha (apiladas en móvil), y una barra de acciones fija abajo.
- **Accesibilidad:** «Saltar al contenido», `aria-current`, foco visible y `prefers-reduced-motion` respetado en el panel.
- **Modo oscuro:** opcional y solo en el panel, con los tokens `.dark` de `globals.css`; claro por defecto. El sitio público siempre es claro.
