import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Target } from 'lucide-react';
import { InstructionsModal } from './InstructionsModal';
import { getEnemyAssets, getProductAssets, getRareProductAssets, getRandomAsset, Asset } from '@/lib/assetLoader';
import { ShelfManager } from '@/lib/shelfManager';
import { ShelfSlot } from '@/types/game';
import { soundManager } from '@/lib/soundManager';

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
  rarity: 'normal' | 'ultra';
  followEnemyId?: string;
}

interface GameEnemy extends GameTarget {
  type: 'enemy';
  health: number;
  targetProductId?: string;
  targetShelfSlotId?: string;
  isMoving: boolean;
  direction: 'toShelf' | 'awayFromShelf' | 'patrol';
  speed: number;
  stealDurationSec: number;
  healthText?: Phaser.GameObjects.Text;
  baseSpriteScaleX: number;
  baseSpriteScaleY: number;
  escapeTarget?: { x: number; y: number };
  patrolTarget?: { x: number; y: number };
}

const LEVEL_CONFIG = {
  1: { productSpawnRate: 1500, enemySpawnRate: 2000, duration: 30000, baseEnemyHealth: 1 },
  2: { productSpawnRate: 1200, enemySpawnRate: 1500, duration: 45000, baseEnemyHealth: 1.5 },
  3: { productSpawnRate: 1000, enemySpawnRate: 1000, duration: 60000, baseEnemyHealth: 2 },
};

const ENEMY_ASSETS: Asset[] = getEnemyAssets();
const PRODUCT_ASSETS: Asset[] = getProductAssets();
const RARE_PRODUCT_ASSETS: Asset[] = getRareProductAssets();

const BACKGROUND_IMAGE_PATH = '/store.png';
const SHELF_IMAGE_PATH = '/shelf.png';
const BACKGROUND_HEIGHT_RATIO = 1;
const ULTRA_RARE_DEBUG = false;
const ULTRA_RARE_CHANCE = 0.25;
const PLAYBOUNDS_Y_OFFSET = 36;
const PLAYBOUNDS_PADDING = 0.1; // 10% padding on all sides

// Dynamic shelf layout configuration
const SHELF_LAYOUT = {
  rows: 4,
  slotsPerRow: 5,
  topMargin: 0.105, // Top margin as % of background height
  bottomMargin: 0.24, // Bottom margin as % of background height
  leftMargin: 0.118, // Left margin as % of background width
  rightMargin: 0.118, // Right margin as % of background width
  shelfSpacing: 0.155, // Vertical spacing between shelf centers as % of background height
};

const DEFAULT_BG_SIZE = { width: 1080, height: 1920 };

