import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { GROVARA_BRANDS } from '@/data/brands';
import { Trophy, Heart, Mail, RefreshCw, Share2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const ResultsScreen = () => {
  const { gameState, setEmail, resetGame, getAnalytics } = useGame();
  const [emailInput, setEmailInput] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const matchedBrands = gameState.swipes
    .filter(s => s.direction === 'right')
    .map(s => GROVARA_BRANDS.find(b => b.id === s.brandId))
    .filter(Boolean);

  const analytics = getAnalytics();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      setEmail(emailInput);
      setEmailSubmitted(true);
      toast.success("You're on the list! We'll be in touch.");
      
      // Log analytics
      console.log('Final analytics:', { ...analytics, email: emailInput });
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
    <div className="min-h-screen gradient-arcade p-6 pb-24 overflow-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full neon-border mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="arcade-text text-2xl font-bold text-foreground neon-glow mb-2">
            MISSION COMPLETE
          </h1>
          <p className="text-muted-foreground">
            Great work taking down outdated B2B!
          </p>
        </motion.div>

        {/* Score summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border"
        >
          <div className="text-center mb-4">
            <span className="arcade-text text-4xl text-warning score-glow">
              {gameState.totalScore.toLocaleString()}
            </span>
            <p className="text-muted-foreground text-sm mt-1">Total Score</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
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
        </motion.div>

        {/* Matched brands */}
        {matchedBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-success fill-success" />
              <h2 className="font-semibold text-foreground">Your Matched Brands</h2>
            </div>
            
            <div className="space-y-3">
              {matchedBrands.map((brand, idx) => (
                <motion.div
                  key={brand?.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="bg-card rounded-xl p-4 flex items-center gap-4"
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: brand?.color + '20' }}
                  >
                    🌱
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{brand?.name}</h3>
                    <p className="text-muted-foreground text-xs">{brand?.category}</p>
                  </div>
                  <div className="text-success">
                    <Check className="w-5 h-5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Email capture */}
        {!emailSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 mb-6 neon-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Stay Connected</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Get updates on your matched brands and exclusive Grovara content.
            </p>
            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 bg-background border-border"
              />
              <button
                type="submit"
                className="btn-arcade px-4 py-2 text-sm"
              >
                Join
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/10 rounded-2xl p-6 mb-6 border border-success/30"
          >
            <div className="flex items-center gap-3 text-success">
              <Check className="w-6 h-6" />
              <div>
                <p className="font-semibold">You're on the list!</p>
                <p className="text-sm opacity-80">We'll be in touch soon.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          <button
            onClick={handleShare}
            className="flex-1 bg-card hover:bg-secondary transition-colors rounded-xl py-3 flex items-center justify-center gap-2 text-foreground"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
          <button
            onClick={resetGame}
            className="flex-1 bg-card hover:bg-secondary transition-colors rounded-xl py-3 flex items-center justify-center gap-2 text-foreground"
          >
            <RefreshCw className="w-5 h-5" />
            Play Again
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-muted-foreground text-xs mt-8"
        >
          Thank you for playing!<br />
          Grovara • Expo West 2024
        </motion.p>
      </div>
    </div>
  );
};
