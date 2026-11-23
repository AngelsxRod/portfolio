/**
 * Anatomía del avatar de Kaled (`public/brand/avatar-kaled-base.svg`, 256×256).
 * El SVG base trae los ojos blancos y sin pupilas; las pupilas, los párpados y
 * las expresiones son rectángulos que se dibujan encima, con las coordenadas
 * de este módulo.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Shape = Rect & { fill: string };

export type AvatarMood =
  "idle" | "happy" | "surprised" | "worried" | "confused";

export type Eye = {
  /** Zona blanca por la que se mueve la pupila. */
  box: Rect;
  /** Pupila en reposo. */
  pupil: Rect;
};

export const SKIN = "#f4c7aa";
export const INK = "#080809";
const SWEAT = "#40cdc1";
const LIME = "#c8f031";
const ORANGE = "#ff6a2b";

export const eyes: Record<"left" | "right", Eye> = {
  left: {
    box: { x: 106, y: 131, w: 20, h: 8 },
    pupil: { x: 117, y: 131, w: 9, h: 8 },
  },
  right: {
    box: { x: 154, y: 126, w: 17, h: 10 },
    pupil: { x: 162, y: 126, w: 9, h: 10 },
  },
};

/** Boca en reposo del dibujo original; las expresiones la tapan con piel. */
const MOUTH_COVER: Shape = { x: 132, y: 166, w: 15, h: 5, fill: SKIN };

const px = (x: number, y: number, w = 1, h = 1, fill = INK): Shape => ({
  x,
  y,
  w,
  h,
  fill,
});

/** Símbolos de 5×7 píxeles para «?» y «!», dibujados a escala 4. */
const GLYPHS: Record<"?" | "!", string[]> = {
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
};

function glyph(char: "?" | "!", x: number, y: number, fill: string): Shape[] {
  const scale = 4;
  return GLYPHS[char].flatMap((row, r) =>
    [...row].flatMap((cell, c) =>
      cell === "1"
        ? [px(x + c * scale, y + r * scale, scale, scale, fill)]
        : [],
    ),
  );
}

/** Cobertura de piel + trazos de la boca y adornos de cada expresión. */
export const moodShapes: Record<AvatarMood, Shape[]> = {
  idle: [],
  happy: [
    MOUTH_COVER,
    px(132, 165, 3, 1),
    px(144, 165, 3, 1),
    px(133, 166, 2, 1),
    px(144, 166, 2, 1),
    px(135, 167, 10, 2),
  ],
  surprised: [
    MOUTH_COVER,
    px(137, 165, 5, 1),
    px(136, 166, 7, 5),
    px(137, 171, 5, 1),
    ...glyph("!", 216, 18, ORANGE),
  ],
  worried: [
    MOUTH_COVER,
    px(135, 166, 10, 2),
    px(132, 168, 3, 3),
    px(145, 168, 3, 3),
    px(171, 106, 3, 3, SWEAT),
    px(170, 109, 5, 4, SWEAT),
  ],
  confused: [
    MOUTH_COVER,
    px(132, 167, 5, 2),
    px(137, 168, 5, 2),
    px(142, 169, 5, 2),
    ...glyph("?", 212, 18, LIME),
  ],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Desplazamiento entero (en píxeles del dibujo) de la pupila para mirar hacia
 * `(nx, ny)`, ambos en [-1, 1]. La pupila nunca sale de la zona blanca, salvo
 * un píxel de margen para que la mirada «hacia abajo» se note.
 */
export function gazeOffset(eye: Eye, nx: number, ny: number) {
  const toLeft = eye.pupil.x - eye.box.x;
  const toRight = eye.box.x + eye.box.w - (eye.pupil.x + eye.pupil.w);
  const x = clamp(nx, -1, 1);
  const y = clamp(ny, -1, 1);
  return {
    dx: Math.round(x < 0 ? x * toLeft : x * (toRight + 1)),
    dy: Math.round(y),
  };
}

/** Dirección normalizada de un vector, saturada a 1 a partir de `reach` px. */
export function gazeDirection(vx: number, vy: number, reach = 220) {
  return {
    nx: clamp(vx / reach, -1, 1),
    ny: clamp(vy / reach, -1, 1),
  };
}
