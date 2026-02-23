/**
 * Swipe Service
 * Handles swipe actions and user matches tracking
 * Supports both Supabase and localStorage fallback
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database } from '@/types/database';

type SwipeAction = Database['public']['Tables']['swipe_actions']['Row'];
type SwipeActionInsert = Database['public']['Tables']['swipe_actions']['Insert'];
type UserMatch = Database['public']['Tables']['user_matches']['Row'];

// LocalStorage keys
const SWIPES_STORAGE_KEY = 'grovara_swipe_actions';
const MATCHES_STORAGE_KEY = 'grovara_user_matches';

/**
 * Record a swipe action
 */
export const recordSwipeAction = async (
  sessionId: string,
  userId: string,
  itemId: string,
  itemName: string,
  itemType: 'brand' | 'buyer',
  direction: 'left' | 'right',
  swipePosition?: number,
  levelAfter?: number
): Promise<void> => {
  console.log('👆 [SwipeService] recordSwipeAction called', { itemId, direction });
  try {
    const swipeData: SwipeActionInsert = {
      session_id: sessionId,
      user_id: userId,
      item_id: itemId,
      item_name: itemName,
      item_type: itemType,
      direction,
      swipe_position: swipePosition || null,
      level_after: levelAfter || null,
    };

    if (isSupabaseConfigured()) {
      console.log('☁️ Saving swipe to Supabase');
      const { error } = await supabase
        .from('swipe_actions')
        .insert(swipeData);

      if (error) {
        console.error('❌ Supabase swipe error:', error);
        throw error;
      }

      // If right swipe (match), update user_matches
      if (direction === 'right') {
        await recordUserMatch(userId, itemId, itemName, itemType);
      }

      console.log('✅ Swipe action recorded in Supabase');
    } else {
      console.log('💾 Using localStorage for swipe');
      // Fallback to localStorage
      recordSwipeActionLocal(swipeData, direction === 'right' ? { userId, itemId, itemName, itemType } : null);
    }
  } catch (error) {
    console.error('❌ Error recording swipe action, falling back to localStorage:', error);
    // Fallback to localStorage
    const swipeData: SwipeActionInsert = {
      session_id: sessionId,
      user_id: userId,
      item_id: itemId,
      item_name: itemName,
      item_type: itemType,
      direction,
      swipe_position: swipePosition || null,
      level_after: levelAfter || null,
    };
    recordSwipeActionLocal(swipeData, direction === 'right' ? { userId, itemId, itemName, itemType } : null);
  }
};

/**
 * LocalStorage fallback for swipe action
 */
const recordSwipeActionLocal = (
  swipeData: SwipeActionInsert,
  matchData: { userId: string; itemId: string; itemName: string; itemType: 'brand' | 'buyer' } | null
): void => {
  const swipe: SwipeAction = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    session_id: swipeData.session_id,
    user_id: swipeData.user_id,
    item_id: swipeData.item_id,
    item_name: swipeData.item_name || null,
    item_type: swipeData.item_type || null,
    direction: swipeData.direction,
    swipe_position: swipeData.swipe_position || null,
    level_after: swipeData.level_after || null,
    created_at: new Date().toISOString(),
  };

  const swipesJson = localStorage.getItem(SWIPES_STORAGE_KEY);
  const swipes: SwipeAction[] = swipesJson ? JSON.parse(swipesJson) : [];
  swipes.push(swipe);
  localStorage.setItem(SWIPES_STORAGE_KEY, JSON.stringify(swipes));

  // Record match if right swipe
  if (matchData) {
    recordUserMatchLocal(matchData.userId, matchData.itemId, matchData.itemName, matchData.itemType);
  }

  console.log('✅ Swipe action recorded in localStorage');
};

/**
 * Record or update a user match
 */
const recordUserMatch = async (
  userId: string,
  itemId: string,
  itemName: string,
  itemType: 'brand' | 'buyer'
): Promise<void> => {
  try {
    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('user_matches')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (existingMatch) {
      // Update match count
      await supabase
        .from('user_matches')
        .update({
          match_count: existingMatch.match_count + 1,
          last_matched_at: new Date().toISOString(),
        })
        .eq('id', existingMatch.id);
    } else {
      // Create new match
      await supabase
        .from('user_matches')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_name: itemName,
          item_type: itemType,
        });
    }
  } catch (error) {
    console.error('Error recording user match:', error);
  }
};

