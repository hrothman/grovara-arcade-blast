// Leaderboard and account management with localStorage and API stubs

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
