import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Trophy, Medal, Crown, RefreshCw } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser } from '@/lib/leaderboardManager';
import { soundManager } from '@/lib/soundManager';

// Pre-generate confetti config so it doesn't change on re-renders
const CONFETTI_COLORS = ['#ff3333', '#10b981', '#ffd700', '#3b82f6', '#f472b6', '#a855f7', '#f97316', '#06b6d4'];

interface ConfettiPiece {
  x: number;
  y: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
  rotate: number;
  delay: number;
  duration: number;
  swayX: number;
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: -(Math.random() * 20 + 5),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'rect' : 'circle' as const,
    rotate: Math.random() * 720 - 360,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 3,
    swayX: (Math.random() - 0.5) * 80,
  }));
}

export const GameCompleteScreen = () => {
  const { gameState, resetGame, goToResults } = useGame();
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number; gamesPlayed: number }>>([]);

  const confettiPieces = useMemo(() => generateConfetti(30), []);

  // Stop background music and play victory fanfare on mount
  useEffect(() => {
    soundManager.stopBackgroundMusic();
    soundManager.playSound('gameComplete');
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const currentUser = getCurrentUser();
      const entries = await getLeaderboard(50);
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score,
        gamesPlayed: entry.games_played || 0,
      }));
      const displayUsername = currentUser?.username || username;
      if (currentUser) {
        // Registered user — ensure their entry reflects the best of DB score vs current game
        const playerIdx = mapped.findIndex(e => e.username === displayUsername);
        if (playerIdx >= 0) {
          mapped[playerIdx].score = Math.max(mapped[playerIdx].score, gameState.totalScore);
        } else {
          // Player not in leaderboard yet — add them
          mapped.push({ username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 });
        }
        setLeaderboard(mapped.sort((a, b) => b.score - a.score));
      } else {
        // Anonymous — add local entry
        const withPlayer = [
          ...mapped,
          { username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 },
        ];
        setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
      }
    };
    loadLeaderboard();
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

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              width: piece.shape === 'rect' ? piece.size : piece.size,
              height: piece.shape === 'rect' ? piece.size * 0.6 : piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : '2px',
            }}
            initial={{
              y: 0,
              x: 0,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 100 : 900,
              x: piece.swayX,
              rotate: piece.rotate,
              opacity: [1, 1, 1, 0],
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full flex flex-col items-center my-auto"
      >
        {/* Success icon with crown */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-2"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-warning/20 rounded-full neon-border relative">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-warning" />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -top-1.5 -right-1.5"
            >
              <Crown className="w-6 h-6 text-warning fill-warning" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arcade-text font-bold text-warning neon-glow mb-1"
          style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.75rem)' }}
        >
          GAME COMPLETE!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-xs sm:text-sm mb-3"
        >
          You conquered all {gameState.levels.length} levels!
        </motion.p>

        {/* Stats — compact row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 neon-border w-full"
        >
          <div className="flex items-center justify-around">
            <div className="text-center">
              <span className="arcade-text text-warning score-glow" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                {gameState.totalScore.toLocaleString()}
              </span>
              <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">Score</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="arcade-text text-foreground" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                {gameState.levels.length} / 3
              </span>
              <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">Levels</p>
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
                      ? 'bg-warning/20 border border-warning'
                      : 'bg-background/50'
                  }`}
                >
                  <span className={`arcade-text text-[10px] w-5 text-center ${
                    rank === 1 ? 'text-warning' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-muted-foreground'
                  }`}>
                    {rankDisplay}
                  </span>
                  <span className={`flex-1 font-medium truncate ${isPlayer ? 'text-warning' : 'text-foreground'}`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  <span className={`arcade-text text-[10px] ${isPlayer ? 'text-warning' : 'text-warning/70'}`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {showSeparator && playerEntry && (
              <>
                <div className="text-center text-muted-foreground text-[10px] py-0.5">• • •</div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs bg-warning/20 border border-warning">
                  <span className="arcade-text text-[10px] w-5 text-center text-muted-foreground">
                    {playerRank}
                  </span>
                  <span className="flex-1 font-medium truncate text-warning">
                    {playerEntry.username} (You)
                  </span>
                  <span className="arcade-text text-[10px] text-warning">
                    {playerEntry.score.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Discount message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="w-full mb-3 sm:mb-4 rounded-xl p-3 sm:p-4 text-center border border-warning/50"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
          }}
        >
          <p className="text-warning font-bold" style={{ fontSize: 'clamp(0.8rem, 3.5vw, 1.1rem)' }}>
            You got 5% flat discount on Grovara's next order.
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)' }}>
            We got your response and will follow up through email.
          </p>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-2 w-full">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="btn-arcade text-sm sm:text-base px-6 py-2.5 flex items-center justify-center gap-2 w-full"
          >
            <RefreshCw className="w-4 h-4" />
            PLAY AGAIN
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToResults}
            className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm w-full"
          >
            View Full Results
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
