# Supabase Database Schema Design

## Overview
This document outlines the database schema for the Grovara Arcade Blast game, designed to support anonymous users, user registration, game sessions, and tracking user interactions.

## Current Data Flow Analysis

### Existing Functionality
1. **Game Sessions**: Users start with an auto-generated session ID based on timestamp and random string
2. **User Types**: Players can be either "buyer" or "brand"
3. **Gameplay**: 3-level shooting game with lives system
4. **Swipe Feature**: After levels, users swipe on brands (if buyer) or buyers (if brand)
5. **Registration**: Optional email/username registration to save progress
6. **Leaderboard**: Score tracking and competitive rankings

### Current Data Tracked
- Session metadata (booth source, campaign, device type, start time)
- Level performance (score, enemies killed, level completion)
- Swipe actions (brand/buyer ID, direction, timestamp)
- User accounts (username, score, matched brands)
- Product placement (products on shelf, ultra-rare products)

---

## Proposed Database Schema

### 1. `users` Table
Stores both anonymous and registered users with device fingerprinting.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,           -- Device fingerprint (browser fingerprint)
  username TEXT UNIQUE,                      -- NULL for anonymous users
  email TEXT UNIQUE,                         -- NULL for anonymous users
  user_type TEXT CHECK (user_type IN ('buyer', 'brand')), -- User's selected type
  is_anonymous BOOLEAN DEFAULT TRUE,         -- Track registration status
  total_score INTEGER DEFAULT 0,             -- Cumulative score across all sessions
  best_score INTEGER DEFAULT 0,              -- Highest single session score
  games_played INTEGER DEFAULT 0,            -- Total number of game sessions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_best_score ON users(best_score DESC);
CREATE INDEX idx_users_is_anonymous ON users(is_anonymous);
```

**Purpose**: 
- Supports anonymous users via device fingerprinting
- Allows seamless upgrade to registered user
- Prevents duplicate anonymous users from same device
- Tracks user preferences and statistics

**Events to Store**:
- User first visits app (anonymous user created)
- User registers (update username/email, set is_anonymous = false)
- User selects user_type (update user_type)

---

### 2. `game_sessions` Table
Tracks individual game play sessions.

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,           -- Frontend-generated session ID
  booth_source TEXT,                          -- e.g., "expo-west-2024"
  campaign TEXT,                              -- UTM campaign tracking
  device_type TEXT,                           -- iOS, Android, Desktop, Mobile
  user_type TEXT CHECK (user_type IN ('buyer', 'brand')), -- User type during this session
  total_score INTEGER DEFAULT 0,
  final_score INTEGER,                        -- Final score when session ends
  lives_remaining INTEGER DEFAULT 3,
  levels_completed INTEGER DEFAULT 0,
  total_enemies_killed INTEGER DEFAULT 0,
  total_products_placed INTEGER DEFAULT 0,    -- Products successfully placed on shelves
  total_ultra_rares INTEGER DEFAULT 0,        -- Ultra rare products collected
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,                   -- Calculated on completion
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON game_sessions(session_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_started_at ON game_sessions(started_at DESC);
CREATE INDEX idx_sessions_booth_campaign ON game_sessions(booth_source, campaign);
```

**Purpose**:
- Track each game playthrough from start to finish
- Enable analytics on session performance
- Support campaign tracking and booth attribution

**Events to Store**:
- Game starts (create session)
- Level completed (update statistics)
- Game ends/completes (update final_score, status, completed_at)
- Game abandoned (update status if user leaves)

---

### 3. `level_results` Table
Stores detailed performance for each level within a session.

```sql
CREATE TABLE level_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL CHECK (level_number > 0),
  score INTEGER DEFAULT 0,
  enemies_killed INTEGER DEFAULT 0,           -- Enemies killed in this level
  products_on_shelf INTEGER DEFAULT 0,        -- Products successfully placed
  ultra_rare_count INTEGER DEFAULT 0,         -- Ultra rare products placed
  completed BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER,                   -- Time taken to complete level
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, level_number)
);

-- Indexes
CREATE INDEX idx_level_results_session_id ON level_results(session_id);
CREATE INDEX idx_level_results_user_id ON level_results(user_id);
CREATE INDEX idx_level_results_level_number ON level_results(level_number);
CREATE INDEX idx_level_results_score ON level_results(score DESC);
```

**Purpose**:
- Detailed level-by-level performance tracking
- Analytics on difficulty progression
- Identify which levels players struggle with
- Track ultra-rare product collection rate

**Events to Store**:
- Level completed (create entry with score, enemies_killed, products_on_shelf, ultra_rare_count, duration)

