import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Star, ArrowRight, Sparkles, Medal } from 'lucide-react';
import leaderboardData from '@/data/leaderboard.json';

export const LevelCompleteScreen = () => {
  const { gameState, goToSwipe, nextLevel } = useGame();
  const currentLevelData = gameState.levels[gameState.levels.length - 1];
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const playerRowRef = useRef<HTMLDivElement>(null);

  // Merge player score into leaderboard and sort
  const fullLeaderboard = [
    ...leaderboardData,
    { username, score: gameState.totalScore }
  ].sort((a, b) => b.score - a.score);

  const playerRank = fullLeaderboard.findIndex(entry => entry.username === username) + 1;

  // Auto-scroll to player position with acceleration
  useEffect(() => {
    if (leaderboardRef.current && playerRowRef.current) {
      const container = leaderboardRef.current;
      const playerRow = playerRowRef.current;
      const targetScroll = playerRow.offsetTop - container.offsetTop - 100;

      if (targetScroll > 0) {
        let currentScroll = 0;
        let velocity = 0;
        const acceleration = 0.5;
        const maxVelocity = 30;

        const animate = () => {
          if (currentScroll < targetScroll) {
            velocity = Math.min(velocity + acceleration, maxVelocity);
            currentScroll += velocity;
            container.scrollTop = Math.min(currentScroll, targetScroll);
            requestAnimationFrame(animate);
          }
        };

        setTimeout(() => animate(), 1000);
      }
    }
  }, []);

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full neon-border">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text text-3xl font-bold text-foreground neon-glow mb-8"
        >
          LEVEL {gameState.currentLevel} COMPLETE!
        </motion.h2>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border"
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
                {currentLevelData?.score?.toLocaleString() || 0}
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

        {/* Leaderboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-8 neon-border w-full"
        >
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Medal className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Leaderboard</h2>
            <span className="text-sm text-muted-foreground">
              Rank #{playerRank}
            </span>
          </div>

          <div 
            ref={leaderboardRef}
            className="max-h-64 overflow-y-auto space-y-1 pr-2 custom-scrollbar"
          >
            {fullLeaderboard.map((entry, idx) => {
              const isPlayer = entry.username === username;
              const rank = idx + 1;
              
              return (
                <div
                  key={entry.username}
                  ref={isPlayer ? playerRowRef : null}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isPlayer 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-background/50 hover:bg-background/70'
                  }`}
                >
                  <span className={`arcade-text text-sm w-8 text-center ${
                    rank === 1 ? 'text-warning' :
                    rank === 2 ? 'text-muted-foreground' :
                    rank === 3 ? 'text-orange-400' :
                    'text-muted-foreground'
                  }`}>
                    {rank <= 3 ? '🏆' : rank}
                  </span>
                  <span className={`flex-1 font-medium ${
                    isPlayer ? 'text-primary' : 'text-foreground'
                  }`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  <span className={`arcade-text text-sm ${
                    isPlayer ? 'text-primary' : 'text-warning'
                  }`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-6"
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
        <div className="flex justify-center w-full">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToSwipe}
            className="btn-arcade text-lg px-8 flex items-center justify-center gap-3"
          >
            DISCOVER BRANDS
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
