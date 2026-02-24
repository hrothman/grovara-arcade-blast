/**
 * Leaderboard Service
 * Handles leaderboard entries and rankings
 * Supports both Supabase and localStorage fallback
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database } from '@/types/database';

type LeaderboardEntry = Database['public']['Tables']['leaderboard_entries']['Row'];
type LeaderboardEntryInsert = Database['public']['Tables']['leaderboard_entries']['Insert'];

// LocalStorage key
const LEADERBOARD_STORAGE_KEY = 'grovara_leaderboard';

// Import fake leaderboard data
import leaderboardData from '@/data/leaderboard.json';

/**
 * Add entry to leaderboard
 */
export const addLeaderboardEntry = async (
  userId: string,
  username: string,
  score: number,
  sessionId?: string
): Promise<void> => {
  console.log('🏆 [LeaderboardService] addLeaderboardEntry called', { username, score });
  try {
    const entryData: LeaderboardEntryInsert = {
      user_id: userId,
      username,
      score,
      session_id: sessionId || null,
      is_fake: false,
    };

    if (isSupabaseConfigured()) {
      console.log('☁️ Saving leaderboard entry to Supabase');
      const { error } = await supabase
        .from('leaderboard_entries')
        .insert(entryData);

      if (error) {
        console.error('❌ Supabase leaderboard error:', error);
        throw error;
      }

      console.log('✅ Leaderboard entry added to Supabase');
    } else {
      console.log('💾 Using localStorage for leaderboard');
      // Fallback to localStorage
      addLeaderboardEntryLocal(entryData);
    }
  } catch (error) {
    console.error('❌ Error adding leaderboard entry, falling back to localStorage:', error);
    // Fallback
    const entryData: LeaderboardEntryInsert = {
      user_id: userId,
      username,
      score,
      session_id: sessionId || null,
      is_fake: false,
    };
    addLeaderboardEntryLocal(entryData);
  }
};

/**
 * LocalStorage fallback for leaderboard entry
 */
const addLeaderboardEntryLocal = (entryData: LeaderboardEntryInsert): void => {
  const entry: LeaderboardEntry = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    user_id: entryData.user_id,
    username: entryData.username,
    score: entryData.score,
    rank: null,
    session_id: entryData.session_id || null,
    achieved_at: new Date().toISOString(),
    is_fake: false,
  };

  const entriesJson = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
  const entries: LeaderboardEntry[] = entriesJson ? JSON.parse(entriesJson) : [];
  entries.push(entry);

  // Recalculate ranks
  const sorted = entries.sort((a, b) => b.score - a.score);
  sorted.forEach((e, index) => {
    e.rank = index + 1;
  });

  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sorted));
  console.log('✅ Leaderboard entry added to localStorage');
};

/**
 * Get leaderboard (merged with fake data if needed)
 */
export const getLeaderboard = async (limit: number = 50): Promise<LeaderboardEntry[]> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } else {
      // Fallback to localStorage + fake data
      return getLeaderboardLocal(limit);
    }
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return getLeaderboardLocal(limit);
  }
};

/**
 * LocalStorage fallback for leaderboard
 */
const getLeaderboardLocal = (limit: number): LeaderboardEntry[] => {
  const entriesJson = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
  const realEntries: LeaderboardEntry[] = entriesJson ? JSON.parse(entriesJson) : [];

  // Merge with fake entries from JSON
  const fakeEntries: LeaderboardEntry[] = (leaderboardData as Array<{ username: string; score: number }>).map((item, index) => ({
    id: `fake_${index}`,
    user_id: `fake_user_${index}`,
    username: item.username,
    score: item.score,
    rank: null,
    session_id: null,
    achieved_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_fake: true,
  }));

  // Combine and sort
  const combined = [...realEntries, ...fakeEntries];
  const sorted = combined.sort((a, b) => b.score - a.score).slice(0, limit);

  // Assign ranks
  sorted.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return sorted;
};

/**
 * Get user's best leaderboard entry
 */
export const getUserBestEntry = async (userId: string): Promise<LeaderboardEntry | null> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const entriesJson = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (!entriesJson) return null;

      const entries: LeaderboardEntry[] = JSON.parse(entriesJson);
      const userEntries = entries.filter(e => e.user_id === userId);

      if (userEntries.length === 0) return null;

      return userEntries.reduce((best, current) => 
        current.score > best.score ? current : best
      );
    }
  } catch (error) {
    console.error('Error getting user best entry:', error);
    return null;
  }
};

/**
 * Get user's rank
 */
export const getUserRank = async (userId: string): Promise<number | null> => {
  try {
    const leaderboard = await getLeaderboard(1000); // Get enough entries to find rank
    const userEntry = leaderboard.find(entry => entry.user_id === userId);
    return userEntry?.rank || null;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return null;
  }
};

/**
 * Check if score qualifies for leaderboard
 */
