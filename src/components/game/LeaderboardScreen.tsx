import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { useGame } from '@/context/GameContext';

export const LeaderboardScreen = () => {
  const { resetGame, startGame } = useGame();
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await getLeaderboard(50);
      // Map to simple format for display
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score
      }));
      setLeaderboard(mapped);
    };
    loadLeaderboard();
  }, []);

  const goBack = () => {
    resetGame();
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Gradient Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/leaderboard/gradient.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Stars Overlay Layer */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: 'url(/leaderboard/stars.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
        }}
      />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={goBack}
        className="absolute top-6 left-6 z-40 p-3 bg-transparent rounded-full border-2 border-white hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </motion.button>

      {/* Content Container */}
      <div className="relative z-30 flex flex-col items-center px-4 sm:px-6 pt-16 sm:pt-20 pb-8 sm:pb-12 flex-1">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3"
            style={{ 
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.75rem, 6vw, 3rem)',
            }}
          >
            LEADERBOARD
          </h1>
          <p 
            className="text-gray-300 text-sm sm:text-base font-light"
            style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}
          >
            Top Scores from Expo West 2026
          </p>
        </motion.div>

        {/* Trophy Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-end justify-center gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10"
        >
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center"
          >
            <img 
              src="/leaderboard/2nd.png" 
              alt="2nd Place" 
              className="w-24 sm:w-32 md:w-40 h-auto object-contain"
            />
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center"
          >
            <img 
              src="/leaderboard/1st.png" 
              alt="1st Place" 
              className="w-28 sm:w-36 md:w-44 h-auto object-contain"
            />
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center"
          >
            <img 
              src="/leaderboard/3rd.png" 
              alt="3rd Place" 
              className="w-24 sm:w-32 md:w-40 h-auto object-contain"
            />
          </motion.div>
        </motion.div>

        {/* Leaderboard List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-2xl bg-black/80 rounded-2xl border-3 border-white p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2 pr-2">
            {leaderboard.slice(0, 10).map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              
              return (
                <motion.div
                  key={`${entry.username}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + idx * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isTop3 ? 'bg-gray-800/50' : 'bg-gray-900/30'
                  }`}
                >
                  {isTop3 ? (
                    <img 
                      src={`/leaderboard/${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}.png`}
                      alt={`${rank} place`}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span 
                      className="text-gray-500 text-sm w-8 text-center"
                      style={{ fontFamily: 'var(--font-pixel)' }}
                    >
                      {rank}
                    </span>
                  )}
                  <span 
                    className={`flex-1 text-xs sm:text-sm ${isTop3 ? 'text-white' : 'text-gray-400'}`}
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    {entry.username}
                  </span>
                  <span 
                    className="text-yellow-500 text-xs sm:text-sm"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    {entry.score.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Start Mission Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="px-8 sm:px-12 md:px-16 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold text-white rounded-lg sm:rounded-xl mb-auto"
          style={{
            fontFamily: 'var(--font-pixel)',
            background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0,0,0,0.4)',
            border: '3px solid rgba(255,255,255,0.3)',
          }}
        >
          START MISSION
        </motion.button>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="relative z-30 pb-6 sm:pb-8 text-center"
      >
        <p
          className="text-gray-300 text-xs sm:text-sm"
          style={{ fontFamily: 'var(--font-pixel)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
        >
          Expo West 2026 • Powered by Grovara
        </p>
      </motion.div>
    </div>
  );
};
