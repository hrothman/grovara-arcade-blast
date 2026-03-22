import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Star, ArrowRight, Sparkles, Medal, PartyPopper } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser } from '@/lib/leaderboardManager';

export const LevelCompleteScreen = () => {
  const { gameState, goToSwipe, nextLevel } = useGame();
  const currentLevelData = gameState.levels[gameState.levels.length - 1];
  const isLastLevel = gameState.currentLevel >= 5;
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number; gamesPlayed: number }>>([]);

  useEffect(() => {
    const loadAndUpdateLeaderboard = async () => {
      const currentUser = getCurrentUser();
      const entries = await getLeaderboard(50);
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score,
        gamesPlayed: entry.games_played || 0,
      }));
      const displayUsername = currentUser?.username || username;
      if (currentUser) {
        const playerIdx = mapped.findIndex(e => e.username === displayUsername);
        if (playerIdx >= 0) {
          mapped[playerIdx].score = Math.max(mapped[playerIdx].score, gameState.totalScore);
        } else {
          mapped.push({ username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 });
        }
        setLeaderboard(mapped.sort((a, b) => b.score - a.score));
      } else {
        const withPlayer = [
          ...mapped,
          { username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 },
        ];
        setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
      }
    };
    loadAndUpdateLeaderboard();
  }, [username, gameState.totalScore]);

  const displayUsername = getCurrentUser()?.username || username;
  const playerRankIdx = leaderboard.findIndex(entry => entry.username === displayUsername);
  const playerRank = playerRankIdx === -1 ? null : playerRankIdx + 1;

  // Build compact display: top 5 + player (if not already in top 5)
  const top5 = leaderboard.slice(0, 5);
  const playerEntry = playerRankIdx > 4 ? leaderboard[playerRankIdx] : null;
  const showSeparator = playerEntry !== null;

  return (
    <div
      className="h-full w-full gradient-arcade flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="absolute inset-0 gradient-radial-glow" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full flex flex-col items-center my-auto"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-1 sm:mb-2"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary/20 rounded-full neon-border">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text font-bold text-foreground neon-glow mb-2 sm:mb-3"
          style={{ fontSize: 'clamp(1rem, 4.5vw, 1.5rem)' }}
        >
          LEVEL {gameState.currentLevel} COMPLETE!
        </motion.h2>

        {/* Stats — compact row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 neon-border w-full"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-3 h-3 text-warning fill-warning" />
            <span className="arcade-text text-[10px] text-muted-foreground">Level Stats</span>
            <Star className="w-3 h-3 text-warning fill-warning" />
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <span className="arcade-text text-warning score-glow" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)' }}>
                {currentLevelData?.score?.toLocaleString() || 0}
              </span>
              <p className="text-muted-foreground text-[10px] mt-0.5">Level Score</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="arcade-text text-foreground" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)' }}>
                {gameState.totalScore.toLocaleString()}
              </span>
              <p className="text-muted-foreground text-[10px] mt-0.5">Total</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard — top 3 + player only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 neon-border w-full"
        >
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Medal className="w-4 h-4 text-warning" />
            <h2 className="font-semibold text-foreground text-xs sm:text-sm">Leaderboard</h2>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {playerRank ? `#${playerRank}` : ''}
            </span>
          </div>

          <div className="space-y-1">
            {top5.map((entry, idx) => {
              const isPlayer = entry.username === displayUsername;
              const rank = idx + 1;
              const rankDisplay = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}`;
              return (
                <div
                  key={entry.username}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                    isPlayer
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-background/50'
                  }`}
                >
                  <span className={`arcade-text text-[10px] w-5 text-center ${
                    rank === 1 ? 'text-warning' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-muted-foreground'
                  }`}>
                    {rankDisplay}
                  </span>
                  <span className={`flex-1 font-medium truncate ${isPlayer ? 'text-primary' : 'text-foreground'}`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  <span className={`arcade-text text-[10px] ${isPlayer ? 'text-primary' : 'text-warning/70'}`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {showSeparator && playerEntry && (
              <>
                <div className="text-center text-muted-foreground text-[10px] py-0.5">• • •</div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs bg-primary/20 border border-primary">
                  <span className="arcade-text text-[10px] w-5 text-center text-muted-foreground">
                    {playerRank}
                  </span>
                  <span className="flex-1 font-medium truncate text-primary">
                    {playerEntry.username} (You)
                  </span>
                  <span className="arcade-text text-[10px] text-primary">
                    {playerEntry.score.toLocaleString()}
                  </span>
                </div>
              </>
            )}
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
            <Sparkles className="w-3 h-3" />
            <p className="text-xs sm:text-sm font-medium">Great job!</p>
            <Sparkles className="w-3 h-3" />
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-2 w-full">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextLevel}
            className="btn-arcade text-sm sm:text-base px-6 py-2.5 flex items-center justify-center gap-2 w-full"
          >
            {isLastLevel ? (
              <>
                <PartyPopper className="w-4 h-4" />
                VIEW RESULTS
              </>
            ) : (
              <>
                NEXT LEVEL
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* Discover Brands button — commented out
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: 'spring' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToSwipe}
            className="w-full px-6 py-2 text-xs sm:text-sm font-bold bg-transparent text-white rounded-xl border-2 border-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            <Sparkles className="w-3 h-3" />
            DISCOVER BRANDS
          </motion.button>
          */}
        </div>
      </motion.div>
    </div>
  );
};
