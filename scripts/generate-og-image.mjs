import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

async function generate() {
  // Load both images
  const villain = sharp(path.join(publicDir, 'home', 'villain.png'));
  const bird = sharp(path.join(publicDir, 'home', 'bird.png'));

  const villainMeta = await villain.metadata();
  const birdMeta = await bird.metadata();

  // Scale both to fit within the OG height with some padding
  const padding = 40;
  const maxH = OG_HEIGHT - padding * 2; // 550px max

  const villainScale = maxH / villainMeta.height;
  const birdScale = maxH / birdMeta.height;

  const villainW = Math.round(villainMeta.width * villainScale);
  const villainH = Math.round(villainMeta.height * villainScale);
  const birdW = Math.round(birdMeta.width * birdScale);
  const birdH = Math.round(birdMeta.height * birdScale);

  const villainBuf = await villain.resize(villainW, villainH).png().toBuffer();
  const birdBuf = await bird.resize(birdW, birdH).png().toBuffer();

  // Position: villain on left side, bird on right side, centered vertically
  const gap = 60;
  const totalW = villainW + gap + birdW;
  const startX = Math.round((OG_WIDTH - totalW) / 2);

  const villainX = startX;
  const villainY = Math.round((OG_HEIGHT - villainH) / 2);
  const birdX = startX + villainW + gap;
  const birdY = Math.round((OG_HEIGHT - birdH) / 2);

  // Create the OG image with a black background
  const output = await sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      // Villain (left)
      { input: villainBuf, left: villainX, top: villainY },
      // Bird (right)
      { input: birdBuf, left: birdX, top: birdY },
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log(`✅ OG image created: public/og-image.png (${OG_WIDTH}x${OG_HEIGHT})`);
}

generate().catch(console.error);
