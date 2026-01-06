import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { Heart, Mail, User, Check, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import realBrandsData from '@/data/realBrands.json';
import buyersData from '@/data/buyers.json';
import { savePlayerAccount, checkUsernameAvailable, setCurrentUser } from '@/lib/leaderboardManager';

export const SwipeSummaryScreen = () => {
  const { gameState, resetGame } = useGame();
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [username, setUsername] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get matched items based on user type
  const allItems = gameState.userType === 'brand' ? buyersData : realBrandsData;
  const itemType = gameState.userType === 'brand' ? 'buyers' : 'brands';
  
  const matchedItems = gameState.swipes
    .filter(s => s.direction === 'right')
    .map(s => allItems.find((item: any) => item.id === s.brandId))
    .filter(Boolean);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to save email and send follow-up
      // const response = await fetch('/api/leads', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, matches: matchedItems.map(i => i.id) }),
      // });

      // For now, save to localStorage
      localStorage.setItem(`user_email_${email}`, JSON.stringify({
        email,
        matches: matchedItems.map((i: any) => i.id),
        timestamp: new Date().toISOString(),
      }));

      setEmailSubmitted(true);
      toast.success('Email saved! Now create your username.');
    } catch (error) {
      console.error('Error saving email:', error);
      toast.error('Failed to save email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      // Check if username is available
      const available = await checkUsernameAvailable(username);
      if (!available) {
        toast.error('Username already taken. Try another!');
        setIsLoading(false);
        return;
      }

      // Save account with matched item IDs
      const matchedItemIds = matchedItems.map((i: any) => i?.id).filter(Boolean) as string[];
      await savePlayerAccount(username, 0, matchedItemIds); // 0 score for swipe-only users

      // Set current user session
      setCurrentUser(username, email);

      setSavedUsername(username);
      setAccountCreated(true);
      toast.success(`Welcome, ${username}! Your matches have been saved.`);

      // Log analytics
      console.log('Account created from swipe:', {
        username,
        email,
        matchedItems: matchedItemIds,
      });
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full"
      >
        {/* Header */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full neon-border mb-4">
          <Heart className="w-10 h-10 text-primary fill-primary" />
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="arcade-text text-3xl font-bold text-foreground neon-glow mb-2"
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

        {/* Email + Account Creation Flow */}
        {!emailSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-6 neon-border"
          >
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Get Follow-Up</h2>
            </div>
            <p className="text-muted-foreground text-xs mb-3 text-center">
              Enter your email to receive information about your {matchedItems.length} matched {itemType}
            </p>
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-background border-border text-sm h-8"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-arcade px-3 py-1 text-xs disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Next'}
              </button>
            </form>
          </motion.div>
        ) : !accountCreated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-6 neon-border"
          >
            <div className="flex items-center gap-2 mb-2 justify-center">
              <User className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Create Username</h2>
            </div>
            <p className="text-muted-foreground text-xs mb-3 text-center">
              Choose a username to save your matches
            </p>
            <form onSubmit={handleAccountSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                disabled={isLoading}
                className="flex-1 bg-background border-border text-sm h-8"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-arcade px-3 py-1 text-xs disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Create'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/30"
          >
            <div className="flex items-center gap-3 text-primary">
              <Check className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">All set, <span className="text-success">{savedUsername}</span>!</p>
                <p className="text-xs opacity-80">We'll follow up about your matches at {email}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={resetGame}
            className="btn-arcade text-lg w-full flex items-center justify-center gap-3"
          >
            <ArrowRight className="w-5 h-5" />
            BACK TO START
          </button>
        </motion.div>

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
