import { useState, useEffect, useCallback } from 'react';
import { GameSession, SwipeAction, LevelData } from '@/types/game';
import {
  getOrCreateUser,
  getUserByEmail,
  getUserByEmailOrUsername,
  createGameSession,
  recordLevelResult,
  updateGameSession,
  recordSwipeAction,
  updateUserScores
} from '@/services';
import { updateLeaderboardScore } from '@/services/leaderboardService';
import { setCurrentUser as setCurrentUserSession } from '@/lib/leaderboardManager';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];

const generateSessionId = () => {
  return `grovara_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mobile/.test(ua)) return 'Mobile';
  return 'Desktop';
};

export const useGameSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [swipes, setSwipes] = useState<SwipeAction[]>([]);

  useEffect(() => {
    // Initialize user and session
    const initializeSession = async () => {
      console.log('🎮 Initializing game session...');
      
      // Get or create anonymous user
      const user = await getOrCreateUser();
      if (user) {
        setUserId(user.id);
        setCurrentUser(user);
        console.log('👤 User ID:', user.id);
        console.log('👤 User details:', user);
      }

      // Parse URL params from QR code
      const params = new URLSearchParams(window.location.search);
      
      const sessionId = params.get('sid') || generateSessionId();
      const boothSource = params.get('booth') || 'expo-west-2024';
      const campaign = params.get('utm_campaign') || 'grovara-expo';
      const deviceType = getDeviceType();

      const newSession: GameSession = {
        sessionId,
        boothSource,
        campaign,
        deviceType,
        startTime: new Date(),
      };

      setSession(newSession);

      // Create session in database
      if (user) {
        const dbSession = await createGameSession(
          user.id,
          sessionId,
          boothSource,
          campaign,
          deviceType,
          user.user_type || undefined
        );
        
        if (dbSession) {
          setDbSessionId(dbSession.id);
          console.log('✅ Game session created in database:', dbSession.id);
        }
      }
    };

    initializeSession();
  }, []);

  const recordLevel = useCallback(async (levelData: LevelData) => {
    console.log('📊 Recording level completion:', levelData);
    setLevels(prev => {
      const newLevels = [...prev, levelData];
      
      // Calculate cumulative score
      const cumulativeScore = newLevels.reduce((sum, level) => sum + level.score, 0);
      console.log('📈 Cumulative score:', cumulativeScore);
      
      // Only update leaderboard for registered users (with a real username)
      if (userId && currentUser && currentUser.username) {
        console.log('🏆 Updating leaderboard with cumulative score for:', currentUser.username);
        updateLeaderboardScore(
          userId,
          currentUser.username,
          cumulativeScore,
          dbSessionId || undefined
        ).catch(err => {
          console.error('Failed to update leaderboard:', err);
        });
      } else {
        console.log('⏭️ Skipping leaderboard update - user not registered yet');
      }
      
      return newLevels;
    });
    
    // Save level result to database
    if (userId && dbSessionId) {
      await recordLevelResult(
        dbSessionId,
        userId,
        levelData.level,
        {
          score: levelData.score,
          enemiesKilled: levelData.enemiesHit,
          productsOnShelf: levelData.productsOnShelf ?? 0,
          ultraRareCount: 0,
          completed: levelData.completed,
          durationSeconds: 0,
        }
      );
    }
  }, [userId, dbSessionId, currentUser]);

  const recordSwipe = useCallback(async (brandId: string, direction: 'left' | 'right', userType?: 'buyer' | 'brand' | null) => {
    if (!session) return;

    console.log('👆 Recording swipe:', { brandId, direction, userId, dbSessionId });

    const swipeAction: SwipeAction = {
      sessionId: session.sessionId,
      brandId,
      direction,
      timestamp: new Date(),
    };

    setSwipes(prev => [...prev, swipeAction]);

    // Bug #7 fix: item_type is the opposite of userType (brands swipe on buyers, buyers swipe on brands)
    const itemType = userType === 'brand' ? 'buyer' : 'brand';

    // Save to database - IMPORTANT: Use dbSessionId (UUID) not session.sessionId (string)
    if (userId && dbSessionId) {
      console.log('💾 Saving swipe to database:', { dbSessionId, userId, brandId, direction, itemType });
      await recordSwipeAction(
        dbSessionId, // Use database UUID, not frontend session string!
        userId,
        brandId,
        brandId, // Use brandId as name for now
        itemType,
        direction,
        swipes.length + 1, // Position
        levels.length // Current level
      );
    } else {
      console.warn('⚠️ Cannot save swipe - missing userId or dbSessionId:', { userId, dbSessionId });
    }
  }, [session, userId, dbSessionId, swipes.length, levels.length]);

  const setEmail = useCallback((email: string) => {
    setSession(prev => prev ? { ...prev, email } : null);
  }, []);

  const getAnalyticsData = useCallback(() => {
    return {
      session,
      levels,
      swipes,
      totalScore: levels.reduce((sum, l) => sum + l.score, 0),
      matchedBrands: swipes.filter(s => s.direction === 'right').length,
      completedLevels: levels.filter(l => l.completed).length,
    };
  }, [session, levels, swipes]);

  const finishGame = useCallback(async (totalScore: number) => {
    if (userId) {
      console.log('🏁 Game finished — updating user stats (games_played +1) and leaderboard');

      // Only update leaderboard for registered users (with a real username)
      if (currentUser && currentUser.username) {
        console.log('🏆 Updating leaderboard with final score:', totalScore, 'for:', currentUser.username);
        await updateLeaderboardScore(userId, currentUser.username, totalScore, dbSessionId || undefined).catch(err => {
          console.error('Failed to update leaderboard at game end:', err);
        });
      } else {
        console.log('⏭️ Skipping final leaderboard update - user not registered');
      }

      // Update user stats (games_played +1, best_score, total_score)
      await updateUserScores(userId, totalScore).catch(err => {
        console.error('Failed to update user scores:', err);
      });
    }
  }, [userId, currentUser, dbSessionId]);

  const resetSession = useCallback(() => {
    setLevels([]);
    setSwipes([]);
  }, []);

  const loadUserByEmail = useCallback(async (emailOrUsername: string): Promise<boolean> => {
    try {
      const user = await getUserByEmailOrUsername(emailOrUsername);
      if (user) {
        setUserId(user.id);
        setCurrentUser(user);

        // Save to localStorage so getCurrentUser() works across components
        if (user.username) {
          setCurrentUserSession(
            user.username,
            user.email || undefined,
          );
        }

        console.log('✅ User loaded and session saved:', user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading user:', error);
      return false;
    }
  }, []);

  const exportToCSV = useCallback(() => {
    const data = getAnalyticsData();
    const csvContent = [
      ['Session ID', 'Booth', 'Campaign', 'Device', 'Email', 'Total Score', 'Matched Brands', 'Completed Levels'],
      [
        data.session?.sessionId || '',
        data.session?.boothSource || '',
        data.session?.campaign || '',
        data.session?.deviceType || '',
        data.session?.email || '',
        data.totalScore.toString(),
        data.matchedBrands.toString(),
        data.completedLevels.toString(),
      ],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grovara_session_${data.session?.sessionId || 'unknown'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getAnalyticsData]);

  return {
    session,
    userId,
    currentUser,
    dbSessionId,
    levels,
    swipes,
    recordLevel,
    recordSwipe,
    finishGame,
    resetSession,
    setEmail,
    getAnalyticsData,
    exportToCSV,
    loadUserByEmail,
  };
};
