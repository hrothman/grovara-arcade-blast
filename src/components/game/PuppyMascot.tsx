import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Short, punchy pixel-font-friendly greetings the mascot cycles through
const GREETINGS = ['WOOF!', "LET'S GO!", 'GOOD LUCK!', 'PLAY!'];

/**
 * Grovara's golden-retriever mascot — a lightweight, GPU-friendly greeter that
 * floats in the top-left with a rotating rainbow ring and a speech bubble.
 * Uses only transform/opacity animations so it stays smooth on mobile, and
 * fully quiets down when the user prefers reduced motion.
 */
export const PuppyMascot = () => {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIdx(i => (i + 1) % GREETINGS.length), 3200);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <motion.div
      className="fixed z-40 flex items-center gap-1.5 sm:gap-2 pointer-events-none"
      style={{
        left: 'max(0.6rem, env(safe-area-inset-left))',
        top: 'max(3.5rem, calc(env(safe-area-inset-top) + 3rem))',
      }}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.6, type: 'spring', stiffness: 180 }}
    >
      {/* Mascot circle with animated rainbow ring + gentle bounce */}
      <motion.div
        className="relative flex-shrink-0"
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Rotating conic rainbow ring (transform-only = compositor cheap) */}
        <motion.div
          className="absolute -inset-[3px] rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, #EC4899, #FBBF24, #8B5CF6, #10B981, #EC4899)',
            filter: 'blur(0.5px)',
          }}
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative w-[3.75rem] h-[3.75rem] sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.4)] bg-white">
          <img
            src="/home/puppy-mascot.jpg"
            alt="Grovara mascot puppy"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 20%' }}
            draggable={false}
          />
        </div>
        {/* Little paw badge */}
        <div className="absolute -bottom-1 -right-1 text-xs sm:text-sm drop-shadow">🐾</div>
      </motion.div>

      {/* Speech bubble that cycles greetings */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.8, x: -4 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.85, x: -4 }}
          transition={{ duration: 0.25 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg"
        >
          <span
            className="text-[8px] sm:text-[10px] font-bold text-gray-900 leading-none whitespace-nowrap"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {GREETINGS[idx]}
          </span>
          {/* Bubble tail pointing at the mascot */}
          <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-r-[6px] border-y-transparent border-r-white/95" />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
