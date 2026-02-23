/**
 * Game Service
 * Handles game sessions and level results tracking
 * Supports both Supabase and localStorage fallback
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database } from '@/types/database';

type GameSession = Database['public']['Tables']['game_sessions']['Row'];
type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert'];
type GameSessionUpdate = Database['public']['Tables']['game_sessions']['Update'];
type LevelResult = Database['public']['Tables']['level_results']['Row'];
type LevelResultInsert = Database['public']['Tables']['level_results']['Insert'];

// LocalStorage keys
const SESSIONS_STORAGE_KEY = 'grovara_sessions';
const LEVELS_STORAGE_KEY = 'grovara_level_results';

/**
 * Create a new game session
 */
export const createGameSession = async (
  userId: string,
  sessionId: string,
  boothSource?: string,
  campaign?: string,
  deviceType?: string,
  userType?: 'buyer' | 'brand'
): Promise<GameSession | null> => {
  try {
    const sessionData: GameSessionInsert = {
      user_id: userId,
      session_id: sessionId,
      booth_source: boothSource || null,
      campaign: campaign || null,
      device_type: deviceType || null,
      user_type: userType || null,
      started_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Game session created in Supabase');
      return data;
    } else {
      // Fallback to localStorage
      return createGameSessionLocal(sessionData);
    }
  } catch (error) {
    console.error('Error creating game session:', error);
    // Fallback to localStorage
    const sessionData: GameSessionInsert = {
      user_id: userId,
      session_id: sessionId,
      booth_source: boothSource || null,
      campaign: campaign || null,
      device_type: deviceType || null,
      user_type: userType || null,
      started_at: new Date().toISOString(),
    };
    return createGameSessionLocal(sessionData);
  }
};

/**
 * LocalStorage fallback for session creation
 */
const createGameSessionLocal = (sessionData: GameSessionInsert): GameSession => {
  const session: GameSession = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    user_id: sessionData.user_id,
    session_id: sessionData.session_id,
    booth_source: sessionData.booth_source || null,
    campaign: sessionData.campaign || null,
    device_type: sessionData.device_type || null,
    user_type: sessionData.user_type || null,
    total_score: 0,
    final_score: null,
    lives_remaining: 3,
    levels_completed: 0,
    total_enemies_killed: 0,
    total_products_placed: 0,
    total_ultra_rares: 0,
    status: 'in_progress',
    started_at: sessionData.started_at || new Date().toISOString(),
    completed_at: null,
    duration_seconds: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sessionsJson = localStorage.getItem(SESSIONS_STORAGE_KEY);
  const sessions: GameSession[] = sessionsJson ? JSON.parse(sessionsJson) : [];
  sessions.push(session);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));

  console.log('✅ Game session created in localStorage');
  return session;
};

/**
 * Update game session with level completion data
 */
export const updateGameSession = async (
  sessionId: string,
  updates: {
    totalScore?: number;
    levelsCompleted?: number;
    totalEnemiesKilled?: number;
    totalProductsPlaced?: number;
    totalUltraRares?: number;
    livesRemaining?: number;
  }
): Promise<void> => {
  try {
    if (isSupabaseConfigured()) {
      const updateData: GameSessionUpdate = {};

      if (updates.totalScore !== undefined) updateData.total_score = updates.totalScore;
      if (updates.levelsCompleted !== undefined) updateData.levels_completed = updates.levelsCompleted;
      if (updates.totalEnemiesKilled !== undefined) updateData.total_enemies_killed = updates.totalEnemiesKilled;
      if (updates.totalProductsPlaced !== undefined) updateData.total_products_placed = updates.totalProductsPlaced;
      if (updates.totalUltraRares !== undefined) updateData.total_ultra_rares = updates.totalUltraRares;
      if (updates.livesRemaining !== undefined) updateData.lives_remaining = updates.livesRemaining;

      const { error } = await supabase
        .from('game_sessions')
        .update(updateData)
        .eq('session_id', sessionId);

      if (error) throw error;
    } else {
      // Fallback to localStorage
      updateGameSessionLocal(sessionId, updates);
    }
  } catch (error) {
    console.error('Error updating game session:', error);
    updateGameSessionLocal(sessionId, updates);
  }
};

/**
 * LocalStorage fallback for session update
 */
const updateGameSessionLocal = (
  sessionId: string,
  updates: {
    totalScore?: number;
    levelsCompleted?: number;
    totalEnemiesKilled?: number;
    totalProductsPlaced?: number;
    totalUltraRares?: number;
    livesRemaining?: number;
  }
): void => {
  const sessionsJson = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!sessionsJson) return;

  const sessions: GameSession[] = JSON.parse(sessionsJson);
  const session = sessions.find(s => s.session_id === sessionId);
  if (!session) return;

  if (updates.totalScore !== undefined) session.total_score = updates.totalScore;
  if (updates.levelsCompleted !== undefined) session.levels_completed = updates.levelsCompleted;
  if (updates.totalEnemiesKilled !== undefined) session.total_enemies_killed = updates.totalEnemiesKilled;
  if (updates.totalProductsPlaced !== undefined) session.total_products_placed = updates.totalProductsPlaced;
  if (updates.totalUltraRares !== undefined) session.total_ultra_rares = updates.totalUltraRares;
  if (updates.livesRemaining !== undefined) session.lives_remaining = updates.livesRemaining;
  
  session.updated_at = new Date().toISOString();

  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
};

