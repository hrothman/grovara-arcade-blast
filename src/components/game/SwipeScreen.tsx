import { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { GROVARA_BRANDS } from '@/data/brands';
import { Heart, X, ArrowRight, Sparkles } from 'lucide-react';

const SWIPE_THRESHOLD = 100;

export const SwipeScreen = () => {
  const { gameState, recordSwipe, nextLevel } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Select brands for this level
  const levelBrands = useMemo(() => {
    const startIdx = ((gameState.currentLevel - 1) * 3) % GROVARA_BRANDS.length;
    return GROVARA_BRANDS.slice(startIdx, startIdx + 3);
  }, [gameState.currentLevel]);

  const currentBrand = levelBrands[currentIndex];
  const isComplete = currentIndex >= levelBrands.length;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentBrand) return;
    
    setSwipeDirection(direction);
    recordSwipe(currentBrand.id, direction);
    
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      handleSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full neon-border mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="arcade-text text-2xl font-bold text-foreground neon-glow mb-4">
            BRANDS DISCOVERED!
          </h2>
          
          <p className="text-muted-foreground mb-8">
            {gameState.currentLevel < 3 
              ? "Ready for the next level?"
              : "You've completed all levels!"
            }
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextLevel}
            className="btn-arcade text-lg flex items-center justify-center gap-3 mx-auto"
          >
            {gameState.currentLevel < 3 ? 'NEXT LEVEL' : 'SEE RESULTS'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-arcade flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-radial-glow opacity-50" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-8"
      >
        <h2 className="arcade-text text-xl font-bold text-foreground mb-2">
          DISCOVER BRANDS
        </h2>
        <p className="text-muted-foreground text-sm">
          Swipe right on brands you're interested in
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          {levelBrands.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx < currentIndex 
                  ? 'bg-primary' 
                  : idx === currentIndex 
                    ? 'bg-primary animate-pulse' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Swipe cards */}
      <div className="relative w-full max-w-sm h-[450px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentBrand && (
            <motion.div
              key={currentBrand.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: swipeDirection === 'left' ? -300 : swipeDirection === 'right' ? 300 : 0,
                rotate: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="absolute w-full cursor-grab active:cursor-grabbing"
            >
              <div className="bg-card rounded-3xl overflow-hidden card-swipe">
                {/* Brand image placeholder */}
                <div 
                  className="h-56 flex items-center justify-center"
                  style={{ backgroundColor: currentBrand.color + '20' }}
                >
                  <div 
                    className="w-32 h-32 rounded-2xl flex items-center justify-center text-6xl"
                    style={{ backgroundColor: currentBrand.color + '30' }}
                  >
                    🌱
                  </div>
                </div>
                
                {/* Brand info */}
                <div className="p-6">
                  <div 
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
                    style={{ 
                      backgroundColor: currentBrand.color + '20',
                      color: currentBrand.color,
                    }}
                  >
                    {currentBrand.category}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {currentBrand.name}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {currentBrand.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 flex items-center justify-center gap-8 mt-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-card border-2 border-destructive/50 flex items-center justify-center transition-all hover:bg-destructive/20"
        >
          <X className="w-8 h-8 text-destructive" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-card border-2 border-success/50 flex items-center justify-center transition-all hover:bg-success/20"
        >
          <Heart className="w-8 h-8 text-success" />
        </motion.button>
      </div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-xs mt-6 text-center"
      >
        ← Skip | Interested →
      </motion.p>
    </div>
  );
};
