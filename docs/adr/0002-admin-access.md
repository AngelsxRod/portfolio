# Acceso administrativo con sesiones en PostgreSQL

## Decisión

El portafolio tiene un solo administrador. Su nombre de usuario y el hash `scrypt` de su contraseña se configuran como `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` en el servidor de la API. No hay registro ni tabla de usuarios. La contraseña original nunca se guarda en el repositorio ni se transmite a la web como configuración; `pnpm admin:hash` genera el hash mediante una lectura interactiva sin mostrarla.

La API crea un identificador aleatorio de 256 bits al iniciar sesión. Envía el identificador únicamente en una cookie `HttpOnly`, `SameSite=Lax`, con ámbito del host y ocho horas de duración; usa `Secure` en producción. PostgreSQL conserva solo su hash SHA-256 y la fecha de vencimiento. El cierre de sesión borra el registro, de modo que la revocación funciona entre instancias de Vercel. La API comprueba la sesión mediante un guard global que deniega el acceso salvo en rutas marcadas explícitamente como públicas. Los intentos fallidos se limitan por origen durante una ventana de 15 minutos, también en PostgreSQL.

La web y la API son proyectos Vercel distintos. El navegador envía el formulario al servidor Next.js de su propio origen. Next.js llama a NestJS y traslada la cabecera `Set-Cookie` al navegador, por lo que la cookie queda ligada al host de la web. La consulta del panel reenvía esa cookie desde el servidor Next.js a la API. La API sigue siendo la autoridad para autenticar y autorizar; la web no consulta PostgreSQL. El inicio de sesión de la API exige además `ADMIN_PROXY_SECRET`, configurado solo en los dos servidores. La web le reenvía la IP del visitante que Vercel coloca en las cabeceras de la petición para que el límite de intentos no agrupe a todos los visitantes bajo la IP de la función Next.js. Las solicitudes que cambian la sesión requieren que `Origin` coincida exactamente con `WEB_ORIGIN`; no se habilita CORS.

## Consecuencias

- Se requiere la migración aditiva de `admin_sessions` y `admin_login_attempts` antes de activar el acceso.
- Los dos despliegues deben configurar `WEB_ORIGIN` con el origen exacto de la web y el mismo `ADMIN_PROXY_SECRET` aleatorio de al menos 32 caracteres. La web configura `API_URL`; la API, `DATABASE_URL`, `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH`.
- Cambiar el hash de la contraseña no revoca automáticamente sesiones existentes. Para revocarlas todas, se eliminan los registros de `admin_sessions` mediante una operación administrativa de base de datos.
- Las futuras rutas de contenido permanecen privadas por defecto; cada una necesitará además sus reglas de autorización y validación.
