import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal, ArrowLeft } from 'lucide-react';
import { getMergedLeaderboard } from '@/lib/leaderboardManager';
import { useGame } from '@/context/GameContext';

export const LeaderboardScreen = () => {
  const { resetGame } = useGame();
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const merged = await getMergedLeaderboard();
      setLeaderboard(merged);
    };
    loadLeaderboard();
  }, []);

  const goBack = () => {
    resetGame();
  };

  return (
    <div className="min-h-screen gradient-arcade flex flex-col p-6 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 gradient-radial-glow" />
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline opacity-30" />

      <div className="relative z-10 max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 pt-4"
        >
          <button
            onClick={goBack}
            className="p-2 bg-card/50 rounded-lg hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2">
              <Medal className="w-6 h-6 text-warning" />
              <h1 className="arcade-text text-2xl font-bold text-foreground neon-glow">
                LEADERBOARD
              </h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Top Scores from Expo West 2026
            </p>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 neon-border"
        >
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center pt-8"
            >
              <div className="text-4xl mb-2">🥈</div>
              <div className="text-xs text-muted-foreground mb-1">2nd</div>
              <div className="font-medium text-foreground text-sm text-center">
                {leaderboard[1]?.username || 'N/A'}
              </div>
              <div className="arcade-text text-warning text-sm mt-1">
                {leaderboard[1]?.score.toLocaleString() || '0'}
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="text-5xl mb-2">🏆</div>
              <div className="text-xs text-warning mb-1">1st</div>
              <div className="font-bold text-foreground text-center">
                {leaderboard[0]?.username || 'N/A'}
              </div>
              <div className="arcade-text text-warning text-lg mt-1">
                {leaderboard[0]?.score.toLocaleString() || '0'}
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center pt-12"
            >
              <div className="text-3xl mb-2">🥉</div>
              <div className="text-xs text-muted-foreground mb-1">3rd</div>
              <div className="font-medium text-foreground text-xs text-center">
                {leaderboard[2]?.username || 'N/A'}
              </div>
              <div className="arcade-text text-orange-400 text-sm mt-1">
                {leaderboard[2]?.score.toLocaleString() || '0'}
              </div>
            </motion.div>
          </div>

          {/* Full Leaderboard List */}
          <div className="max-h-96 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              
              return (
                <motion.div
                  key={entry.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    rank <= 3
                      ? 'bg-warning/10 border border-warning/30'
                      : 'bg-background/50 hover:bg-background/70'
                  }`}
                >
                  <span className={`arcade-text text-sm w-10 text-center ${
                    rank === 1 ? 'text-warning text-lg' :
                    rank === 2 ? 'text-muted-foreground' :
                    rank === 3 ? 'text-orange-400' :
                    'text-muted-foreground'
                  }`}>
                    {rank <= 3 ? (
                      rank === 1 ? '🏆' : rank === 2 ? '🥈' : '🥉'
                    ) : (
                      `#${rank}`
                    )}
                  </span>
                  <span className={`flex-1 font-medium ${
                    rank <= 3 ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {entry.username}
                  </span>
                  <span className={`arcade-text text-sm ${
                    rank === 1 ? 'text-warning text-base' :
                    rank <= 3 ? 'text-warning' :
                    'text-muted-foreground'
                  }`}>
                    {entry.score.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-muted-foreground text-xs mt-6"
        >
          Compete for the top spot!
        </motion.p>
      </div>
    </div>
  );
};
