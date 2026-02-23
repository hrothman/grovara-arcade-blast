# Supabase Integration Setup Guide

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16 or higher
3. **Package Manager**: npm, yarn, pnpm, or bun

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
# or
pnpm add @supabase/supabase-js
# or
bun add @supabase/supabase-js
```

### Step 2: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: grovara-arcade-blast
   - **Database Password**: (save this - you'll need it)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Step 3: Run Database Migration

1. In your Supabase project, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase_migration.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

**What this does:**
- ✅ Creates all 6 tables (users, game_sessions, level_results, swipe_actions, user_matches, leaderboard_entries)
- ✅ Sets up indexes for performance
- ✅ Configures automatic triggers (timestamps, duration calculation, rank updates)
- ✅ Enables Row Level Security (RLS)
- ✅ Creates helpful views (active_users, popular_items, session_statistics)
- ✅ Inserts sample leaderboard data

### Step 4: Get Your API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: `.env.local` is git-ignored for security

### Step 6: Test the Connection

Add this to your app's initialization (e.g., in `main.tsx` or `App.tsx`):

```typescript
import { testSupabaseConnection } from '@/lib/supabaseClient';

// Test connection on app start
testSupabaseConnection().then(connected => {
  if (connected) {
    console.log('✅ Supabase is ready!');
  } else {
    console.log('⚠️ Running in offline mode (localStorage fallback)');
  }
});
```

### Step 7: Start Development

```bash
npm run dev
```

Visit your app and check the browser console. You should see:
```
✅ Supabase connected successfully
✅ Anonymous user created in Supabase
```

---

## 📁 File Structure

```
src/
├── lib/
│   ├── supabaseClient.ts      # Supabase client configuration
│   └── deviceFingerprint.ts   # Anonymous user identification
├── services/
│   ├── index.ts               # Service exports
│   ├── userService.ts         # User management
│   ├── gameService.ts         # Game sessions & levels
│   ├── swipeService.ts        # Swipe actions & matches
│   └── leaderboardService.ts  # Leaderboard operations
└── types/
    └── database.ts            # TypeScript database types

.env.local                      # Your secret credentials (git-ignored)
.env.example                    # Template for credentials
supabase_migration.sql          # Database schema & setup
```

---

## 🔄 How It Works

### Device Fingerprinting (Anonymous Users)

When a user first visits:
1. Browser fingerprint is generated from characteristics (user agent, screen size, timezone, etc.)
2. Hashed with SHA-256 to create unique `device_id`
3. Stored in `localStorage` for persistence
4. Used to create anonymous user in database
5. No signup required - seamless experience!

### Data Flow

```
User plays game
    ↓
Services called (e.g., createGameSession)
    ↓
Try Supabase first
    ↓
If Supabase fails → localStorage fallback
    ↓
User never sees errors - data always saved
```

### Fallback Strategy

All services support **dual mode**:
- **Supabase mode**: When configured, all data goes to cloud database
- **Offline mode**: When Supabase unavailable, falls back to localStorage
- **Seamless**: User experience identical in both modes
- **No errors**: Failed Supabase calls automatically use localStorage

---

## 🎮 Usage Examples

### Create Anonymous User

```typescript
import { getOrCreateUser } from '@/services';

const user = await getOrCreateUser();
console.log('User ID:', user?.id);
console.log('Device ID:', user?.device_id);
console.log('Anonymous:', user?.is_anonymous);
```

### Start Game Session

```typescript
import { createGameSession } from '@/services';

const session = await createGameSession(
  userId,
  sessionId,
  'expo-west-2024',  // booth source
  'social-media',    // campaign
  'iOS',             // device type
  'buyer'            // user type
);
```

### Record Level Completion

```typescript
import { recordLevelResult, updateGameSession } from '@/services';

// Record level details
await recordLevelResult(
  dbSessionId,
  userId,
  levelNumber,
  {
    score: 5000,
    enemiesKilled: 10,
    productsOnShelf: 8,
    ultraRareCount: 2,
    completed: true,
    durationSeconds: 45,
  }
);

// Update session totals
await updateGameSession(sessionId, {
  totalScore: 5000,
  levelsCompleted: 1,
  totalEnemiesKilled: 10,
  totalProductsPlaced: 8,
  totalUltraRares: 2,
});
```

### Record Swipe Action

```typescript
import { recordSwipeAction } from '@/services';

await recordSwipeAction(
  sessionId,
  userId,
  'liquid-death',        // item ID
  'Liquid Death',        // item name
  'brand',               // item type
  'right',               // direction (right = match)
  1,                     // swipe position
  3                      // level after
);
```

### Register User

```typescript
import { registerUser } from '@/services';

const user = await registerUser('username123', 'user@example.com');
// Converts anonymous user to registered user
```

### Add to Leaderboard

```typescript
import { addLeaderboardEntry } from '@/services';

