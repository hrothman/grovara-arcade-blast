import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
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

const TOTAL_LEVELS = 5;
const INITIAL_LIVES = 5;

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    session,
    currentUser,
    initSession,
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

  const totalScoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const currentLevelRef = useRef(1);
  useEffect(() => { totalScoreRef.current = gameState.totalScore; }, [gameState.totalScore]);

  const startGame = useCallback(() => {
    livesRef.current = INITIAL_LIVES;
    currentLevelRef.current = 1;
    totalScoreRef.current = 0;
    // Create the DB game session now (deferred from mount to avoid null users)
    initSession();
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
  }, [session, initSession]);

  const addScore = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      totalScore: prev.totalScore + points,
    }));
  }, []);

  const loseLife = useCallback(() => {
    // Decrement ref immediately (not inside updater) to avoid React 18 batching issues
    const newLives = livesRef.current - 1;
    livesRef.current = newLives;

    setGameState(prev => ({
      ...prev,
      lives: Math.max(0, newLives),
      ...(newLives <= 0 ? { currentScreen: 'gameOver' as const } : {}),
    }));

    if (newLives <= 0) {
      finishGame(totalScoreRef.current);
    }
  }, [finishGame]);

  const completeLevel = useCallback((levelData: LevelData) => {
    recordLevel(levelData);
    const isFinalLevel = currentLevelRef.current >= TOTAL_LEVELS;

    setGameState(prev => ({
      ...prev,
      levels: [...prev.levels, levelData],
      currentScreen: isFinalLevel ? 'gameComplete' as const : 'levelComplete' as const,
    }));

    if (isFinalLevel) {
      finishGame(totalScoreRef.current);
    }
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
    const isFinalLevel = currentLevelRef.current >= TOTAL_LEVELS;

    if (isFinalLevel) {
      setGameState(prev => ({ ...prev, currentScreen: 'gameComplete' as const }));
      finishGame(totalScoreRef.current);
    } else {
      currentLevelRef.current += 1;
      setGameState(prev => ({
        ...prev,
        currentLevel: prev.currentLevel + 1,
        currentScreen: 'game' as const,
      }));
    }
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
    livesRef.current = INITIAL_LIVES;
    currentLevelRef.current = 1;
    totalScoreRef.current = 0;
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
