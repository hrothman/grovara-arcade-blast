import { useState, useEffect, useCallback } from 'react';
import { GameSession, SwipeAction, LevelData } from '@/types/game';

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
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [swipes, setSwipes] = useState<SwipeAction[]>([]);

  useEffect(() => {
    // Parse URL params from QR code
    const params = new URLSearchParams(window.location.search);
    
    const newSession: GameSession = {
      sessionId: params.get('sid') || generateSessionId(),
      boothSource: params.get('booth') || 'expo-west-2024',
      campaign: params.get('utm_campaign') || 'grovara-expo',
      deviceType: getDeviceType(),
      startTime: new Date(),
    };

    setSession(newSession);

    // Log session start
    console.log('Game session started:', newSession);
  }, []);

  const recordLevel = useCallback((levelData: LevelData) => {
    setLevels(prev => [...prev, levelData]);
    console.log('Level completed:', levelData);
  }, []);

  const recordSwipe = useCallback((brandId: string, direction: 'left' | 'right') => {
    if (!session) return;
    
    const swipeAction: SwipeAction = {
      sessionId: session.sessionId,
      brandId,
      direction,
      timestamp: new Date(),
    };

    setSwipes(prev => [...prev, swipeAction]);
    console.log('Brand swipe:', swipeAction);
  }, [session]);

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
    levels,
    swipes,
    recordLevel,
    recordSwipe,
    setEmail,
    getAnalyticsData,
    exportToCSV,
  };
};
