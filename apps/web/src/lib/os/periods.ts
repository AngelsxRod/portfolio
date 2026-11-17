const short = new Intl.DateTimeFormat("es-GT", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function month(value: string) {
  return short.format(new Date(`${value}-01T00:00:00Z`)).replace(".", "");
}

/** «oct 2025 — hoy», «ene 2022 — oct 2024». */
export function formatPeriod(start: string, end: string | null) {
  return `${month(start)} — ${end ? month(end) : "hoy"}`;
}
