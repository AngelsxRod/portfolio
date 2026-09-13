export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const messages = {
  es: {
    eyebrow: 'Base técnica publicada',
    title: 'Portafolio en construcción',
    description:
      'Next.js, NestJS, Neon y Vercel conectados. El contenido y el diseño crecerán en entregas pequeñas.',
    apiOnline: 'API y base de datos disponibles',
    apiOffline: 'API o base de datos sin conexión',
    checking: 'Comprobando servicios',
    switchLanguage: 'English',
  },
  en: {
    eyebrow: 'Technical foundation deployed',
    title: 'Portfolio under construction',
    description:
      'Next.js, NestJS, Neon, and Vercel are connected. Content and design will grow through small releases.',
    apiOnline: 'API and database are available',
    apiOffline: 'API or database is unavailable',
    checking: 'Checking services',
    switchLanguage: 'Español',
  },
} satisfies Record<Locale, Record<string, string>>;
