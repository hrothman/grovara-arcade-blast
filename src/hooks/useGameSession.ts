import { useState, useEffect, useCallback } from 'react';
import { GameSession, SwipeAction, LevelData } from '@/types/game';
import { 
  getOrCreateUser,
  createGameSession,
  recordLevelResult,
  updateGameSession,
  recordSwipeAction 
} from '@/services';

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
        console.log('👤 User ID:', user.id);
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
    setLevels(prev => [...prev, levelData]);
    
    // Save to database
    if (userId && dbSessionId) {
      await recordLevelResult(
        dbSessionId,
        userId,
        levelData.level,
        {
          score: levelData.score,
          enemiesKilled: levelData.enemiesKilled,
          productsOnShelf: levelData.score, // Approximate - score comes from products placed
          ultraRareCount: levelData.ultraRareCount || 0,
          completed: levelData.completed,
          durationSeconds: levelData.duration || 0,
        }
      );
    }
  }, [userId, dbSessionId]);

  const recordSwipe = useCallback(async (brandId: string, direction: 'left' | 'right') => {
    if (!session) return;
    
    console.log('👆 Recording swipe:', { brandId, direction });
    
    const swipeAction: SwipeAction = {
      sessionId: session.sessionId,
      brandId,
      direction,
      timestamp: new Date(),
    };

    setSwipes(prev => [...prev, swipeAction]);
    
    // Save to database
    if (userId && session) {
      await recordSwipeAction(
        session.sessionId,
        userId,
        brandId,
        brandId, // Use brandId as name for now
        'brand', // Type
        direction,
        swipes.length + 1, // Position
        levels.length // Current level
      );
    }
  }, [session, userId, swipes.length, levels.length]);

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
    dbSessionId,
    levels,
    swipes,
    recordLevel,
    recordSwipe,
    setEmail,
    getAnalyticsData,
    exportToCSV,
  };
};
