import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Download, ArrowLeft, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { setCurrentUser } from '@/lib/leaderboardManager';
import { registerUser, checkUsernameAvailable } from '@/services/userService';
import { updateLeaderboardScore } from '@/services/leaderboardService';
import { UserInfoModal } from './UserInfoModal';

export const LoadProgressScreen = () => {
  const { resetGame, startGame, loadUserByEmail } = useGame();
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to load user progress
      // const response = await fetch(`/api/users/progress?email=${email}`);
      // const data = await response.json();
      
      // For now, simulate loading from localStorage
      const savedProgress = localStorage.getItem(`user_progress_${email}`);
      
      if (savedProgress) {
        toast.success(`Welcome back! Progress loaded for ${email}`);
        // Load the user into the hook so initSession knows who they are
        await loadUserByEmail(email);
        startGame();
      } else {
        // No progress found - show modal to create account
        setShowModal(true);
        toast.info('No progress found. Let\'s create your account!');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      toast.error('Failed to load progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserInfoSubmit = async (username: string, submittedEmail: string) => {
    try {
      // Check if username is available
      const available = await checkUsernameAvailable(username);
      if (!available) {
        toast.error('Username already taken. Try another!');
        throw new Error('Username taken');
      }

      // Register user in database (updates the anonymous user record)
      const registeredUser = await registerUser(username, submittedEmail);
      if (!registeredUser) {
        throw new Error('Failed to register user');
      }

      console.log('✅ User registered in database:', registeredUser);

      // Add/update leaderboard entry with score 0
      await updateLeaderboardScore(
        registeredUser.id,
        username,
        0,
        undefined
      );
      
      console.log('✅ Leaderboard entry added');

      // Set current user session
      setCurrentUser(username, submittedEmail);

      // Save email association
      localStorage.setItem(`user_progress_${submittedEmail}`, JSON.stringify({
        username,
        email: submittedEmail,
        createdAt: new Date().toISOString(),
      }));

      toast.success(`Account created! Welcome, ${username}!`);
      setShowModal(false);

      // Load the just-registered user into the hook so initSession knows who they are
      await loadUserByEmail(submittedEmail);

      // Start the game
      setTimeout(() => {
        startGame();
      }, 500);
    } catch (error) {
      console.error('Error creating account:', error);
      if (error instanceof Error && error.message !== 'Username taken') {
        toast.error('Failed to create account. Please try again.');
      }
      throw error;
    }
  };

  return (
    <div className="h-screen max-h-screen gradient-arcade flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-x-hidden overflow-y-auto" style={{ maxHeight: '100vh', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full my-auto"
      >
        {/* Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 rounded-full neon-border mb-4">
          <Download className="w-7 h-7 text-primary" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="arcade-text font-bold text-foreground neon-glow mb-2"
          style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.75rem)' }}
        >
          CONTINUE PROGRESS
        </motion.h1>

        <p className="text-muted-foreground text-sm mb-5">
          Enter your email to load your saved game
        </p>

        {/* Email Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-4 neon-border"
        >
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Your Email</h2>
          </div>

          <form onSubmit={handleLoadProgress} className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-background border-border"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-arcade w-full text-sm disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load Progress'}
            </button>
          </form>
        </motion.div>

        {/* User Info Modal */}
        <UserInfoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleUserInfoSubmit}
          title="Create Your Account"
          description="No progress found. Let's create your account to get started!"
          initialEmail={email}
          submitButtonText="Create & Start Playing"
        />

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card/30 rounded-lg p-3 mb-4 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground">
            Your progress is saved automatically when you create an account or save your score
          </p>
        </motion.div>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={resetGame}
          className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </motion.button>
      </motion.div>
    </div>
  );
};
