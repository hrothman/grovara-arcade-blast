import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Frown, RefreshCw, Medal } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser } from '@/lib/leaderboardManager';

export const GameOverScreen = () => {
  const { gameState, resetGame, goToSwipe } = useGame();
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number; gamesPlayed: number }>>([]);

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
          mapped.push({ username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 });
        }
        setLeaderboard(mapped.sort((a, b) => b.score - a.score));
      } else {
        const withPlayer = [
          ...mapped,
          { username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 }
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
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />

      <div className="relative z-10 text-center max-w-md mx-auto w-full my-auto flex flex-col items-center">
        {/* Game over icon */}
        <div className="mb-2 sm:mb-3">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-destructive/20 rounded-full">
            <Frown className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
          </div>
        </div>

        <h2
          className="arcade-text font-bold text-foreground mb-1"
          style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.75rem)' }}
        >
          GAME OVER
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          Don't give up — try again!
        </p>

        {/* Stats — compact single row */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 neon-border w-full">
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
                {gameState.levels.length} / 5
              </span>
              <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">Levels</p>
            </div>
          </div>
        </div>

        {/* Leaderboard — top 5 + player */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 sm:mb-4 neon-border w-full">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Medal className="w-4 h-4 text-warning" />
            <h2 className="font-semibold text-foreground text-xs sm:text-sm">Leaderboard</h2>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {playerRank ? `Rank #${playerRank}` : ''}
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
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            onClick={resetGame}
            type="button"
            className="btn-arcade text-sm sm:text-base w-full max-w-xs flex items-center justify-center gap-2 py-3"
          >
            <RefreshCw className="w-4 h-4" />
            BACK TO START
          </button>
{/* See brands/buyers button — commented out
          <button
            onClick={goToSwipe}
            type="button"
            className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
          >
            See brands / buyers anyway
          </button>
*/}
        </div>
      </div>
    </div>
  );
};