**Note**: Current implementation doesn't track accuracy or individual shots. The game is placement-based (products on shelf) with enemy elimination.

---

### 4. `swipe_actions` Table
Tracks user swipes on brands/buyers.

```sql
CREATE TABLE swipe_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,                      -- Brand/buyer ID from JSON
  item_name TEXT,                             -- Brand/buyer name
  item_type TEXT CHECK (item_type IN ('brand', 'buyer')),
  direction TEXT CHECK (direction IN ('left', 'right')) NOT NULL,
  swipe_position INTEGER,                     -- Order in the swipe sequence
  level_after INTEGER,                        -- Which level this swipe came after
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_swipe_actions_session_id ON swipe_actions(session_id);
CREATE INDEX idx_swipe_actions_user_id ON swipe_actions(user_id);
CREATE INDEX idx_swipe_actions_item_id ON swipe_actions(item_id);
CREATE INDEX idx_swipe_actions_direction ON swipe_actions(direction);
CREATE INDEX idx_swipe_actions_created_at ON swipe_actions(created_at DESC);
```

**Purpose**:
- Track brand/buyer preferences and matches
- Generate leads for business development
- Analyze user interest patterns
- Enable follow-up marketing

**Events to Store**:
- User swipes left on item (create with direction='left')
- User swipes right on item (create with direction='right')

**Implementation Note**: The current frontend code uses `brandId` in SwipeAction interface even when swiping on buyers. When integrating with Supabase, map `brandId` → `item_id` and determine `item_type` based on `gameState.userType`.

---

### 5. `user_matches` Table
Stores confirmed matches (right swipes) for easy querying.

```sql
CREATE TABLE user_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT,
  item_type TEXT CHECK (item_type IN ('brand', 'buyer')),
  match_count INTEGER DEFAULT 1,              -- Number of times matched
  first_matched_at TIMESTAMPTZ DEFAULT NOW(),
  last_matched_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, item_id)
);

-- Indexes
CREATE INDEX idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX idx_user_matches_item_id ON user_matches(item_id);
CREATE INDEX idx_user_matches_item_type ON user_matches(item_type);
```

**Purpose**:
- Quick access to user's matched brands/buyers
- Deduplicated view of user interests
- Support for "view your matches" feature

**Events to Store**:
- User swipes right (insert or update match_count)

---

### 6. `leaderboard_entries` Table
Materialized view of top scores for performance.

```sql
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER,
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  is_fake BOOLEAN DEFAULT FALSE,              -- For pre-populated placeholder entries
  
  UNIQUE(user_id, score, achieved_at)
);

-- Indexes
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(rank);
CREATE INDEX idx_leaderboard_username ON leaderboard_entries(username);
```

**Purpose**:
- Fast leaderboard queries
- Support global and filtered leaderboards
- Mix real players with placeholder entries

**Events to Store**:
- New high score achieved (insert entry)
- Periodic rebuild/refresh of rankings

---

## Additional Considerations

### Device Fingerprinting Strategy

For anonymous user identification, use a combination of:
- Browser fingerprint (using libraries like FingerprintJS or ClientJS)
- LocalStorage backup ID
- Session cookie

**Recommended: Use FingerprintJS Library**
```typescript
// Install: npm install @fingerprintjs/fingerprintjs
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const generateDeviceId = async (): Promise<string> => {
  // Try to get existing device ID from localStorage
  const existingId = localStorage.getItem('grovara_device_id');
  if (existingId) return existingId;
  
  // Use FingerprintJS for robust fingerprinting
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const deviceId = result.visitorId;
  
  // Store in localStorage as backup
  localStorage.setItem('grovara_device_id', deviceId);
  
  return deviceId;
};
```

**Fallback Implementation (if not using library)**:
```typescript
const generateDeviceId = (): string => {
  const existingId = localStorage.getItem('grovara_device_id');
  if (existingId) return existingId;
  
  // Generate fingerprint from browser characteristics
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    `${screen.width}x${screen.height}`,
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ].join('|');
  
  // Simple hash function (for production, use crypto.subtle.digest)
  const hash = Array.from(fingerprint)
    .reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
    .toString(36);
  
  const deviceId = `grovara_${hash}_${Date.now().toString(36)}`;
  localStorage.setItem('grovara_device_id', deviceId);
  
  return deviceId;
};
```

**Important Notes**:
- FingerprintJS provides 99.5% accuracy for user identification
- Simple fingerprinting may have collisions (use with UUID fallback)
- Always combine with localStorage for persistence
- Consider GDPR/privacy implications and disclose in privacy policy

### Row Level Security (RLS) Policies

