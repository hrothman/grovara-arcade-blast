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
}

const LEVEL_CONFIG = {
  1: { enemies: 8, friendlies: 3, speed: 1, duration: 30000 },
  2: { enemies: 12, friendlies: 5, speed: 1.3, duration: 35000 },
  3: { enemies: 16, friendlies: 7, speed: 1.6, duration: 40000 },
};

export const GameCanvas = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const { gameState, addScore, loseLife, completeLevel } = useGame();
  const [displayScore, setDisplayScore] = useState(0);
  const [hitFeedback, setHitFeedback] = useState<{ type: 'enemy' | 'friendly' | null; points: number }>({ type: null, points: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetsHit, setTargetsHit] = useState({ enemies: 0, friendlies: 0 });
  
  const levelConfig = LEVEL_CONFIG[gameState.currentLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];

  const showHitFeedback = useCallback((type: 'enemy' | 'friendly', points: number) => {
    setHitFeedback({ type, points });
    setTimeout(() => setHitFeedback({ type: null, points: 0 }), 500);
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
            const side = Math.floor(Math.random() * 4);
            let x = 0, y = 0;

            switch (side) {
              case 0: x = Math.random() * width; y = -60; break;
              case 1: x = width + 60; y = Math.random() * height; break;
              case 2: x = Math.random() * width; y = height + 60; break;
              case 3: x = -60; y = Math.random() * height; break;
            }

            const targetX = width / 2 + (Math.random() - 0.5) * 200;
            const targetY = height / 2 + (Math.random() - 0.5) * 200;

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

            const speed = (0.5 + Math.random() * 0.5) * levelConfig.speed;
            const angle = Math.atan2(targetY - y, targetX - x);
            
            const target: GameTarget = {
              id: `target_${Date.now()}_${Math.random()}`,
              type: isEnemy ? 'enemy' : 'friendly',
              label: labelData.label,
              emoji: labelData.emoji,
              x, y, speed,
              points: isEnemy ? 100 : -150,
              container,
            };

            targets.push(target);

            // Movement tween
            scene.tweens.add({
              targets: container,
              x: targetX,
              y: targetY,
              duration: 3000 / speed,
              ease: 'Linear',
              onComplete: () => {
                if (!gameActive) return;
                // Target escaped
                const idx = targets.findIndex(t => t.id === target.id);
                if (idx !== -1) {
                  targets.splice(idx, 1);
                  container.destroy();
                }
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

              // Hit effect
              scene.tweens.killTweensOf(container);
              scene.tweens.add({
                targets: container,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => container.destroy(),
              });

              if (isEnemy) {
                addScore(100);
                setDisplayScore(prev => prev + 100);
                setTargetsHit(prev => ({ ...prev, enemies: prev.enemies + 1 }));
                showHitFeedback('enemy', 100);
              } else {
                loseLife();
                setTargetsHit(prev => ({ ...prev, friendlies: prev.friendlies + 1 }));
                showHitFeedback('friendly', -150);
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
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Hit Feedback */}
      <AnimatePresence>
        {hitFeedback.type && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
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
