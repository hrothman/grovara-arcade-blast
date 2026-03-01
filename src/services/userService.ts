/**
 * User Service
 * Handles user creation, registration, and profile management
 * Supports both Supabase and localStorage fallback
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { generateDeviceId, getDeviceId } from '@/lib/deviceFingerprint';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

// LocalStorage key
const USERS_STORAGE_KEY = 'grovara_users';

/**
 * Get or create anonymous user by device ID
 */
export const getOrCreateUser = async (): Promise<User | null> => {
  console.log('🔍 [UserService] getOrCreateUser called');
  try {
    const deviceId = await generateDeviceId();
    console.log('🆔 Device ID:', deviceId);

    if (isSupabaseConfigured()) {
      console.log('☁️ Supabase configured - attempting cloud storage');
      // Try Supabase first
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Supabase fetch error:', fetchError);
        throw fetchError;
      }

      if (existingUser) {
        console.log('✅ Found existing user in Supabase:', existingUser.id);
        // Update last_active_at
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.warn('⚠️ Failed to update last_active_at:', updateError);
        } else {
          console.log('✅ Updated last_active_at');
        }
        return existingUser;
      }

      // Create new anonymous user
      console.log('👤 Creating new anonymous user in Supabase');
      const newUser: UserInsert = {
        device_id: deviceId,
        is_anonymous: true,
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create user in Supabase:', createError);
        throw createError;
      }

      console.log('✅ Anonymous user created in Supabase:', createdUser.id);
      return createdUser;
    } else {
      console.log('💾 Supabase not configured - using localStorage fallback');
      // Fallback to localStorage
      return getOrCreateUserLocal(deviceId);
    }
  } catch (error) {
    console.error('❌ Error in getOrCreateUser, falling back to localStorage:', error);
    const deviceId = await generateDeviceId();
    return getOrCreateUserLocal(deviceId);
  }
};

/**
 * LocalStorage fallback for user management
 */
const getOrCreateUserLocal = (deviceId: string): User => {
  console.log('💾 Using localStorage for user management');
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  const users: User[] = usersJson ? JSON.parse(usersJson) : [];
  
  let user = users.find(u => u.device_id === deviceId);
  
  if (!user) {
    user = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      device_id: deviceId,
      username: null,
      email: null,
      user_type: null,
      is_anonymous: true,
      total_score: 0,
      best_score: 0,
      games_played: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
    
    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    console.log('✅ Anonymous user created in localStorage');
  } else {
    // Update last_active_at
    user.last_active_at = new Date().toISOString();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
  
  return user;
};

/**
 * Get user by device ID
 */
export const getUserByDeviceId = async (deviceId: string): Promise<User | null> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } else {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      if (!usersJson) return null;
      const users: User[] = JSON.parse(usersJson);
      return users.find(u => u.device_id === deviceId) || null;
    }
  } catch (error) {
    console.error('Error getting user by device ID:', error);
    return null;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Update last_active_at
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', data.id);
      }
      
      return data;
    } else {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      if (!usersJson) return null;
      const users: User[] = JSON.parse(usersJson);
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
      
      if (user) {
        // Update last_active_at
        user.last_active_at = new Date().toISOString();
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      
      return user;
    }
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Update last_active_at
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', data.id);
      }
      
      return data;
    } else {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      if (!usersJson) return null;
      const users: User[] = JSON.parse(usersJson);
      const user = users.find(u => u.username?.toLowerCase() === username.toLowerCase()) || null;
      
      if (user) {
        // Update last_active_at
        user.last_active_at = new Date().toISOString();
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      
      return user;
    }
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

/**
 * Get user by email or username
 */
export const getUserByEmailOrUsername = async (emailOrUsername: string): Promise<User | null> => {
  try {
    // Try email first (if it contains @)
    if (emailOrUsername.includes('@')) {
      return await getUserByEmail(emailOrUsername);
    }
    
    // Try username
    const userByUsername = await getUserByUsername(emailOrUsername);
    if (userByUsername) return userByUsername;
    
    // Fallback: try as email anyway (in case user entered email without validation)
    return await getUserByEmail(emailOrUsername);
  } catch (error) {
    console.error('Error getting user by email or username:', error);
    return null;
  }
};

/**
 * Register user (convert anonymous to registered)
 */
export const registerUser = async (
  username: string,
  email?: string
): Promise<User | null> => {
  try {
    const deviceId = getDeviceId() || await generateDeviceId();
    
    if (isSupabaseConfigured()) {
      // Check if username is available
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Try to update existing anonymous user first
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          username,
          email: email || null,
          is_anonymous: false,
          updated_at: new Date().toISOString(),
        } as UserUpdate)
        .eq('device_id', deviceId)
        .select()
        .maybeSingle();

      if (updated) {
        console.log('✅ User registered in Supabase (updated existing)');
        return updated;
      }

      // No existing row for this device — insert a new registered user
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          device_id: deviceId,
          username,
          email: email || null,
          is_anonymous: false,
        } as UserInsert)
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ User registered in Supabase (new row)');
      return inserted;
    } else {
      // Fallback to localStorage
      return registerUserLocal(deviceId, username, email);
    }
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * LocalStorage fallback for registration
 */
