import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getLeaderboard } from '@/services/leaderboardService';
import { useGame } from '@/context/GameContext';

export const LeaderboardScreen = () => {
  const { resetGame } = useGame();
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number; gamesPlayed: number }>>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await getLeaderboard(50);
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score,
        gamesPlayed: entry.games_played || 0,
      }));
      setLeaderboard(mapped);
    };
    loadLeaderboard();
  }, []);

  const goBack = () => {
    resetGame();
  };

  return (
    <div
      className="h-full w-full relative flex flex-col overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        touchAction: 'none',
      }}
    >
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
        className="absolute top-3 left-3 z-40 p-2 bg-transparent rounded-full border-2 border-white hover:bg-white/10 transition-colors"
        style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </motion.button>

      {/* ── All content in a single non-scrolling flex column ── */}
      <div className="relative z-30 flex flex-col flex-1 min-h-0 px-3 sm:px-4 lg:px-6 pt-12 pb-3 sm:pt-14 sm:pb-4 lg:pt-16 lg:pb-6">

        {/* Header — compact */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center shrink-0 mb-2 sm:mb-3 lg:mb-4"
        >
          <h1
            className="font-bold text-white"
            style={{
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.1rem, 4.5vw, 2.25rem)',
              lineHeight: 1.2,
            }}
          >
            LEADERBOARD
          </h1>
          <p
            className="text-gray-300 font-light mt-0.5"
            style={{
              fontFamily: 'var(--font-pixel)',
              fontWeight: 300,
              fontSize: 'clamp(0.5rem, 2vw, 0.875rem)',
            }}
          >
            Top Scores
          </p>
        </motion.div>

        {/* Trophy Display — scales down aggressively on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-end justify-center gap-2 sm:gap-4 lg:gap-6 shrink-0 mb-2 sm:mb-4 lg:mb-6"
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
              className="h-auto object-contain"
              style={{ width: 'clamp(3.5rem, 12vw, 9rem)' }}
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
              className="h-auto object-contain"
              style={{ width: 'clamp(4.5rem, 15vw, 10rem)' }}
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
              className="h-auto object-contain"
              style={{ width: 'clamp(3.5rem, 12vw, 9rem)' }}
            />
          </motion.div>
        </motion.div>

        {/* Leaderboard List — takes ALL remaining space, scrolls internally */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex-1 min-h-0 w-full max-w-2xl mx-auto bg-black/80 rounded-xl sm:rounded-2xl border-2 border-white p-2 sm:p-3 lg:p-4 flex flex-col"
        >
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 pr-1 custom-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
          >
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;

              return (
                <motion.div
                  key={`${entry.username}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + idx * 0.02 }}
                  className={`flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:p-2.5 lg:p-3 rounded-lg ${
                    isTop3 ? 'bg-gray-800/50' : 'bg-gray-900/30'
                  }`}
                >
                  {isTop3 ? (
                    <img
                      src={`/leaderboard/${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}.png`}
                      alt={`${rank} place`}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0"
                    />
                  ) : (
                    <span
                      className="text-gray-500 w-6 sm:w-8 text-center shrink-0"
                      style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.55rem, 1.8vw, 0.875rem)' }}
                    >
                      {rank}
                    </span>
                  )}
                  <span
                    className={`flex-1 truncate ${isTop3 ? 'text-white' : 'text-gray-400'}`}
                    style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.55rem, 1.8vw, 0.875rem)' }}
                  >
                    {entry.username}
                  </span>
                  <span
                    className="text-gray-500 shrink-0"
                    style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.45rem, 1.4vw, 0.7rem)' }}
                  >
                    {entry.gamesPlayed || 0} {entry.gamesPlayed === 1 ? 'Play' : 'Plays'}
                  </span>
                  <span
                    className="text-yellow-500 shrink-0"
                    style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(0.55rem, 1.8vw, 0.875rem)' }}
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
          onClick={resetGame}
          className="shrink-0 mx-auto mt-3 sm:mt-4 lg:mt-5 px-6 sm:px-10 lg:px-14 py-2.5 sm:py-3 lg:py-4 font-bold text-white rounded-lg sm:rounded-xl"
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(0.65rem, 2.2vw, 1.15rem)',
            background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0,0,0,0.4)',
            border: '3px solid rgba(255,255,255,0.3)',
          }}
        >
          START MISSION
        </motion.button>

        {/* Footer — compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="shrink-0 text-center mt-2 sm:mt-3"
        >
          <p
            className="text-gray-300"
            style={{
              fontFamily: 'var(--font-pixel)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontSize: 'clamp(0.45rem, 1.5vw, 0.75rem)',
            }}
          >
            Powered by Grovara
          </p>
        </motion.div>
      </div>
    </div>
  );
};
