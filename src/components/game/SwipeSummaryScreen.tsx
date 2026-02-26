import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Heart, Check, ArrowRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import realBrandsData from '@/data/realBrands.json';
import buyersData from '@/data/buyers.json';
import { setCurrentUser } from '@/lib/leaderboardManager';
import { registerUser, checkUsernameAvailable } from '@/services/userService';
import { updateLeaderboardScore } from '@/services/leaderboardService';
import { UserInfoModal } from './UserInfoModal';

export const SwipeSummaryScreen = () => {
  const { gameState, resetGame } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  // Get matched items based on user type
  const allItems = gameState.userType === 'brand' ? buyersData : realBrandsData;
  const itemType = gameState.userType === 'brand' ? 'buyers' : 'brands';
  
  const matchedItems = gameState.swipes
    .filter(s => s.direction === 'right')
    .map(s => allItems.find((item: any) => item.id === s.brandId))
    .filter(Boolean);

  const handleUserInfoSubmit = async (username: string, email: string) => {
    try {
      // Check if username is available
      const available = await checkUsernameAvailable(username);
      if (!available) {
        toast.error('Username already taken. Try another!');
        throw new Error('Username taken');
      }

      // Register user in database (updates the anonymous user record)
      const registeredUser = await registerUser(username, email);
      if (!registeredUser) {
        throw new Error('Failed to register user');
      }

      console.log('✅ User registered in database:', registeredUser);

      // Add/update leaderboard entry with score 0 (swipe-only user)
      await updateLeaderboardScore(
        registeredUser.id,
        username,
        0, // 0 score for swipe-only users
        undefined // session ID
      );
      
      console.log('✅ Leaderboard entry added');

      // Set current user session
      setCurrentUser(username, email);

      setSavedUsername(username);
      setSavedEmail(email);
      setAccountCreated(true);
      setShowModal(false);
      toast.success(`Welcome, ${username}! Your matches have been saved.`);

      // Log analytics
      const matchedItemIds = matchedItems.map((i: any) => i?.id).filter(Boolean) as string[];
      console.log('Account created from swipe:', {
        username,
        email,
        matchedItems: matchedItemIds,
        dbUser: registeredUser,
      });
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
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-full neon-border mb-3 sm:mb-4">
          <Heart className="w-10 h-10 text-primary fill-primary" />
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="arcade-text text-2xl sm:text-3xl font-bold text-foreground neon-glow mb-2"
          style={{ fontSize: 'clamp(1.25rem, 5vw, 1.875rem)' }}
        >
          YOUR MATCHES
        </motion.h1>

        <p className="text-muted-foreground mb-8">
          You matched with {matchedItems.length} {itemType}!
        </p>

        {/* Matched items */}
        {matchedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-6 neon-border"
          >
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Heart className="w-4 h-4 text-success fill-success" />
              <h2 className="font-semibold text-foreground text-sm">Matched {itemType}</h2>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {matchedItems.map((item: any, idx) => (
                <motion.div
                  key={item?.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="bg-background/50 rounded-lg p-3 flex items-center gap-3 text-sm"
                >
                  {item?.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: item?.color + '30' }}
                    >
                      {item?.emoji || '🌱'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-foreground text-xs truncate">{item?.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{item?.category}</p>
                  </div>
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Save Account Button or Success Message */}
        {!accountCreated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <button
              onClick={() => setShowModal(true)}
              className="btn-arcade w-full text-lg flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              SAVE YOUR MATCHES
            </button>
            
            <button
              onClick={resetGame}
              className="w-full bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl py-3 px-4 text-lg flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground border border-border/50"
            >
              <ArrowRight className="w-5 h-5" />
              BACK TO START
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <div className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
              <div className="flex items-center gap-3 text-primary">
                <Check className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-sm">All set, <span className="text-success">{savedUsername}</span>!</p>
                  <p className="text-xs opacity-80">We'll follow up about your matches at {savedEmail}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={resetGame}
              className="w-full bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl py-3 px-4 text-lg flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground border border-border/50"
            >
              <ArrowRight className="w-5 h-5" />
              BACK TO START
            </button>
          </motion.div>
        )}

        {/* User Info Modal */}
        <UserInfoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleUserInfoSubmit}
          title="Save Your Matches"
          description="Connect with the businesses you're interested in"
          showMatchesInfo={true}
          matchCount={matchedItems.length}
          matchType={itemType}
          submitButtonText="Save & Connect"
        />

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-muted-foreground text-xs mt-6"
        >
          Thank you for exploring! • Expo West 2026
        </motion.p>
      </motion.div>
    </div>
  );
};
