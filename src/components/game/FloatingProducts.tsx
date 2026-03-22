import { useEffect, useRef, useState } from 'react';

const PRODUCT_IMAGES = [
  '017b95374b2361d593c3ca7a0e861d0479ac0064.png',
  '09c17048b517f04e61147428b060918fa9e5c2c6.png',
  '0eee9bd70a21386e16a29b23d0ee55201ae8f6e2.png',
  '18797974080cb22af4bb9b7bc82573f306adfa1e.png',
  '1ab1b3cdb128cc7f0c1fb5e6e4948e02e8efd34d.png',
  '1b0882f2b77dee171b120d0a929f64c2511eaecb.png',
  '1ccf4b81ed38106e7fc100abab20f66217a78cbf.png',
  '20683b86a0e0d879b72ca2683b4445c1ac1ef773.png',
  '2a99bc8365a0b48cf58ce38fb99d22c4bc81d54e.png',
  '2da2ef266779595eb7b409ab7f2e9009721627cc.png',
  '34b5a0861756d05f750233295d5d64fa067269c5.png',
  '41c2a8bd14ff0bde714ad8e04677fd2c39cb5878.png',
  '42673d4af72d0b29b895da96689fb2378863c0c2.png',
  '4b62e20ead5f35c43dd5e24aa631eda6b436ce2c.png',
  '4d2b4e225940483ecfce1cd08d6caf7034d9950a.png',
  '53554bc84e8ff536735992405bc9753b80fcbc63.png',
  '58e076508a56fa86cb311c7da37c0b8236533315.png',
  '6aa2344ed6ccfbbb105d0d7e0137572785965e7f.png',
  '6e966d8ac8754e17bb5dfae63ccfb86fa84b6ec8.png',
  '6eb2c2947798f9534f5a4e34abd8e597a47c0398.png',
  '730ee9c1516bb96810b3ec376ff7711a40043bb8.png',
  '7bc8f04eda28c44ae37c6908db64c8f668fe51d5.png',
  '7f28cacf9213dfe5ca01470fffca6d42d0e19b85.png',
  '834073e4e2c6068a66727eda50ef49812a23d350.png',
  '8dc8b8ce51323e1a65512f032490cc4140567c76.png',
  '8f030cf8700a57b425ce2f81d3cdca81de867154.png',
  '90bf7fc4742c25beb903f81def57036b30ea0a3b.png',
  '95517964b8a87158f3c2755c20753c856fe8ca14.png',
  '989424d37b917ff0cab81a9934037a039fc459e4.png',
  '9a94954b72fc836cf097ecd9e72e146afcea7915.png',
  'b4615556aa97f60b5b1a1862274da37ae8a42cdb.png',
  'Blue Diamond01.png',
  'Blue Diamond02.png',
  'Blue Diamond03.png',
  'c20aa5e951e5819beb7378f6150697145eb05120.png',
  'c3896b37c97c3ef88173fa5e2625561168795dfd.png',
  'c476f1efeabe0cde349952ae4da6850b6e5a8f38.png',
  'c480bde430c05fdec05609dc7d89ff152cce7cb4.png',
  'cd2b344725ae02ad30f1faafc464346905f3c22d.png',
  'd26fec8e7b16eb2f8f69109b3c6b4384eb5fc043.png',
  'd8bfb8a0319322cded14c0947df6d5518403d695.png',
  'da53d70f3070605bd69a1b799ee892c50e8f8913.png',
  'de5043c55be1675d7abceeb8e1fc9ae93fbba59b.png',
  'Dubai Choconafeh01.png',
  'Dubai Choconafeh02.png',
  'Dubai Choconafeh03.png',
  'e9b9657728963874a8d955127475e2bc4e5c2907.png',
  'edee2988da6c278c871fde87711c895bb8f4a832.png',
  'ef70e0fbfa9c40120c3b861bff4b55166b40763b.png',
  'f4863b34f48308ba27ba8134d4a188c85169c09c.png',
  'f9d406d561d203c74cded9f173bff2093ac508f7.png',
  'Kirkland Signature01.png',
  'Kirkland Signature02.png',
  'Kirkland Signature03.png',
  'MINIX 01.png',
  'MINIX 02.png',
  'MINIX 03.png',
];

// Physics constants (matching game style)
const GRAVITY = 500;
const THROW_SPEED_Y = -750; // upward velocity
const ITEM_COUNT = 12;
const THROW_INTERVAL = 600; // ms between new throws
const ITEM_SIZE = 55;

interface PhysicsItem {
  id: number;
  image: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

function createItem(id: number, screenW: number, screenH: number): PhysicsItem {
  const image = PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)];
  const margin = screenW * 0.1;
  const spawnX = margin + Math.random() * (screenW - margin * 2);
  const centerBias = (screenW / 2 - spawnX) * 0.3;

  return {
    id,
    image,
    x: spawnX,
    y: screenH + 40,
    velocityX: centerBias + (Math.random() - 0.5) * 200,
    velocityY: THROW_SPEED_Y + (Math.random() - 0.5) * 100,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 300,
    size: ITEM_SIZE + (Math.random() - 0.5) * 20,
  };
}

export const FloatingProducts = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<PhysicsItem[]>([]);
  const counterRef = useRef(0);
  const lastThrowRef = useRef(0);
  const imagesCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Preload images
  useEffect(() => {
    PRODUCT_IMAGES.forEach(name => {
      const img = new Image();
      img.src = `/products/${encodeURIComponent(name)}`;
      imagesCache.current.set(name, img);
    });
  }, []);

  // Track dimensions
  useEffect(() => {
    const update = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.w === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.w;
    canvas.height = dimensions.h;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, dimensions.w, dimensions.h);

      // Throw new items at intervals
      if (now - lastThrowRef.current > THROW_INTERVAL && itemsRef.current.length < ITEM_COUNT) {
        itemsRef.current.push(createItem(counterRef.current++, dimensions.w, dimensions.h));
        lastThrowRef.current = now;
      }

      // Update & draw items
      const alive: PhysicsItem[] = [];
      for (const item of itemsRef.current) {
        // Physics update
        item.velocityY += GRAVITY * dt;
        item.x += item.velocityX * dt;
        item.y += item.velocityY * dt;
        item.rotation += item.rotationSpeed * dt;

        // Remove if fallen below screen
        if (item.y > dimensions.h + 80) {
          // Respawn as new item
          alive.push(createItem(counterRef.current++, dimensions.w, dimensions.h));
          continue;
        }

        alive.push(item);

        // Draw
        const cachedImg = imagesCache.current.get(item.image);
        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.translate(item.x, item.y);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.drawImage(cachedImg, -item.size / 2, -item.size / 2, item.size, item.size);
          ctx.restore();
        }
      }

      itemsRef.current = alive;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[15] pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
