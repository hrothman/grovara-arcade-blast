import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Target } from 'lucide-react';
import { getEnemyAssets, getProductAssets, getRandomAsset, Asset } from '@/lib/assetLoader';
import { ShelfManager } from '@/lib/shelfManager';
import { ShelfSlot } from '@/types/game';

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
  originalShelfSlotId?: string;
  wasStolen?: boolean;
  escapeTween?: Phaser.Tweens.Tween;
}

interface GameEnemy extends GameTarget {
  type: 'enemy';
  health: number;
  targetProductId?: string;
  targetShelfSlotId?: string;
  isMoving: boolean;
  direction: 'toShelf' | 'awayFromShelf';
  speed: number;
  stealDurationSec: number;
  healthText?: Phaser.GameObjects.Text;
  baseSpriteScaleX: number;
  baseSpriteScaleY: number;
}

const LEVEL_CONFIG = {
  1: { productSpawnRate: 1500, enemySpawnRate: 2000, duration: 60000, baseEnemyHealth: 1 },
  2: { productSpawnRate: 1200, enemySpawnRate: 1500, duration: 90000, baseEnemyHealth: 1.5 },
  3: { productSpawnRate: 1000, enemySpawnRate: 1000, duration: 120000, baseEnemyHealth: 2 },
};

const ENEMY_ASSETS: Asset[] = getEnemyAssets();
const PRODUCT_ASSETS: Asset[] = getProductAssets();

const BACKGROUND_IMAGE_PATH = '/background.png';
const BACKGROUND_HEIGHT_RATIO = 1;
const SHELF_AREA_INSETS = {
  top: 0.2,
  bottom: 0.18,
  left: 0.08,
  right: 0.08,
};
const SHELF_AREA_SCALE_Y = 0.88;

const DEFAULT_BG_SIZE = { width: 1080, height: 1920 };

const getContainRect = (
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
) => {
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const x = (containerWidth - width) / 2;
  const y = 0;
  return { x, y, width, height };
};

