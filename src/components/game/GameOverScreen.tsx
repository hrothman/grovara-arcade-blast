import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Frown, RefreshCw, Heart } from 'lucide-react';

export const GameOverScreen = () => {
  const { gameState, resetGame, goToResults } = useGame();

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-md mx-auto"
      >
        {/* Game over icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/20 rounded-full">
            <Frown className="w-10 h-10 text-destructive" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text text-3xl font-bold text-foreground mb-2"
        >
          GAME OVER
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          Too many friendly hits! Remember: protect the good brands.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-8 neon-border"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Final Score</span>
              <span className="arcade-text text-2xl text-warning score-glow">
                {gameState.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Levels Completed</span>
              <span className="arcade-text text-lg text-foreground">
                {gameState.levels.length} / 3
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="btn-arcade text-lg w-full max-w-xs flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-5 h-5" />
            TRY AGAIN
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={goToResults}
            className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 w-full"
          >
            <Heart className="w-4 h-4" />
            <span className="text-sm">View matched brands anyway</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
