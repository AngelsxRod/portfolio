# ADR 0003: imágenes de proyectos en PostgreSQL

**Estado:** aceptado (etapa 5, 2026-10-22).

## Contexto

El CMS ya usa PostgreSQL para los proyectos. Las imágenes deben sobrevivir a reinicios del proceso, seguir la publicación del proyecto y conservarse junto con los seis proyectos existentes. El despliegue todavía no define almacenamiento de objetos ni un volumen persistente compartido.

## Decisión

Guardar cada imagen en `project_media` como `bytea`, con UUID, clave foránea al proyecto, tipo MIME, texto alternativo obligatorio y fechas. La migración `0002_fancy_zaran.sql` solo crea esta tabla e índice; no modifica las filas de `projects`. Limitar cada archivo a 5 MiB y aceptar PNG, JPEG o WebP comprobando el tipo declarado y la firma del contenido. El cuerpo HTTP tiene un límite de 7 MiB para permitir la codificación base64; la API rechaza campos inesperados y no devuelve los bytes en listados.

La carga, consulta privada y eliminación requieren sesión administrativa. La carga y eliminación exigen el origen web configurado. El archivo público solo se entrega si el proyecto asociado está `published`, y las respuestas llevan `no-store` y `nosniff`. El panel permite asociar imágenes tanto a borradores como a publicados. Un borrador conserva sus imágenes al publicarse o retirarse. El detalle público muestra las imágenes en un carrusel accesible y portada y archivo incorporan una vista previa, conservando la composición existente.

La ampliación de la etapa 5 añade `is_featured` con valor inicial `false` e índice único parcial por proyecto mediante la migración aditiva `0003_solid_warbird.sql`. No cambia bytes, asociaciones ni metadatos anteriores. La selección explícita de destacada es transaccional; sin selección se usa la primera imagen por fecha e ID. El formulario integra carga y edición de medios con guardado por pasos y reintentos de operaciones pendientes; los fallos conservan los archivos y textos en memoria mientras el formulario permanezca abierto.

## Consecuencias

La copia de seguridad y restauración de PostgreSQL incluye imágenes y metadatos de forma conjunta. La base crecerá con los medios; hay sobrecarga de base64 durante la carga y no hay variantes optimizadas. Si el volumen o tráfico crece, se puede migrar el contenido binario a almacenamiento de objetos conservando UUID y metadatos, con una nueva ADR. No se confía en el nombre del archivo ni se permite SVG o HTML.
