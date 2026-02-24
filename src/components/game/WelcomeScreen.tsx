import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Zap, Target, Medal, Download, UserPlus } from 'lucide-react';
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

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 gradient-radial-glow" />
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto"
      >
        {/* Logo area */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-4 mb-4">
            <img 
              src="/grovara-logo.svg" 
              alt="Grovara" 
              className="w-14 h-14 drop-shadow-lg animate-float"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(0, 181, 115, 0.6)) drop-shadow(0 0 25px rgba(0, 171, 158, 0.4))',
              }}
            />
            <h1 className="arcade-text text-4xl font-bold text-foreground neon-glow">
              GROVARA
            </h1>
          </div>
          <p className="text-primary font-display text-lg tracking-wider">
            B2B BLASTER
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10 space-y-3"
        >
          <p className="text-muted-foreground text-lg">
            Old B2B is <span className="text-destructive font-semibold">broken</span>.
          </p>
          <p className="text-foreground text-xl font-medium">
            Grovara is built for <span className="text-primary neon-glow">what's next</span>.
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-8 neon-border"
        >
          <h3 className="arcade-text text-sm text-primary mb-4 flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            How to Play
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="text-destructive text-xl">💥</span>
              <p className="text-foreground text-sm">
                <strong className="text-destructive">Tap to shoot</strong> outdated B2B processes
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-success text-xl">🛡️</span>
              <p className="text-foreground text-sm">
                <strong className="text-success">Avoid</strong> Grovara-approved brands
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-warning text-xl">⭐</span>
              <p className="text-foreground text-sm">
                <strong className="text-warning">Discover</strong> new brands after each level
              </p>
            </div>
          </div>
        </motion.div>

        {/* Start & swipe buttons */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="btn-arcade text-xl w-full max-w-xs flex items-center justify-center gap-3 animate-pulse-glow"
          >
            <Zap className="w-6 h-6" />
            START MISSION
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToSwipe}
            className="btn-arcade text-lg w-full max-w-xs flex items-center justify-center gap-3 bg-card/80 hover:bg-card text-foreground"
          >
            <Target className="w-5 h-5" />
            SWIPE
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToLeaderboard}
            className="text-sm w-full max-w-xs flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Medal className="w-4 h-4" />
            View Leaderboard
          </motion.button>

          {!sessionUser && currentUser?.is_anonymous && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openRegisterModal}
              className="text-sm w-full max-w-xs flex items-center justify-center gap-2 py-2 text-primary hover:text-primary/80 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </motion.button>
          )}
        </div>

        {/* Account Load Modal */}
        <AccountLoadModal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          onLoadAccount={handleLoadAccount}
          onCreateAccount={handleCreateNewAccount}
        />

        {/* Registration Prompt Modal */}
        <UserInfoModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegisterUser}
          title="Create Your Account"
          description="Save your progress and connect with amazing brands!"
          submitButtonText="Create Account"
        />

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-muted-foreground text-xs"
        >
          Expo West 2026 • Powered by Grovara
        </motion.p>
      </motion.div>
    </div>
  );
};
