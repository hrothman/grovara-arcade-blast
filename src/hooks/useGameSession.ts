import { useState, useEffect, useCallback, useRef } from 'react';
import { GameSession, SwipeAction, LevelData } from '@/types/game';
import {
  getOrCreateUser,
  getUserByEmail,
  getUserByEmailOrUsername,
  createGameSession,
  completeGameSession,
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

  // Refs to avoid stale closures in callbacks (critical for leaderboard updates)
  const currentUserRef = useRef<User | null>(null);
  const userIdRef = useRef<string | null>(null);
  const dbSessionIdRef = useRef<string | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const gameFinishedRef = useRef(false);
  const cumulativeScoreRef = useRef(0);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { dbSessionIdRef.current = dbSessionId; }, [dbSessionId]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    // Initialize user and session
    const initializeSession = async () => {
      console.log('🎮 Initializing game session...');
      
      // Get or create anonymous user
      const user = await getOrCreateUser();
      if (user) {
        setUserId(user.id);
        setCurrentUser(user);
        userIdRef.current = user.id;
        currentUserRef.current = user;
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
          dbSessionIdRef.current = dbSession.id;
          console.log('✅ Game session created in database:', dbSession.id);
        }
      }
    };

    initializeSession();
  }, []);

  const recordLevel = useCallback(async (levelData: LevelData) => {
    console.log('📊 Recording level completion:', levelData);

    // Update levels state
    setLevels(prev => [...prev, levelData]);

    // Track cumulative score via ref (avoids React 18 batching issue where
    // variables mutated inside setState updaters aren't available after the call)
    cumulativeScoreRef.current += levelData.score;
    const cumulativeScore = cumulativeScoreRef.current;

    // Use refs for latest values (avoids stale closures after registration)
    const uid = userIdRef.current;
    const user = currentUserRef.current;
    const sessionId = dbSessionIdRef.current;

    console.log('📈 Cumulative score:', cumulativeScore, '| User:', user?.username, '| uid:', uid);

    // Only update leaderboard for registered users (with a real username)
    if (uid && user && user.username) {
      console.log('🏆 Updating leaderboard with cumulative score for:', user.username);
      updateLeaderboardScore(uid, user.username, cumulativeScore, sessionId || undefined)
        .catch(err => { console.error('Failed to update leaderboard:', err); });
    } else {
      console.log('⏭️ Skipping leaderboard update - user not registered yet');
    }

    // Save level result to database
    if (uid && sessionId) {
      await recordLevelResult(
        sessionId,
        uid,
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
  }, []);

  const recordSwipe = useCallback(async (brandId: string, direction: 'left' | 'right', userType?: 'buyer' | 'brand' | null) => {
    if (!session) return;

    const uid = userIdRef.current;
    const sessionId = dbSessionIdRef.current;

    console.log('👆 Recording swipe:', { brandId, direction, userId: uid, dbSessionId: sessionId });

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
    if (uid && sessionId) {
      console.log('💾 Saving swipe to database:', { dbSessionId: sessionId, userId: uid, brandId, direction, itemType });
      await recordSwipeAction(
        sessionId, // Use database UUID, not frontend session string!
        uid,
        brandId,
        brandId, // Use brandId as name for now
        itemType,
        direction,
        swipes.length + 1, // Position
        levels.length // Current level
      );
    } else {
      console.warn('⚠️ Cannot save swipe - missing userId or dbSessionId:', { userId: uid, dbSessionId: sessionId });
    }
  }, [session, swipes.length, levels.length]);

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
    // Guard against double calls (e.g. loseLife + completeLevel race)
    if (gameFinishedRef.current) return;
    gameFinishedRef.current = true;

    // Use refs for latest values (avoids stale closures)
    const uid = userIdRef.current;
    const user = currentUserRef.current;
    const sessionId = dbSessionIdRef.current;
    const currentSession = sessionRef.current;

    if (uid) {
      console.log('🏁 Game finished — updating user stats (games_played +1) and leaderboard');

      // Only update leaderboard for registered users (with a real username)
      if (user && user.username) {
        console.log('🏆 Updating leaderboard with final score:', totalScore, 'for:', user.username);
        await updateLeaderboardScore(uid, user.username, totalScore, sessionId || undefined).catch(err => {
          console.error('Failed to update leaderboard at game end:', err);
        });
      } else {
        console.log('⏭️ Skipping final leaderboard update - user not registered');
      }

      // Update user stats (games_played +1, best_score, total_score)
      await updateUserScores(uid, totalScore).catch(err => {
        console.error('Failed to update user scores:', err);
      });
    }

    // Mark game session as completed in the database
    if (currentSession?.sessionId) {
      await completeGameSession(currentSession.sessionId, totalScore, 'completed').catch(err => {
        console.error('Failed to complete game session:', err);
      });
    }
  }, []);

  const resetSession = useCallback(async () => {
    setLevels([]);
    setSwipes([]);
    gameFinishedRef.current = false;
    cumulativeScoreRef.current = 0;

    // Create a brand-new DB session so "Play Again" doesn't reuse the old one (409 duplicate key)
    const prevSession = sessionRef.current;
    const uid = userIdRef.current;
    const user = currentUserRef.current;

    const newSessionId = generateSessionId();
    const boothSource = prevSession?.boothSource || 'expo-west-2024';
    const campaign = prevSession?.campaign || 'grovara-expo';
    const deviceType = prevSession?.deviceType || getDeviceType();

    const newSession: GameSession = {
      sessionId: newSessionId,
      boothSource,
      campaign,
      deviceType,
      startTime: new Date(),
    };

    setSession(newSession);
    sessionRef.current = newSession;

    if (uid) {
      const dbSession = await createGameSession(
        uid,
        newSessionId,
        boothSource,
        campaign,
        deviceType,
        user?.user_type || undefined
      );
      if (dbSession) {
        setDbSessionId(dbSession.id);
        dbSessionIdRef.current = dbSession.id;
        console.log('✅ New game session created for Play Again:', dbSession.id);
      }
    }
  }, []);

  const loadUserByEmail = useCallback(async (emailOrUsername: string): Promise<boolean> => {
    try {
      const user = await getUserByEmailOrUsername(emailOrUsername);
      if (user) {
        // Update both state AND refs immediately so leaderboard updates work right away
        setUserId(user.id);
        setCurrentUser(user);
        userIdRef.current = user.id;
        currentUserRef.current = user;

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
