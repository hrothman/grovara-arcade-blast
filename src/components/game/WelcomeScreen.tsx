import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Zap, Target, Crosshair } from 'lucide-react';

export const WelcomeScreen = () => {
  const { startGame } = useGame();

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 gradient-radial-glow" />
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto"
      >
        {/* Logo area */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Crosshair className="w-10 h-10 text-primary animate-pulse-neon" />
            <h1 className="arcade-text text-4xl font-bold text-foreground neon-glow">
              GROVARA
            </h1>
          </div>
          <p className="text-primary font-display text-lg tracking-wider">
            B2B BLASTER
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10 space-y-3"
        >
          <p className="text-muted-foreground text-lg">
            Old B2B is <span className="text-destructive font-semibold">broken</span>.
          </p>
          <p className="text-foreground text-xl font-medium">
            Grovara is built for <span className="text-primary neon-glow">what's next</span>.
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-8 neon-border"
        >
          <h3 className="arcade-text text-sm text-primary mb-4 flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            How to Play
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="text-destructive text-xl">💥</span>
              <p className="text-foreground text-sm">
                <strong className="text-destructive">Tap to shoot</strong> outdated B2B processes
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-success text-xl">🛡️</span>
              <p className="text-foreground text-sm">
                <strong className="text-success">Avoid</strong> Grovara-approved brands
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-warning text-xl">⭐</span>
              <p className="text-foreground text-sm">
                <strong className="text-warning">Discover</strong> new brands after each level
              </p>
            </div>
          </div>
        </motion.div>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="btn-arcade text-xl w-full max-w-xs flex items-center justify-center gap-3 animate-pulse-glow"
        >
          <Zap className="w-6 h-6" />
          START MISSION
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-muted-foreground text-xs"
        >
          Expo West 2024 • Powered by Grovara
        </motion.p>
      </motion.div>
    </div>
  );
};
