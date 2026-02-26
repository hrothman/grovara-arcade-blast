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
  const { resetGame, startGame } = useGame();
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
        // TODO: Load the actual game state from savedProgress
        // For now, just start the game
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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full neon-border mb-6">
          <Download className="w-10 h-10 text-primary" />
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="arcade-text text-3xl font-bold text-foreground neon-glow mb-4"
        >
          CONTINUE PROGRESS
        </motion.h1>

        <p className="text-muted-foreground mb-8">
          Enter your email to load your saved game
        </p>

        {/* Email Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border"
        >
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Your Email</h2>
          </div>
          
          <form onSubmit={handleLoadProgress} className="space-y-4">
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
              className="btn-arcade w-full text-lg disabled:opacity-50"
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
          className="bg-card/30 rounded-xl p-4 mb-6 border border-primary/20"
        >
          <p className="text-sm text-muted-foreground">
            💡 Your progress is saved automatically when you create an account or save your score
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
