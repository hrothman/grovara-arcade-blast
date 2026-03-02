import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap } from 'lucide-react';
import { InstructionsModal } from './InstructionsModal';
import { getEnemyAssets, getProductAssets, getRareProductAssets, getRandomAsset, Asset } from '@/lib/assetLoader';
import { soundManager } from '@/lib/soundManager';

// ── Interfaces ──────────────────────────────────────────────────────────────

interface FlyingItem {
  id: string;
  type: 'product' | 'enemy' | 'bonus';
  rarity: 'normal' | 'ultra';
  assetId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  sprite?: Phaser.GameObjects.Image;
  glowOuter?: Phaser.GameObjects.Arc;
  glowInner?: Phaser.GameObjects.Arc;
  borderRing?: Phaser.GameObjects.Arc;
  sliced: boolean;
  missed: boolean;
  radius: number;
}

interface SlicedHalf {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  life: number;
}

interface Particle {
  circle: Phaser.GameObjects.Arc;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  alpha: number;
  life: number;
}

interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

// ── Level config ────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  1: { duration: 20000, throwRate: 1800, itemsMin: 1, itemsMax: 2, enemyChance: 0.40, gravity: 460, throwSpeedY: -700 },
  2: { duration: 20000, throwRate: 1400, itemsMin: 2, itemsMax: 3, enemyChance: 0.45, gravity: 530, throwSpeedY: -780 },
  3: { duration: 20000, throwRate: 1100, itemsMin: 2, itemsMax: 3, enemyChance: 0.45, gravity: 560, throwSpeedY: -820 },
};

const ULTRA_RARE_CHANCE = 0.12;
const MIN_SWIPE_SPEED = 0.5; // px/ms
const SLASH_TRAIL_LIFETIME = 150; // ms
const HUD_HEIGHT = 100; // px reserved for HUD at top (reduced — no miss counter row)

// Scale game parameters relative to a 414×736 reference (iPhone 6/7/8 Plus)
const getScale = (w: number, h: number) => {
  const refW = 414;
  const refH = 736;
  const s = Math.min(w / refW, h / refH);
  return Math.max(0.55, Math.min(s, 1.8)); // clamp for extremes
};

const ENEMY_ASSETS: Asset[] = getEnemyAssets();
const PRODUCT_ASSETS: Asset[] = getProductAssets();
const RARE_PRODUCT_ASSETS: Asset[] = getRareProductAssets();

// ── Component ───────────────────────────────────────────────────────────────

