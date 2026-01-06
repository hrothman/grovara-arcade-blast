import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { ShoppingCart, Briefcase } from 'lucide-react';

export const UserTypeSelectionScreen = () => {
  const { setUserType } = useGame();

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow opacity-50" />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-12"
      >
        <h1 className="arcade-text text-4xl font-bold text-foreground neon-glow mb-4">
          WHO ARE YOU?
        </h1>
        <p className="text-muted-foreground text-lg">
          Select your role to discover matching opportunities
        </p>
      </motion.div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-8 max-w-2xl mx-auto">
        {/* Buyer Option */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUserType('buyer')}
          className="flex-1 p-8 rounded-2xl bg-card border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all card-swipe"
        >
          <div className="flex flex-col items-center">
            <div className="mb-4 p-4 bg-primary/20 rounded-full">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="arcade-text text-2xl font-bold text-foreground mb-2">
              BUYER
            </h2>
            <p className="text-muted-foreground text-sm text-center">
              Discover brands that match your store or business needs
            </p>
          </div>
        </motion.button>

        {/* Brand Option */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUserType('brand')}
          className="flex-1 p-8 rounded-2xl bg-card border-2 border-success/50 hover:border-success hover:bg-success/10 transition-all card-swipe"
        >
          <div className="flex flex-col items-center">
            <div className="mb-4 p-4 bg-success/20 rounded-full">
              <Briefcase className="w-8 h-8 text-success" />
            </div>
            <h2 className="arcade-text text-2xl font-bold text-foreground mb-2">
              BRAND
            </h2>
            <p className="text-muted-foreground text-sm text-center">
              Find retailers and businesses that could carry your products
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
};
