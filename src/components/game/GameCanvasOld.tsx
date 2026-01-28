import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Target } from 'lucide-react';
import { getRandomAsset } from '@/lib/assetLoader';
import { ShelfManager } from '@/lib/shelfManager';
import { Product, EnemySpawner, ShelfSlot } from '@/types/game';

interface GameTarget {
import { ShelfSlot } from '@/types/game';

interface Asset {
  id: string;
  filename: string;
  path: string;
}

interface GameTarget {
  id: string;
  type: 'product' | 'enemy';
  assetPath: string;
  x: number;
  y: number;
  container?: Phaser.GameObjects.Container;
  health?: number;
}

interface GameProduct extends GameTarget {
  type: 'product';
  shelfSlotId?: string;
  onShelf: boolean;
  isBeingDragged?: boolean;
}

interface GameEnemy extends GameTarget {
  type: 'enemy';
  health: number;
  targetProductId?: string;
  targetShelfSlotId?: string;
  isMoving: boolean;
  direction: 'toShelf' | 'awayFromShelf';
  speed: number;
}

const LEVEL_CONFIG = {
  1: { productSpawnRate: 1500, enemySpawnRate: 2000, duration: 60000, baseEnemyHealth: 1 },
  2: { productSpawnRate: 1200, enemySpawnRate: 1500, duration: 90000, baseEnemyHealth: 1.5 },
  3: { productSpawnRate: 1000, enemySpawnRate: 1000, duration: 120000, baseEnemyHealth: 2 },
};

export const GameCanvas = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const isMountedRef = useRef(true);
  const { gameState, addScore, loseLife, completeLevel } = useGame();
  const [displayScore, setDisplayScore] = useState(0);
  const [displayProductsCount, setDisplayProductsCount] = useState(0);
  const [displayKills, setDisplayKills] = useState(0);
  const [hitFeedback, setHitFeedback] = useState<{ 
    type: 'kill' | 'damage' | null; 
    text: string; 
    x: number; 
    y: number 
  }>({ type: null, text: '', x: 0, y: 0 });

  const levelConfig = LEVEL_CONFIG[gameState.currentLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];
  const [timeLeft, setTimeLeft] = useState(levelConfig.duration / 1000);

