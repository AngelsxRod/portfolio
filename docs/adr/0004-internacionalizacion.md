# ADR 0004: internacionalización del sitio público

**Estado:** aceptado (etapa 14, 2026-11-23).

## Contexto

El sitio público está solo en español: los textos están fijos en los componentes, `<html lang>` es siempre `es` y las fechas usan `es-GT`. Se quiere ofrecer también inglés sin tocar la API ni el modelo de contenido.

## Decisión

Usar `next-intl` con App Router y un segmento `[locale]` bajo las rutas públicas. Idiomas: `es` (por defecto) y `en`. Todas las URLs públicas llevan prefijo (`localePrefix: "always"`): `/es/sobre-mi`, `/en/sobre-mi`. Los nombres de las rutas no se traducen, así que `routes.ts` y los enlaces conservan sus segmentos actuales.

Los textos de interfaz viven en `apps/web/messages/{es,en}.json`, agrupados por espacio de nombres. Un `proxy.ts` negocia el idioma con `Accept-Language` y redirige `/` al prefijo correspondiente. Su `matcher` excluye `/admin`, `/api`, `/_next` y los archivos estáticos, de modo que la autenticación del panel y los proxies del mismo origen no cambian.

Quedan fuera de alcance: el panel administrativo, los mensajes de error de la API y el contenido del CMS (proyectos, experiencia, educación, certificados, habilidades y perfil). No hay migraciones ni columnas de traducción. Los esquemas Zod del sitio público se construyen con el traductor para que sus mensajes salgan en el idioma activo.

## Consecuencias

Con la interfaz en inglés, el contenido del CMS se sigue mostrando en español; es una limitación aceptada hasta que se decida traducirlo. Traducir el contenido exigiría una nueva ADR, porque implica tablas o columnas por idioma y duplicar el flujo de borrador, `pending` y publicación. Los errores de la API que llegan al visitante (por ejemplo, un fallo del formulario de contacto) siguen en español.

El sitio público pasa a ser el primer consumidor de `proxy.ts`. Un `matcher` demasiado amplio rompería el panel o los proxies de `app/api`, por lo que se verifica explícitamente en cada cambio. Cada idioma nuevo exige un archivo de mensajes con las mismas claves; una prueba compara las claves de `es.json` y `en.json`.