/**
 * Complete game session
 */
export const completeGameSession = async (
  sessionId: string,
  finalScore: number,
  status: 'completed' | 'abandoned' = 'completed'
): Promise<void> => {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          final_score: finalScore,
          status,
          completed_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (error) throw error;

      console.log('✅ Game session completed in Supabase');
    } else {
      // Fallback to localStorage
      completeGameSessionLocal(sessionId, finalScore, status);
    }
  } catch (error) {
    console.error('Error completing game session:', error);
    completeGameSessionLocal(sessionId, finalScore, status);
  }
};

/**
 * LocalStorage fallback for session completion
 */
const completeGameSessionLocal = (
  sessionId: string,
  finalScore: number,
  status: 'completed' | 'abandoned'
): void => {
  const sessionsJson = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!sessionsJson) return;

  const sessions: GameSession[] = JSON.parse(sessionsJson);
  const session = sessions.find(s => s.session_id === sessionId);
  if (!session) return;

  session.final_score = finalScore;
  session.status = status;
  session.completed_at = new Date().toISOString();
  
  // Calculate duration
  const startTime = new Date(session.started_at).getTime();
  const endTime = new Date().getTime();
  session.duration_seconds = Math.floor((endTime - startTime) / 1000);

  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  console.log('✅ Game session completed in localStorage');
};

/**
 * Record level result
 */
export const recordLevelResult = async (
  dbSessionId: string,
  userId: string,
  levelNumber: number,
  levelData: {
    score: number;
    enemiesKilled: number;
    productsOnShelf: number;
    ultraRareCount: number;
    completed: boolean;
    durationSeconds?: number;
  }
): Promise<void> => {
  try {
    const resultData: LevelResultInsert = {
      session_id: dbSessionId,
      user_id: userId,
      level_number: levelNumber,
      score: levelData.score,
      enemies_killed: levelData.enemiesKilled,
      products_on_shelf: levelData.productsOnShelf,
      ultra_rare_count: levelData.ultraRareCount,
      completed: levelData.completed,
      duration_seconds: levelData.durationSeconds || null,
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('level_results')
        .insert(resultData);

      if (error) throw error;

      console.log('✅ Level result recorded in Supabase');
    } else {
      // Fallback to localStorage
      recordLevelResultLocal(resultData);
    }
  } catch (error) {
    console.error('Error recording level result:', error);
    // Try localStorage fallback
    const resultData: LevelResultInsert = {
      session_id: dbSessionId,
      user_id: userId,
      level_number: levelNumber,
      score: levelData.score,
      enemies_killed: levelData.enemiesKilled,
      products_on_shelf: levelData.productsOnShelf,
      ultra_rare_count: levelData.ultraRareCount,
      completed: levelData.completed,
      duration_seconds: levelData.durationSeconds || null,
    };
    recordLevelResultLocal(resultData);
  }
};

/**
 * LocalStorage fallback for level result
 */
const recordLevelResultLocal = (resultData: LevelResultInsert): void => {
  const result: LevelResult = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    session_id: resultData.session_id,
    user_id: resultData.user_id,
    level_number: resultData.level_number,
    score: resultData.score || 0,
    enemies_killed: resultData.enemies_killed || 0,
    products_on_shelf: resultData.products_on_shelf || 0,
    ultra_rare_count: resultData.ultra_rare_count || 0,
    completed: resultData.completed || false,
    duration_seconds: resultData.duration_seconds || null,
    created_at: new Date().toISOString(),
  };

  const levelsJson = localStorage.getItem(LEVELS_STORAGE_KEY);
  const levels: LevelResult[] = levelsJson ? JSON.parse(levelsJson) : [];
  levels.push(result);
  localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(levels));

  console.log('✅ Level result recorded in localStorage');
};

/**
 * Get session by session_id
 */
export const getGameSession = async (sessionId: string): Promise<GameSession | null> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const sessionsJson = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (!sessionsJson) return null;
      const sessions: GameSession[] = JSON.parse(sessionsJson);
      return sessions.find(s => s.session_id === sessionId) || null;
    }
  } catch (error) {
    console.error('Error getting game session:', error);
    return null;
  }
};

/**
 * Get all sessions for a user
 */
export const getUserSessions = async (userId: string): Promise<GameSession[]> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } else {
      const sessionsJson = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (!sessionsJson) return [];
      const sessions: GameSession[] = JSON.parse(sessionsJson);
      return sessions
        .filter(s => s.user_id === userId)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

/**
 * Get level results for a session
 */
export const getLevelResults = async (sessionId: string): Promise<LevelResult[]> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('level_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('level_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } else {
      const levelsJson = localStorage.getItem(LEVELS_STORAGE_KEY);
      if (!levelsJson) return [];
      const levels: LevelResult[] = JSON.parse(levelsJson);
      return levels
        .filter(l => l.session_id === sessionId)
        .sort((a, b) => a.level_number - b.level_number);
    }
  } catch (error) {
    console.error('Error getting level results:', error);
    return [];
  }
};