```sql
-- Users can only read/update their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (device_id = current_setting('app.device_id', true));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (device_id = current_setting('app.device_id', true));

-- Sessions are readable by owner
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON game_sessions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE device_id = current_setting('app.device_id', true)));

-- Similar policies for other tables...
```

---

## Data Storage Events Summary

### On App Load (Anonymous User)
1. Generate/retrieve device_id
2. Check if user exists with device_id
3. If not exists, INSERT into `users` with:
   - device_id
   - is_anonymous = true
   - created_at = NOW()

### On Game Start
1. INSERT into `game_sessions` with:
   - user_id (from device_id lookup)
   - session_id (frontend-generated)
   - booth_source, campaign (from URL params)
   - device_type
   - status = 'in_progress'
   - started_at = NOW()

### On Level Complete
1. INSERT into `level_results` with:
   - session_id
   - user_id
   - level_number
   - score
   - enemies_killed
   - products_on_shelf (count of products successfully placed)
   - ultra_rare_count (count of ultra rare products)
   - completed = true
   - duration_seconds (time taken for level)

2. UPDATE `game_sessions` SET:
   - total_score += level_score
   - levels_completed += 1
   - total_enemies_killed += level_enemies
   - total_products_placed += level_products
   - total_ultra_rares += level_ultra_rares

### On Swipe Action
1. INSERT into `swipe_actions` with:
   - session_id
   - user_id
   - item_id, item_name, item_type
   - direction
   - swipe_position
   - created_at = NOW()

2. If direction = 'right':
   - INSERT/UPDATE `user_matches` with:
     - user_id
     - item_id, item_name, item_type
     - match_count += 1
     - last_matched_at = NOW()

### On Game End
1. UPDATE `game_sessions` SET:
   - status = 'completed'
   - final_score = total_score
   - completed_at = NOW()
   - duration_seconds = EXTRACT(EPOCH FROM (completed_at - started_at))

2. UPDATE `users` SET:
   - total_score += session_final_score
   - best_score = MAX(best_score, session_final_score)
   - games_played += 1
   - last_active_at = NOW()

3. If new high score, INSERT into `leaderboard_entries`

### On User Registration
1. UPDATE `users` SET:
   - username = <input_username>
   - email = <input_email>
   - is_anonymous = false
   - updated_at = NOW()

### On User Type Selection
1. UPDATE `users` SET:
   - user_type = 'buyer' | 'brand'
   - updated_at = NOW()

---

## Analytics Queries

### Top Performers
```sql
SELECT username, best_score, games_played
FROM users
WHERE is_anonymous = false
ORDER BY best_score DESC
LIMIT 10;
```

### Most Popular Brands/Buyers
```sql
SELECT item_id, item_name, COUNT(*) as match_count
FROM user_matches
WHERE item_type = 'brand'
GROUP BY item_id, item_name
ORDER BY match_count DESC
LIMIT 20;
```

### Session Completion Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as completion_rate
FROM game_sessions;
```

### Average Session Duration
```sql
SELECT AVG(duration_seconds) as avg_duration
FROM game_sessions
WHERE status = 'completed';
```

### Campaign Performance
```sql
SELECT 
  campaign,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_sessions,
  AVG(final_score) as avg_score
