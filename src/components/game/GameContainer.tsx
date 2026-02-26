import { WelcomeScreen } from './WelcomeScreen';
import { GameCanvas } from './GameCanvas';
import { LevelCompleteScreen } from './LevelCompleteScreen';
import { GameCompleteScreen } from './GameCompleteScreen';
import { SwipeScreen } from './SwipeScreen';
import { SwipeSummaryScreen } from './SwipeSummaryScreen';
import { GameOverScreen } from './GameOverScreen';
import { ResultsScreen } from './ResultsScreen';
import { UserTypeSelectionScreen } from './UserTypeSelectionScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { LoadProgressScreen } from './LoadProgressScreen';
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
      case 'gameComplete':
        return <GameCompleteScreen />;
      case 'userTypeSelection':
        return <UserTypeSelectionScreen />;
      case 'swipe':
        return <SwipeScreen />;
      case 'swipeSummary':
        return <SwipeSummaryScreen />;
      case 'gameOver':
        return <GameOverScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'loadProgress':
        return <LoadProgressScreen />;
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
