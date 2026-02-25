import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import featuredBrandsData from '@/data/featuredBrands.json';
import buyersData from '@/data/buyers.json';
import { Heart, X, CheckCircle, Tag } from 'lucide-react';
import { SwipeInstructionsModal } from './SwipeInstructionsModal';

const SWIPE_THRESHOLD = 100;

type SwipeItem = {
  id: string;
  name: string;
  description: string;
  category?: string;
  imageUrl: string;
  color: string;
  emoji?: string;
  topSKUs?: string[];
  tags?: string[];
};

const BRAND_COLORS = ['#10B981', '#22D3EE', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];

const buildItems = (items: any[]): SwipeItem[] => {
  return items.map((item: any, idx: number) => {
    const color = BRAND_COLORS[idx % BRAND_COLORS.length];
    return {
      id: item.id,
      name: item.name,
      description: item.description || `Explore ${item.name} on Grovara`,
      category: item.category,
      imageUrl: item.imageUrl,
      color,
      emoji: item.emoji,
      topSKUs: item.topSKUs,
      tags: item.tags,
    };
  });
};

const FEATURED_BRANDS = buildItems(featuredBrandsData);
const BUYERS = buildItems(buyersData);

export const SwipeScreen = () => {
  const { gameState, recordSwipe, goToSwipeSummary } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [swipeStarted, setSwipeStarted] = useState(false);

  // Select items based on user type
  const items = gameState.userType === 'brand' ? BUYERS : FEATURED_BRANDS;
  const itemType = gameState.userType === 'brand' ? 'BUYERS' : 'BRANDS';

  // Select items for this level
  const levelItems = useMemo(() => {
    const startIdx = ((gameState.currentLevel - 1) * 3) % items.length;
    return items.slice(startIdx, startIdx + 3);
  }, [gameState.currentLevel, items]);

  const currentBrand = levelItems[currentIndex];
  const isComplete = currentIndex >= levelItems.length;

  // Reset instructions when entering swipe screen
  useEffect(() => {
    setShowInstructions(true);
    setSwipeStarted(false);
    setCurrentIndex(0);
    setSwipeDirection(null);
  }, [gameState.currentLevel]);

  const handleStartSwipe = () => {
    setShowInstructions(false);
    setSwipeStarted(true);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!swipeStarted) return;
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
      <div className="min-h-screen relative flex flex-col overflow-hidden">
        {/* Gradient Background Layer */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/discovered/gradient.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Stars Overlay Layer */}
        <div 
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: 'url(/discovered/stars.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            opacity: 0.8,
          }}
        />

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-30 flex flex-col items-center justify-center text-center px-4 sm:px-6 flex-1"
        >
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6"
            style={{ 
              fontFamily: 'var(--font-pixel)',
              textShadow: '3px 3px 0px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)',
              fontSize: 'clamp(1.75rem, 6vw, 3rem)',
            }}
          >
            {itemType === 'BRANDS' ? 'Brand' : 'Buyer'} Discovered!
          </h2>
          
          <p 
            className="text-gray-300 mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base md:text-lg font-light"
            style={{ fontFamily: 'var(--font-pixel)', fontWeight: 300 }}
          >
            See your matches and get follow-up information
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToSwipeSummary}
            className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold text-white rounded-lg sm:rounded-xl"
            style={{
              fontFamily: 'var(--font-pixel)',
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0,0,0,0.4)',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            VIEW MATCHES
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-30 pb-6 sm:pb-8 text-center"
        >
          <p
            className="text-gray-300 text-xs sm:text-sm"
            style={{ fontFamily: 'var(--font-pixel)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            Expo West 2026 • Powered by Grovara
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center p-4 sm:p-6 overflow-hidden">
      {/* Instructions Modal */}
      <SwipeInstructionsModal 
        isOpen={showInstructions} 
        onStart={handleStartSwipe}
        itemType={itemType}
      />

      {/* Gradient Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/swipe/gradient.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Stars Overlay Layer */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: 'url(/swipe/stars.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
        }}
      />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-30 text-center mb-2 sm:mb-3 md:mb-4 mt-2 sm:mt-4 flex-shrink-0"
      >
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3"
          style={{ 
            fontFamily: 'var(--font-pixel)',
            textShadow: '3px 3px 0px rgba(0,0,0,0.8)',
            fontSize: 'clamp(1.25rem, 5vw, 2.5rem)',
          }}
        >
          Discover {itemType === 'BRANDS' ? 'Brands' : 'Buyers'}
        </h2>
        <p 
          className="text-gray-300 text-xs sm:text-sm"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          Swipe right on {itemType.toLowerCase()} you're interesting in
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3 md:mt-4">
          {levelItems.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                idx < currentIndex 
                  ? 'bg-white' 
                  : idx === currentIndex 
                    ? 'bg-white animate-pulse' 
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Swipe cards */}
      <div className="relative z-30 w-full max-w-md flex-1 flex items-center justify-center mb-2 sm:mb-3 md:mb-4 min-h-0">
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
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              drag={swipeStarted ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className={`absolute w-full ${swipeStarted ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            >
              <div className="bg-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border-3 sm:border-4 border-white relative shadow-2xl">
                {/* Swipe feedback overlay */}
                <AnimatePresence>
                  {swipeDirection === 'right' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm z-10 rounded-2xl sm:rounded-3xl"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.6 }}
                          className="mb-2"
                        >
                          <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-400 mx-auto" strokeWidth={3} />
                        </motion.div>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-xl sm:text-2xl text-green-400 font-bold"
                          style={{ fontFamily: 'var(--font-pixel)' }}
                        >
                          MATCH SAVED!
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                  {swipeDirection === 'left' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="absolute inset-0 flex items-center justify-center z-10 bg-red-500/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6 }}
                      >
                        <X className="w-16 h-16 sm:w-20 sm:h-20 text-red-400" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Brand/Buyer image */}
                <div 
                  className="h-48 sm:h-52 md:h-56 flex items-center justify-center bg-black/40 p-4 sm:p-6"
                >
                  {currentBrand.imageUrl ? (
                    <img
                      src={currentBrand.imageUrl}
                      alt={currentBrand.name}
                      className="max-h-full max-w-full object-contain drop-shadow-2xl"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-8xl">
                      {currentBrand.emoji || '📦'}
                    </div>
                  )}
                </div>
                
                {/* Brand/Buyer details */}
                <div className="p-3 sm:p-4 md:p-5 bg-gray-900 overflow-hidden">
                  {/* Brand name */}
                  <h3 
                    className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1.5 sm:mb-2"
                    style={{ 
                      fontFamily: 'var(--font-pixel)',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                    }}
                  >
                    {currentBrand.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-[10px] sm:text-xs mb-2 leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-pixel)' }}>
                    {currentBrand.description}
                  </p>
                  
                  {/* Top SKUs */}
                  {currentBrand.topSKUs && currentBrand.topSKUs.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-white text-[10px] sm:text-xs font-bold mb-1" style={{ fontFamily: 'var(--font-pixel)' }}>
                        Top SKUs
                      </h4>
                      <ul className="text-gray-400 text-[9px] sm:text-[10px] space-y-0.5" style={{ fontFamily: 'var(--font-pixel)' }}>
                        {currentBrand.topSKUs.slice(0, 3).map((sku, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-1">•</span>
                            <span className="line-clamp-1">{sku}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {currentBrand.tags && currentBrand.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {currentBrand.tags.slice(0, 4).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/20 text-primary text-[8px] sm:text-[9px] rounded-full border border-primary/30"
                          style={{ fontFamily: 'var(--font-pixel)' }}
                        >
                          <Tag className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="relative z-30 flex items-center justify-center gap-8 sm:gap-12 md:gap-16 mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <motion.button
            whileHover={swipeStarted ? { scale: 1.1 } : {}}
            whileTap={swipeStarted ? { scale: 0.9 } : {}}
            onClick={() => handleSwipe('left')}
            disabled={!swipeStarted}
            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-900 border-2 sm:border-3 md:border-4 border-red-500 flex items-center justify-center transition-all shadow-lg ${
              swipeStarted ? 'hover:bg-red-500/20 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <X className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-red-500" strokeWidth={3} />
          </motion.button>
          <span 
            className="text-white text-xs sm:text-sm font-bold"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            Skip
          </span>
        </div>
        
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <motion.button
            whileHover={swipeStarted ? { scale: 1.1 } : {}}
            whileTap={swipeStarted ? { scale: 0.9 } : {}}
            onClick={() => handleSwipe('right')}
            disabled={!swipeStarted}
            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-900 border-2 sm:border-3 md:border-4 border-green-500 flex items-center justify-center transition-all shadow-lg ${
              swipeStarted ? 'hover:bg-green-500/20 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-500" strokeWidth={2.5} fill="currentColor" />
          </motion.button>
          <span 
            className="text-white text-xs sm:text-sm font-bold"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            Interested
          </span>
        </div>
      </div>

      {/* Footer - Sticks to bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-30 mt-auto pb-2 sm:pb-3 flex-shrink-0"
      >
        <p className="text-gray-400 text-xs text-center" style={{ fontFamily: 'var(--font-pixel)' }}>
          Expo West 2026 • Powered by Grovara
        </p>
      </motion.div>
    </div>
  );
};
