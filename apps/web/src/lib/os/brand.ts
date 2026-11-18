/**
 * Isotipo de angel.os («Muesca K en bloque»): un bloque lima con la K vaciada y
 * un punto naranja en el hueco entre sus brazos. Lienzo de 64×64.
 * Debe coincidir con `public/brand/mark.svg` y `src/app/icon.svg`.
 */
export const BRAND_COLORS = {
  lime: "#c8f031",
  ink: "#0d0e12",
  orange: "#ff6a2b",
  bone: "#f2efe8",
} as const;

/** Contorno de la K (asta a la izquierda, brazos hasta las esquinas). */
export const MARK_K_PATH =
  "M12 8h10v20L44 8h10a2 2 0 0 1 1.4 3.4L33 32l22.4 20.6A2 2 0 0 1 54 56H44L22 36v20H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z";

/** La K se reduce al 72 % dentro del bloque. */
export const MARK_K_TRANSFORM =
  "translate(32 32) scale(0.72) translate(-32 -32)";

export const MARK_DOT = { cx: 42.8, cy: 32, r: 4 } as const;

/** SVG del isotipo a color, para usarlo como imagen (`data:`). */
export function markSvg() {
  const { lime, ink, orange } = BRAND_COLORS;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="12" fill="${lime}"/><path d="${MARK_K_PATH}" fill="${ink}" transform="${MARK_K_TRANSFORM}"/><circle cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" fill="${orange}"/></svg>`;
}
