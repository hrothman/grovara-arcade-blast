export interface GameSession {
  sessionId: string;
  boothSource: string;
  campaign: string;
  deviceType: string;
  startTime: Date;
  email?: string;
}

export interface LevelData {
  level: number;
  score: number;
  accuracy: number; // TODO: Currently unused - set to 0
  completed: boolean;
  enemiesHit: number; // Maps to enemies_killed in DB
  friendliesHit: number; // TODO: Currently unused - always 0
  // TODO: Add for DB integration:
  // productsOnShelf?: number;
  // ultraRareCount?: number;
  // durationSeconds?: number;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  color: string;
}

export interface SwipeAction {
  sessionId: string;
  brandId: string; // Can be brand or buyer ID depending on userType
  direction: 'left' | 'right';
  timestamp: Date;
  // TODO: For DB integration, map to:
  // item_id: brandId
  // item_type: gameState.userType === 'brand' ? 'buyer' : 'brand'
}

export interface GameState {
  currentScreen: 'welcome' | 'game' | 'swipe' | 'levelComplete' | 'gameComplete' | 'gameOver' | 'results' | 'userTypeSelection' | 'leaderboard' | 'swipeSummary' | 'loadProgress';
  currentLevel: number;
  totalScore: number;
  lives: number;
  levels: LevelData[];
  swipes: SwipeAction[];
  session: GameSession | null;
  userType: 'buyer' | 'brand' | null;
}

export interface Target {
  id: string;
  type: 'enemy' | 'friendly';
  name: string;
  points: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sprite: string;
  speed: number;
  active: boolean;
}

export type EnemyType = 
  | 'pdf'
  | 'spreadsheet'
  | 'fax'
  | 'broker'
  | 'paperwork'
  | 'oldComputer';

export type FriendlyType =
  | 'grovara-logo'
  | 'organic-brand'
  | 'healthy-snack'
  | 'fresh-produce'
  | 'eco-friendly';

// New shelf-based gameplay types
export interface ShelfSlot {
  id: string;
  shelfIndex: number;
  slotIndex: number;
  occupied: boolean;
  productId?: string;
  x: number;
  y: number;
}

export interface Product {
  id: string;
  assetPath: string;
  x: number;
  y: number;
  shelfSlotId?: string;
  onShelf: boolean;
  health?: number;
}

export interface EnemySpawner {
  id: string;
  assetPath: string;
  x: number;
  y: number;
  targetProductId?: string;
  health: number; // 1-3 hearts
  targetShelfSlotId?: string;
  isMoving: boolean;
  direction: 'toShelf' | 'awayFromShelf' | 'patrol';
  patrolTarget?: { x: number; y: number };
}

export interface GameScore {
  productsOnShelf: number;
  enemiesKilled: number;
  totalScore: number;
}
