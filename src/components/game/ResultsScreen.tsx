import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import featuredBrandsData from '@/data/featuredBrands.json';
import buyersData from '@/data/buyers.json';
import { Trophy, Heart, RefreshCw, Share2, Check, Medal } from 'lucide-react';
import { toast } from 'sonner';
import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentUser, UserSession } from '@/lib/leaderboardManager';

export const ResultsScreen = () => {
  const { gameState, resetGame, getAnalytics, currentUser } = useGame();
  const [sessionUser] = useState<UserSession | null>(() => getCurrentUser());
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number; gamesPlayed: number }>>([]);

  const allItems = [...featuredBrandsData, ...buyersData];
  const matchedBrands = gameState.swipes
    .filter(s => s.direction === 'right')
    .map(s => allItems.find(b => b.id === s.brandId))
    .filter(Boolean);

  const analytics = getAnalytics();
  const displayUsername = sessionUser?.username || `user${Math.floor(Math.random() * 10000000)}`;

  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await getLeaderboard(50);
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score,
        gamesPlayed: entry.games_played || 0,
      }));
      const playerExists = mapped.some(entry => entry.username === displayUsername) || sessionUser;
      const withPlayer = playerExists
        ? mapped
        : [
            ...mapped,
            { username: displayUsername, score: gameState.totalScore, gamesPlayed: 1 }
          ];
      setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
    };
    loadLeaderboard();
  }, [displayUsername, gameState.totalScore]);

  const playerRankIdx = leaderboard.findIndex(entry => entry.username === displayUsername);
  const playerRank = playerRankIdx === -1 ? null : playerRankIdx + 1;

  // Build compact display: top 3 + player
  const top3 = leaderboard.slice(0, 3);
  const playerEntry = playerRankIdx > 2 ? leaderboard[playerRankIdx] : null;
  const showSeparator = playerEntry !== null;

  const handleShare = () => {
    const shareText = `I scored ${gameState.totalScore.toLocaleString()} points playing Grovara B2B Blaster at Expo West!`;
    if (navigator.share) {
      navigator.share({
        title: 'Grovara B2B Blaster',
        text: shareText,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.origin}`).then(() => {
        toast.success('Score copied to clipboard!');
      }).catch(() => {
        toast.success('Score copied to clipboard!');
      });
    }
  };

  return (
    <div
      className="h-full w-full gradient-arcade flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full flex flex-col items-center my-auto"
      >
        {/* Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 rounded-full neon-border mb-2">
          <Trophy className="w-7 h-7 text-primary" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="arcade-text font-bold text-foreground neon-glow mb-3"
          style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.75rem)' }}
        >
          MISSION COMPLETE!
        </motion.h1>

        {/* Combined Score & Leaderboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 neon-border w-full"
        >
          {/* Score row */}
          <div className="flex items-center justify-around mb-3 pb-3 border-b border-border">
            <div className="text-center">
              <span className="arcade-text text-warning score-glow" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                {gameState.totalScore.toLocaleString()}
              </span>
              <p className="text-muted-foreground text-[10px] mt-0.5">Score</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="arcade-text text-foreground" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                {gameState.levels.length}
              </span>
              <p className="text-muted-foreground text-[10px] mt-0.5">Levels</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="arcade-text text-primary" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                {matchedBrands.length}
              </span>
              <p className="text-muted-foreground text-[10px] mt-0.5">Matches</p>
            </div>
          </div>

          {/* Leaderboard — top 3 + player */}
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Medal className="w-4 h-4 text-warning" />
            <h2 className="font-semibold text-foreground text-xs sm:text-sm">Leaderboard</h2>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {playerRank ? `#${playerRank}` : ''}
            </span>
          </div>

          <div className="space-y-1">
            {top3.map((entry, idx) => {
              const isPlayer = entry.username === displayUsername;
              const rank = idx + 1;
              return (
                <div
                  key={entry.username}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                    isPlayer
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-background/50'
                  }`}
                >
                  <span className={`arcade-text text-[10px] w-5 text-center ${
                    rank === 1 ? 'text-warning' : rank === 2 ? 'text-gray-400' : 'text-orange-400'
                  }`}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </span>
                  <span className={`flex-1 font-medium truncate ${isPlayer ? 'text-primary' : 'text-foreground'}`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  {entry.gamesPlayed > 0 && (
                    <span className="text-[9px] text-muted-foreground/70 tabular-nums">{entry.gamesPlayed}x</span>
                  )}
                  <span className={`arcade-text text-[10px] ${isPlayer ? 'text-primary' : 'text-warning/70'}`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}

            {showSeparator && playerEntry && (
              <>
                <div className="text-center text-muted-foreground text-[10px] py-0.5">• • •</div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs bg-primary/20 border border-primary">
                  <span className="arcade-text text-[10px] w-5 text-center text-muted-foreground">
                    {playerRank}
                  </span>
                  <span className="flex-1 font-medium truncate text-primary">
                    {playerEntry.username} (You)
                  </span>
                  {playerEntry.gamesPlayed > 0 && (
                    <span className="text-[9px] text-muted-foreground/70 tabular-nums">{playerEntry.gamesPlayed}x</span>
                  )}
                  <span className="arcade-text text-[10px] text-primary">
                    {playerEntry.score.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Matched brands — compact */}
        {matchedBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/50 backdrop-blur-sm rounded-xl p-3 mb-3 neon-border w-full"
          >
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Heart className="w-3 h-3 text-success fill-success" />
              <h2 className="font-semibold text-foreground text-xs">Your Matches ({matchedBrands.length})</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {matchedBrands.slice(0, 6).map((brand) => (
                <span
                  key={brand?.id}
                  className="bg-background/50 rounded px-2 py-0.5 text-[10px] text-foreground truncate max-w-[120px]"
                >
                  {brand?.name}
                </span>
              ))}
              {matchedBrands.length > 6 && (
                <span className="text-[10px] text-muted-foreground">+{matchedBrands.length - 6} more</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Registered user confirmation */}
        {sessionUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-primary/10 rounded-xl p-3 mb-3 border border-primary/30 w-full"
          >
            <div className="flex items-center gap-2 text-primary">
              <Check className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-xs">Playing as <span className="text-success">{sessionUser.firstName || sessionUser.username}</span></p>
                {sessionUser.email && <p className="text-[10px] opacity-80">{sessionUser.email}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-2 w-full mb-2"
        >
          <button
            onClick={handleShare}
            className="flex-1 bg-card/80 hover:bg-card transition-colors rounded-xl py-2 flex items-center justify-center gap-1.5 text-foreground text-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share with Friends
          </button>
          <button
            onClick={resetGame}
            className="flex-1 bg-card/80 hover:bg-card transition-colors rounded-xl py-2 flex items-center justify-center gap-1.5 text-foreground text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Play Again
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-muted-foreground text-[10px]"
        >
          Thank you for playing! • Expo West 2026
        </motion.p>
      </motion.div>
    </div>
  );
};
