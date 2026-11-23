import { toIntlLocale } from "@/i18n/format";

const formatters = new Map<string, Intl.DateTimeFormat>();

function month(value: string, locale: string) {
  const tag = toIntlLocale(locale);
  let short = formatters.get(tag);
  if (!short) {
    short = new Intl.DateTimeFormat(tag, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    formatters.set(tag, short);
  }
  return short.format(new Date(`${value}-01T00:00:00Z`)).replace(".", "");
}

/**
 * «oct 2025 — hoy», «ene 2022 — oct 2024». `present` es la palabra que
 * sustituye a la fecha final cuando el período sigue abierto.
 */
export function formatPeriod(
  start: string,
  end: string | null,
  locale: string,
  present: string,
) {
  return `${month(start, locale)} — ${end ? month(end, locale) : present}`;
}
