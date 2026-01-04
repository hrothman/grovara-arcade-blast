import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useGame } from '@/context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Target } from 'lucide-react';
import { ENEMY_LABELS, FRIENDLY_LABELS } from '@/data/brands';

interface GameTarget {
  id: string;
  type: 'enemy' | 'friendly';
  label: string;
  emoji: string;
  x: number;
  y: number;
  speed: number;
  points: number;
  container?: Phaser.GameObjects.Container;
  disappearTime?: number;
}

const LEVEL_CONFIG = {
  1: { enemies: 15, friendlies: 7, speed: 1, duration: 30000, targetLifeMin: 3000, targetLifeMax: 5000 },
  2: { enemies: 25, friendlies: 12, speed: 1.3, duration: 35000, targetLifeMin: 2500, targetLifeMax: 4000 },
  3: { enemies: 35, friendlies: 17, speed: 1.6, duration: 40000, targetLifeMin: 2000, targetLifeMax: 3500 },
};

export const GameCanvas = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const { gameState, addScore, loseLife, completeLevel } = useGame();
  const [displayScore, setDisplayScore] = useState(0);
  const [hitFeedback, setHitFeedback] = useState<{ type: 'enemy' | 'friendly' | null; points: number; x: number; y: number }>({ type: null, points: 0, x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetsHit, setTargetsHit] = useState({ enemies: 0, friendlies: 0 });
  
  const levelConfig = LEVEL_CONFIG[gameState.currentLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];

  const showHitFeedback = useCallback((type: 'enemy' | 'friendly', points: number, x: number, y: number) => {
    setHitFeedback({ type, points, x, y });
    setTimeout(() => setHitFeedback({ type: null, points: 0, x: 0, y: 0 }), 800);
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: window.innerWidth,
      height: window.innerHeight - 120,
      transparent: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: {
        create: function(this: Phaser.Scene) {
          const scene = this;
          const targets: GameTarget[] = [];
          let gameActive = true;

          const createTarget = (isEnemy: boolean) => {
            if (!gameActive) return;
            
            const labelData = isEnemy 
              ? ENEMY_LABELS[Math.floor(Math.random() * ENEMY_LABELS.length)]
              : FRIENDLY_LABELS[Math.floor(Math.random() * FRIENDLY_LABELS.length)];

            const width = scene.scale.width;
            const height = scene.scale.height;
            
            // Spawn at random location within the screen (with margin from edges)
            const margin = 80; // Keep targets away from edges
            const x = margin + Math.random() * (width - 2 * margin);
            const y = margin + Math.random() * (height - 2 * margin);

            const container = scene.add.container(x, y);
            
            // Background circle
            const bgColor = isEnemy ? 0xff4444 : 0x44ff88;
            const bg = scene.add.circle(0, 0, 45, bgColor, 0.9);
            bg.setStrokeStyle(3, isEnemy ? 0xff0000 : 0x00ff66);
            
            // Emoji text
            const emoji = scene.add.text(0, -5, labelData.emoji, {
              fontSize: '28px',
            }).setOrigin(0.5);

            // Label
            const label = scene.add.text(0, 25, labelData.label, {
              fontSize: '10px',
              color: '#ffffff',
              fontFamily: 'Inter',
              fontStyle: 'bold',
            }).setOrigin(0.5);

            container.add([bg, emoji, label]);
            container.setSize(90, 90);
            container.setInteractive();

            // Randomize target lifetime based on level
            const disappearTime = levelConfig.targetLifeMin + 
              Math.random() * (levelConfig.targetLifeMax - levelConfig.targetLifeMin);
            
            const target: GameTarget = {
              id: `target_${Date.now()}_${Math.random()}`,
              type: isEnemy ? 'enemy' : 'friendly',
              label: labelData.label,
              emoji: labelData.emoji,
              x, y, 
              speed: levelConfig.speed,
              points: isEnemy ? 100 : -150,
              container,
              disappearTime,
            };

            targets.push(target);

            // Fade in animation
            container.setAlpha(0);
            scene.tweens.add({
              targets: container,
              alpha: 1,
              duration: 300,
              ease: 'Power2',
            });

            // Auto-disappear after timeout
            const disappearTimeout = scene.time.delayedCall(disappearTime, () => {
              if (!gameActive) return;
              const idx = targets.findIndex(t => t.id === target.id);
              if (idx !== -1) {
                targets.splice(idx, 1);
                // Fade out animation
                scene.tweens.add({
                  targets: container,
                  alpha: 0,
                  duration: 300,
                  ease: 'Power2',
                  onComplete: () => container.destroy(),
                });
              }
            });

            // Floating animation
            scene.tweens.add({
              targets: container,
              scaleX: 1.1,
              scaleY: 1.1,
              yoyo: true,
              repeat: -1,
              duration: 500 + Math.random() * 500,
              ease: 'Sine.easeInOut',
            });

            container.on('pointerdown', () => {
              if (!gameActive) return;
              
              const idx = targets.findIndex(t => t.id === target.id);
              if (idx !== -1) {
                targets.splice(idx, 1);
              }

              const clickX = container.x;
              const clickY = container.y;

              if (isEnemy) {
                // Explosion effect for enemy
                scene.tweens.killTweensOf(container);
                
                // Create explosion particles
                for (let i = 0; i < 12; i++) {
                  const particle = scene.add.circle(clickX, clickY, 8, 0xff4444);
                  const angle = (Math.PI * 2 * i) / 12;
                  const distance = 50 + Math.random() * 30;
                  
                  scene.tweens.add({
                    targets: particle,
                    x: clickX + Math.cos(angle) * distance,
                    y: clickY + Math.sin(angle) * distance,
                    alpha: 0,
                    scale: 0,
                    duration: 400 + Math.random() * 200,
                    ease: 'Power2',
                    onComplete: () => particle.destroy(),
                  });
                }
                
                // Flash effect
                const flash = scene.add.circle(clickX, clickY, 60, 0xffff00, 0.8);
                scene.tweens.add({
                  targets: flash,
                  scale: 2,
                  alpha: 0,
                  duration: 300,
                  ease: 'Power2',
                  onComplete: () => flash.destroy(),
                });
                
                container.destroy();
                
                addScore(100);
                setDisplayScore(prev => prev + 100);
                setTargetsHit(prev => ({ ...prev, enemies: prev.enemies + 1 }));
                showHitFeedback('enemy', 100, clickX, clickY);
              } else {
                // Big red X effect for friendly
                scene.tweens.killTweensOf(container);
                
                const lineThickness = 8;
                const size = 60;
                
                // Create X lines at the click position
                const xGraphics = scene.add.graphics();
                xGraphics.lineStyle(lineThickness, 0xff0000);
                
                // Draw first diagonal
                xGraphics.beginPath();
                xGraphics.moveTo(clickX - size/2, clickY - size/2);
                xGraphics.lineTo(clickX + size/2, clickY + size/2);
                xGraphics.strokePath();
                
                // Draw second diagonal
                xGraphics.beginPath();
                xGraphics.moveTo(clickX + size/2, clickY - size/2);
                xGraphics.lineTo(clickX - size/2, clickY + size/2);
                xGraphics.strokePath();
                
                xGraphics.setAlpha(0);
                
                // Animate X appearing and disappearing
                scene.tweens.add({
                  targets: xGraphics,
                  alpha: 1,
                  duration: 150,
                  ease: 'Power2',
                  onComplete: () => {
                    scene.tweens.add({
                      targets: xGraphics,
                      alpha: 0,
                      duration: 400,
                      delay: 200,
                      ease: 'Power2',
                      onComplete: () => xGraphics.destroy(),
                    });
                  },
                });
                
                container.destroy();
                
                loseLife();
                setTargetsHit(prev => ({ ...prev, friendlies: prev.friendlies + 1 }));
                showHitFeedback('friendly', -150, clickX, clickY);
              }
            });
          };

          // Spawn targets
          const spawnInterval = setInterval(() => {
            if (!gameActive) return;
            const isEnemy = Math.random() > 0.25;
            createTarget(isEnemy);
          }, 1500 / levelConfig.speed);

          // Timer
          let timeRemaining = levelConfig.duration / 1000;
          const timerInterval = setInterval(() => {
            timeRemaining--;
            setTimeLeft(timeRemaining);
            
            if (timeRemaining <= 0) {
              gameActive = false;
              clearInterval(spawnInterval);
              clearInterval(timerInterval);
              
              // Complete level
              setTimeout(() => {
                completeLevel({
                  level: gameState.currentLevel,
                  score: displayScore,
                  accuracy: 0,
                  completed: true,
                  enemiesHit: 0,
                  friendliesHit: 0,
                });
              }, 500);
            }
          }, 1000);

          // Cleanup
          scene.events.on('shutdown', () => {
            gameActive = false;
            clearInterval(spawnInterval);
            clearInterval(timerInterval);
          });
        },
      },
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      phaserGameRef.current?.destroy(true);
    };
  }, [gameState.currentLevel, levelConfig, addScore, loseLife, completeLevel, showHitFeedback]);

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
      <div className="absolute top-16 left-0 right-0 z-20 px-4 flex items-center justify-between">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2 neon-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="arcade-text text-xl text-warning score-glow">
              {gameState.totalScore.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <span className={`arcade-text text-xl ${timeLeft <= 10 ? 'text-destructive' : 'text-foreground'}`}>
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
            <span className={`arcade-text text-4xl font-bold ${
              hitFeedback.type === 'enemy' ? 'text-success score-glow' : 'text-destructive enemy-glow'
            }`}>
              {hitFeedback.type === 'enemy' ? '+100' : '-150'}
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
