import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Star, ArrowRight, Sparkles } from 'lucide-react';

export const LevelCompleteScreen = () => {
  const { gameState, goToSwipe } = useGame();
  const currentLevelData = gameState.levels[gameState.levels.length - 1];

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full neon-border">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text text-3xl font-bold text-foreground neon-glow mb-2"
        >
          LEVEL {gameState.currentLevel}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-primary text-xl font-display mb-8"
        >
          COMPLETE!
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-8 neon-border"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-5 h-5 text-warning fill-warning" />
            <span className="arcade-text text-sm text-muted-foreground">Level Stats</span>
            <Star className="w-5 h-5 text-warning fill-warning" />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Score</span>
              <span className="arcade-text text-2xl text-warning score-glow">
                {currentLevelData?.score?.toLocaleString() || gameState.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Score</span>
              <span className="arcade-text text-lg text-foreground">
                {gameState.totalScore.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Discover brands message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <p className="text-lg font-medium">Discover amazing brands!</p>
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            Swipe right on brands you'd like to learn more about
          </p>
        </motion.div>

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToSwipe}
          className="btn-arcade text-lg w-full max-w-xs flex items-center justify-center gap-3"
        >
          DISCOVER BRANDS
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
};
