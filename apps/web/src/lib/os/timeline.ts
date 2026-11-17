/** Periodo en meses `AAAA-MM`; sin fin, sigue en curso. */
export type Period = { start: string; end: string | null };

export type TimelineBar = { left: number; width: number };

/** Ancho mínimo, en porcentaje, para que un periodo corto siga siendo visible. */
const MIN_WIDTH = 1.5;

function months(value: string) {
  const [year, month] = value.split("-").map(Number);
  return year! * 12 + (month! - 1);
}

/**
 * Escala de la línea de tiempo: de enero del primer año con datos a diciembre
 * del año actual. Cada barra incluye su mes final; sin fin llega al mes actual.
 */
export function timeline(periods: Period[], today: Date) {
  if (periods.length === 0)
    return { years: [] as number[], bars: [] as TimelineBar[] };
  const now = today.getUTCFullYear() * 12 + today.getUTCMonth();
  const firstYear = Math.floor(
    Math.min(...periods.map((period) => months(period.start))) / 12,
  );
  const lastYear = Math.floor(now / 12);
  const from = firstYear * 12;
  const total = (lastYear + 1) * 12 - from;
  const bars = periods.map((period) => {
    const start = months(period.start) - from;
    const end = (period.end ? months(period.end) : now) + 1 - from;
    const width = Math.max(((end - start) / total) * 100, MIN_WIDTH);
    return { left: (start / total) * 100, width: Math.min(width, 100) };
  });
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
  return { years, bars };
}