export const qualifiesForLeaderboard = async (score: number): Promise<boolean> => {
  try {
    if (isSupabaseConfigured()) {
      // Get the lowest score in top 50
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('score')
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length < 50) return true; // Always qualify if < 50 entries

      const lowestTopScore = data[data.length - 1].score;
      return score > lowestTopScore;
    } else {
      const leaderboard = getLeaderboardLocal(50);
      if (leaderboard.length < 50) return true;
      return score > leaderboard[leaderboard.length - 1].score;
    }
  } catch (error) {
    console.error('Error checking leaderboard qualification:', error);
    return true; // Default to true on error
  }
};

/**
 * Update or create leaderboard entry with cumulative score
 * This updates existing entries or creates new ones as users progress
 */
export const updateLeaderboardScore = async (
  userId: string,
  username: string,
  cumulativeScore: number,
  sessionId?: string
): Promise<void> => {
  console.log('🏆 [LeaderboardService] updateLeaderboardScore called', { userId, username, cumulativeScore, sessionId });
  try {
    if (isSupabaseConfigured()) {
      // Check if user already has an entry (by user_id, regardless of session)
      // This allows updating anonymous entries when they register with a real username
      const { data: existingEntry } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingEntry) {
        // Update existing entry with new cumulative score and username
        console.log('📝 Updating existing leaderboard entry', existingEntry.id);
        const { error } = await supabase
          .from('leaderboard_entries')
          .update({ 
            username: username, // Update username in case user registered
            score: cumulativeScore,
            session_id: sessionId || existingEntry.session_id, // Update session if provided
            achieved_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id);

        if (error) {
          console.error('❌ Error updating leaderboard entry:', error);
          throw error;
        }
        console.log('✅ Leaderboard entry updated');
      } else {
        // Create new entry
        console.log('➕ Creating new leaderboard entry');
        await addLeaderboardEntry(userId, username, cumulativeScore, sessionId);
      }
    } else {
      // LocalStorage fallback
      updateLeaderboardScoreLocal(userId, username, cumulativeScore, sessionId);
    }
  } catch (error) {
    console.error('❌ Error updating leaderboard score:', error);
    updateLeaderboardScoreLocal(userId, username, cumulativeScore, sessionId);
  }
};

/**
 * LocalStorage fallback for updating leaderboard score
 */
const updateLeaderboardScoreLocal = (
  userId: string,
  username: string,
  cumulativeScore: number,
  sessionId?: string
): void => {
  const entriesJson = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
  let entries: LeaderboardEntry[] = entriesJson ? JSON.parse(entriesJson) : [];

  // Find existing entry for this user (by user_id only)
  // This allows updating when anonymous users register with a real username
  const existingIndex = entries.findIndex(e => e.user_id === userId);

  if (existingIndex >= 0) {
    // Update existing entry with new score, username, and session
    entries[existingIndex].username = username; // Update username in case user registered
    entries[existingIndex].score = cumulativeScore;
    entries[existingIndex].session_id = sessionId || entries[existingIndex].session_id;
    entries[existingIndex].achieved_at = new Date().toISOString();
  } else {
    // Create new entry
    const entry: LeaderboardEntry = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      username: username,
      score: cumulativeScore,
      rank: null,
      session_id: sessionId || null,
      achieved_at: new Date().toISOString(),
      is_fake: false,
    };
    entries.push(entry);
  }

  // Recalculate ranks
  const sorted = entries.sort((a, b) => b.score - a.score);
  sorted.forEach((e, index) => {
    e.rank = index + 1;
  });

  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sorted));
  console.log('✅ Leaderboard score updated in localStorage');
};

/**
 * Get leaderboard statistics
 */
export const getLeaderboardStats = async (): Promise<{
  totalEntries: number;
  highestScore: number;
  averageScore: number;
  totalPlayers: number;
}> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('score, user_id');

      if (error) throw error;

      const entries = data || [];
      const uniqueUsers = new Set(entries.map(e => e.user_id));

      return {
        totalEntries: entries.length,
        highestScore: entries.length > 0 ? Math.max(...entries.map(e => e.score)) : 0,
        averageScore: entries.length > 0 
          ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length)
          : 0,
        totalPlayers: uniqueUsers.size,
      };
    } else {
      const leaderboard = getLeaderboardLocal(1000);
      const uniqueUsers = new Set(leaderboard.map(e => e.user_id));

      return {
        totalEntries: leaderboard.length,
        highestScore: leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.score)) : 0,
        averageScore: leaderboard.length > 0
          ? Math.round(leaderboard.reduce((sum, e) => sum + e.score, 0) / leaderboard.length)
          : 0,
        totalPlayers: uniqueUsers.size,
      };
    }
  } catch (error) {
    console.error('Error getting leaderboard stats:', error);
    return {
      totalEntries: 0,
      highestScore: 0,
      averageScore: 0,
      totalPlayers: 0,
    };
  }
};
