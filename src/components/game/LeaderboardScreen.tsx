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
    <div className="h-screen max-h-screen relative flex flex-col overflow-hidden" style={{ maxHeight: '100vh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
        className="fixed top-4 left-4 z-40 p-2 sm:p-3 bg-transparent rounded-full border-2 border-white hover:bg-white/10 transition-colors"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </motion.button>

      {/* Content Container */}
      <div className="relative z-30 flex flex-col items-center px-3 sm:px-4 md:px-6 pt-14 sm:pt-16 md:pt-20 pb-4 sm:pb-6 md:pb-8 flex-1 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-3 sm:mb-4 md:mb-6"
        >
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2"
            style={{ 
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.5rem, 5.5vw, 2.5rem)',
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
          className="flex items-end justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8"
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
              className="w-20 sm:w-28 md:w-36 h-auto object-contain"
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
              className="w-24 sm:w-32 md:w-40 h-auto object-contain"
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
              className="w-20 sm:w-28 md:w-36 h-auto object-contain"
            />
          </motion.div>
        </motion.div>

        {/* Leaderboard List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-2xl bg-black/80 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-white p-3 sm:p-4 md:p-6 mb-4 sm:mb-6"
          style={{ maxHeight: '40vh' }}
        >
          <div className="overflow-y-auto space-y-2 pr-2" style={{ maxHeight: '36vh' }}>
            {leaderboard.map((entry, idx) => {
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
