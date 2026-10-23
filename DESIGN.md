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
- Archivo como filas separadas por reglas. Cada fila contiene título y resumen a la izquierda; tecnologías y acceso al detalle a la derecha. Si hay un único caso, como R&R Asociados, ocupa una fila completa sin inventar proyectos vecinos.
- Detalle con cabecera amplia y descripción de lectura; una ficha lateral solo muestra metadatos presentes. En móvil la ficha va después de la descripción.
- Escala de espacio base: `0.5`, `0.75`, `1`, `1.5`, `2`, `3`, `4`, `5` y `7rem`. Entre secciones principales usar `4–7rem`; entre título y resumen, `0.8–2rem`. No comprimir varias funciones dentro de una tarjeta pequeña.

## Imágenes

La etapa de medios sigue pendiente. Hasta que exista una imagen publicada con permiso y texto alternativo, usar tipografía, color y geometría abstracta. No usar capturas ficticias de R&R Asociados ni imágenes de stock como si fueran el proyecto. Cuando lleguen medios, usar una imagen principal por caso con proporción estable, sin recortar información esencial; el texto alternativo debe describir lo visible, no repetir el título.

## Interacción y movimiento

- Las acciones usan el componente `Button` de shadcn/ui; las tecnologías usan `Badge`. Variantes primarias para la acción principal, contorno para la secundaria. Las filas tienen enlaces con nombre explícito y subrayado visible al pasar el cursor.
- Enlaces, botones y campos muestran un foco de alto contraste. El enlace «Saltar al contenido» aparece al recibir foco. `aria-current="page"` señala la navegación activa.
- Los cambios de color pueden durar cerca de `150ms`; evitar entradas automáticas en cascada, paralaje y movimiento ornamental. Respetar `prefers-reduced-motion`.
- Estado vacío: explicar cuándo aparecerá contenido. Error: nombrar el fallo y ofrecer reintentar. 404: ofrecer volver al archivo. Evitar mensajes vagos como «Algo salió mal».

## Móvil y accesibilidad

- Desde `800px` la portada y el detalle pasan a una columna; desde `600px` las filas también. No esconder enlaces esenciales detrás de un menú que hoy no hace falta.
- Mantener áreas de toque cómodas, lectura sin desplazamiento horizontal y títulos que envuelvan palabras largas. El Markdown y los bloques de código deben poder desbordarse dentro de su región sin romper el marco.
- Usar `header`, `nav`, `main`, `section`, `article`, `aside` y `footer` según su función, un `h1` por página y encabezados en orden. El símbolo de portada es decorativo y se oculta a lectores de pantalla.
- Comprobar teclado, zoom, contraste y anchos de 375 px y escritorio antes de publicar cambios visuales.

## Para páginas futuras

Una página de perfil, cuando tenga datos reales, debería abrir con su información confirmada y continuar con secciones separadas por reglas. Un certificado se mostraría con emisor y fecha reales. Evitar la secuencia automática de hero con eslogan, cuatro tarjetas de métricas y carrusel de testimonios cuando esos datos no existan.