export const GameCanvas = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const isMountedRef = useRef(true);
  const backgroundLayoutRef = useRef<{
    backgroundRect: { x: number; y: number; width: number; height: number };
    shelfArea: { x: number; y: number; width: number; height: number };
    backgroundContainerHeight: number;
    spawnAreaY: number;
  } | null>(null);
  const dataRef = useRef<{
    products: GameProduct[];
    enemies: GameEnemy[];
    gameActive: boolean;
    shelfManager: ShelfManager;
    kills: number;
  } | null>(null);
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

  useEffect(() => {
    if (gameState.currentScreen !== 'game') return;
    setDisplayScore(0);
    setDisplayProductsCount(0);
    setDisplayKills(0);
    setTimeLeft(levelConfig.duration / 1000);
  }, [gameState.currentScreen, gameState.currentLevel, levelConfig.duration]);

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

    let isCancelled = false;
    const timeoutIds: NodeJS.Timeout[] = [];

    const loadBackgroundSize = () =>
      new Promise<{ width: number; height: number }>(resolve => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(DEFAULT_BG_SIZE);
        img.src = BACKGROUND_IMAGE_PATH;
      });

    const initGame = async () => {
      const bgSize = await loadBackgroundSize();
      if (isCancelled) return;

      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight - 120;
      const backgroundContainerHeight = canvasHeight * BACKGROUND_HEIGHT_RATIO;
      const backgroundRect = getContainRect(
        canvasWidth,
        backgroundContainerHeight,
        bgSize.width,
        bgSize.height
      );

      const shelfArea = {
        x: backgroundRect.x + backgroundRect.width * SHELF_AREA_INSETS.left,
        y: backgroundRect.y + backgroundRect.height * SHELF_AREA_INSETS.top,
        width:
          backgroundRect.width * (1 - SHELF_AREA_INSETS.left - SHELF_AREA_INSETS.right),
        height:
          backgroundRect.height * (1 - SHELF_AREA_INSETS.top - SHELF_AREA_INSETS.bottom),
      };
      const shelfRows = 4;
      const slotsPerRow = 5;
      const shelfHeight = shelfArea.height * SHELF_AREA_SCALE_Y;
      const shelfTop = shelfArea.y + (shelfArea.height - shelfHeight) / 2;
      const scaledShelfArea = {
        ...shelfArea,
        y: shelfTop,
        height: shelfHeight,
      };
      const slotWidth = scaledShelfArea.width / slotsPerRow;
      const slotHeight = scaledShelfArea.height / shelfRows;
      const shiftedShelfArea = {
        ...scaledShelfArea,
        y: Math.max(backgroundRect.y, scaledShelfArea.y - slotHeight),
      };

          const spawnAreaY = Math.min(
            backgroundRect.y + backgroundRect.height - 40,
            backgroundRect.y + backgroundRect.height * 0.92
          );

      backgroundLayoutRef.current = {
        backgroundRect,
        shelfArea: shiftedShelfArea,
        backgroundContainerHeight,
        spawnAreaY,
      };

      dataRef.current = {
        products: [],
        enemies: [],
        gameActive: true,
        shelfManager: new ShelfManager(
          canvasWidth,
          backgroundContainerHeight,
          shelfRows,
          slotsPerRow,
          {
            topMargin: shiftedShelfArea.y,
            leftMargin: shiftedShelfArea.x,
            slotWidth,
            slotHeight,
            shelfHeight: shiftedShelfArea.height,
          }
        ),
        kills: 0,
      };

      const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
        width: canvasWidth,
        height: canvasHeight,
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
      scene: {
        preload: function(this: Phaser.Scene) {
          const scene = this;
          
          // Preload all enemy assets
          ENEMY_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });

          // Preload all product assets
          PRODUCT_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });
        },
        create: function(this: Phaser.Scene) {
          const scene = this;
          const data = dataRef.current;
          if (!data) {
            return;
          }
          const shelfMgr = data.shelfManager;
          const width = scene.scale.width;
          const height = scene.scale.height;
          const layout = backgroundLayoutRef.current;

          // Draw shelves background
          const drawShelves = () => {
            if (!layout) return;
            const graphics = scene.add.graphics();
            const shelfTop = shelfMgr.getConfig().topMargin;
            const shelfHeight = shelfMgr.getConfig().shelfHeight;
            const shelfArea = layout.shelfArea;

            graphics.lineStyle(2, 0xd3d3d3, 0.5);

            shelfMgr.getSlots().forEach(slot => {
              graphics.strokeRect(
                slot.x - shelfMgr.getConfig().slotWidth / 2,
                slot.y - shelfMgr.getConfig().slotHeight / 2,
                shelfMgr.getConfig().slotWidth,
                shelfMgr.getConfig().slotHeight
              );
            });

            graphics.lineStyle(2, 0xd3d3d3, 0.5);
            for (let i = 1; i < shelfMgr.getConfig().slotsPerRow; i++) {
              const slotWidth = shelfArea.width / shelfMgr.getConfig().slotsPerRow;
              graphics.lineBetween(
                shelfArea.x + i * slotWidth,
                shelfMgr.getConfig().topMargin,
                shelfArea.x + i * slotWidth,
                shelfMgr.getConfig().topMargin + shelfMgr.getConfig().shelfHeight
              );
            }

            graphics.setDepth(0);
          };

          drawShelves();

          const spawnAreaY = layout?.spawnAreaY ?? height - 120;
          const spawnBounds = layout?.backgroundRect;

          const createProduct = () => {
            if (!data.gameActive || !PRODUCT_ASSETS.length) return;

            const asset = getRandomAsset(PRODUCT_ASSETS);
            if (!asset) return;

            const spawnMinX = spawnBounds ? spawnBounds.x + 40 : 40;
            const spawnMaxX = spawnBounds ? spawnBounds.x + spawnBounds.width - 40 : width - 40;
            const x = spawnMinX + Math.random() * Math.max(0, spawnMaxX - spawnMinX);
            const y = spawnAreaY;

            const container = scene.add.container(x, y);

            const sprite = scene.add.image(0, 0, asset.id);
            sprite.setDisplaySize(60, 60);
            sprite.setOrigin(0.5);

            container.add(sprite);
            container.setSize(70, 70);
            container.setInteractive();
            container.setDepth(1);

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
                const pointerX = scene.input.activePointer.x;
                const pointerY = scene.input.activePointer.y;
                const nearestSlot = shelfMgr.getNearestEmptySlot(pointerX, pointerY);

                if (nearestSlot && shelfMgr.occupySlot(nearestSlot.id, product.id)) {
                  product.onShelf = true;
                  product.shelfSlotId = nearestSlot.id;

                  scene.tweens.killTweensOf(container);
                  scene.tweens.add({
                    targets: container,
                    x: nearestSlot.x,
                    y: nearestSlot.y,
                    duration: 400,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                      product.x = nearestSlot.x;
                      product.y = nearestSlot.y;
                      setDisplayProductsCount(shelfMgr.getOccupiedProducts().length);
                    },
                  });
                }
              }
            });
          };

          const createEnemy = () => {
            if (!data.gameActive || !ENEMY_ASSETS.length) return;

            const occupiedProductsAtSpawn = shelfMgr.getOccupiedProducts();
            if (occupiedProductsAtSpawn.length === 0) {
              return;
            }

            const asset = getRandomAsset(ENEMY_ASSETS);
            if (!asset) return;

            const spawnFromTop = Math.random() > 0.5;
            const spawnMinX = spawnBounds ? spawnBounds.x + 40 : 40;
            const spawnMaxX = spawnBounds ? spawnBounds.x + spawnBounds.width - 40 : width - 40;
            const x = spawnMinX + Math.random() * Math.max(0, spawnMaxX - spawnMinX);
            const y = spawnBounds
              ? spawnFromTop
                ? spawnBounds.y - 60
                : spawnBounds.y + spawnBounds.height + 60
              : spawnFromTop
                ? -60
                : height + 60;

            const container = scene.add.container(x, y);

            const sprite = scene.add.image(0, 0, asset.id);
            sprite.setDisplaySize(70, 70);
            sprite.setOrigin(0.5);

            container.add(sprite);
            container.setSize(80, 80);
            container.setInteractive();
            container.setDepth(1);

            const health = Math.ceil(Math.random() * 3);

            const healthText = scene.add.text(0, -52, '❤'.repeat(health), {
              fontFamily: 'inherit',
              fontSize: '14px',
              color: '#ff5a5a',
              stroke: '#2b0f0f',
              strokeThickness: 3,
            });
            healthText.setOrigin(0.5, 1);
            container.add(healthText);

            const baseSpriteScaleX = sprite.scaleX;
            const baseSpriteScaleY = sprite.scaleY;

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
              speed: 0,
              stealDurationSec: 3 + Math.random() * 2,
              healthText,
              baseSpriteScaleX,
              baseSpriteScaleY,
            };

            data.enemies.push(enemy);

            container.setAlpha(0);
            scene.tweens.add({
              targets: container,
              alpha: 1,
              duration: 300,
              ease: 'Power2',
            });

            if (occupiedProductsAtSpawn.length > 0) {
              const targetProduct = occupiedProductsAtSpawn[Math.floor(Math.random() * occupiedProductsAtSpawn.length)];
              const targetGameProduct = data.products.find(p => p.id === targetProduct);
              if (targetGameProduct?.shelfSlotId) {
                enemy.targetProductId = targetProduct;
                enemy.targetShelfSlotId = targetGameProduct.shelfSlotId;

                const targetSlot = shelfMgr.getSlot(targetGameProduct.shelfSlotId);
                if (targetSlot) {
                  const dx = targetSlot.x - enemy.x;
                  const dy = targetSlot.y - enemy.y;
                  const distance = Math.hypot(dx, dy);
                  enemy.speed = distance / enemy.stealDurationSec;
                }
              }
            }

            container.on('pointerdown', () => {
              if (!data.gameActive) return;

              enemy.health--;
              showHitFeedback('damage', `-${enemy.health <= 0 ? 'KILL' : '❤️'}`, enemy.x, enemy.y);

              if (enemy.healthText) {
                enemy.healthText.setText('❤'.repeat(Math.max(enemy.health, 0)));
              }

              scene.tweens.killTweensOf(sprite);
              scene.tweens.killTweensOf(enemy.container);
              sprite.setScale(enemy.baseSpriteScaleX, enemy.baseSpriteScaleY);
              sprite.setAlpha(1);
              scene.tweens.add({
                targets: sprite,
                duration: 120,
                alpha: 0.85,
                yoyo: true,
                ease: 'Sine.easeOut',
                onComplete: () => {
                  sprite.setAlpha(1);
                  sprite.setScale(enemy.baseSpriteScaleX, enemy.baseSpriteScaleY);
                },
              });

              const baseX = enemy.x;
              const baseY = enemy.y;
              scene.tweens.add({
                targets: enemy.container,
                duration: 120,
                x: baseX + (Math.random() > 0.5 ? 4 : -4),
                y: baseY + (Math.random() > 0.5 ? 4 : -4),
                yoyo: true,
                ease: 'Sine.easeOut',
                onComplete: () => {
                  enemy.container?.setPosition(baseX, baseY);
                },
              });

              for (let i = 0; i < 4; i++) {
                const particle = scene.add.circle(enemy.x, enemy.y, 4, 0xff5a5a);
                const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.4;
                const distance = 20 + Math.random() * 10;

                scene.tweens.add({
                  targets: particle,
                  x: enemy.x + Math.cos(angle) * distance,
                  y: enemy.y + Math.sin(angle) * distance,
                  alpha: 0,
                  scale: 0,
                  duration: 200 + Math.random() * 80,
                  ease: 'Power2',
                  onComplete: () => particle.destroy(),
                });
              }

              if (enemy.health <= 0) {
                data.kills++;
                setDisplayKills(data.kills);
                addScore(50);
                setDisplayScore(prev => prev + 50);

                if (enemy.targetProductId) {
                  const stolenProduct = data.products.find(p => p.id === enemy.targetProductId);
                  if (stolenProduct) {
                    if (enemy.direction === 'awayFromShelf' && stolenProduct.originalShelfSlotId) {
                      stolenProduct.escapeTween?.stop();
                      scene.tweens.killTweensOf(stolenProduct.container);
                      const slotId = stolenProduct.originalShelfSlotId;
                      const slot = shelfMgr.getSlot(slotId);
                      if (slot && stolenProduct.container) {
                        stolenProduct.container.setAlpha(1);
                        scene.tweens.add({
                          targets: stolenProduct.container,
                          x: slot.x,
                          y: slot.y,
                          duration: 300,
                          ease: 'Back.easeOut',
                        });
                      }
                      shelfMgr.occupySlot(slotId, stolenProduct.id);
                      stolenProduct.onShelf = true;
                      stolenProduct.shelfSlotId = slotId;
                      stolenProduct.wasStolen = false;
                      stolenProduct.originalShelfSlotId = undefined;
                      setDisplayProductsCount(shelfMgr.getOccupiedProducts().length);
                    }
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
          const updateHandler = (_time: number, delta: number) => {
            if (!data.gameActive) return;

            const deltaSeconds = delta / 1000;

            data.enemies.forEach(enemy => {
              if (!enemy.targetShelfSlotId) {
                const occupiedProducts = shelfMgr.getOccupiedProducts();
                if (occupiedProducts.length === 0) return;

                const targetProduct = occupiedProducts[Math.floor(Math.random() * occupiedProducts.length)];
                const targetGameProduct = data.products.find(p => p.id === targetProduct);
                if (targetGameProduct?.shelfSlotId) {
                  enemy.targetProductId = targetProduct;
                  enemy.targetShelfSlotId = targetGameProduct.shelfSlotId;

                  const targetSlot = shelfMgr.getSlot(targetGameProduct.shelfSlotId);
                  if (targetSlot) {
                    const dx = targetSlot.x - enemy.x;
                    const dy = targetSlot.y - enemy.y;
                    const distance = Math.hypot(dx, dy);
                    enemy.speed = distance / enemy.stealDurationSec;
                  }
                }

                if (!enemy.targetShelfSlotId) return;
              }

              const targetSlot = shelfMgr.getSlot(enemy.targetShelfSlotId);
              if (!targetSlot) return;

              const dx = targetSlot.x - enemy.x;
              const dy = targetSlot.y - enemy.y;
              const distance = Math.hypot(dx, dy);

              if (distance < 30) {
                if (enemy.targetProductId) {
                  const product = data.products.find(p => p.id === enemy.targetProductId);
                  if (product) {
                    product.originalShelfSlotId = enemy.targetShelfSlotId;
                    product.wasStolen = true;
                    shelfMgr.releaseSlot(enemy.targetShelfSlotId);
                    product.onShelf = false;
                    product.shelfSlotId = undefined;
                    setDisplayProductsCount(shelfMgr.getOccupiedProducts().length);

                    addScore(-100);
                    setDisplayScore(prev => Math.max(0, prev - 100));

                    enemy.direction = 'awayFromShelf';
                    const offscreenX = enemy.x > width / 2 ? width + 100 : -100;
                    const offscreenY = enemy.y > height / 2 ? height + 100 : -100;

                    if (product.container) {
                      const escapeSpeed = enemy.speed > 0 ? enemy.speed : 60;
                      const productDistance = Math.hypot(offscreenX - product.x, offscreenY - product.y);
                      const productDuration = (productDistance / escapeSpeed) * 1000;

                      product.escapeTween = scene.tweens.add({
                        targets: product.container,
                        x: offscreenX,
                        y: offscreenY,
                        alpha: 0,
                        duration: productDuration,
                        ease: 'Linear',
                        onComplete: () => {
                          product.escapeTween = undefined;
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

                const escapeSpeed = enemy.speed > 0 ? enemy.speed : 60;
                const enemyDistance = Math.hypot(offscreenX - enemy.x, offscreenY - enemy.y);
                const enemyDuration = (enemyDistance / escapeSpeed) * 1000;

                scene.tweens.add({
                  targets: enemy.container,
                  x: offscreenX,
                  y: offscreenY,
                  alpha: 0,
                  duration: enemyDuration,
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
                const moveX = (dx / distance) * enemy.speed * deltaSeconds;
                const moveY = (dy / distance) * enemy.speed * deltaSeconds;
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
    };

    initGame();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
      timeoutIds.forEach(id => clearTimeout(id));
      phaserGameRef.current?.destroy(true);
    };
  }, [gameState.currentLevel, levelConfig, addScore, loseLife, completeLevel, showHitFeedback, gameState.currentScreen]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-arcade-dark relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-full z-0"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_PATH}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
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
            {timeLeft} sec
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
        className="w-full h-full absolute inset-0 z-10"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
