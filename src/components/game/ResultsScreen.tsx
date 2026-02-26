import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { GROVARA_BRANDS } from '@/data/brands';
import { Trophy, Heart, User, RefreshCw, Share2, Check, Medal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getLeaderboard, updateLeaderboardScore } from '@/services/leaderboardService';
import { registerUser, checkUsernameAvailable } from '@/services/userService';
import { UserInfoModal } from './UserInfoModal';
import { getCurrentUser, setCurrentUser } from '@/lib/leaderboardManager';

export const ResultsScreen = () => {
  const { gameState, resetGame, getAnalytics, currentUser } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [savedUsername, setSavedUsername] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [username] = useState(`user${Math.floor(Math.random() * 10000000)}`);
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const playerRowRef = useRef<HTMLDivElement>(null);

  const matchedBrands = gameState.swipes
    .filter(s => s.direction === 'right')
    .map(s => GROVARA_BRANDS.find(b => b.id === s.brandId))
    .filter(Boolean);

  const analytics = getAnalytics();

  // Use saved username if available, otherwise use temporary one
  const displayUsername = savedUsername || username;

  // Load merged leaderboard on mount and when account is created
  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await getLeaderboard(50);
      // Map to simple format
      const mapped = entries.map(entry => ({
        username: entry.username,
        score: entry.score
      }));
      
      // Check if current user exists
      const currentUser = getCurrentUser();
      // Only add current player if not already in leaderboard (new temporary player)
      const playerExists = mapped.some(entry => entry.username === displayUsername) || currentUser;
      const withPlayer = playerExists
        ? mapped
        : [
            ...mapped,
            { username: displayUsername, score: gameState.totalScore }
          ];
      setLeaderboard(withPlayer.sort((a, b) => b.score - a.score));
    };
    loadLeaderboard();
  }, [displayUsername, gameState.totalScore, accountCreated]);

  const playerRank = leaderboard.findIndex(entry => entry.username === displayUsername) + 1;

  // Auto-scroll to player position with acceleration
  useEffect(() => {
    if (leaderboardRef.current && playerRowRef.current) {
      const container = leaderboardRef.current;
      const playerRow = playerRowRef.current;
      const targetScroll = playerRow.offsetTop - container.offsetTop - 100;

      if (targetScroll > 0) {
        let currentScroll = 0;
        let velocity = 0;
        const acceleration = 0.5;
        const maxVelocity = 30;

        const animate = () => {
          if (currentScroll < targetScroll) {
            velocity = Math.min(velocity + acceleration, maxVelocity);
            currentScroll += velocity;
            container.scrollTop = Math.min(currentScroll, targetScroll);
            requestAnimationFrame(animate);
          }
        };

        setTimeout(() => animate(), 1000);
      }
    }
  }, []);

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

      // Update/create leaderboard entry with cumulative score
      await updateLeaderboardScore(
        registeredUser.id,
        username,
        gameState.totalScore,
        undefined // session ID
      );

      // Set current user session
      setCurrentUser(username, email);

      setSavedUsername(username);
      setSavedEmail(email);
      setAccountCreated(true);
      setShowModal(false);
      toast.success(`Welcome, ${username}! Your score has been saved.`);

      // Log analytics
      console.log('Account created:', {
        username,
        email,
        score: gameState.totalScore,
        matchedBrands: matchedBrands.map(b => b?.id),
        dbUser: registeredUser,
        ...analytics,
      });
    } catch (error) {
      console.error('Error creating account:', error);
      if (error instanceof Error && error.message !== 'Username taken') {
        toast.error('Failed to create account. Please try again.');
      }
      throw error;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Grovara B2B Blaster',
        text: `I scored ${gameState.totalScore.toLocaleString()} points playing Grovara B2B Blaster at Expo West!`,
        url: window.location.origin,
      });
    } else {
      toast.success('Score copied to clipboard!');
    }
  };

  return (
    <div className="h-screen max-h-screen gradient-arcade flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-x-hidden overflow-y-auto" style={{ maxHeight: '100vh', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="absolute inset-0 gradient-radial-glow opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative z-10 text-center max-w-md mx-auto w-full"
      >
        {/* Header */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full neon-border mb-4">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="arcade-text text-3xl font-bold text-foreground neon-glow mb-8"
        >
          MISSION COMPLETE!
        </motion.h1>

        {/* Combined Score & Leaderboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border"
        >
          {/* Score Display */}
          <div className="text-center mb-6">
            <span className="arcade-text text-4xl text-warning score-glow">
              {gameState.totalScore.toLocaleString()}
            </span>
            <p className="text-muted-foreground text-sm mt-2">Total Score</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-6 mb-6 border-b border-border">
            <div className="text-center">
              <span className="arcade-text text-xl text-foreground">
                {gameState.levels.length}
              </span>
              <p className="text-muted-foreground text-xs mt-1">Levels</p>
            </div>
            <div className="text-center">
              <span className="arcade-text text-xl text-primary">
                {matchedBrands.length}
              </span>
              <p className="text-muted-foreground text-xs mt-1">Matched Brands</p>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Medal className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Leaderboard</h2>
            <span className="text-sm text-muted-foreground">Rank #{playerRank}</span>
          </div>

          <div 
            ref={leaderboardRef}
            className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar"
          >
            {leaderboard.map((entry, idx) => {
              const isPlayer = entry.username === displayUsername;
              const rank = idx + 1;
              
              return (
                <div
                  key={entry.username}
                  ref={isPlayer ? playerRowRef : null}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all text-sm ${
                    isPlayer 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-background/50 hover:bg-background/70'
                  }`}
                >
                  <span className={`arcade-text text-xs w-6 text-center ${
                    rank === 1 ? 'text-warning' :
                    rank === 2 ? 'text-muted-foreground' :
                    rank === 3 ? 'text-orange-400' :
                    'text-muted-foreground'
                  }`}>
                    {rank <= 3 ? '🏆' : rank}
                  </span>
                  <span className={`flex-1 font-medium truncate ${
                    isPlayer ? 'text-primary' : 'text-foreground'
                  }`}>
                    {isPlayer ? `${entry.username} (You)` : entry.username}
                  </span>
                  <span className={`arcade-text text-xs ${
                    isPlayer ? 'text-primary' : 'text-warning'
                  }`}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Matched brands */}
        {matchedBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-6 neon-border"
          >
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Heart className="w-4 h-4 text-success fill-success" />
              <h2 className="font-semibold text-foreground text-sm">Your Matched Brands</h2>
            </div>
            
            <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
              {matchedBrands.map((brand, idx) => (
                <motion.div
                  key={brand?.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="bg-background/50 rounded-lg p-2 flex items-center gap-2 text-sm"
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: brand?.color + '30' }}
                  >
                    🌱
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-xs truncate">{brand?.name}</h3>
                  </div>
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Account Creation */}
        {!accountCreated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => setShowModal(true)}
              className="btn-arcade w-full text-lg mb-2 flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              SAVE YOUR SCORE
            </button>
            <p className="text-xs text-muted-foreground text-center mb-6">
              Save your score and connect with your {matchedBrands.length} matched brands
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/30"
          >
            <div className="flex items-center gap-3 text-primary">
              <Check className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Score saved as <span className="text-success">{savedUsername}</span>!</p>
                <p className="text-xs opacity-80">We'll follow up at {savedEmail}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* User Info Modal */}
        <UserInfoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleUserInfoSubmit}
          title="Save Your Score"
          description="Create an account to save your score and connect with matched brands"
          showMatchesInfo={matchedBrands.length > 0}
          matchCount={matchedBrands.length}
          matchType="brands"
          submitButtonText="Save to Leaderboard"
        />

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3 mb-4"
        >
          <button
            onClick={handleShare}
            className="flex-1 bg-card/80 hover:bg-card transition-colors rounded-xl py-2 flex items-center justify-center gap-2 text-foreground text-sm"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={resetGame}
            className="flex-1 bg-card/80 hover:bg-card transition-colors rounded-xl py-2 flex items-center justify-center gap-2 text-foreground text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Play Again
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-muted-foreground text-xs"
        >
          Thank you for playing! • Expo West 2026
        </motion.p>
      </motion.div>
    </div>
  );
};
