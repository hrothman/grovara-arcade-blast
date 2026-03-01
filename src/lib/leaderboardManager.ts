// Leaderboard and account management with localStorage and API stubs

import leaderboardData from '@/data/leaderboard.json';

export interface PlayerAccount {
  username: string;
  score: number;
  matchedBrands: string[];
  createdAt: string;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

const STORAGE_KEY = 'grovara_players';

/**
 * Save a player account to localStorage
 * In production, this would call an API endpoint
 */
export const savePlayerAccount = async (
  username: string,
  score: number,
  matchedBrandIds: string[]
): Promise<PlayerAccount> => {
  const account: PlayerAccount = {
    username,
    score,
    matchedBrands: matchedBrandIds,
    createdAt: new Date().toISOString(),
  };

  // TODO: Replace with actual API call
  // const response = await fetch('/api/players', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(account),
  // });
  // return response.json();

  // For now, save to localStorage
  const existing = localStorage.getItem(STORAGE_KEY);
  const players = existing ? JSON.parse(existing) : [];
  players.push(account);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));

  console.log('Account saved:', account);
  return account;
};

/**
 * Get all player accounts
 * In production, this would call an API endpoint
 */
export const getAllPlayers = async (): Promise<PlayerAccount[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/players');
  // return response.json();

  // For now, load from localStorage
  const existing = localStorage.getItem(STORAGE_KEY);
  return existing ? JSON.parse(existing) : [];
};

/**
 * Get the leaderboard (sorted by score)
 * In production, this would call an API endpoint
 */
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/leaderboard');
  // return response.json();

  // For now, get from localStorage
  const players = await getAllPlayers();
  return players
    .map(p => ({ username: p.username, score: p.score }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Check if a username is already taken
 * In production, this would call an API endpoint
 */
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/players/check/${username}`);
  // const data = await response.json();
  // return data.available;

  // For now, check localStorage
  const players = await getAllPlayers();
  return !players.some(p => p.username.toLowerCase() === username.toLowerCase());
};

/**
 * Get merged leaderboard (static fake players + real player accounts)
 * This combines the fake leaderboard from JSON with actual player accounts from localStorage
 * In production, this would just call the API endpoint which returns all players
 */
export const getMergedLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  // TODO: Replace with actual API call that returns all players from database
  // const response = await fetch('/api/leaderboard');
  // return response.json();

  // For now, merge fake players with real players from localStorage
  const realPlayers = await getAllPlayers();
  const realLeaderboard: LeaderboardEntry[] = realPlayers.map(p => ({
    username: p.username,
    score: p.score,
  }));

  // Get fake players from JSON (these are the pre-populated ones)
  const fakeLeaderboard: LeaderboardEntry[] = leaderboardData as LeaderboardEntry[];

  // Merge and sort by score
  const mergedLeaderboard = [...fakeLeaderboard, ...realLeaderboard];
  return mergedLeaderboard.sort((a, b) => b.score - a.score);
};

/**
 * Update a player's score (keeps highest score)
 * In production, this would call an API endpoint
 */
export const updatePlayerScore = async (
  username: string,
  newScore: number
): Promise<PlayerAccount | null> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/players/${username}/score`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ score: newScore }),
  // });
  // return response.json();

  // For now, update in localStorage
  const existing = localStorage.getItem(STORAGE_KEY);
  const players: PlayerAccount[] = existing ? JSON.parse(existing) : [];
  
  const playerIndex = players.findIndex(p => p.username === username);
  if (playerIndex === -1) {
    return null;
  }

  // Update the score to the higher of current or new score
  const currentScore = players[playerIndex].score;
  players[playerIndex].score = Math.max(currentScore, newScore);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));

  console.log('Score updated:', players[playerIndex]);
  return players[playerIndex];
};

export interface UserSession {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

/**
 * Get current logged-in user session
 */
export const getCurrentUser = (): UserSession | null => {
  const currentSession = localStorage.getItem('current_user_session');
  if (!currentSession) return null;

  try {
    return JSON.parse(currentSession);
  } catch {
    return null;
  }
};

/**
 * Set current user session
 */
export const setCurrentUser = (
  username: string,
  email?: string,
  firstName?: string,
  lastName?: string,
  company?: string
): void => {
  localStorage.setItem(
    'current_user_session',
    JSON.stringify({ username, email, firstName, lastName, company })
  );
};

/**
 * Clear current user session (logout)
 * In production, this would call logout endpoint
 */
export const clearCurrentUser = (): void => {
  // TODO: Replace with actual logout call
  // await fetch('/api/auth/logout', { method: 'POST' });
  
  // For now, remove from localStorage
  localStorage.removeItem('current_user_session');
};