const registerUserLocal = (deviceId: string, username: string, email?: string): User | null => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersJson) return null;
  
  const users: User[] = JSON.parse(usersJson);
  
  // Check if username is taken
  if (users.some(u => u.username === username)) {
    throw new Error('Username already taken');
  }
  
  const user = users.find(u => u.device_id === deviceId);
  if (!user) return null;
  
  user.username = username;
  user.email = email || null;
  user.is_anonymous = false;
  user.updated_at = new Date().toISOString();
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  console.log('✅ User registered in localStorage');
  
  return user;
};

/**
 * Update user type (buyer/brand)
 */
export const updateUserType = async (
  userType: 'buyer' | 'brand'
): Promise<User | null> => {
  try {
    const deviceId = getDeviceId() || await generateDeviceId();
    
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('users')
        .update({ user_type: userType })
        .eq('device_id', deviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Fallback to localStorage
      return updateUserTypeLocal(deviceId, userType);
    }
  } catch (error) {
    console.error('Error updating user type:', error);
    return null;
  }
};

/**
 * LocalStorage fallback for user type update
 */
const updateUserTypeLocal = (deviceId: string, userType: 'buyer' | 'brand'): User | null => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersJson) return null;
  
  const users: User[] = JSON.parse(usersJson);
  const user = users.find(u => u.device_id === deviceId);
  if (!user) return null;
  
  user.user_type = userType;
  user.updated_at = new Date().toISOString();
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return user;
};

/**
 * Update user scores after game completion
 */
export const updateUserScores = async (
  userId: string,
  sessionScore: number
): Promise<void> => {
  try {
    if (isSupabaseConfigured()) {
      // Get current user to compare scores
      const { data: user } = await supabase
        .from('users')
        .select('total_score, best_score, games_played')
        .eq('id', userId)
        .single();

      if (user) {
        const updates: UserUpdate = {
          total_score: user.total_score + sessionScore,
          best_score: Math.max(user.best_score, sessionScore),
          games_played: user.games_played + 1,
          last_active_at: new Date().toISOString(),
        };

        await supabase
          .from('users')
          .update(updates)
          .eq('id', userId);
      }
    } else {
      // Fallback to localStorage
      updateUserScoresLocal(userId, sessionScore);
    }
  } catch (error) {
    console.error('Error updating user scores:', error);
  }
};

/**
 * LocalStorage fallback for score update
 */
const updateUserScoresLocal = (userId: string, sessionScore: number): void => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersJson) return;
  
  const users: User[] = JSON.parse(usersJson);
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  user.total_score += sessionScore;
  user.best_score = Math.max(user.best_score, sessionScore);
  user.games_played += 1;
  user.last_active_at = new Date().toISOString();
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

/**
 * Check if username is available
 */
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      return !data;
    } else {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      if (!usersJson) return true;
      const users: User[] = JSON.parse(usersJson);
      return !users.some(u => u.username?.toLowerCase() === username.toLowerCase());
    }
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};