/**
 * LocalStorage fallback for user match
 */
const recordUserMatchLocal = (
  userId: string,
  itemId: string,
  itemName: string,
  itemType: 'brand' | 'buyer'
): void => {
  const matchesJson = localStorage.getItem(MATCHES_STORAGE_KEY);
  const matches: UserMatch[] = matchesJson ? JSON.parse(matchesJson) : [];

  const existingMatch = matches.find(m => m.user_id === userId && m.item_id === itemId);

  if (existingMatch) {
    existingMatch.match_count += 1;
    existingMatch.last_matched_at = new Date().toISOString();
  } else {
    const newMatch: UserMatch = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      item_id: itemId,
      item_name: itemName,
      item_type: itemType,
      match_count: 1,
      first_matched_at: new Date().toISOString(),
      last_matched_at: new Date().toISOString(),
    };
    matches.push(newMatch);
  }

  localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
};

/**
 * Get all matches for a user
 */
export const getUserMatches = async (
  userId: string,
  itemType?: 'brand' | 'buyer'
): Promise<UserMatch[]> => {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('user_matches')
        .select('*')
        .eq('user_id', userId);

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { data, error } = await query.order('last_matched_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } else {
      const matchesJson = localStorage.getItem(MATCHES_STORAGE_KEY);
      if (!matchesJson) return [];
      
      const matches: UserMatch[] = JSON.parse(matchesJson);
      let filtered = matches.filter(m => m.user_id === userId);
      
      if (itemType) {
        filtered = filtered.filter(m => m.item_type === itemType);
      }
      
      return filtered.sort((a, b) => 
        new Date(b.last_matched_at).getTime() - new Date(a.last_matched_at).getTime()
      );
    }
  } catch (error) {
    console.error('Error getting user matches:', error);
    return [];
  }
};

/**
 * Get swipe actions for a session
 */
export const getSessionSwipes = async (sessionId: string): Promise<SwipeAction[]> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('swipe_actions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } else {
      const swipesJson = localStorage.getItem(SWIPES_STORAGE_KEY);
      if (!swipesJson) return [];
      
      const swipes: SwipeAction[] = JSON.parse(swipesJson);
      return swipes
        .filter(s => s.session_id === sessionId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  } catch (error) {
    console.error('Error getting session swipes:', error);
    return [];
  }
};

/**
 * Get popular items (brands/buyers) by match count
 */
export const getPopularItems = async (
  itemType?: 'brand' | 'buyer',
  limit: number = 20
): Promise<Array<{ item_id: string; item_name: string; item_type: string; match_count: number; unique_users: number }>> => {
  try {
    if (isSupabaseConfigured()) {
      // Use the view if available, otherwise aggregate
      const { data, error } = await supabase
        .from('popular_items')
        .select('*')
        .order('match_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      const result = data || [];
      
      if (itemType) {
        return result.filter(item => item.item_type === itemType);
      }
      
      return result;
    } else {
      const matchesJson = localStorage.getItem(MATCHES_STORAGE_KEY);
      if (!matchesJson) return [];
      
      const matches: UserMatch[] = JSON.parse(matchesJson);
      
      // Aggregate by item_id
      const aggregated = new Map<string, { 
        item_id: string; 
        item_name: string; 
        item_type: string; 
        match_count: number; 
        users: Set<string> 
      }>();
      
      matches.forEach(match => {
        if (itemType && match.item_type !== itemType) return;
        
        const key = match.item_id;
        if (aggregated.has(key)) {
          const item = aggregated.get(key)!;
          item.match_count += match.match_count;
          item.users.add(match.user_id);
        } else {
          aggregated.set(key, {
            item_id: match.item_id,
            item_name: match.item_name || '',
            item_type: match.item_type || '',
            match_count: match.match_count,
            users: new Set([match.user_id]),
          });
        }
      });
      
      return Array.from(aggregated.values())
        .map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          item_type: item.item_type,
          match_count: item.match_count,
          unique_users: item.users.size,
        }))
        .sort((a, b) => b.match_count - a.match_count)
        .slice(0, limit);
    }
  } catch (error) {
    console.error('Error getting popular items:', error);
    return [];
  }
};
