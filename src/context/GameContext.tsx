import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState, LevelData, SwipeAction } from '@/types/game';
import { useGameSession } from '@/hooks/useGameSession';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];

interface GameContextType {
  gameState: GameState;
  currentUser: User | null;
  startGame: () => void;
  completeLevel: (levelData: LevelData) => void;
  recordSwipe: (brandId: string, direction: 'left' | 'right') => void;
  nextLevel: () => void;
  goToSwipe: () => void;
  goToResults: () => void;
  goToLeaderboard: () => void;
  goToSwipeSummary: () => void;
  goToLoadProgress: () => void;
  resetGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  setEmail: (email: string) => void;
  getAnalytics: () => any;
  setUserType: (type: 'buyer' | 'brand') => void;
  loadUserByEmail: (email: string) => Promise<boolean>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const TOTAL_LEVELS = 3;
const INITIAL_LIVES = 3;

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    session,
    currentUser,
    recordLevel,
    recordSwipe: sessionRecordSwipe,
    finishGame,
    resetSession,
    setEmail: sessionSetEmail,
    getAnalyticsData,
    loadUserByEmail,
  } = useGameSession();

  const [gameState, setGameState] = useState<GameState>({
    currentScreen: 'welcome',
    currentLevel: 1,
    totalScore: 0,
    lives: INITIAL_LIVES,
    levels: [],
    swipes: [],
    session: null,
    userType: null,
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
        // Game over — update user stats (games_played +1)
        finishGame(prev.totalScore);
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
  }, [finishGame]);

  const completeLevel = useCallback((levelData: LevelData) => {
    recordLevel(levelData);
    setGameState(prev => {
      if (prev.currentLevel >= TOTAL_LEVELS) {
        // Final level — go straight to victory screen
        finishGame(prev.totalScore);
        return {
          ...prev,
          levels: [...prev.levels, levelData],
          currentScreen: 'gameComplete',
        };
      }
      return {
        ...prev,
        levels: [...prev.levels, levelData],
        currentScreen: 'levelComplete',
      };
    });
  }, [recordLevel, finishGame]);

  const recordSwipe = useCallback((brandId: string, direction: 'left' | 'right') => {
    sessionRecordSwipe(brandId, direction, gameState.userType);
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
  }, [session, sessionRecordSwipe, gameState.userType]);

  const nextLevel = useCallback(() => {
    setGameState(prev => {
      if (prev.currentLevel >= TOTAL_LEVELS) {
        // All levels complete — update user stats (games_played +1)
        finishGame(prev.totalScore);
        return {
          ...prev,
          currentScreen: 'gameComplete',
        };
      }
      return {
        ...prev,
        currentLevel: prev.currentLevel + 1,
        currentScreen: 'game',
      };
    });
  }, [finishGame]);

  const goToSwipe = useCallback(() => {
    setGameState(prev => {
      // If userType hasn't been set yet, go to user type selection first
      if (prev.userType === null) {
        return {
          ...prev,
          currentScreen: 'userTypeSelection',
        };
      }
      // Otherwise go directly to swipe
      return {
        ...prev,
        currentScreen: 'swipe',
      };
    });
  }, []);

  const goToResults = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'results',
    }));
  }, []);

  const goToLeaderboard = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'leaderboard',
    }));
  }, []);

  const goToSwipeSummary = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'swipeSummary',
    }));
  }, []);

  const goToLoadProgress = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'loadProgress',
    }));
  }, []);

  const resetGame = useCallback(() => {
    resetSession(); // Clear accumulated levels/swipes in session hook
    setGameState({
      currentScreen: 'welcome',
      currentLevel: 1,
      totalScore: 0,
      lives: INITIAL_LIVES,
      levels: [],
      swipes: [],
      session,
      userType: null,
    });
  }, [session, resetSession]);

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

  const setUserType = useCallback((type: 'buyer' | 'brand') => {
    setGameState(prev => ({
      ...prev,
      userType: type,
      currentScreen: 'swipe',
    }));
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentUser,
        startGame,
        completeLevel,
        recordSwipe,
        nextLevel,
        goToSwipe,
        goToResults,
        goToLeaderboard,
        goToSwipeSummary,
        goToLoadProgress,
        resetGame,
        addScore,
        loseLife,
        setEmail,
        getAnalytics,
        setUserType,
        loadUserByEmail,
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
