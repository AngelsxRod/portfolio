// Exporta los PNG de la marca a partir de `public/brand/mark.svg`.
// Uso: pnpm --filter web brand:png
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = join(root, "public/brand");
const BG = "#0d0e12";

const mark = await readFile(join(brand, "mark.svg"));
// Renderizar a alta densidad para que los bordes queden nítidos al reducir.
const render = (size) =>
  sharp(mark, { density: Math.ceil((72 * size) / 64) * 2 }).resize(size, size);

/** Isotipo centrado sobre el negro del sitio, con margen (avatares y Apple). */
async function onDark(size, file) {
  const inner = Math.round(size * 0.72);
  const logo = await render(inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(file);
}

await mkdir(brand, { recursive: true });
for (const size of [64, 192, 512, 1024]) {
  await render(size)
    .png()
    .toFile(join(brand, `mark-${size}.png`));
}
await onDark(1024, join(brand, "mark-on-dark-1024.png"));
await onDark(180, join(root, "src/app/apple-icon.png"));
console.log("PNG de marca generados.");
