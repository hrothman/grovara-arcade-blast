import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';

export const UserTypeSelectionScreen = () => {
  const { setUserType } = useGame();

  return (
    <div className="h-screen max-h-screen relative flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto" style={{ maxHeight: '100vh', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      {/* Gradient Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/who-are-you/gradient.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Stars Overlay Layer */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: 'url(/who-are-you/stars.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
        }}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-30 text-center w-full max-w-2xl mx-auto px-2 sm:px-4 py-2 sm:py-4"
      >
        {/* Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.1, 
            type: 'spring', 
            stiffness: 300,
            damping: 20
          }}
          className="mb-3 sm:mb-4 md:mb-6"
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 tracking-wider leading-tight"
            style={{ 
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.25rem, 5.5vw, 3rem)',
            }}
          >
            WHO ARE YOU?
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300" style={{ fontFamily: 'var(--font-pixel)' }}>
            Select your role to discover matching opportunities
          </p>
        </motion.div>

        {/* Options */}
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 max-w-xl mx-auto mb-4 sm:mb-6">
          {/* Buyer Card */}
          <motion.button
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ scale: 1.03, y: -4, boxShadow: '0 10px 30px rgba(250, 204, 21, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setUserType('buyer')}
            className="w-full bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-white p-4 sm:p-6 md:p-8 text-left hover:border-yellow-400 transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <img 
                src="/who-are-you/coin.png" 
                alt="Buyer" 
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0"
              />
              <div className="flex-1">
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 tracking-wide"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  I'M A BUYER
                </h2>
                <p className="text-xs sm:text-sm text-gray-300" style={{ fontFamily: 'var(--font-pixel)' }}>
                  Discover brands that match your store or business needs
                </p>
              </div>
            </div>
          </motion.button>

          {/* Brand Card */}
          <motion.button
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ 
              delay: 0.3, 
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ scale: 1.03, y: -4, boxShadow: '0 10px 30px rgba(96, 165, 250, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setUserType('brand')}
            className="w-full bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-white p-4 sm:p-6 md:p-8 text-left hover:border-blue-400 transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <img 
                src="/who-are-you/diamond.png" 
                alt="Brand" 
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0"
              />
              <div className="flex-1">
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 tracking-wide"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  I'M A BRAND
                </h2>
                <p className="text-xs sm:text-sm text-gray-300" style={{ fontFamily: 'var(--font-pixel)' }}>
                  Find retailers and businesses that could carry your products
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-gray-400 text-xs"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          Expo West 2026 • Powered by Grovara
        </motion.p>
      </motion.div>
    </div>
  );
};
