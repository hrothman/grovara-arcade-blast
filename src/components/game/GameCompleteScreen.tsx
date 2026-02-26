import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Star, ArrowRight, Sparkles, Medal, Crown } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser } from '@/lib/leaderboardManager';

export const GameCompleteScreen = () => {
  const { gameState, goToSwipe, goToResults } = useGame();
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const playerRowRef = useRef<HTMLDivElement>(null);

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      const currentUser = getCurrentUser();
      
      const entries = await getLeaderboard(50);
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score
      }));
      
      const displayUsername = currentUser?.username || username;
      const withPlayer = currentUser 
        ? mapped
        : [
            ...mapped,
            { username: displayUsername, score: gameState.totalScore }
          ];
      setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
    };
    loadLeaderboard();
  }, [username, gameState.totalScore]);

  const displayUsername = getCurrentUser()?.username || username;
  const playerRank = leaderboard.findIndex(entry => entry.username === displayUsername) + 1;

  // Auto-scroll to player position
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
    <div className="h-screen max-h-screen gradient-arcade flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-x-hidden overflow-y-auto" style={{ maxHeight: '100vh', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="absolute inset-0 gradient-radial-glow" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100,
              scale: 0,
            }}
            animate={{ 
              y: -100,
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <Star className="w-4 h-4 text-warning fill-warning" />
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full flex flex-col my-auto"
      >
        {/* Success icon with crown */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-2 sm:mb-3"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-warning/20 rounded-full neon-border relative">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-warning" />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -top-2 -right-2"
            >
              <Crown className="w-8 h-8 text-warning fill-warning" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text text-2xl sm:text-3xl font-bold text-warning neon-glow mb-1 sm:mb-2"
          style={{ fontSize: 'clamp(1.25rem, 5vw, 1.875rem)' }}
        >
          GAME COMPLETE!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-sm mb-3 sm:mb-4"
        >
          You've conquered all {gameState.levels.length} levels! 🎉
        </motion.p>

        {/* Final Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-3 sm:mb-4 neon-border"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-warning" />
            <span className="arcade-text text-xs text-muted-foreground">Final Stats</span>
            <Sparkles className="w-4 h-4 text-warning" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Total Score</span>
              <span className="arcade-text text-2xl text-warning score-glow">
                {gameState.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Levels Completed</span>
              <span className="arcade-text text-base text-foreground">
                {gameState.levels.length} / 3
              </span>
            </div>
            {gameState.levels.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Best Level</span>
                  <span className="arcade-text text-base text-primary">
                    {Math.max(...gameState.levels.map(l => l.score || 0)).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Leaderboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 neon-border w-full flex-1 min-h-0 flex flex-col max-h-48"
        >
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Medal className="w-4 h-4 text-warning" />
            <h2 className="font-semibold text-foreground text-sm">Final Leaderboard</h2>
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
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all text-xs ${
                    isPlayer 
                      ? 'bg-warning/20 border-2 border-warning' 
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
                  <span className={`flex-1 font-medium truncate ${
                    isPlayer ? 'text-warning' : 'text-foreground'
                  }`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  <span className={`arcade-text text-xs ${
                    isPlayer ? 'text-warning' : 'text-warning/70'
                  }`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-2">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToSwipe}
            className="btn-arcade text-sm sm:text-base px-6 py-2 flex items-center justify-center gap-2 w-full"
          >
            <Sparkles className="w-4 h-4" />
            DISCOVER BRANDS
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToResults}
            className="text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            View Full Results
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
