# Database Schema Summary & Implementation Guide

## 📊 Table Overview

### Core Tables (6 total)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **users** | User accounts (anonymous + registered) | Device fingerprinting, scores, preferences |
| **game_sessions** | Individual game playthroughs | Campaign tracking, session stats, completion status |
| **level_results** | Performance per level | Enemies killed, products placed, ultra-rares, duration |
| **swipe_actions** | Every swipe interaction | Lead generation, user preferences |
| **user_matches** | Deduplicated matches | Right swipes only, match counts |
| **leaderboard_entries** | High score rankings | Fast queries, fake + real players |

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

1️⃣ APP LOAD (Anonymous)
   ↓
   └─> Generate/retrieve device_id
   └─> Check users table for existing user
   └─> If not exists: INSERT into users (is_anonymous=true)

2️⃣ GAME START
   ↓
   └─> INSERT into game_sessions
       • session_id (frontend-generated)
       • booth_source, campaign (from URL params)
       • user_id (from device_id lookup)
       • status = 'in_progress'

3️⃣ PLAYING GAME (per level)
   ↓
   └─> On Level Complete:
       ├─> INSERT into level_results
       │   • level_number, score
       │   • enemies_killed, products_on_shelf
       │   • ultra_rare_count, duration_seconds
       │
       └─> UPDATE game_sessions
           • total_score += level_score
           • levels_completed += 1
           • total_enemies_killed += enemies
           • total_products_placed += products
           • total_ultra_rares += ultras

4️⃣ SWIPE FEATURE (after each level)
   ↓
   └─> For each swipe:
       ├─> INSERT into swipe_actions
       │   • item_id, direction, timestamp
       │
       └─> If direction = 'right':
           └─> INSERT/UPDATE user_matches
               • match_count += 1

5️⃣ GAME END
   ↓
   ├─> UPDATE game_sessions
   │   • status = 'completed'
   │   • final_score, completed_at
   │   • duration_seconds (auto-calculated)
   │
   ├─> UPDATE users
   │   • total_score += session_score
   │   • best_score = MAX(current, session_score)
   │   • games_played += 1
   │
   └─> If new high score:
       └─> INSERT into leaderboard_entries

6️⃣ OPTIONAL: USER REGISTRATION
   ↓
   └─> UPDATE users
       • username, email
       • is_anonymous = false
```

---

## 🔗 Table Relationships

```
users (1) ──────┬──── (many) game_sessions
                │
                ├──── (many) level_results
                │
                ├──── (many) swipe_actions
                │
                ├──── (many) user_matches
                │
                └──── (many) leaderboard_entries

game_sessions (1) ──┬── (many) level_results
                    │
                    ├── (many) swipe_actions
                    │
                    └── (1) leaderboard_entries
```

---

## 📝 Data Storage Events

### Complete Event List

| Event | Tables Updated | Fields |
|-------|---------------|--------|
| **First Visit** | `users` (INSERT) | device_id, is_anonymous, created_at |
| **Game Start** | `game_sessions` (INSERT) | session_id, user_id, booth_source, campaign, started_at |
| **Level Complete** | `level_results` (INSERT)<br>`game_sessions` (UPDATE) | score, enemies_killed, products_on_shelf, ultra_rare_count, duration<br>total_score, levels_completed, total_enemies_killed |
| **Swipe Left** | `swipe_actions` (INSERT) | item_id, direction='left', timestamp |
| **Swipe Right** | `swipe_actions` (INSERT)<br>`user_matches` (UPSERT) | item_id, direction='right'<br>match_count += 1 |
| **Game End** | `game_sessions` (UPDATE)<br>`users` (UPDATE)<br>`leaderboard_entries` (INSERT) | status, final_score, completed_at<br>total_score, best_score<br>score, rank |
| **User Registers** | `users` (UPDATE) | username, email, is_anonymous=false |
| **Select User Type** | `users` (UPDATE) | user_type ('buyer' or 'brand') |

---

## 🎯 Key Design Decisions

### 1. Anonymous User Strategy
**Problem**: Need to track users without requiring sign-up  
**Solution**: Device fingerprinting using browser characteristics  
**Benefits**:
- ✅ Seamless user experience
- ✅ No duplicate anonymous users from same device
- ✅ Easy upgrade to registered user
- ✅ Preserve game history after registration

**Recommended: Use FingerprintJS Library**
```bash
npm install @fingerprintjs/fingerprintjs
```

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const generateDeviceId = async (): Promise<string> => {
  const existingId = localStorage.getItem('grovara_device_id');
  if (existingId) return existingId;
  
  // FingerprintJS provides 99.5% accuracy
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const deviceId = result.visitorId;
  
  localStorage.setItem('grovara_device_id', deviceId);
  return deviceId;
};
```

