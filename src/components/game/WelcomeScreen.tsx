import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Medal, UserPlus } from 'lucide-react';
import { getCurrentUser, setCurrentUser as setCurrentUserSession } from '@/lib/leaderboardManager';
import { AccountLoadModal } from './AccountLoadModal';
import { UserInfoModal } from './UserInfoModal';
import { registerUser, checkUsernameAvailable } from '@/services/userService';
import { updateLeaderboardScore } from '@/services/leaderboardService';
import { toast } from 'sonner';

export const WelcomeScreen = () => {
  const { startGame, goToSwipe, goToLeaderboard, currentUser, loadUserByEmail } = useGame();
  const [sessionUser, setSessionUser] = useState<{ username: string; email?: string } | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [hasShownInitialPrompt, setHasShownInitialPrompt] = useState(false);

  // Check session user on mount
  useEffect(() => {
    const user = getCurrentUser();
    setSessionUser(user);
    console.log('💾 Session user:', user);
  }, []);

  // Show account load/create modal immediately on first visit
  useEffect(() => {
    // Don't show if we already showed a prompt
    if (hasShownInitialPrompt) return;

    // Don't show if user already has a session (registered and logged in)
    if (sessionUser) {
      console.log('✅ User has session, no modal needed');
      setHasShownInitialPrompt(true);
      return;
    }

    // Show the load/create modal after a short delay
    console.log('🎮 First visit - showing account modal');
    const timer = setTimeout(() => {
      setShowLoadModal(true);
      setHasShownInitialPrompt(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [sessionUser, hasShownInitialPrompt]);

  const handleLoadAccount = async (emailOrUsername: string): Promise<boolean> => {
    const loaded = await loadUserByEmail(emailOrUsername);
    if (loaded) {
      toast.success(`Welcome back! Your account has been loaded.`);
      setShowLoadModal(false);
      // Refresh session user
      const user = getCurrentUser();
      setSessionUser(user);
    }
    return loaded;
  };

  const handleCreateNewAccount = () => {
    console.log('📝 User chose to create new account - showing registration modal');
    setShowLoadModal(false);
    setShowRegisterModal(true);
  };

  const handleRegisterUser = async (username: string, email: string) => {
    try {
      // Check if username is available
      const available = await checkUsernameAvailable(username);
      if (!available) {
        toast.error('Username already taken. Try another!');
        throw new Error('Username taken');
      }

      // Register user in database
      const registeredUser = await registerUser(username, email);
      if (!registeredUser) {
        throw new Error('Failed to register user');
      }

      console.log('✅ User registered:', registeredUser);

      // Update leaderboard entry with new username (if they had anonymous entry)
      // This will update any existing anonymous entry or create a new one
      await updateLeaderboardScore(
        registeredUser.id,
        username,
        0,
        undefined
      );
      
      console.log('✅ Leaderboard entry added');

      // Set current user session
      setCurrentUserSession(username, email);
      setSessionUser({ username, email });

      setShowRegisterModal(false);
      toast.success(`Welcome, ${username}! Your account has been created.`);
    } catch (error) {
      console.error('Error registering user:', error);
      if (error instanceof Error && error.message !== 'Username taken') {
        toast.error('Failed to create account. Please try again.');
      }
      throw error;
    }
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
  };

  const openAccountLoadModal = () => {
    setShowLoadModal(true);
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Gradient Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/home/gradient.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Stars Overlay Layer */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: 'url(/home/stars.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
        }}
      />

      {/* TOP SECTION - 60% - Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-30 flex flex-col items-center justify-center text-center"
        style={{ height: '55vh' }}
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mb-2 sm:mb-3 md:mb-4 px-6 sm:px-8 md:px-10"
        >
          {/* Grovara.com Logo */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <img 
              src="/grovara-logo.svg" 
              alt="Grovara" 
              className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 drop-shadow-lg"
            />
            <h2 
              className="text-lg sm:text-xl md:text-2xl font-normal text-white tracking-wide" 
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              GROVARA.COM
            </h2>
          </div>

          {/* Main Title */}
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2 tracking-wider leading-tight px-2"
            style={{ 
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.75rem, 7vw, 3.5rem)',
            }}
          >
            B2B BLASTER
          </h1>
        </motion.div>

        {/* How to Play Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-2 sm:mb-3 md:mb-4 px-6 sm:px-8 md:px-10"
        >
          <h3 
            className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 sm:mb-2 tracking-widest"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            HOW TO PLAY
          </h3>

          {/* Tagline */}
          <div className="mb-1 sm:mb-2 space-y-0.5">
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 font-light" style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}>
              Old B2B is <span className="text-red-400">broken</span>...
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-light" style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}>
              Grovara is built for what's next.
            </p>
          </div>

          {/* Instructions Box */}
          <div className="bg-black rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-white p-2 sm:p-3 md:p-4 max-w-xl mx-auto">
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {/* Instruction 1 */}
              <div className="flex items-center gap-2 sm:gap-3 text-left">
                <img src="/home/sword.png" alt="Sword" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <p className="text-white text-xs sm:text-sm md:text-base font-light" style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}>
                  <span className="text-red-500">Tap to shoot</span> outdated B2B process
                </p>
              </div>

              {/* Instruction 2 */}
              <div className="flex items-center gap-2 sm:gap-3 text-left">
                <img src="/home/diamond.png" alt="Diamond" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <p className="text-white text-xs sm:text-sm md:text-base font-light" style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}>
                  <span className="text-blue-500">Drag in</span> Grovara-approved brands
                </p>
              </div>

              {/* Instruction 3 */}
              <div className="flex items-center gap-2 sm:gap-3 text-left">
                <img src="/home/coin.png" alt="Coin" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0" />
                <p className="text-white text-xs sm:text-sm md:text-base font-light" style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}>
                  <span className="text-yellow-500">Discover</span> new brands after each level
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-3xl mx-auto px-6 sm:px-8 md:px-10">
          {/* Start Mission Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="flex-1 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold text-white rounded-lg sm:rounded-xl relative overflow-hidden"
            style={{
              fontFamily: 'var(--font-pixel)',
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0,0,0,0.4)',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            START MISSION
          </motion.button>

          {/* Swipe for Brands Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToSwipe}
            className="flex-1 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold bg-transparent text-white rounded-lg sm:rounded-xl"
            style={{
              fontFamily: 'var(--font-pixel)',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            SWIPE FOR BRANDS
          </motion.button>
        </div>
      </motion.div>

      {/* BOTTOM SECTION - 40% - Characters & Footer */}
      <div className="relative z-20 flex-1" style={{ height: '45vh' }}>
        {/* Villain Character - Left */}
        <motion.img
          src="/home/villain.png"
          alt="Villain"
          className="absolute bottom-0 left-0 z-20 pointer-events-none"
          style={{ 
            height: '100%', 
            width: '60%',
            objectFit: 'cover',
            objectPosition: 'right top'
          }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Bird Character - Right */}
        <motion.img
          src="/home/bird.png"
          alt="Bird"
          className="absolute bottom-0 right-0 z-20 pointer-events-none"
          style={{ 
            height: '100%', 
            width: '60%',
            objectFit: 'cover',
            objectPosition: 'left top'
          }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Bottom Gradient Overlay - MUST be on top of characters */}
        <div 
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            backgroundImage: 'url(/home/home_gradient.png)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'bottom',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Footer - Positioned at bottom over gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-40 text-center px-2 sm:px-4"
        >
          {/* Footer Links */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-2 sm:mb-3" style={{ fontFamily: 'var(--font-pixel)' }}>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={goToLeaderboard}
              className="flex items-center gap-1 sm:gap-2 hover:text-white transition-colors text-gray-300 text-[10px] sm:text-xs md:text-sm"
            >
              <Medal className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">View Leaderboard</span>
            </motion.button>

            {!sessionUser && currentUser?.is_anonymous && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={openAccountLoadModal}
                className="flex items-center gap-1 sm:gap-2 hover:text-white transition-colors text-gray-300 text-[10px] sm:text-xs md:text-sm"
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Continue Progress</span>
              </motion.button>
            )}
          </div>

          <p
            className="text-gray-300 text-[9px] xs:text-[10px] sm:text-xs md:text-sm px-2"
            style={{ fontFamily: 'var(--font-pixel)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            <span className="inline-block">Expo West 2026</span>
            <span className="hidden xs:inline"> • </span>
            <span className="block xs:inline">Powered by Grovara</span>
          </p>
        </motion.div>
      </div>

      {/* Modals */}
      <AccountLoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadAccount={handleLoadAccount}
        onCreateAccount={handleCreateNewAccount}
      />

      <UserInfoModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSubmit={handleRegisterUser}
        title="Create Your Account"
        description="Save your progress and connect with amazing brands!"
        submitButtonText="Create Account"
      />
    </div>
  );
};
