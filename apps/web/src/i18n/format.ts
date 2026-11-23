import type { Locale } from "./routing";

/** Etiqueta BCP 47 que usa `Intl` para cada idioma del sitio. */
export const intlLocale: Record<Locale, string> = {
  es: "es-GT",
  en: "en-US",
};

/** Idioma de la interfaz a partir del valor de `useLocale()`. */
export function toIntlLocale(locale: string) {
  return intlLocale[locale as Locale] ?? intlLocale.es;
}