**Fallback (if not using library)**:
```typescript
const generateDeviceId = (): string => {
  const existingId = localStorage.getItem('grovara_device_id');
  if (existingId) return existingId;
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    `${screen.width}x${screen.height}`,
    navigator.hardwareConcurrency || 'unknown',
  ].join('|');
  
  // Simple hash (use crypto.subtle.digest for production)
  const hash = Array.from(fingerprint)
    .reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0)
    .toString(36);
  
  const deviceId = `grovara_${hash}_${Date.now().toString(36)}`;
  localStorage.setItem('grovara_device_id', deviceId);
  return deviceId;
};
```

### 2. Dual Storage Pattern
**Sessions Table**: Tracks the entire game session  
**Level Results Table**: Granular per-level data  
**Why Both?**
- Session queries: fast aggregates
- Level queries: detailed analytics
- Better data normalization

### 3. Swipe Actions vs User Matches
**swipe_actions**: Every single swipe (left + right)  
**user_matches**: Deduplicated right swipes only  
**Why Both?**
- swipe_actions: Complete audit trail, analytics
- user_matches: Fast "show my matches" queries
- Different use cases, different query patterns

### 4. Leaderboard Strategy
**Mixed Fake + Real Players**  
- Pre-populate with placeholder entries
- Real players compete alongside fakes
- Motivates engagement even at low user counts

---

## 🚀 Implementation Checklist

### Phase 1: Setup (1-2 hours)
- [ ] Create Supabase project
- [ ] Run migration SQL
- [ ] Configure environment variables
- [ ] Test database connection

### Phase 2: Device Fingerprinting (2-3 hours)
- [ ] Implement device ID generation
- [ ] Add localStorage fallback
- [ ] Create user lookup/creation logic
- [ ] Test duplicate prevention

### Phase 3: Data Service Layer (4-6 hours)
- [ ] Create `src/lib/supabaseClient.ts`
- [ ] Create `src/services/userService.ts`
- [ ] Create `src/services/gameService.ts`
- [ ] Create `src/services/swipeService.ts`
- [ ] Create `src/services/leaderboardService.ts`

### Phase 4: Integration (6-8 hours)
- [ ] Replace localStorage in `useGameSession.ts`
- [ ] Update `GameContext.tsx` with Supabase calls
- [ ] Update `leaderboardManager.ts`
- [ ] Update swipe recording logic
- [ ] Add error handling and retry logic

### Phase 5: Testing (2-3 hours)
- [ ] Test anonymous user flow
- [ ] Test registration flow
- [ ] Test game session tracking
- [ ] Test swipe recording
- [ ] Test leaderboard updates
- [ ] Test offline/online sync

### Phase 6: Migration & Launch (1-2 hours)
- [ ] Migrate existing localStorage data (if any)
- [ ] Deploy database changes
- [ ] Monitor error rates
- [ ] Verify data integrity

**Total Estimated Time**: 16-24 hours

---

## 📈 Analytics Queries

### Top 10 Players
```sql
SELECT username, best_score, games_played
FROM users
WHERE is_anonymous = false
ORDER BY best_score DESC
LIMIT 10;
```

### Most Matched Brands
```sql
SELECT 
  item_name,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(match_count) as total_matches
FROM user_matches
WHERE item_type = 'brand'
GROUP BY item_name
ORDER BY unique_users DESC
LIMIT 20;
```