export const GameCanvas = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const isMountedRef = useRef(true);
  const levelScoreRef = useRef(0);
  const { gameState, addScore, loseLife, completeLevel } = useGame();

  const [displayScore, setDisplayScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [comboPopup, setComboPopup] = useState<{ active: boolean; count: number }>({ active: false, count: 0 });
  const [scorePopup, setScorePopup] = useState<{ active: boolean; value: number; x: number; y: number }>({
    active: false, value: 0, x: 0, y: 0,
  });
  const [lifeLostFlash, setLifeLostFlash] = useState(false);

  // Stats for level completion
  const statsRef = useRef({ productsSliced: 0, enemiesSliced: 0, totalProductsThrown: 0 });

  const levelConfig = LEVEL_CONFIG[gameState.currentLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];

  // ── Reset on screen/level change ────────────────────────────────────────
  useEffect(() => {
    if (gameState.currentScreen !== 'game') return;
    setShowInstructions(true);
    setGameStarted(false);
    setDisplayScore(0);
    setTimeLeft(levelConfig.duration / 1000);
    setComboPopup({ active: false, count: 0 });
    levelScoreRef.current = 0;
    statsRef.current = { productsSliced: 0, enemiesSliced: 0, totalProductsThrown: 0 };
  }, [gameState.currentScreen, gameState.currentLevel, levelConfig.duration]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const applyScoreChange = useCallback(
    (delta: number, x?: number, y?: number) => {
      addScore(delta);
      levelScoreRef.current += delta;
      setDisplayScore(prev => Math.max(0, prev + delta));
      if (x !== undefined && y !== undefined) {
        if (!isMountedRef.current) return;
        setScorePopup({ active: true, value: delta, x, y });
        setTimeout(() => {
          if (isMountedRef.current) setScorePopup({ active: false, value: 0, x: 0, y: 0 });
        }, 800);
      }
    },
    [addScore]
  );

  const showCombo = useCallback((count: number) => {
    if (!isMountedRef.current) return;
    setComboPopup({ active: true, count });
    setTimeout(() => {
      if (isMountedRef.current) setComboPopup({ active: false, count: 0 });
    }, 1000);
  }, []);

  const flashLifeLost = useCallback(() => {
    if (!isMountedRef.current) return;
    setLifeLostFlash(true);
    setTimeout(() => {
      if (isMountedRef.current) setLifeLostFlash(false);
    }, 400);
  }, []);

  const handleStartGame = useCallback(() => {
    // Unlock audio on user gesture (required for mobile browsers)
    soundManager.unlockAudio();
    setShowInstructions(false);
    setGameStarted(true);
  }, []);

  // ── Main Phaser game effect ─────────────────────────────────────────────
  useEffect(() => {
    if (!gameContainerRef.current || !gameStarted) return;

    let isCancelled = false;
    isMountedRef.current = true;

    const canvasWidth = window.innerWidth;
    const canvasHeight = Math.max(300, window.innerHeight - HUD_HEIGHT);
    const scale = getScale(canvasWidth, canvasHeight);

    // Scaled constants
    const ITEM_RADIUS = 52 * scale;
    const PRODUCT_SIZE = 100 * scale;
    const ENEMY_SIZE = 115 * scale;
    const GLOW_OUTER_R = 42 * scale;
    const GLOW_INNER_R = 30 * scale;
    const BORDER_RING_R = 55 * scale; // red border ring radius for enemies
    const scaledGravity = levelConfig.gravity * scale;
    const scaledThrowSpeedY = levelConfig.throwSpeedY * scale;

    // Game data refs
    const items: FlyingItem[] = [];
    const slicedHalves: SlicedHalf[] = [];
    const particles: Particle[] = [];
    let gameActive = true;
    let lastThrowTime = 0;
    let currentCombo = 0;
    let bonusSpawned = false;
    // Spawn bonus between 30-70% of the level duration
    const bonusSpawnTime = levelConfig.duration * (0.3 + Math.random() * 0.4);
    let isPointerDown = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPointerTime = 0;
    const slashPoints: SlashPoint[] = [];
    let slashGraphics: Phaser.GameObjects.Graphics | null = null;
    let timerEvent: Phaser.Time.TimerEvent | null = null;
    let remainingTime = levelConfig.duration / 1000;
    let elapsedTime = 0;

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
      scene: {
        preload: function (this: Phaser.Scene) {
          const scene = this;

          // Loading progress bar
          const barWidth = 300;
          const barHeight = 20;
          const barX = (scene.scale.width - barWidth) / 2;
          const barY = scene.scale.height / 2;
          const progressBg = scene.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight, 0x222222);
          const progressBar = scene.add.rectangle(barX, barY, 0, barHeight, 0x10b981).setOrigin(0, 0.5);
          const progressText = scene.add.text(scene.scale.width / 2, barY + 30, 'Loading...', {
            fontSize: '14px',
            color: '#ffffff',
          }).setOrigin(0.5);

          scene.load.on('progress', (value: number) => {
            progressBar.width = barWidth * value;
            progressText.setText(`Loading... ${Math.round(value * 100)}%`);
          });

          scene.load.on('complete', () => {
            progressBg.destroy();
            progressBar.destroy();
            progressText.destroy();
          });

          ENEMY_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });
          PRODUCT_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });
          RARE_PRODUCT_ASSETS.forEach(asset => {
            scene.load.image(asset.id, asset.path);
          });
        },

        create: function (this: Phaser.Scene) {
          const scene = this;
          const w = scene.scale.width;
          const h = scene.scale.height;

          soundManager.init(scene);
          soundManager.playBackgroundMusic();

          // Set music speed based on level (Level 1 = chill, Level 3 = intense)
          const musicSpeedByLevel: Record<number, number> = { 1: 0.88, 2: 1.0, 3: 1.15 };
          soundManager.setMusicSpeed(musicSpeedByLevel[gameState.currentLevel] || 1.0);

          slashGraphics = scene.add.graphics();
          slashGraphics.setDepth(10);

          // ── Throw items ───────────────────────────────────────────

          const throwItems = () => {
            if (!gameActive) return;

            const count = levelConfig.itemsMin + Math.floor(Math.random() * (levelConfig.itemsMax - levelConfig.itemsMin + 1));

            for (let i = 0; i < count; i++) {
              const isEnemy = Math.random() < levelConfig.enemyChance;
              const isUltraRare = !isEnemy && RARE_PRODUCT_ASSETS.length > 0 && Math.random() < ULTRA_RARE_CHANCE;

              let asset: Asset | undefined;
              if (isEnemy) {
                asset = getRandomAsset(ENEMY_ASSETS);
              } else if (isUltraRare) {
                asset = getRandomAsset(RARE_PRODUCT_ASSETS) ?? getRandomAsset(PRODUCT_ASSETS);
              } else {
                asset = getRandomAsset(PRODUCT_ASSETS);
              }
              if (!asset) continue;

              if (!isEnemy) {
                statsRef.current.totalProductsThrown++;
              }

              // Spawn from bottom, spread horizontally
              const margin = w * 0.15;
              const spawnX = margin + Math.random() * (w - margin * 2);
              const spawnY = h + 40;

              // Horizontal velocity: aim towards center-ish (scaled)
              const centerBias = (w / 2 - spawnX) * 0.3;
              const velocityX = centerBias + (Math.random() - 0.5) * 200 * scale;
              const velocityY = scaledThrowSpeedY + (Math.random() - 0.5) * 80 * scale;

              const item: FlyingItem = {
                id: `item_${Date.now()}_${Math.random()}`,
                type: isEnemy ? 'enemy' : 'product',
                rarity: isUltraRare ? 'ultra' : 'normal',
                assetId: asset.id,
                x: spawnX,
                y: spawnY,
                velocityX,
                velocityY,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 6,
                sliced: false,
                missed: false,
                radius: ITEM_RADIUS,
              };

              const sprite = scene.add.image(spawnX, spawnY, asset.id);
              const spriteSize = isEnemy ? ENEMY_SIZE : PRODUCT_SIZE;
              sprite.setDisplaySize(spriteSize, spriteSize);
              sprite.setOrigin(0.5);
              sprite.setDepth(2);
              item.sprite = sprite;

              // Color glow to differentiate items
              if (isEnemy) {
                // Red glow for enemies (slice these for points!)
                const glowOuter = scene.add.circle(spawnX, spawnY, GLOW_OUTER_R, 0xff3333, 0.25);
                glowOuter.setDepth(1);
                const glowInner = scene.add.circle(spawnX, spawnY, GLOW_INNER_R, 0xff6666, 0.2);
                glowInner.setDepth(1);
                item.glowOuter = glowOuter;
                item.glowInner = glowInner;

                // Bold red border ring around enemies
                const borderRing = scene.add.circle(spawnX, spawnY, BORDER_RING_R);
                borderRing.setStrokeStyle(3 * scale, 0xff3333, 0.85);
                borderRing.setFillStyle(0x000000, 0); // transparent fill
                borderRing.setDepth(3);
                item.borderRing = borderRing;
              } else if (isUltraRare) {
                // Cyan/gold glow for ultra-rare products (don't slice!)
                const glowOuter = scene.add.circle(spawnX, spawnY, GLOW_OUTER_R, 0x7cf7ff, 0.2);
                glowOuter.setDepth(1);
                const glowInner = scene.add.circle(spawnX, spawnY, GLOW_INNER_R, 0xffd86a, 0.25);
                glowInner.setDepth(1);
                item.glowOuter = glowOuter;
                item.glowInner = glowInner;
              } else {
                // Green glow for products (don't slice — these are yours!)
                const glowOuter = scene.add.circle(spawnX, spawnY, GLOW_OUTER_R, 0x10b981, 0.2);
                glowOuter.setDepth(1);
                const glowInner = scene.add.circle(spawnX, spawnY, GLOW_INNER_R, 0x34d399, 0.15);
                glowInner.setDepth(1);
                item.glowOuter = glowOuter;
                item.glowInner = glowInner;
              }

              items.push(item);
            }
          };

          // ── Throw bonus item ──────────────────────────────────────

          const throwBonusItem = () => {
            if (!gameActive || bonusSpawned) return;
            bonusSpawned = true;

            // Use a random enemy asset for the bonus (it's a special enemy)
            const asset = getRandomAsset(ENEMY_ASSETS);
            if (!asset) return;

            const margin = w * 0.2;
            const spawnX = margin + Math.random() * (w - margin * 2);
            const spawnY = h + 40;

            const centerBias = (w / 2 - spawnX) * 0.3;
            const velocityX = centerBias + (Math.random() - 0.5) * 150 * scale;
            // Throw higher and slower so player has more time to slash it
            const velocityY = (scaledThrowSpeedY * 0.85) + (Math.random() - 0.5) * 40 * scale;

            const item: FlyingItem = {
              id: `bonus_${Date.now()}`,
              type: 'bonus',
              rarity: 'ultra',
              assetId: asset.id,
              x: spawnX,
              y: spawnY,
              velocityX,
              velocityY,
              rotation: 0,
              rotationSpeed: (Math.random() - 0.5) * 4,
              sliced: false,
              missed: false,
              radius: ITEM_RADIUS * 1.2, // Slightly larger hit area
            };

            const sprite = scene.add.image(spawnX, spawnY, asset.id);
            const spriteSize = ENEMY_SIZE * 1.15; // Slightly bigger
            sprite.setDisplaySize(spriteSize, spriteSize);
            sprite.setOrigin(0.5);
            sprite.setDepth(2);
            item.sprite = sprite;

            // Gold/yellow glow for bonus items
            const glowOuter = scene.add.circle(spawnX, spawnY, GLOW_OUTER_R * 1.3, 0xffd700, 0.35);
            glowOuter.setDepth(1);
            const glowInner = scene.add.circle(spawnX, spawnY, GLOW_INNER_R * 1.2, 0xffaa00, 0.3);
            glowInner.setDepth(1);
            item.glowOuter = glowOuter;
            item.glowInner = glowInner;

            // Gold border ring for bonus
            const borderRing = scene.add.circle(spawnX, spawnY, BORDER_RING_R * 1.15);
            borderRing.setStrokeStyle(4 * scale, 0xffd700, 0.9);
            borderRing.setFillStyle(0x000000, 0);
            borderRing.setDepth(3);
            item.borderRing = borderRing;

            items.push(item);
          };

          // ── Swipe / slice detection ───────────────────────────────

          const checkSlice = (x1: number, y1: number, x2: number, y2: number, speed: number) => {
            if (!gameActive || speed < MIN_SWIPE_SPEED) return;

            for (const item of items) {
              if (item.sliced || item.missed) continue;

              // Point-on-segment closest to item center
              const dx = x2 - x1;
              const dy = y2 - y1;
              const lenSq = dx * dx + dy * dy;
              if (lenSq === 0) continue;

              let t = ((item.x - x1) * dx + (item.y - y1) * dy) / lenSq;
              t = Math.max(0, Math.min(1, t));
              const closestX = x1 + t * dx;
              const closestY = y1 + t * dy;
              const dist = Math.hypot(item.x - closestX, item.y - closestY);

              if (dist < item.radius + 10) {
                sliceItem(item, scene);
              }
            }
          };

          const sliceItem = (item: FlyingItem, scene: Phaser.Scene) => {
            item.sliced = true;

            if (item.type === 'bonus') {
              // Bonus item sliced — big score!
              const bonusScore = Math.random() < 0.5 ? 500 : 1000;
              soundManager.playSound('shelfComplete');
              soundManager.playSound('enemyKill');

              applyScoreChange(bonusScore, item.x, item.y + HUD_HEIGHT);
              statsRef.current.enemiesSliced++;

              // Extra flashy gold/cyan particle burst for bonus
              spawnParticles(scene, item.x, item.y, 0xffd700, 14);
              spawnParticles(scene, item.x, item.y, 0x7cf7ff, 10);
              spawnParticles(scene, item.x, item.y, 0xff8c00, 8);
            } else if (item.type === 'enemy') {
              // Enemy sliced — score! (enemies are the bad guys)
              const baseScore = 100;
              soundManager.playSound('enemyKill');

              currentCombo++;
              let totalScore = baseScore;
              if (currentCombo >= 2) {
                totalScore += currentCombo * 50;
                showCombo(currentCombo);
                if (currentCombo >= 5) {
                  soundManager.playSound('shelfComplete');
                }
              }

              applyScoreChange(totalScore, item.x, item.y + HUD_HEIGHT);
              statsRef.current.enemiesSliced++;

              // Green/gold particle burst for satisfying enemy kill
              spawnParticles(scene, item.x, item.y, 0x10b981, 10);
              spawnParticles(scene, item.x, item.y, 0xffd700, 6);
            } else {
              // Product sliced — lose a life! (these are Grovara's goods!)
              soundManager.playSound('enemyHit');
              soundManager.playSound('ouch');
              loseLife();
              flashLifeLost();
              currentCombo = 0;

              // Red particle burst (warning — you hit a product!)
              spawnParticles(scene, item.x, item.y, 0xff3333, 8);
            }

            // Create split halves
            if (item.sprite) {
              const halfLeft = scene.add.image(item.x, item.y, item.assetId);
              halfLeft.setDisplaySize(item.sprite.displayWidth * 0.55, item.sprite.displayHeight);
              halfLeft.setCrop(0, 0, halfLeft.texture.getSourceImage().width / 2, halfLeft.texture.getSourceImage().height);
              halfLeft.setDepth(3);

              const halfRight = scene.add.image(item.x, item.y, item.assetId);
              halfRight.setDisplaySize(item.sprite.displayWidth * 0.55, item.sprite.displayHeight);
              const srcW = halfRight.texture.getSourceImage().width;
              const srcH = halfRight.texture.getSourceImage().height;
              halfRight.setCrop(srcW / 2, 0, srcW / 2, srcH);
              halfRight.setDepth(3);

              slicedHalves.push({
                sprite: halfLeft,
                x: item.x,
                y: item.y,
                velocityX: (-80 - Math.random() * 60) * scale,
                velocityY: (-100 - Math.random() * 50) * scale,
                rotation: 0,
                rotationSpeed: -3 - Math.random() * 2,
                alpha: 1,
                life: 1.0,
              });
              slicedHalves.push({
                sprite: halfRight,
                x: item.x,
                y: item.y,
                velocityX: (80 + Math.random() * 60) * scale,
                velocityY: (-100 - Math.random() * 50) * scale,
                rotation: 0,
                rotationSpeed: 3 + Math.random() * 2,
                alpha: 1,
                life: 1.0,
              });

              // Destroy original sprite
              item.sprite.destroy();
              item.sprite = undefined;
              if (item.glowOuter) { item.glowOuter.destroy(); item.glowOuter = undefined; }
              if (item.glowInner) { item.glowInner.destroy(); item.glowInner = undefined; }
              if (item.borderRing) { item.borderRing.destroy(); item.borderRing = undefined; }
            }
          };

          const spawnParticles = (scene: Phaser.Scene, x: number, y: number, color: number, count: number) => {
            for (let i = 0; i < count; i++) {
              const circle = scene.add.circle(x, y, (3 + Math.random() * 3) * scale, color);
              circle.setDepth(5);
              const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
              const speed = (120 + Math.random() * 100) * scale;
              particles.push({
                circle,
                x,
                y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                alpha: 1,
                life: 0.6,
              });
            }
          };

          // ── Input handlers ────────────────────────────────────────

          scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            isPointerDown = true;
            currentCombo = 0;
            lastPointerX = pointer.x;
            lastPointerY = pointer.y;
            lastPointerTime = Date.now();
            slashPoints.length = 0;
            slashPoints.push({ x: pointer.x, y: pointer.y, time: Date.now() });
          });

          scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!isPointerDown) return;

            const now = Date.now();
            const dt = now - lastPointerTime;
            if (dt <= 0) return;

            const speed = Math.hypot(pointer.x - lastPointerX, pointer.y - lastPointerY) / dt;

            checkSlice(lastPointerX, lastPointerY, pointer.x, pointer.y, speed);

            slashPoints.push({ x: pointer.x, y: pointer.y, time: now });

            lastPointerX = pointer.x;
            lastPointerY = pointer.y;
            lastPointerTime = now;
          });

          scene.input.on('pointerup', () => {
            isPointerDown = false;
          });

          // ── Timer ─────────────────────────────────────────────────

          timerEvent = scene.time.addEvent({
            delay: 1000,
            repeat: remainingTime - 1,
            callback: () => {
              remainingTime--;
              if (isMountedRef.current) {
                setTimeLeft(remainingTime);
              }

              if (remainingTime <= 0 && gameActive) {
                gameActive = false;
                // Level complete
                soundManager.playSound('levelComplete');
                const stats = statsRef.current;

                completeLevel({
                  level: gameState.currentLevel,
                  score: levelScoreRef.current,
                  accuracy: 0,
                  completed: true,
                  enemiesHit: stats.enemiesSliced,
                  friendliesHit: stats.productsSliced,
                  productsOnShelf: stats.enemiesSliced,
                });
              }
            },
          });

          // ── Main update loop ──────────────────────────────────────

          scene.events.on('update', (_time: number, deltaMs: number) => {
            if (!gameActive) return;
            const dt = deltaMs / 1000;
            const now = Date.now();

            // Track elapsed time for bonus spawning
            elapsedTime += deltaMs;

            // Spawn bonus item once per level at the designated time
            if (!bonusSpawned && elapsedTime >= bonusSpawnTime) {
              throwBonusItem();
            }

            // Throw items on schedule
            if (now - lastThrowTime > levelConfig.throwRate) {
              throwItems();
              lastThrowTime = now;
            }

            // Update flying items
            for (let i = items.length - 1; i >= 0; i--) {
              const item = items[i];
              if (item.sliced) {
                items.splice(i, 1);
                continue;
              }

              item.velocityY += scaledGravity * dt;
              item.x += item.velocityX * dt;
              item.y += item.velocityY * dt;
              item.rotation += item.rotationSpeed * dt;

              if (item.sprite) {
                item.sprite.setPosition(item.x, item.y);
                item.sprite.setRotation(item.rotation);
              }
              if (item.glowOuter) {
                item.glowOuter.setPosition(item.x, item.y);
                const glowSpeed = item.type === 'bonus' ? 0.012 : 0.005;
                const glowBase = item.type === 'bonus' ? 0.25 : 0.15;
                const glowRange = item.type === 'bonus' ? 0.2 : 0.1;
                const glowAlpha = glowBase + Math.sin(now * glowSpeed) * glowRange;
                item.glowOuter.setAlpha(glowAlpha);
              }
              if (item.glowInner) {
                item.glowInner.setPosition(item.x, item.y);
                const glowSpeed = item.type === 'bonus' ? 0.015 : 0.005;
                const glowBase = item.type === 'bonus' ? 0.3 : 0.2;
                const glowRange = item.type === 'bonus' ? 0.2 : 0.1;
                const glowAlpha = glowBase + Math.sin(now * glowSpeed + 1) * glowRange;
                item.glowInner.setAlpha(glowAlpha);
              }
              if (item.borderRing) {
                item.borderRing.setPosition(item.x, item.y);
                const ringSpeed = item.type === 'bonus' ? 0.015 : 0.008;
                const ringBase = item.type === 'bonus' ? 0.7 : 0.6;
                const ringRange = item.type === 'bonus' ? 0.3 : 0.25;
                const ringAlpha = ringBase + Math.sin(now * ringSpeed) * ringRange;
                item.borderRing.setAlpha(ringAlpha);
              }

              // Check if item fell off screen
              if (item.y > h + 60 && !item.missed) {
                item.missed = true;
                // Lose a life if an enemy escapes unsliced (bonus items don't penalize)
                if (item.type === 'enemy') {
                  soundManager.playSound('ouch');
                  loseLife();
                  flashLifeLost();
                  currentCombo = 0;
                }
                if (item.sprite) { item.sprite.destroy(); item.sprite = undefined; }
                if (item.glowOuter) { item.glowOuter.destroy(); item.glowOuter = undefined; }
                if (item.glowInner) { item.glowInner.destroy(); item.glowInner = undefined; }
                if (item.borderRing) { item.borderRing.destroy(); item.borderRing = undefined; }
                items.splice(i, 1);
              }
            }

            // Update sliced halves
            for (let i = slicedHalves.length - 1; i >= 0; i--) {
              const half = slicedHalves[i];
              half.life -= dt;
              if (half.life <= 0) {
                half.sprite.destroy();
                slicedHalves.splice(i, 1);
                continue;
              }
              half.velocityY += scaledGravity * dt;
              half.x += half.velocityX * dt;
              half.y += half.velocityY * dt;
              half.rotation += half.rotationSpeed * dt;
              half.alpha = Math.max(0, half.life);
              half.sprite.setPosition(half.x, half.y);
              half.sprite.setRotation(half.rotation);
              half.sprite.setAlpha(half.alpha);
            }

            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
              const p = particles[i];
              p.life -= dt;
              if (p.life <= 0) {
                p.circle.destroy();
                particles.splice(i, 1);
                continue;
              }
              p.x += p.velocityX * dt;
              p.y += p.velocityY * dt;
              p.alpha = Math.max(0, p.life / 0.6);
              p.circle.setPosition(p.x, p.y);
              p.circle.setAlpha(p.alpha);
            }

            // Draw slash trail
            if (slashGraphics) {
              slashGraphics.clear();
              // Remove old points
              while (slashPoints.length > 0 && now - slashPoints[0].time > SLASH_TRAIL_LIFETIME) {
                slashPoints.shift();
              }
              if (isPointerDown && slashPoints.length >= 2) {
                for (let i = 1; i < slashPoints.length; i++) {
                  const age = now - slashPoints[i].time;
                  const alpha = Math.max(0, 1 - age / SLASH_TRAIL_LIFETIME);
                  const thickness = 4 * alpha + 1;
                  slashGraphics.lineStyle(thickness, 0xffffff, alpha * 0.8);
                  slashGraphics.beginPath();
                  slashGraphics.moveTo(slashPoints[i - 1].x, slashPoints[i - 1].y);
                  slashGraphics.lineTo(slashPoints[i].x, slashPoints[i].y);
                  slashGraphics.strokePath();
                }
              }
            }
          });
        },
      },
      input: {
        activePointers: 2,
        touch: { capture: true },
      },
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
      gameActive = false;
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [gameStarted, gameState.currentLevel, gameState.currentScreen, levelConfig, addScore, loseLife, completeLevel, applyScoreChange, showCombo, flashLifeLost]);

  // ── Don't render if not on game screen ──────────────────────────────────
  if (gameState.currentScreen !== 'game') return null;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      />

      {/* Phaser canvas */}
      <div ref={gameContainerRef} className="absolute inset-0" style={{ top: `${HUD_HEIGHT}px` }} />

      {/* Life lost red flash — intense screen flash + red vignette + shake */}
      <AnimatePresence>
        {lifeLostFlash && (
          <>
            {/* Quick white flash then red overlay */}
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: [0.9, 0.6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, times: [0, 0.15, 1] }}
              className="absolute inset-0 pointer-events-none z-50"
              style={{ backgroundColor: 'rgba(255, 30, 30, 0.55)' }}
            />
            {/* Red vignette pulse */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0.7, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 pointer-events-none z-50"
              style={{
                background: 'radial-gradient(circle at center, transparent 30%, rgba(255, 0, 0, 0.6) 100%)',
              }}
            />
            {/* White flash burst */}
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 pointer-events-none z-50"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Level */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">LVL</span>
            <span className="text-white text-lg font-bold ml-1.5">{gameState.currentLevel}</span>
          </div>

          {/* Lives */}
          <motion.div
            className="flex gap-1"
            animate={lifeLostFlash ? { x: [0, -8, 8, -6, 6, -3, 3, 0], scale: [1, 1.15, 1, 1.1, 1] } : { x: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                animate={
                  lifeLostFlash && i === gameState.lives
                    ? { scale: [1, 2, 0.5, 1.5, 0], opacity: [1, 1, 0.8, 0.5, 0] }
                    : lifeLostFlash && i < gameState.lives
                    ? { scale: [1, 1.3, 0.9, 1.2, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)', 'brightness(1.5)', 'brightness(1)'] }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-200 ${
                    i < gameState.lives
                      ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                      : 'text-gray-600/40'
                  }`}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Timer */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className={`text-lg font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center px-4 py-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-lg font-bold tabular-nums">
              {displayScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Score popup */}
      <AnimatePresence>
        {scorePopup.active && (
          <motion.div
            key="score-popup"
            initial={{ opacity: 1, y: scorePopup.y, scale: 0.8 }}
            animate={{ opacity: 0, y: scorePopup.y - 80, scale: scorePopup.value >= 500 ? 1.5 : 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute z-40 pointer-events-none flex flex-col items-center"
            style={{ left: scorePopup.x, transform: 'translateX(-50%)' }}
          >
            {scorePopup.value >= 500 && (
              <span className="text-orange-400 font-bold text-xs tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" style={{ fontFamily: 'var(--font-pixel)' }}>
                BONUS!
              </span>
            )}
            <span className={`font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] ${
              scorePopup.value >= 500 ? 'text-3xl text-orange-300' : 'text-2xl text-yellow-300'
            }`}>
              +{scorePopup.value}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo popup */}
      <AnimatePresence>
        {comboPopup.active && (
          <motion.div
            key="combo-popup"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'backOut' }}
            className="absolute z-40 pointer-events-none"
            style={{
              left: '50%',
              top: '55%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              className="text-4xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
              }}
            >
              COMBO x{comboPopup.count}!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions modal */}
      <InstructionsModal isOpen={showInstructions} onStart={handleStartGame} />
    </div>
  );
};
