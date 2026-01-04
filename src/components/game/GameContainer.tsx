import { WelcomeScreen } from './WelcomeScreen';
import { GameCanvas } from './GameCanvas';
import { LevelCompleteScreen } from './LevelCompleteScreen';
import { SwipeScreen } from './SwipeScreen';
import { GameOverScreen } from './GameOverScreen';
import { ResultsScreen } from './ResultsScreen';
import { useGame } from '@/context/GameContext';
import { AnimatePresence, motion } from 'framer-motion';

export const GameContainer = () => {
  const { gameState } = useGame();

  const renderScreen = () => {
    switch (gameState.currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'game':
        return <GameCanvas />;
      case 'levelComplete':
        return <LevelCompleteScreen />;
      case 'swipe':
        return <SwipeScreen />;
      case 'gameOver':
        return <GameOverScreen />;
      case 'results':
        return <ResultsScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
