import { useEffect, useRef, useState } from 'react';

const PRODUCT_IMAGES = [
  'public_products_01K9JVYWR9QDZV7R0NCBX46XHY_Primary Image_Bag front (1).png',
  'public_products_01K9JVYWR9YBG18NTB06TW48TB_Primary Image_Raw front (1).png',
  'public_products_01KAVN5NSZVFN7SGMYDR8CVD6Q_assets_primary-image_Screenshot 2025-11-24 at 2.24.39 PM.png',
  'public_products_01KAVND8QQ8MG3XVVFNM1R8S1K_assets_primary-image_Screenshot 2025-11-24 at 2.28.39 PM.png',
  'public_products_01KAVVKMHGTHQ0Q9506FTC79G0_assets_primary-image_Screenshot 2025-11-24 at 4.19.43 PM.png',
  'public_products_01KEZ5K72T49AVVPEXH6B4PB9M_assets_primary-image_EACH_ 20850003628510_C1C1.png',
  'public_products_01KFDXVKKJA4GJB42DAK006H0N_assets_primary-image_EACH_ 30781231000441_C1C1 (1).jpg',
  'public_products_01KJ1A428AJN9AJZ95BXSB18NB_assets_primary-image_Travel Light Kit-01KJ1AD6HG7SS3ASDN29XNGB5Y (1).jpg',
  'public_products_01KJ63KNX65BQXM3Y7DSGRYYDS_assets_primary-image_IMG_0765-01KJ64W4X5TX07X2HKP6HWE6TW (1).jpg',
  'public_products_01KJDQAXKMZQRRWSEESXDHAQE4_assets_primary-image_2-01KJDQPDKG5F011S82PD14EGQH.jpg',
  'public_products_01KJDTTZHSRQ0S2FF06CVE2FM7_assets_primary-image_14-01KJDVB1H0J78NW6KY8R8ZMP3F (1).jpg',
  'public_products_01KKVVC3EMY068N5B5BMESTSKF_assets_primary-image_Screenshot 2026-03-16 at 2.38.22 PM-01KKVZ34XNQ52XDMS3YZ2QTY55.png',
  'public_products_01KMTGG6PCGHMB2PN3SB628FCQ_assets_primary-image_WhatsApp Image 2025-04-08 at 06.45.45-01KMTGMAACZ3HKX0F7K3AW3BB1 (3).jpeg',
  'public_products_01KMTMEB5GED82AD4PNTB6NS0V_assets_primary-image_B0C12DPP57.main-01KMY8SG5FDEQDJ45MV3K296GR (1).png',
  'public_products_01KQD5FY8177R7VPVWFCV7KKTV_assets_primary-image_Screenshot 2026-04-29 at 1.46.24 PM-01KQD5KM8Q56RM8AG9HF8E620T.png',
  'public_products_01KQD9YH1E0VARC7X28TQQMW0K_assets_primary-image_Screenshot 2026-04-29 at 3.06.01 PM-01KQDA55ZJQS9TS1SP6HM467N3.png',
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
  const imagesCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Preload images and strip near-white backgrounds to transparent
  useEffect(() => {
    PRODUCT_IMAGES.forEach(name => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        if (!cx) return;
        cx.drawImage(img, 0, 0);
        try {
          const imgData = cx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) {
              d[i + 3] = 0;
            }
          }
          cx.putImageData(imgData, 0, 0);
        } catch {
          // CORS-tainted canvas — fall back to raw image
        }
        imagesCache.current.set(name, c);
      };
      img.src = `/new_brands/${encodeURIComponent(name)}`;
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
        if (cachedImg && cachedImg.width > 0) {
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
