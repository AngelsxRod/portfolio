const dateTime = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Guatemala",
});

/** Fecha y hora de una edición, en la zona horaria del panel. */
export function formatDateTime(value: string) {
  return dateTime.format(new Date(value));
}