  const showHitFeedback = useCallback((type: 'kill' | 'damage', text: string, x: number, y: number) => {
    if (!isMountedRef.current) return;
    setHitFeedback({ type, text, x, y });
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setHitFeedback({ type: null, text: '', x: 0, y: 0 });
      }
    }, 800);
    return timeoutId;
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const timeoutIds: NodeJS.Timeout[] = [];
    const dataRef = useRef({
      products: [] as GameProduct[],
      enemies: [] as GameEnemy[],
      gameActive: true,
      shelfManager: new ShelfManager(
        window.innerWidth,
        window.innerHeight - 120,
        4,
        5
      ),
      kills: 0,
    });

    // Load assets before creating Phaser scene
    Promise.all([loadEnemyAssets(), loadProductAssets()]).then(([enemies, products]) => {
      if (!isMountedRef.current) return;
      const dataRef = useRef({
        products: [] as GameProduct[],
        enemies: [] as GameEnemy[],
        gameActive: true,
        shelfManager: new ShelfManager(
          window.innerWidth,
          window.innerHeight - 120,
          4,
          5
        ),
        enemyAssets: [] as Asset[],
        productAssets: [] as Asset[],
        kills: 0,
      });
      dataRef.current.enemyAssets = enemies;
      dataRef.current.productAssets = products;
    });

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: window.innerWidth,
      height: window.innerHeight - 120,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true,
        resizeInterval: 200,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
        const enemyAssets = [
          { id: 'enemy_0', filename: '7bfbb5b34e13f5f37efd8ef70a492251b99b8d12.png', path: '/enemies/7bfbb5b34e13f5f37efd8ef70a492251b99b8d12.png' },
          { id: 'enemy_1', filename: 'b1876fe608b0368b4d55ce902557a49a4ae981bb.png', path: '/enemies/b1876fe608b0368b4d55ce902557a49a4ae981bb.png' },
          { id: 'enemy_2', filename: 'b9669f092502299b8ff6451ced88435926727b04.png', path: '/enemies/b9669f092502299b8ff6451ced88435926727b04.png' },
          { id: 'enemy_3', filename: 'broker.png', path: '/enemies/broker.png' },
          { id: 'enemy_4', filename: 'paperwork.png', path: '/enemies/paperwork.png' },
        ];

        const productAssets = [
          { id: 'product_0', filename: '017b95374b2361d593c3ca7a0e861d0479ac0064.png', path: '/products/017b95374b2361d593c3ca7a0e861d0479ac0064.png' },
          { id: 'product_1', filename: '09c17048b517f04e61147428b060918fa9e5c2c6.png', path: '/products/09c17048b517f04e61147428b060918fa9e5c2c6.png' },
          { id: 'product_2', filename: '0eee9bd70a21386e16a29b23d0ee55201ae8f6e2.png', path: '/products/0eee9bd70a21386e16a29b23d0ee55201ae8f6e2.png' },
          { id: 'product_3', filename: '18797974080cb22af4bb9b7bc82573f306adfa1e.png', path: '/products/18797974080cb22af4bb9b7bc82573f306adfa1e.png' },
          { id: 'product_4', filename: '1ab1b3cdb128cc7f0c1fb5e6e4948e02e8efd34d.png', path: '/products/1ab1b3cdb128cc7f0c1fb5e6e4948e02e8efd34d.png' },
          { id: 'product_5', filename: '1b0882f2b77dee171b120d0a929f64c2511eaecb.png', path: '/products/1b0882f2b77dee171b120d0a929f64c2511eaecb.png' },
          { id: 'product_6', filename: '1ccf4b81ed38106e7fc100abab20f66217a78cbf.png', path: '/products/1ccf4b81ed38106e7fc100abab20f66217a78cbf.png' },
          { id: 'product_7', filename: '20683b86a0e0d879b72ca2683b4445c1ac1ef773.png', path: '/products/20683b86a0e0d879b72ca2683b4445c1ac1ef773.png' },
          { id: 'product_8', filename: '2a99bc8365a0b48cf58ce38fb99d22c4bc81d54e.png', path: '/products/2a99bc8365a0b48cf58ce38fb99d22c4bc81d54e.png' },
          { id: 'product_9', filename: '2da2ef266779595eb7b396b0a4f15e009721627cc.png', path: '/products/2da2ef266779595eb7b396b0a4f15e009721627cc.png' },
          { id: 'product_10', filename: '34b5a0861756d05f750233295d5d64fa067269c5.png', path: '/products/34b5a0861756d05f750233295d5d64fa067269c5.png' },
          { id: 'product_11', filename: '41c2a8bd14ff0bde714ad8e04677fd2c39cb5878.png', path: '/products/41c2a8bd14ff0bde714ad8e04677fd2c39cb5878.png' },
          { id: 'product_12', filename: '42673d4af72d0b29b895da96689fb2378863c0c2.png', path: '/products/42673d4af72d0b29b895da96689fb2378863c0c2.png' },
          { id: 'product_13', filename: '4b62e20ead5f35c43df5e24aa631eda6b436ce2c.png', path: '/products/4b62e20ead5f35c43df5e24aa631eda6b436ce2c.png' },
          { id: 'product_14', filename: '4d2b4e225940483ecfce1cd08d6caf7034d9940a.png', path: '/products/4d2b4e225940483ecfce1cd08d6caf7034d9940a.png' },
          { id: 'product_15', filename: '53554bc84e8ff536735992405ba9753b80fcbc63.png', path: '/products/53554bc84e8ff536735992405ba9753b80fcbc63.png' },
          { id: 'product_16', filename: '58e076508a56fa86cb311c7da37c0b8236533315.png', path: '/products/58e076508a56fa86cb311c7da37c0b8236533315.png' },
          { id: 'product_17', filename: '6555ec3286461fd536735992405ba9753b80fcbc.png', path: '/products/6555ec3286461fd536735992405ba9753b80fcbc.png' },
          { id: 'product_18', filename: '6aa2344ed6ccfbbb105d0d7e0137572785965e7f.png', path: '/products/6aa2344ed6ccfbbb105d0d7e0137572785965e7f.png' },
          { id: 'product_19', filename: '6e966d8ac8754e17bb5dfae63ccfb86fa84b6ec8.png', path: '/products/6e966d8ac8754e17bb5dfae63ccfb86fa84b6ec8.png' },
          { id: 'product_20', filename: '6eb2c2947798f9534f5a4e34abd8e597a47c0398.png', path: '/products/6eb2c2947798f9534f5a4e34abd8e597a47c0398.png' },
          { id: 'product_21', filename: '730ee9c1516bb96810b3ec376ff7711a40043bb8.png', path: '/products/730ee9c1516bb96810b3ec376ff7711a40043bb8.png' },
          { id: 'product_22', filename: '7bc8f04eda28c44ae37c6908db64c8f668fe51d5.png', path: '/products/7bc8f04eda28c44ae37c6908db64c8f668fe51d5.png' },
          { id: 'product_23', filename: '7f28cacf9213dfe5ca01470fffca6d42d0e19b85.png', path: '/products/7f28cacf9213dfe5ca01470fffca6d42d0e19b85.png' },
          { id: 'product_24', filename: '834073e4e2c6068a66727eda50ef49812a23d350.png', path: '/products/834073e4e2c6068a66727eda50ef49812a23d350.png' },
          { id: 'product_25', filename: '84321b115344959741934ef60055e7d34c3979dd.png', path: '/products/84321b115344959741934ef60055e7d34c3979dd.png' },
          { id: 'product_26', filename: '8dc8b8ce51323e1a65512f032490cc4140567c76.png', path: '/products/8dc8b8ce51323e1a65512f032490cc4140567c76.png' },
          { id: 'product_27', filename: '8f030cf8700a57b425ce2f81d3cdca81de867154.png', path: '/products/8f030cf8700a57b425ce2f81d3cdca81de867154.png' },
          { id: 'product_28', filename: '90bf7fc4742c25beb903f81def57036b30ea0a3b.png', path: '/products/90bf7fc4742c25beb903f81def57036b30ea0a3b.png' },
          { id: 'product_29', filename: '95517964b8a87158f3c2755c20753c856fe8ca14.png', path: '/products/95517964b8a87158f3c2755c20753c856fe8ca14.png' },
          { id: 'product_30', filename: '989424d37b917ff0cab81a9934037a039fc459e4.png', path: '/products/989424d37b917ff0cab81a9934037a039fc459e4.png' },
          { id: 'product_31', filename: '9a94954b72fd405a1a1862274da27091527e91a7.png', path: '/products/9a94954b72fd405a1a1862274da27091527e91a7.png' },
          { id: 'product_32', filename: 'b4615556aa97f60b5b1a1862274da27e8a42cdb.png', path: '/products/b4615556aa97f60b5b1a1862274da27e8a42cdb.png' },
          { id: 'product_33', filename: 'c20aa5e951e5819beb7378f6150697145eb05120.png', path: '/products/c20aa5e951e5819beb7378f6150697145eb05120.png' },
          { id: 'product_34', filename: 'c3896b37c97c3ef88173fa5e2625561168795dfd.png', path: '/products/c3896b37c97c3ef88173fa5e2625561168795dfd.png' },
          { id: 'product_35', filename: 'c476f1efeabe0cde349952ae4da6850b6e5a8f38.png', path: '/products/c476f1efeabe0cde349952ae4da6850b6e5a8f38.png' },
          { id: 'product_36', filename: 'c480bde430c05fdec05609dc7d89ff152cce7cb4.png', path: '/products/c480bde430c05fdec05609dc7d89ff152cce7cb4.png' },
          { id: 'product_37', filename: 'cd2b344725ae02ad30f1faafc464346905f3c22d.png', path: '/products/cd2b344725ae02ad30f1faafc464346905f3c22d.png' },
          { id: 'product_38', filename: 'd26fec8e7b16eb2f8f69109b3c6b4384eb5fc043.png', path: '/products/d26fec8e7b16eb2f8f69109b3c6b4384eb5fc043.png' },
          { id: 'product_39', filename: 'd8bfb8a0319322cded14c0947df6d5518403d695.png', path: '/products/d8bfb8a0319322cded14c0947df6d5518403d695.png' },
          { id: 'product_40', filename: 'da53d70f3070605bd69a1b799ee892c50e8f8913.png', path: '/products/da53d70f3070605bd69a1b799ee892c50e8f8913.png' },
          { id: 'product_41', filename: 'de5043c55be1675d7abceeb8e1fc9ae93fbba59b.png', path: '/products/de5043c55be1675d7abceeb8e1fc9ae93fbba59b.png' },
          { id: 'product_42', filename: 'e7c0cd8a7e69253a31485eadcc37efb7a251a3d7.png', path: '/products/e7c0cd8a7e69253a31485eadcc37efb7a251a3d7.png' },
          { id: 'product_43', filename: 'e9b9657728963874a8d955127475e2bc4e5c2907.png', path: '/products/e9b9657728963874a8d955127475e2bc4e5c2907.png' },
          { id: 'product_44', filename: 'edee2988da6c278c871fde87711c895bb8f4a832.png', path: '/products/edee2988da6c278c871fde87711c895bb8f4a832.png' },
          { id: 'product_45', filename: 'ef70e0fbfa9c40120c3b861bff4b55166b40763b.png', path: '/products/ef70e0fbfa9c40120c3b861bff4b55166b40763b.png' },
          { id: 'product_46', filename: 'f4863b34f48308ba27ba8134d4a188c85169c09c.png', path: '/products/f4863b34f48308ba27ba8134d4a188c85169c09c.png' },
          { id: 'product_47', filename: 'f9d406d561d203c74cded9f173bff2093c09c.png', path: '/products/f9d406d561d203c74cded9f173bff2093c09c.png' },
        ];

        dataRef.current.enemyAssets = enemyAssets;
        dataRef.current.productAssets = productAssets;
            scene.load.image(asset.id, asset.path);
          });

          // Preload all product assets
          dataRef.current.productAssets.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });
        },
        create: function(this: Phaser.Scene) {
          const scene = this;
          const data = dataRef.current;
          const shelfMgr = data.shelfManager;
          const width = scene.scale.width;
          const height = scene.scale.height;

          // Draw shelves background
          const drawShelves = () => {
            const graphics = scene.add.graphics();
            graphics.fillStyle(0x2a1810, 0.8);
            graphics.lineStyle(2, 0x8b6f47, 0.9);

            shelfMgr.getSlots().forEach(slot => {
              graphics.fillRect(
                slot.x - shelfMgr.getConfig().slotWidth / 2,
                slot.y - shelfMgr.getConfig().slotHeight / 2,
                shelfMgr.getConfig().slotWidth,
                shelfMgr.getConfig().slotHeight
              );
              graphics.strokeRect(
                slot.x - shelfMgr.getConfig().slotWidth / 2,
                slot.y - shelfMgr.getConfig().slotHeight / 2,
                shelfMgr.getConfig().slotWidth,
                shelfMgr.getConfig().slotHeight
              );
            });

            graphics.lineStyle(3, 0x5c4033, 0.7);
            for (let i = 1; i < shelfMgr.getConfig().slotsPerRow; i++) {
              const slotWidth = width / shelfMgr.getConfig().slotsPerRow;
              graphics.lineBetween(
                i * slotWidth,
                shelfMgr.getConfig().topMargin,
                i * slotWidth,
                shelfMgr.getConfig().topMargin + shelfMgr.getConfig().shelfHeight
              );
            }

            graphics.setDepth(-1);
          };

          drawShelves();

          const spawnAreaY = height - 120;

          const createProduct = () => {
            if (!data.gameActive || !data.productAssets.length) return;

            const asset = getRandomAsset(data.productAssets);
            if (!asset) return;

            const x = 40 + Math.random() * (width - 80);
            const y = spawnAreaY;

            const container = scene.add.container(x, y);

            const sprite = scene.add.image(0, 0, asset.id);
            sprite.setDisplaySize(60, 60);
            sprite.setOrigin(0.5);

            container.add(sprite);
            container.setSize(70, 70);
            container.setInteractive();

            const product: GameProduct = {
              id: `product_${Date.now()}_${Math.random()}`,
              type: 'product',
              assetPath: asset.path,
              x,
              y,
              container,
              onShelf: false,
            };

            data.products.push(product);

            container.setAlpha(0);
            scene.tweens.add({
              targets: container,
              alpha: 1,
              duration: 300,
              ease: 'Power2',
            });

            const originalY = y;
            scene.tweens.add({
              targets: container,
              y: originalY - 10,
              yoyo: true,
              repeat: -1,
              duration: 600,
              ease: 'Sine.easeInOut',
            });

            let dragStartX = 0;
            let dragStartY = 0;
            let isDragging = false;

            container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              if (!data.gameActive) return;
              dragStartX = pointer.x;
              dragStartY = pointer.y;
              isDragging = true;
              product.isBeingDragged = true;
            });

            scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
              if (!isDragging || !data.gameActive) return;
              const deltaY = dragStartY - pointer.y;
              if (deltaY > 0) {
                container.setScale(0.95);
              }
            });

            scene.input.on('pointerup', () => {
              if (!isDragging || !data.gameActive) return;
              isDragging = false;
              product.isBeingDragged = false;
              container.setScale(1);

              const deltaY = dragStartY - scene.input.activePointer.y;
              const deltaX = Math.abs(dragStartX - scene.input.activePointer.x);

              if (deltaY > 50 && deltaX < 100 && !product.onShelf) {
                const nearestSlot = shelfMgr.getNearestEmptySlot(product.x, product.y);

                if (nearestSlot) {
                  product.onShelf = true;
                  product.shelfSlotId = nearestSlot.id;
                  shelfMgr.occupySlot(nearestSlot.id, product.id);

                  scene.tweens.killTweensOf(container);
                  scene.tweens.add({
                    targets: container,
                    x: nearestSlot.x,
                    y: nearestSlot.y,
                    duration: 400,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                      setDisplayProductsCount(shelfMgr.getOccupiedProducts().length);
                    },
                  });
                }
              }
            });
          };

          const createEnemy = () => {
            if (!data.gameActive || !data.enemyAssets.length) return;

            const asset = getRandomAsset(data.enemyAssets);
            if (!asset) return;

            const spawnFromTop = Math.random() > 0.5;
            const x = 40 + Math.random() * (width - 80);
            const y = spawnFromTop ? -60 : height + 60;

            const container = scene.add.container(x, y);

            const sprite = scene.add.image(0, 0, asset.id);
            sprite.setDisplaySize(50, 50);
            sprite.setOrigin(0.5);
            sprite.setTint(0xff4444);

            container.add(sprite);
            container.setSize(70, 70);
            container.setInteractive();

            const health = Math.ceil(Math.random() * 3);

            const enemy: GameEnemy = {
              id: `enemy_${Date.now()}_${Math.random()}`,
              type: 'enemy',
              assetPath: asset.path,
              x,
              y,
              container,
              health,
              isMoving: true,
              direction: 'toShelf',
              speed: 50 + Math.random() * 50,
            };

            data.enemies.push(enemy);

            container.setAlpha(0);
            scene.tweens.add({
              targets: container,
              alpha: 1,
              duration: 300,
              ease: 'Power2',
            });

            const occupiedProducts = shelfMgr.getOccupiedProducts();
            if (occupiedProducts.length > 0) {
              const targetProduct = occupiedProducts[Math.floor(Math.random() * occupiedProducts.length)];
              const targetGameProduct = data.products.find(p => p.id === targetProduct);
              if (targetGameProduct?.shelfSlotId) {
                enemy.targetProductId = targetProduct;
                enemy.targetShelfSlotId = targetGameProduct.shelfSlotId;
              }
            }

            container.on('pointerdown', () => {
              if (!data.gameActive) return;

              enemy.health--;
              showHitFeedback('damage', `-${enemy.health <= 0 ? 'KILL' : '❤️'}`, enemy.x, enemy.y);

              sprite.setTint(0xff6666);
              scene.tweens.add({
                targets: sprite,
                duration: 150,
                onComplete: () => {
                  sprite.setTint(0xff4444);
                },
              });

              if (enemy.health <= 0) {
                data.kills++;
                setDisplayKills(data.kills);
                addScore(50);
                setDisplayScore(prev => prev + 50);

                if (enemy.targetProductId) {
                  const stolenProduct = data.products.find(p => p.id === enemy.targetProductId);
                  if (stolenProduct && stolenProduct.shelfSlotId) {
                    shelfMgr.releaseSlot(stolenProduct.shelfSlotId);
                    stolenProduct.onShelf = false;
                    stolenProduct.shelfSlotId = undefined;
                    setDisplayProductsCount(shelfMgr.getOccupiedProducts().length);
                  }
                }

                scene.tweens.killTweensOf(container);
                for (let i = 0; i < 8; i++) {
                  const particle = scene.add.circle(enemy.x, enemy.y, 6, 0xff4444);
                  const angle = (Math.PI * 2 * i) / 8;
                  const distance = 40 + Math.random() * 20;

                  scene.tweens.add({
                    targets: particle,
                    x: enemy.x + Math.cos(angle) * distance,
                    y: enemy.y + Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 0,
                    duration: 300 + Math.random() * 150,
                    ease: 'Power2',
                    onComplete: () => particle.destroy(),
                  });
                }

                container.destroy();
                const idx = data.enemies.indexOf(enemy);
                if (idx !== -1) {
                  data.enemies.splice(idx, 1);
                }
              }
            });
          };

          const productInterval = setInterval(() => {
            if (!data.gameActive) return;
            createProduct();
          }, levelConfig.productSpawnRate);

          const enemyInterval = setInterval(() => {
            if (!data.gameActive) return;
            createEnemy();
          }, levelConfig.enemySpawnRate);

          // Use Phaser's update event for continuous enemy movement
          const updateHandler = () => {
            if (!data.gameActive) return;

            data.enemies.forEach(enemy => {
              if (!enemy.targetShelfSlotId) return;

              const targetSlot = shelfMgr.getSlot(enemy.targetShelfSlotId);
              if (!targetSlot) return;

              const dx = targetSlot.x - enemy.x;
              const dy = targetSlot.y - enemy.y;
              const distance = Math.hypot(dx, dy);

              if (distance < 20) {
                if (enemy.targetProductId) {
                  const product = data.products.find(p => p.id === enemy.targetProductId);
                  if (product) {
                    shelfMgr.releaseSlot(enemy.targetShelfSlotId);
                    product.onShelf = false;
                    product.shelfSlotId = undefined;
                    setDisplayProductsCount(shelfMgr.getOccupiedProducts().length);

                    enemy.direction = 'awayFromShelf';
                    const offscreenX = enemy.x > width / 2 ? width + 100 : -100;
                    const offscreenY = enemy.y > height / 2 ? height + 100 : -100;

                    if (product.container) {
                      scene.tweens.add({
                        targets: product.container,
                        x: offscreenX,
                        y: offscreenY,
                        alpha: 0,
                        duration: 800,
                        ease: 'Linear',
                        onComplete: () => {
                          product.container?.destroy();
                          const idx = data.products.indexOf(product);
                          if (idx !== -1) {
                            data.products.splice(idx, 1);
                          }
                        },
                      });
                    }
                  }
                }

                const offscreenX = enemy.x > width / 2 ? width + 100 : -100;
                const offscreenY = enemy.y > height / 2 ? height + 100 : -100;

                scene.tweens.add({
                  targets: enemy.container,
                  x: offscreenX,
                  y: offscreenY,
                  alpha: 0,
                  duration: 800,
                  ease: 'Linear',
                  onComplete: () => {
                    enemy.container?.destroy();
                    const idx = data.enemies.indexOf(enemy);
                    if (idx !== -1) {
                      data.enemies.splice(idx, 1);
                    }
                  },
                });
              } else {
                const moveX = (dx / distance) * enemy.speed;
                const moveY = (dy / distance) * enemy.speed;
                enemy.x += moveX;
                enemy.y += moveY;
                enemy.container?.setPosition(enemy.x, enemy.y);
              }
            });
          };

          scene.events.on('update', updateHandler);

          let timeRemaining = levelConfig.duration / 1000;
          const timerInterval = setInterval(() => {
            if (!isMountedRef.current) {
              clearInterval(timerInterval);
              return;
            }
            timeRemaining--;
            setTimeLeft(timeRemaining);

            if (timeRemaining <= 0) {
              data.gameActive = false;
              clearInterval(productInterval);
              clearInterval(enemyInterval);
              clearInterval(timerInterval);

              const timeoutId = setTimeout(() => {
                if (isMountedRef.current && gameState.currentScreen === 'game') {
                  const finalScore = 
                    shelfMgr.getOccupiedProducts().length * 100 + 
                    data.kills * 50;
                  
                  addScore(finalScore);

                  completeLevel({
                    level: gameState.currentLevel,
                    score: finalScore,
                    accuracy: 0,
                    completed: true,
                    enemiesHit: data.kills,
                    friendliesHit: 0,
                  });
                }
              }, 500);
              timeoutIds.push(timeoutId);
            }
          }, 1000);

          scene.events.on('shutdown', () => {
            data.gameActive = false;
            clearInterval(productInterval);
            clearInterval(enemyInterval);
            clearInterval(timerInterval);
            scene.events.off('update', updateHandler);
          });
        },
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      isMountedRef.current = false;
      timeoutIds.forEach(id => clearTimeout(id));
      phaserGameRef.current?.destroy(true);
    };
  }, [gameState.currentLevel, levelConfig, addScore, loseLife, completeLevel, showHitFeedback, gameState.currentScreen]);

  // Cleanup mounted flag when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-arcade-dark relative overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="arcade-text text-sm text-primary">LVL {gameState.currentLevel}</span>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all ${
                i < gameState.lives 
                  ? 'text-destructive fill-destructive' 
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Score & Timer */}
      <div className="absolute top-16 left-0 right-0 z-20 px-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2 neon-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="arcade-text text-lg text-warning score-glow">
              {displayScore.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <span className="arcade-text text-sm text-foreground">
            📦 {displayProductsCount} | 💀 {displayKills}
          </span>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <span className={`arcade-text text-lg ${timeLeft <= 10 ? 'text-destructive' : 'text-foreground'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Hit Feedback */}
      <AnimatePresence>
        {hitFeedback.type && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -30 }}
            exit={{ opacity: 0, y: -60 }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${hitFeedback.x}px`,
              top: `${hitFeedback.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className={`arcade-text text-3xl font-bold ${
              hitFeedback.type === 'kill' ? 'text-success score-glow' : 'text-yellow-400'
            }`}>
              {hitFeedback.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game canvas container */}
      <div 
        ref={gameContainerRef} 
        className="w-full h-full absolute inset-0"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
