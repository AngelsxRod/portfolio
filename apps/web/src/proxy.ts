import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Solo rutas públicas: el panel, la API, los recursos de Next y los
  // archivos con extensión quedan fuera de la negociación de idioma.
  matcher: ["/((?!admin|api|components|_next|_vercel|.*\\..*).*)"],
};