### Session Completion Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM game_sessions
GROUP BY status;
```

### Campaign Performance
```sql
SELECT 
  campaign,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(final_score) as avg_score,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_games
FROM game_sessions
GROUP BY campaign
ORDER BY unique_users DESC;
```

### Daily Active Users
```sql
SELECT 
  DATE(last_active_at) as date,
  COUNT(*) as active_users,
  COUNT(*) FILTER (WHERE is_anonymous = false) as registered_users
FROM users
WHERE last_active_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(last_active_at)
ORDER BY date DESC;
```

### Swipe Conversion Rate
```sql
SELECT 
  item_type,
  COUNT(*) as total_swipes,
  COUNT(*) FILTER (WHERE direction = 'right') as right_swipes,
  ROUND(COUNT(*) FILTER (WHERE direction = 'right') * 100.0 / COUNT(*), 2) as conversion_rate
FROM swipe_actions
GROUP BY item_type;
```

---

## 🔒 Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with permissive policies for prototype.  
**For production**, restrict policies to:
```sql
-- Example: Users can only see their own data
CREATE POLICY "Users view own data" ON users
  FOR SELECT USING (
    device_id = current_setting('app.device_id', true)
    OR 
    auth.uid() = id  -- If using Supabase Auth
  );
```

### Privacy Compliance
- **GDPR**: Implement user data export/deletion
- **CCPA**: Add opt-out mechanism
- **Fingerprinting**: Disclose in privacy policy
- **Consent**: Consider cookie banner if in EU

### Data Retention
Consider adding automated cleanup:
```sql
-- Delete abandoned sessions older than 30 days
DELETE FROM game_sessions
WHERE status = 'abandoned'
  AND created_at < NOW() - INTERVAL '30 days';

-- Anonymize inactive anonymous users
UPDATE users
SET device_id = 'deleted_' || id
WHERE is_anonymous = true
  AND last_active_at < NOW() - INTERVAL '1 year';
```

---

## 🎨 Next Steps: UI Integration Points

### 1. Anonymous User Banner
Show registration prompt after first game:
```typescript
if (user.is_anonymous && user.games_played > 0) {
  // Show "Register to save your progress!"
}
```

### 2. Match Summary Screen
Query user matches after swipe session:
```typescript
const matches = await supabase
  .from('user_matches')
  .select('*')
  .eq('user_id', userId)
  .order('last_matched_at', { ascending: false });
```

### 3. Real-time Leaderboard
Subscribe to leaderboard changes:
```typescript
const subscription = supabase
  .channel('leaderboard-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leaderboard_entries' },
    (payload) => {
      // Update leaderboard UI
    }
  )
  .subscribe();
```

### 4. Progress Dashboard
Show user stats on welcome screen:
```typescript
const stats = await supabase
  .from('users')
  .select('games_played, best_score, total_score')
  .eq('device_id', deviceId)
  .single();
```

---

## 💾 Offline Support Strategy

### LocalStorage as Cache
Keep localStorage for offline resilience:
```typescript
// Write to both localStorage and Supabase
await saveToLocalStorage(data);
await saveToSupabase(data);

// Sync on reconnection
window.addEventListener('online', syncPendingData);
```

### Pending Queue Pattern
```typescript
interface PendingAction {
  type: 'swipe' | 'level_complete' | 'session_end';
  data: any;
  timestamp: number;
}

const queue: PendingAction[] = [];
// Process queue when online
```

---

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **SQL Reference**: PostgreSQL 15 documentation
- **Device Fingerprinting**: FingerprintJS, ClientJS libraries
- **Privacy**: GDPR guidelines, privacy policy templates

---

## 🎯 Success Metrics to Track

After implementation, monitor:
- [ ] Anonymous user creation rate
- [ ] Registration conversion rate (anonymous → registered)
- [ ] Session completion rate
- [ ] Average swipes per session
- [ ] Match-to-total-swipe ratio
- [ ] Daily/Weekly/Monthly active users
- [ ] Campaign ROI (booth source tracking)
- [ ] Database query performance
- [ ] Error rates and failed queries
