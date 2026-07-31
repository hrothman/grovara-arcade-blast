/**
 * One-off: turn the healer dog photo (white studio background, JPG) into a
 * transparent PNG the game can overlay on the arcade background.
 *
 * A plain "every near-white pixel becomes transparent" pass would punch holes
 * through the dog's white fur patches, so this flood-fills inward from the
 * border instead — only white *connected to the edge* is treated as backdrop.
 *
 *   node scripts/cutout-healer-dog.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public/who-are-you/Image from iOS (2).jpg');
const OUT = path.join(root, 'public/healer/healer-dog.png');

const MAX_DIM = 360;      // rendered at ~150px in game; 360 is plenty
const WHITE_MIN = 232;    // channel value at/above which a pixel counts as backdrop
const FEATHER = 1.5;      // px of alpha falloff at the cut edge

const img = sharp(SRC).resize({ width: MAX_DIM, withoutEnlargement: true });
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h, channels } = info;

const isWhite = (i) => {
  const o = i * channels;
  return data[o] >= WHITE_MIN && data[o + 1] >= WHITE_MIN && data[o + 2] >= WHITE_MIN;
};

// Flood fill from every border pixel through connected white.
const bg = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) {
  stack.push(x, (h - 1) * w + x);
}
for (let y = 0; y < h; y++) {
  stack.push(y * w, y * w + w - 1);
}
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || !isWhite(i)) continue;
  bg[i] = 1;
  const x = i % w;
  const y = (i - x) / w;
  if (x > 0) stack.push(i - 1);
  if (x < w - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - w);
  if (y < h - 1) stack.push(i + w);
}

// Erode the silhouette by a pixel: JPEG compression leaves a light halo of
// half-white pixels hugging the outline, which reads as a glowing white
// tracing on the game's dark background.
const eroded = Uint8Array.from(bg);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (bg[i]) continue;
    if (
      (x > 0 && bg[i - 1]) ||
      (x < w - 1 && bg[i + 1]) ||
      (y > 0 && bg[i - w]) ||
      (y < h - 1 && bg[i + w])
    ) {
      eroded[i] = 1;
    }
  }
}
bg.set(eroded);

// Distance-to-background feather so the silhouette edge isn't a hard staircase.
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const o = i * channels;
    if (bg[i]) {
      data[o + 3] = 0;
      continue;
    }
    // Count background neighbours in a small ring to soften the boundary.
    let near = 0;
    let total = 0;
    const r = Math.ceil(FEATHER);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        total++;
        if (bg[ny * w + nx]) near++;
      }
    }
    if (near > 0) {
      data[o + 3] = Math.round(255 * Math.max(0.15, 1 - near / total));
    }
  }
}

await sharp(data, { raw: { width: w, height: h, channels } })
  .png({ compressionLevel: 9, palette: true, quality: 88 })
  .toFile(OUT);

const cut = bg.reduce((n, v) => n + v, 0);
console.log(`wrote ${OUT} — ${w}x${h}, ${((cut / (w * h)) * 100).toFixed(1)}% cut to transparent`);