FROM game_sessions
GROUP BY campaign
ORDER BY unique_users DESC;
```

---

## Migration Path

1. ✅ Design schema (this document)
2. Create Supabase project and tables
3. Implement device fingerprinting
4. Create data service layer for Supabase integration
5. Replace localStorage calls with Supabase calls
6. Test anonymous user flow
7. Test registration flow
8. Migrate existing localStorage data (if needed)
9. Add analytics dashboard

---

## Implementation Gaps & Code Changes Required

### Current Code → Database Schema Mapping

#### ✅ Already Captured:
- Session ID, booth source, campaign, device type
- Level number, score, completion status
- Enemies killed per level
- Swipe action (brandId, direction, timestamp)
- User registration (username, email)

#### ⚠️ Need to Add Tracking:
1. **Level Duration** - Add timer tracking:
   ```typescript
   // In GameCanvas.tsx, track level start/end time
   const levelStartTime = useRef<number>(Date.now());
   const durationSeconds = Math.floor((Date.now() - levelStartTime.current) / 1000);
   ```

2. **Products on Shelf** - Already available from ShelfManager:
   ```typescript
   const productsOnShelf = shelfMgr.getOccupiedProducts().length;
   ```

3. **Ultra Rare Count** - Track in level completion:
   ```typescript
   const ultraRareCount = occupiedIds.reduce((count, id) => {
     const product = data.products.find(p => p.id === id);
     return product?.rarity === 'ultra' ? count + 1 : count;
   }, 0);
   ```

4. **Item Name & Type in Swipes** - Enhance recordSwipe:
   ```typescript
   const recordSwipe = (brandId: string, direction: 'left' | 'right', itemName: string) => {
     const itemType = gameState.userType === 'brand' ? 'buyer' : 'brand';
     // Save to DB with item_id, item_name, item_type
   };
   ```

#### ❌ Not Currently Tracked (Optional):
- Individual shots fired (not needed for this game type)
- Accuracy percentage (not applicable to placement game)
- Friendlies hit (no penalty for hitting products currently)
- Lives lost per level (could be calculated from game state)

### Required Code Changes

#### 1. Update `LevelData` Interface
```typescript
// src/types/game.ts
export interface LevelData {
  level: number;
  score: number;
  completed: boolean;
  enemiesKilled: number;          // Rename from enemiesHit
  productsOnShelf: number;        // Add
  ultraRareCount: number;         // Add
  durationSeconds: number;        // Add
  // Remove: accuracy, friendliesHit
}
```

#### 2. Update Level Completion Call
```typescript
// In GameCanvas.tsx
completeLevel({
  level: gameState.currentLevel,
  score: finalScore,
  completed: true,
  enemiesKilled: data.kills,
  productsOnShelf: normalCount + ultraCount,
  ultraRareCount: ultraCount,
  durationSeconds: Math.floor((Date.now() - levelStartTime.current) / 1000),
});
```

#### 3. Enhance Swipe Tracking
```typescript
// In SwipeScreen.tsx
const handleSwipe = (direction: 'left' | 'right') => {
  if (!currentBrand) return;
  
  recordSwipe(
    currentBrand.id,
    direction,
    currentBrand.name,
    gameState.userType === 'brand' ? 'buyer' : 'brand'
  );
};
```

#### 4. Add Session Duration Tracking
```typescript
// In useGameSession.ts
const sessionStartTime = useRef<number>(Date.now());

// On session end
const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
```

### Schema Validation Summary

| Database Field | Current Code | Status | Action Needed |
|----------------|--------------|--------|---------------|
| `device_id` | ❌ Not implemented | 🔴 Required | Add fingerprinting |
| `session_id` | ✅ Generated | ✅ Ready | None |
| `booth_source` | ✅ URL param | ✅ Ready | None |
| `campaign` | ✅ URL param | ✅ Ready | None |
| `total_score` | ✅ Tracked | ✅ Ready | None |
| `levels_completed` | ✅ Tracked | ✅ Ready | None |
| `enemies_killed` | ✅ Tracked as `kills` | ✅ Ready | None |
| `products_on_shelf` | ✅ Available | 🟡 Needs wiring | Add to LevelData |
| `ultra_rares` | ✅ Available | 🟡 Needs wiring | Add to LevelData |
| `duration_seconds` | ❌ Not tracked | 🟡 Needs wiring | Add timer |
| `item_name` | ❌ Not in SwipeAction | 🟡 Needs wiring | Enhance interface |
| `item_type` | ❌ Not in SwipeAction | 🟡 Needs wiring | Calculate from userType |

---

## Notes

- **Privacy**: Device fingerprinting should comply with privacy regulations
- **Fallback**: Keep localStorage as fallback if Supabase is unavailable
- **Performance**: Use Supabase real-time subscriptions for leaderboard
- **Future**: Consider adding email notifications for matches
- **Future**: Add brand/buyer profiles table if needed

---

## Pre-Implementation Checklist

Before starting Supabase integration, complete these code enhancements:

### 🔴 Critical (Required for Schema)
- [ ] Add device fingerprinting utility (recommend FingerprintJS)
- [ ] Update `LevelData` interface with required fields
- [ ] Track level duration (start/end timestamps)
- [ ] Track products on shelf count
- [ ] Track ultra rare count
- [ ] Enhance swipe tracking with item names

### 🟡 Recommended (Improves Data Quality)
- [ ] Add session duration tracking
- [ ] Remove unused `accuracy` and `friendliesHit` fields from types
- [ ] Add comprehensive error handling for missing data
- [ ] Create data validation utilities
- [ ] Add TypeScript types for DB entities

### 🟢 Optional (Nice to Have)
- [ ] Add analytics for products stolen vs saved
- [ ] Track individual click positions (heatmap data)
- [ ] Add A/B test support (variant tracking)
- [ ] Track user agent details separately

### 📋 Review Completed
- [x] Schema matches current game mechanics (placement-based gameplay)
- [x] Removed inapplicable fields (shots, accuracy)
- [x] Added ultra-rare tracking for scoring
- [x] Device fingerprinting strategy defined
- [x] Migration SQL updated to match schema
- [x] Documentation aligned with implementation

