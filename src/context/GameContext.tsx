import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState, LevelData, SwipeAction } from '@/types/game';
import { useGameSession } from '@/hooks/useGameSession';

interface GameContextType {
  gameState: GameState;
  startGame: () => void;
  completeLevel: (levelData: LevelData) => void;
  recordSwipe: (brandId: string, direction: 'left' | 'right') => void;
  nextLevel: () => void;
  goToSwipe: () => void;
  goToResults: () => void;
  resetGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  setEmail: (email: string) => void;
  getAnalytics: () => any;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const TOTAL_LEVELS = 3;
const INITIAL_LIVES = 3;

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    session,
    recordLevel,
    recordSwipe: sessionRecordSwipe,
    setEmail: sessionSetEmail,
    getAnalyticsData,
  } = useGameSession();

  const [gameState, setGameState] = useState<GameState>({
    currentScreen: 'welcome',
    currentLevel: 1,
    totalScore: 0,
    lives: INITIAL_LIVES,
    levels: [],
    swipes: [],
    session: null,
  });

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'game',
      currentLevel: 1,
      totalScore: 0,
      lives: INITIAL_LIVES,
      levels: [],
      swipes: [],
      session,
    }));
  }, [session]);

  const addScore = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      totalScore: prev.totalScore + points,
    }));
  }, []);

  const loseLife = useCallback(() => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        return {
          ...prev,
          lives: 0,
          currentScreen: 'gameOver',
        };
      }
      return {
        ...prev,
        lives: newLives,
      };
    });
  }, []);

  const completeLevel = useCallback((levelData: LevelData) => {
    recordLevel(levelData);
    setGameState(prev => ({
      ...prev,
      levels: [...prev.levels, levelData],
      currentScreen: 'levelComplete',
    }));
  }, [recordLevel]);

  const recordSwipe = useCallback((brandId: string, direction: 'left' | 'right') => {
    sessionRecordSwipe(brandId, direction);
    const swipeAction: SwipeAction = {
      sessionId: session?.sessionId || '',
      brandId,
      direction,
      timestamp: new Date(),
    };
    setGameState(prev => ({
      ...prev,
      swipes: [...prev.swipes, swipeAction],
    }));
  }, [session, sessionRecordSwipe]);

  const nextLevel = useCallback(() => {
    setGameState(prev => {
      if (prev.currentLevel >= TOTAL_LEVELS) {
        return {
          ...prev,
          currentScreen: 'results',
        };
      }
      return {
        ...prev,
        currentLevel: prev.currentLevel + 1,
        currentScreen: 'game',
      };
    });
  }, []);

  const goToSwipe = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'swipe',
    }));
  }, []);

  const goToResults = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'results',
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      currentScreen: 'welcome',
      currentLevel: 1,
      totalScore: 0,
      lives: INITIAL_LIVES,
      levels: [],
      swipes: [],
      session,
    });
  }, [session]);

  const setEmail = useCallback((email: string) => {
    sessionSetEmail(email);
    setGameState(prev => ({
      ...prev,
      session: prev.session ? { ...prev.session, email } : null,
    }));
  }, [sessionSetEmail]);

  const getAnalytics = useCallback(() => {
    return getAnalyticsData();
  }, [getAnalyticsData]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        startGame,
        completeLevel,
        recordSwipe,
        nextLevel,
        goToSwipe,
        goToResults,
        resetGame,
        addScore,
        loseLife,
        setEmail,
        getAnalytics,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
