import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Star, ArrowRight, Sparkles, Medal } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser } from '@/lib/leaderboardManager';

export const LevelCompleteScreen = () => {
  const { gameState, goToSwipe, nextLevel } = useGame();
  const currentLevelData = gameState.levels[gameState.levels.length - 1];
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const playerRowRef = useRef<HTMLDivElement>(null);

  // Update score if user is logged in, then load leaderboard
  useEffect(() => {
    const loadAndUpdateLeaderboard = async () => {
      const currentUser = getCurrentUser();
      
      const entries = await getLeaderboard(50);
      // Map to simple format
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score
      }));
      
      // Only add temporary player if not logged in (logged-in user should already be in leaderboard)
      const displayUsername = currentUser?.username || username;
      const withPlayer = currentUser 
        ? mapped
        : [
            ...mapped,
            { username: displayUsername, score: gameState.totalScore }
          ];
      setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
    };
    loadAndUpdateLeaderboard();
  }, [username, gameState.totalScore]);

  // Get the correct username to display (logged in user or temporary)
  const displayUsername = getCurrentUser()?.username || username;
  const playerRank = leaderboard.findIndex(entry => entry.username === displayUsername) + 1;

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
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full max-h-[calc(100vh-40px)] overflow-y-auto flex flex-col"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-2"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full neon-border">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text text-2xl font-bold text-foreground neon-glow mb-4"
        >
          LEVEL {gameState.currentLevel} COMPLETE!
        </motion.h2>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-4 neon-border text-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="arcade-text text-xs text-muted-foreground">Level Stats</span>
            <Star className="w-4 h-4 text-warning fill-warning" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Score</span>
              <span className="arcade-text text-lg text-warning score-glow">
                {currentLevelData?.score?.toLocaleString() || 0}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Total</span>
              <span className="arcade-text text-base text-foreground">
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
          className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-4 neon-border w-full flex-1 min-h-0 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Medal className="w-4 h-4 text-warning" />
            <h2 className="font-semibold text-foreground text-sm">Leaderboard</h2>
            <span className="text-xs text-muted-foreground">
              #{playerRank}
            </span>
          </div>

          <div 
            ref={leaderboardRef}
            className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-2 custom-scrollbar"
          >
            {leaderboard.map((entry, idx) => {
              const isPlayer = entry.username === displayUsername;
              const rank = idx + 1;
              
              return (
                <div
                  key={entry.username}
                  ref={isPlayer ? playerRowRef : null}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all text-xs ${
                    isPlayer 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-background/50 hover:bg-background/70'
                  }`}
                >
                  <span className={`arcade-text text-xs w-6 text-center ${
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
          className="mb-3"
        >
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <p className="text-sm font-medium">Discover amazing brands!</p>
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Swipe right on brands you're interested in
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
            className="btn-arcade text-base px-6 py-2 flex items-center justify-center gap-2"
          >
            DISCOVER BRANDS
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
