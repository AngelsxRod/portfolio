import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

const ogLocale: Record<string, string> = { es: "es_GT", en: "en_US" };

/**
 * Metadatos de una página pública: título traducido, descripción, URL
 * canónica y alternativas por idioma (hreflang). `navKey` es la clave de
 * `nav.*` que da nombre a la página; `path` es la ruta sin prefijo.
 */
export async function pageMetadata(
  locale: string,
  path: string,
  navKey: string,
  overrides: Pick<Metadata, "title" | "description"> = {},
): Promise<Metadata> {
  const [nav, meta] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "metadata" }),
  ]);
  const suffix = path === "/" ? "" : path;
  return {
    title: overrides.title ?? `${nav(navKey)} | angel.os`,
    description: overrides.description ?? meta("description"),
    alternates: {
      canonical: `/${locale}${suffix}`,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, `/${l}${suffix}`]),
        ),
        "x-default": `/${routing.defaultLocale}${suffix}`,
      },
    },
    openGraph: { locale: ogLocale[locale] },
  };
}