const getContainRect = (
  canvasWidth: number,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
) => {
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const x = (canvasWidth - width) / 2;
  const y = PLAYBOUNDS_Y_OFFSET;
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
    gridScale: number;
  } | null>(null);
  const [backgroundLayout, setBackgroundLayout] = useState<{
    backgroundRect: { x: number; y: number; width: number; height: number };
    shelfArea: { x: number; y: number; width: number; height: number };
    backgroundContainerHeight: number;
    spawnAreaY: number;
    gridScale: number;
  } | null>(null);
  const dataRef = useRef<{
    products: GameProduct[];
    enemies: GameEnemy[];
    gameActive: boolean;
    shelfManager: ShelfManager;
    kills: number;
  } | null>(null);
  const userInteractedRef = useRef(false);
  const { gameState, addScore, loseLife, completeLevel } = useGame();
  const [displayScore, setDisplayScore] = useState(0);
  const [displayProductsCount, setDisplayProductsCount] = useState(0);
  const [displayKills, setDisplayKills] = useState(0);
  const [rarePopup, setRarePopup] = useState<{ active: boolean; text: string }>({
    active: false,
    text: '',
  });
  const [scorePopup, setScorePopup] = useState<{ active: boolean; value: number; x: number; y: number }>({
    active: false,
    value: 0,
    x: 0,
    y: 0,
  });
  const [eventPopup, setEventPopup] = useState<{ active: boolean; text: string }>({
    active: false,
    text: '',
  });
  const [hitFeedback, setHitFeedback] = useState<{ 
    type: 'kill' | 'damage' | null; 
    text: string; 
    x: number; 
    y: number 
  }>({ type: null, text: '', x: 0, y: 0 });

  const levelConfig = LEVEL_CONFIG[gameState.currentLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];
  const [timeLeft, setTimeLeft] = useState(levelConfig.duration / 1000);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (gameState.currentScreen !== 'game') return;
    // Reset instructions modal when entering game screen
    setShowInstructions(true);
    setGameStarted(false);
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

  const showRarePopup = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    setRarePopup({ active: true, text });
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setRarePopup({ active: false, text: '' });
      }
    }, 1200);
    return timeoutId;
  }, []);

  const showScorePopup = useCallback((value: number, x: number, y: number) => {
    if (!isMountedRef.current) return;
    setScorePopup({ active: true, value, x, y });
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setScorePopup({ active: false, value: 0, x: 0, y: 0 });
      }
    }, 800);
    return timeoutId;
  }, []);

  const showEventPopup = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    setEventPopup({ active: true, text });
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setEventPopup({ active: false, text: '' });
      }
    }, 1200);
    return timeoutId;
  }, []);

  const applyScoreChange = useCallback(
    (delta: number, x?: number, y?: number) => {
      addScore(delta);
      setDisplayScore(prev => Math.max(0, prev + delta));
      if (x !== undefined && y !== undefined) {
        showScorePopup(delta, x, y);
      }
    },
    [addScore, showScorePopup]
  );

  const handleStartGame = useCallback(() => {
    setShowInstructions(false);
    setGameStarted(true);
    // Mark that user has interacted (needed for mobile audio)
    userInteractedRef.current = true;
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current || !gameStarted) return;

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
      
      // Apply 10% padding to create playbounds area
      const paddingX = canvasWidth * PLAYBOUNDS_PADDING;
      const paddingY = canvasHeight * PLAYBOUNDS_PADDING;
      
      const playboundsWidth = canvasWidth - (paddingX * 2);
      const playboundsHeight = canvasHeight - (paddingY * 2) - PLAYBOUNDS_Y_OFFSET;
      
      // Center the playbounds with padding
      const backgroundRect = {
        x: paddingX,
        y: PLAYBOUNDS_Y_OFFSET + paddingY,
        width: playboundsWidth,
        height: playboundsHeight,
      };

      // Calculate shelf area based on layout configuration
      const shelfAreaLeft = backgroundRect.x + backgroundRect.width * SHELF_LAYOUT.leftMargin;
      const shelfAreaWidth = backgroundRect.width * (1 - SHELF_LAYOUT.leftMargin - SHELF_LAYOUT.rightMargin);
      
      const firstShelfY = backgroundRect.y + backgroundRect.height * SHELF_LAYOUT.topMargin;
      const totalShelfAreaHeight = backgroundRect.height * SHELF_LAYOUT.shelfSpacing * (SHELF_LAYOUT.rows - 1);
      const shelfAreaHeight = totalShelfAreaHeight + backgroundRect.height * SHELF_LAYOUT.shelfSpacing;

      const gridScale = Math.min(1, backgroundRect.width / 500); // Scale based on 500px reference width
      
      const finalShelfArea = {
        x: shelfAreaLeft,
        y: firstShelfY,
        width: shelfAreaWidth,
        height: shelfAreaHeight,
      };
      
      const slotWidth = finalShelfArea.width / SHELF_LAYOUT.slotsPerRow;
      const slotHeight = finalShelfArea.height / SHELF_LAYOUT.rows;

          const spawnAreaY = Math.min(
            backgroundRect.y + backgroundRect.height - 40,
            backgroundRect.y + backgroundRect.height * 0.92
          );

      backgroundLayoutRef.current = {
        backgroundRect,
        shelfArea: finalShelfArea,
        backgroundContainerHeight: backgroundRect.height,
        spawnAreaY,
        gridScale,
      };
      setBackgroundLayout({
        backgroundRect,
        shelfArea: finalShelfArea,
        backgroundContainerHeight: backgroundRect.height,
        spawnAreaY,
        gridScale,
      });

      dataRef.current = {
        products: [],
        enemies: [],
        gameActive: true,
        shelfManager: new ShelfManager(
          canvasWidth,
          backgroundRect.height,
          SHELF_LAYOUT.rows,
          SHELF_LAYOUT.slotsPerRow,
          {
            topMargin: finalShelfArea.y,
            leftMargin: finalShelfArea.x,
            slotWidth,
            slotHeight,
            shelfHeight: finalShelfArea.height,
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
          
          // Preload shelf image
          scene.load.image('shelf', SHELF_IMAGE_PATH);
          
          // Preload all enemy assets
          ENEMY_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });

          // Preload all product assets
          PRODUCT_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });

          // Preload rare product assets
          RARE_PRODUCT_ASSETS.forEach(asset => {
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
          
          // Initialize sound manager
          soundManager.init(scene);
          
          // Load audio in background (non-blocking)
          soundManager.preloadAsync(scene);
          
          // Start music after user interaction (required for mobile browsers)
          if (userInteractedRef.current) {
            // Small delay to ensure audio context is ready
            setTimeout(() => {
              soundManager.playBackgroundMusic();
            }, 100);
          }

          // Draw shelves first
          if (layout) {
            const shelfWidth = layout.shelfArea.width;
            const slotHeight = layout.shelfArea.height / SHELF_LAYOUT.rows;
            const shelfHeight = slotHeight * 0.7; // Shelf visual height is 70% of slot height
            
            for (let i = 0; i < SHELF_LAYOUT.rows; i++) {
              // Position shelf so its bottom edge aligns with the grid cell bottom
              const shelfY = layout.shelfArea.y + (i + 1) * slotHeight - shelfHeight / 2;
              const shelfX = layout.shelfArea.x + shelfWidth / 2;
              
              const shelf = scene.add.image(shelfX, shelfY, 'shelf');
              shelf.setDisplaySize(shelfWidth, shelfHeight);
              shelf.setDepth(0);
            }
          }

          // Draw shelves background
          const drawShelves = () => {
            if (!layout) return;
            const graphics = scene.add.graphics();
            // Debug boundaries removed for cleaner gameplay
            // const gridScale = layout.gridScale;
            // const lineWidth = Math.max(1, 2 * gridScale);
            // const shelfTop = shelfMgr.getConfig().topMargin;
            // const shelfHeight = shelfMgr.getConfig().shelfHeight;
            // const shelfArea = layout.shelfArea;

            // graphics.lineStyle(lineWidth, 0xd3d3d3, 0.5);

            // shelfMgr.getSlots().forEach(slot => {
            //   graphics.strokeRect(
            //     slot.x - shelfMgr.getConfig().slotWidth / 2,
            //     slot.y - shelfMgr.getConfig().slotHeight / 2,
            //     shelfMgr.getConfig().slotWidth,
            //     shelfMgr.getConfig().slotHeight
            //   );
            // });

            // graphics.lineStyle(lineWidth, 0xd3d3d3, 0.5);
            // for (let i = 1; i < shelfMgr.getConfig().slotsPerRow; i++) {
            //   const slotWidth = shelfArea.width / shelfMgr.getConfig().slotsPerRow;
            //   graphics.lineBetween(
            //     shelfArea.x + i * slotWidth,
            //     shelfMgr.getConfig().topMargin,
            //     shelfArea.x + i * slotWidth,
            //     shelfMgr.getConfig().topMargin + shelfMgr.getConfig().shelfHeight
            //   );
            // }

            graphics.setDepth(0);
          };

          drawShelves();

          const spawnAreaY = layout?.spawnAreaY ?? height - 120;
          const spawnBounds = layout?.backgroundRect;

          const createProduct = () => {
            if (!data.gameActive || !PRODUCT_ASSETS.length) return;
            const ultraRareChance = ULTRA_RARE_DEBUG ? 0.9 : ULTRA_RARE_CHANCE;
            const isUltraRare = RARE_PRODUCT_ASSETS.length > 0 && Math.random() < ultraRareChance;

            const asset = isUltraRare
              ? getRandomAsset(RARE_PRODUCT_ASSETS) ?? getRandomAsset(PRODUCT_ASSETS)
              : getRandomAsset(PRODUCT_ASSETS);
            if (!asset) return;

            const spawnMinX = spawnBounds ? spawnBounds.x + 40 : 40;
            const spawnMaxX = spawnBounds ? spawnBounds.x + spawnBounds.width - 40 : width - 40;
            const x = spawnMinX + Math.random() * Math.max(0, spawnMaxX - spawnMinX);
            const y = spawnAreaY;

            const container = scene.add.container(x, y);

            const sprite = scene.add.image(0, 0, asset.id);
            const layoutScale = backgroundLayoutRef.current?.gridScale ?? 1;
            const spriteSize = 60 * layoutScale;
            sprite.setDisplaySize(spriteSize, spriteSize);
            sprite.setOrigin(0.5);

            if (isUltraRare) {
              const glowOuter = scene.add.circle(0, 0, 38 * layoutScale, 0x7cf7ff, 0.18);
              const glowInner = scene.add.circle(0, 0, 28 * layoutScale, 0xffd86a, 0.22);
              container.add([glowOuter, glowInner]);

              scene.tweens.add({
                targets: [glowOuter, glowInner],
                alpha: { from: 0.2, to: 0.6 },
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
            }

            container.add(sprite);
            container.setSize(70 * layoutScale, 70 * layoutScale);
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
              rarity: isUltraRare ? 'ultra' : 'normal',
            };

            data.products.push(product);

            // Play sound for ultra rare item
            if (isUltraRare) {
              soundManager.playSound('rareItem');
            }

            container.setAlpha(0);
            scene.tweens.add({
              targets: container,
              alpha: 1,
              duration: 300,
              ease: 'Power2',
            });

            if (isUltraRare) {
              container.setScale(0.9);
              scene.tweens.add({
                targets: container,
                scale: 1.05,
                duration: 260,
                yoyo: true,
                ease: 'Back.easeOut',
              });

              for (let i = 0; i < 6; i++) {
                const sparkle = scene.add.circle(x, y, 4 * layoutScale, 0xffe27a);
                const angle = (Math.PI * 2 * i) / 6;
                const distance = (28 + Math.random() * 10) * layoutScale;
                scene.tweens.add({
                  targets: sparkle,
                  x: x + Math.cos(angle) * distance,
                  y: y + Math.sin(angle) * distance,
                  alpha: 0,
                  scale: 0,
                  duration: 300 + Math.random() * 100,
                  ease: 'Power2',
                  onComplete: () => sparkle.destroy(),
                });
              }

              showRarePopup('ULTRA RARE!!');
            }

            const originalY = y;
            scene.tweens.add({
              targets: container,
              y: originalY - 10 * layoutScale,
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
                      
                      // Play sound for placing product
                      soundManager.playSound('placeProduct');
                      
                      // Give immediate score feedback
                      const scoreValue = product.rarity === 'ultra' ? 5000 : 1000;
                      applyScoreChange(scoreValue, nearestSlot.x, nearestSlot.y);
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

            const spawnMinX = spawnBounds ? spawnBounds.x + 40 : 40;
            const spawnMaxX = spawnBounds ? spawnBounds.x + spawnBounds.width - 40 : width - 40;
            const x = spawnMinX + Math.random() * Math.max(0, spawnMaxX - spawnMinX);
            const y = spawnBounds ? spawnBounds.y - 60 : -60;

            const container = scene.add.container(x, y);

            const sprite = scene.add.image(0, 0, asset.id);
            const layoutScale = backgroundLayoutRef.current?.gridScale ?? 1;
            const enemySize = 140 * layoutScale;
            sprite.setDisplaySize(enemySize, enemySize);
            sprite.setOrigin(0.5);

            container.add(sprite);
            container.setSize(80 * layoutScale, 80 * layoutScale);
            container.setInteractive();
            container.setDepth(1);

            const health = Math.ceil(Math.random() * 3);

            const healthText = scene.add.text(0, -52 * layoutScale, '❤'.repeat(health), {
              fontFamily: 'inherit',
              fontSize: `${Math.max(12, 14 * layoutScale)}px`,
              color: '#ff5a5a',
              stroke: '#2b0f0f',
              strokeThickness: Math.max(2, 3 * layoutScale),
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
              
              // Play hit or kill sound
              if (enemy.health <= 0) {
                soundManager.playSound('enemyKill');
              } else {
                soundManager.playSound('enemyHit');
              }

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
                applyScoreChange(500, enemy.x, enemy.y);

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
              if (enemy.health > 0) {
                applyScoreChange(250, enemy.x, enemy.y);
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
              if (enemy.direction === 'awayFromShelf' && enemy.escapeTarget) {
                const escapeDx = enemy.escapeTarget.x - enemy.x;
                const escapeDy = enemy.escapeTarget.y - enemy.y;
                const escapeDistance = Math.hypot(escapeDx, escapeDy);
                if (escapeDistance < 20) {
                  if (enemy.targetProductId) {
                    const stolenProduct = data.products.find(p => p.id === enemy.targetProductId);
                    if (stolenProduct?.wasStolen) {
                      stolenProduct.container?.destroy();
                      const productIdx = data.products.indexOf(stolenProduct);
                      if (productIdx !== -1) {
                        data.products.splice(productIdx, 1);
                      }
                      const stolenValue = stolenProduct.rarity === 'ultra' ? 5000 : 1000;
                      applyScoreChange(-stolenValue, enemy.x, enemy.y);
                      showEventPopup('ITEM STOLEN');
                      soundManager.playSound('itemStolen');
                    }
                  }
                  enemy.container?.destroy();
                  const idx = data.enemies.indexOf(enemy);
                  if (idx !== -1) {
                    data.enemies.splice(idx, 1);
                  }
                  return;
                }

                const moveX = (escapeDx / escapeDistance) * enemy.speed * deltaSeconds;
                const moveY = (escapeDy / escapeDistance) * enemy.speed * deltaSeconds;
                enemy.x += moveX;
                enemy.y += moveY;
                enemy.container?.setPosition(enemy.x, enemy.y);

                if (enemy.targetProductId) {
                  const stolenProduct = data.products.find(p => p.id === enemy.targetProductId);
                  if (stolenProduct?.followEnemyId === enemy.id && stolenProduct.container) {
                    stolenProduct.container.setPosition(enemy.x, enemy.y + 18);
                  }
                }
                return;
              }

              // Patrol behavior when no products available
              if (enemy.direction === 'patrol') {
                if (!enemy.patrolTarget) {
                  const patrolY = spawnBounds ? spawnBounds.y + 20 : 20;
                  const patrolMinX = spawnBounds ? spawnBounds.x + 60 : 60;
                  const patrolMaxX = spawnBounds ? spawnBounds.x + spawnBounds.width - 60 : width - 60;
                  enemy.patrolTarget = {
                    x: patrolMinX + Math.random() * (patrolMaxX - patrolMinX),
                    y: patrolY,
                  };
                  enemy.speed = 80 + Math.random() * 40;
                }

                const dx = enemy.patrolTarget.x - enemy.x;
                const dy = enemy.patrolTarget.y - enemy.y;
                const distance = Math.hypot(dx, dy);

                if (distance < 10) {
                  // Reached patrol target, pick a new one
                  const patrolY = spawnBounds ? spawnBounds.y + 20 : 20;
                  const patrolMinX = spawnBounds ? spawnBounds.x + 60 : 60;
                  const patrolMaxX = spawnBounds ? spawnBounds.x + spawnBounds.width - 60 : width - 60;
                  enemy.patrolTarget = {
                    x: patrolMinX + Math.random() * (patrolMaxX - patrolMinX),
                    y: patrolY,
                  };
                }

                const moveX = (dx / distance) * enemy.speed * deltaSeconds;
                const moveY = (dy / distance) * enemy.speed * deltaSeconds;
                enemy.x += moveX;
                enemy.y += moveY;
                enemy.container?.setPosition(enemy.x, enemy.y);

                // Check if products are now available
                const occupiedProducts = shelfMgr.getOccupiedProducts();
                if (occupiedProducts.length > 0) {
                  const targetProduct = occupiedProducts[Math.floor(Math.random() * occupiedProducts.length)];
                  const targetGameProduct = data.products.find(p => p.id === targetProduct);
                  if (targetGameProduct?.shelfSlotId) {
                    enemy.targetProductId = targetProduct;
                    enemy.targetShelfSlotId = targetGameProduct.shelfSlotId;
                    enemy.direction = 'toShelf';
                    enemy.patrolTarget = undefined;

                    const targetSlot = shelfMgr.getSlot(targetGameProduct.shelfSlotId);
                    if (targetSlot) {
                      const dx = targetSlot.x - enemy.x;
                      const dy = targetSlot.y - enemy.y;
                      const distance = Math.hypot(dx, dy);
                      enemy.speed = distance / enemy.stealDurationSec;
                    }
                  }
                }
                return;
              }

              if (!enemy.targetShelfSlotId) {
                const occupiedProducts = shelfMgr.getOccupiedProducts();
                if (occupiedProducts.length === 0) {
                  // Switch to patrol mode
                  enemy.direction = 'patrol';
                  return;
                }

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

              // Verify target product still exists and is on the shelf
              if (enemy.targetProductId) {
                const targetProduct = data.products.find(p => p.id === enemy.targetProductId);
                if (!targetProduct || !targetProduct.onShelf || targetProduct.shelfSlotId !== enemy.targetShelfSlotId) {
                  // Target was stolen or moved, pick a new target
                  enemy.targetProductId = undefined;
                  enemy.targetShelfSlotId = undefined;
                  
                  const occupiedProducts = shelfMgr.getOccupiedProducts();
                  if (occupiedProducts.length === 0) {
                    // No products available, switch to patrol
                    enemy.direction = 'patrol';
                    return;
                  }
                  
                  // Pick a new target
                  const newTargetProduct = occupiedProducts[Math.floor(Math.random() * occupiedProducts.length)];
                  const newTargetGameProduct = data.products.find(p => p.id === newTargetProduct);
                  if (newTargetGameProduct?.shelfSlotId) {
                    enemy.targetProductId = newTargetProduct;
                    enemy.targetShelfSlotId = newTargetGameProduct.shelfSlotId;

                    const targetSlot = shelfMgr.getSlot(newTargetGameProduct.shelfSlotId);
                    if (targetSlot) {
                      const dx = targetSlot.x - enemy.x;
                      const dy = targetSlot.y - enemy.y;
                      const distance = Math.hypot(dx, dy);
                      enemy.speed = distance / enemy.stealDurationSec;
                    }
                  }
                  return;
                }
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

                    enemy.direction = 'awayFromShelf';
                    enemy.escapeTarget = {
                      x: spawnBounds ? spawnBounds.x + spawnBounds.width / 2 : width / 2,
                      y: spawnBounds ? spawnBounds.y + 20 : 20,
                    };
                    product.followEnemyId = enemy.id;

                    if (product.container) {
                      product.escapeTween?.stop();
                      scene.tweens.killTweensOf(product.container);
                    }
                  }
                }
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
              soundManager.playSound('levelComplete');

              const timeoutId = setTimeout(() => {
                if (isMountedRef.current && gameState.currentScreen === 'game') {
                  const occupiedIds = shelfMgr.getOccupiedProducts();
                  const ultraCount = occupiedIds.reduce((count, id) => {
                    const product = data.products.find(p => p.id === id);
                    return product?.rarity === 'ultra' ? count + 1 : count;
                  }, 0);
                  const normalCount = occupiedIds.length - ultraCount;
                  const finalScore = normalCount * 1000 + ultraCount * 5000;
                  applyScoreChange(finalScore);

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
            // Keep music playing across screens - don't stop it here
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
  }, [
    gameState.currentLevel,
    levelConfig,
    addScore,
    loseLife,
    completeLevel,
    showHitFeedback,
    showRarePopup,
    applyScoreChange,
    showEventPopup,
    gameState.currentScreen,
    gameStarted,
  ]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-arcade-dark relative overflow-hidden">
      {/* Instructions Modal */}
      <InstructionsModal 
        isOpen={showInstructions} 
        onStart={handleStartGame}
      />

      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGE_PATH}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {backgroundLayout && (
        <div
          className="absolute z-5 pointer-events-none"
          style={{
            left: `${backgroundLayout.backgroundRect.x}px`,
            top: `${backgroundLayout.backgroundRect.y}px`,
            width: `${backgroundLayout.backgroundRect.width}px`,
            height: `${backgroundLayout.backgroundRect.height}px`,
            border: '2px solid rgba(124, 247, 255, 0.35)',
            boxShadow: '0 0 18px rgba(124, 247, 255, 0.25)',
            borderRadius: '16px',
          }}
        />
      )}
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

      <AnimatePresence>
        {scorePopup.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${scorePopup.x}px`,
              top: `${scorePopup.y + 34}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              className={`arcade-text text-2xl font-bold ${
                scorePopup.value >= 0 ? 'text-success score-glow' : 'text-destructive'
              }`}
            >
              {scorePopup.value >= 0 ? `+${scorePopup.value}` : scorePopup.value}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {eventPopup.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute z-30 left-1/2 top-28 -translate-x-1/2 pointer-events-none"
          >
            <div className="bg-destructive/20 border border-destructive/60 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="arcade-text text-base text-destructive">{eventPopup.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rarePopup.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute z-50 left-1/2 top-32 -translate-x-1/2 pointer-events-none"
          >
            <div className="bg-warning/20 border border-warning/60 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="arcade-text text-base text-warning score-glow">{rarePopup.text}</span>
            </div>
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