await addLeaderboardEntry(
  userId,
  username,
  finalScore,
  sessionId
);
```

### Get Leaderboard

```typescript
import { getLeaderboard } from '@/services';

const topPlayers = await getLeaderboard(50);
// Returns top 50 players (includes fake players for engagement)
```

---

## 🔒 Security & Privacy

### Row Level Security (RLS)

The migration automatically enables RLS on all tables. Current policies are permissive for prototype phase.

**For production**, tighten policies:

```sql
-- Example: Restrict users table
CREATE POLICY "Users view own data" ON users
  FOR SELECT USING (
    device_id = current_setting('app.device_id', true)
  );
```

### Device Fingerprinting Compliance

- ⚠️ **GDPR**: Disclose fingerprinting in privacy policy
- ⚠️ **CCPA**: Provide opt-out mechanism
- ⚠️ **Cookie Laws**: Consider showing banner in EU

**Recommended privacy policy text:**
> "We use device fingerprinting to provide a seamless gaming experience without requiring account creation. This creates a unique identifier based on your browser characteristics. No personal information is collected."

### Data Retention

Consider implementing cleanup:

```sql
-- Delete old abandoned sessions
DELETE FROM game_sessions
WHERE status = 'abandoned'
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## 🐛 Troubleshooting

### "Supabase not configured"

**Cause**: Missing or invalid environment variables

**Fix**:
1. Check `.env.local` exists (not `.env.example`)
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart dev server after changing `.env.local`

### "Connection test failed"

**Cause**: Network issue or incorrect credentials

**Fix**:
1. Check Supabase project is active (not paused)
2. Verify URL and key are correct (no extra spaces)
3. Check internet connection
4. Try accessing Supabase dashboard to confirm service is up

### "Table not found"

**Cause**: Migration not run or failed

**Fix**:
1. Go to Supabase SQL Editor
2. Re-run `supabase_migration.sql`
3. Check for error messages
4. Verify all tables exist in Table Editor

### Data not appearing

**Cause**: RLS policies blocking access

**Fix**:
1. For development, temporarily disable RLS:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```
2. Check Supabase logs for permission errors
3. Review RLS policies in Table Editor

### localStorage limit exceeded

**Cause**: Too much data in localStorage (5-10MB limit)

**Fix**:
1. This shouldn't happen - Supabase should be storing data
2. Clear old localStorage data:
   ```javascript
   localStorage.clear();
   ```
3. Check why Supabase fallback is being used

---

## 📊 Database Schema

See `SUPABASE_SCHEMA.md` for complete documentation including:
- Full table structures
- Field descriptions
- Relationships
- Indexes
- Analytics queries

---

## 🚢 Deployment

### Environment Variables

Add to your deployment platform (Vercel, Netlify, etc.):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Command

```bash
npm run build
```

The build will use environment variables from your deployment platform.

### Supabase Limits (Free Tier)

- Database: 500MB
- Bandwidth: 5GB/month
- Requests: Unlimited (with fair use)

**For production**: Consider upgrading to Pro ($25/month) for:
- 8GB database
- 250GB bandwidth
- Point-in-time recovery
- Daily backups

---

## 📈 Monitoring

### Supabase Dashboard

Monitor at `https://app.supabase.com/project/YOUR_PROJECT/database`:

- **Table Editor**: View all data
- **SQL Editor**: Run custom queries
- **Logs**: See all database activity
- **API Logs**: Track service calls
- **Database**: Monitor size and performance

### Useful Queries

**Session statistics:**
```sql
SELECT * FROM session_statistics;
```

**Active users (last 7 days):**
```sql
SELECT * FROM active_users;
```

**Popular items:**
```sql
SELECT * FROM popular_items LIMIT 20;
```

**Campaign performance:**
```sql
SELECT 
  campaign,
  COUNT(*) as sessions,
  AVG(final_score) as avg_score
FROM game_sessions
WHERE campaign IS NOT NULL
GROUP BY campaign
ORDER BY sessions DESC;
```

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Migration SQL executed successfully
- [ ] All 6 tables visible in Supabase Table Editor
- [ ] `.env.local` configured with correct credentials
- [ ] `npm install @supabase/supabase-js` completed
- [ ] Dev server restarted after env changes
- [ ] Browser console shows "Supabase connected successfully"
- [ ] Anonymous user created on first visit
- [ ] Game session data appears in `game_sessions` table
- [ ] Level results appear in `level_results` table

---

## 🎯 Next Steps

1. **Test thoroughly**: Play through game and verify data in Supabase
2. **Review RLS policies**: Tighten security before production
3. **Add monitoring**: Set up alerts for errors
4. **Plan data retention**: Decide on cleanup schedule
5. **Privacy policy**: Update with fingerprinting disclosure
6. **Consider analytics**: Use views for business insights

---

## 🤝 Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Migration Issues**: Check `IMPLEMENTATION_GUIDE.md`
- **Schema Questions**: Review `SUPABASE_SCHEMA.md`
