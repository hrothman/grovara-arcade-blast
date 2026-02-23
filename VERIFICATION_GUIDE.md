# Supabase Integration Verification Guide

## ✅ What Was Fixed

### 1. **Added Comprehensive Logging**
All service functions now have detailed console logging:
- 🔍 Function entry points
- ☁️ Supabase attempts
- ✅ Success confirmations
- ❌ Error messages
- 💾 localStorage fallback usage

### 2. **Connection Testing on App Init**
Modified [main.tsx](src/main.tsx) to:
- Test Supabase connection when app starts
- Initialize anonymous user automatically
- Log connection status and user details

### 3. **Integrated Services into Game Flow**
Updated [useGameSession.ts](src/hooks/useGameSession.ts) to:
- Call `getOrCreateUser()` on session start
- Call `createGameSession()` to save to database
- Call `recordLevelResult()` when levels complete
- Call `recordSwipeAction()` when user swipes brands
- All data now flows to Supabase (with localStorage fallback)

---

## 🧪 How to Verify It's Working

### Step 1: Start the Dev Server

```bash
npm run dev
```

### Step 2: Open Browser Console

Open your browser's developer console (F12 or Cmd+Option+I on Mac).

### Step 3: Check Initial Logs

You should see these logs when the app loads:

```
🎮 Initializing Grovara Arcade Blast...
🔍 [UserService] getOrCreateUser called
🆔 Device ID: <your-device-fingerprint>
☁️ Supabase configured - attempting cloud storage
✅ Found existing user in Supabase: <user-id>
   OR
✅ Anonymous user created in Supabase: <user-id>
✅ Supabase connected successfully
👤 User initialized: <user-id>
   Anonymous: true
   Device ID: <device-fingerprint>
```

**If you see:**
- ☁️ markers: Supabase is being used
- 💾 markers: localStorage fallback is being used
- ❌ markers: Errors occurred (check the error message)

### Step 4: Start Playing a Game

Click through the welcome screen and start playing. Watch for:

```
🎮 Initializing game session...
👤 User ID: <user-id>
🎮 [GameService] createGameSession called
☁️ Attempting to save session to Supabase
✅ Game session created in Supabase: <session-id>
```

### Step 5: Complete a Level

When you finish a level:

```
📊 Recording level completion: {level: 1, score: 5000, ...}
🎮 [GameService] recordLevelResult called
☁️ Saving level result to Supabase
✅ Level result recorded in Supabase
```

### Step 6: Swipe Brands (if applicable)

During brand swiping:

```
👆 Recording swipe: {brandId: "liquid-death", direction: "right"}
👆 [SwipeService] recordSwipeAction called
☁️ Saving swipe to Supabase
✅ Swipe action recorded in Supabase
```

### Step 7: Check Supabase Dashboard

1. Go to your Supabase project: https://app.supabase.com/project/vjssvvwdthaljhksdkak
2. Navigate to **Table Editor**
3. Check each table:

   **users table:**
   - Should have 1 row with your device_id
   - `is_anonymous` should be `true`
   - `last_active_at` should be recent

   **game_sessions table:**
   - Should have 1 row with your session
   - Check `booth_source`, `campaign`, `device_type` are populated
   - `status` should be `in_progress`

   **level_results table:**
   - Should have rows for each completed level
   - Check `score`, `enemies_killed`, `products_on_shelf` values

   **swipe_actions table:**
   - Should have rows for each brand swipe
   - Check `direction` (`left` or `right`)

---

## 🐛 Troubleshooting Common Issues

### Issue: "Supabase not configured - using localStorage fallback"

**Cause:** Environment variables not set or dev server not restarted.

**Fix:**
1. Verify [.env.local](.env.local) has your credentials
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Issue: "❌ Supabase connection test failed"

**Cause:** Invalid credentials or network issue.

**Fix:**
1. Double-check your Supabase URL and anon key in `.env.local`
2. Test Supabase dashboard is accessible
3. Check browser network tab for failed requests

### Issue: "❌ Supabase session creation error: JWT expired"

**Cause:** Anon key was revoked or project paused.

**Fix:**
1. Go to Supabase dashboard → Settings → API
2. Copy fresh anon key
3. Update `.env.local`
4. Restart dev server

### Issue: No data appearing in Supabase tables

**Cause:** RLS policies blocking access or tables don't exist.

**Fix:**
1. Go to Supabase SQL Editor
2. Run this to check tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. Should see: `users`, `game_sessions`, `level_results`, `swipe_actions`, `user_matches`, `leaderboard_entries`
4. If missing, re-run [supabase_migration.sql](supabase_migration.sql)

### Issue: Console shows errors but game still works

**Cause:** Fallback to localStorage is working correctly.

**Impact:** Game functions normally but data isn't saved to cloud.

**Fix:** Resolve the Supabase errors to enable cloud storage.

---

## 📊 Expected Console Log Flow

Here's what a successful game session looks like in the console:

```
1. App Init:
   🎮 Initializing Grovara Arcade Blast...
   🔍 [UserService] getOrCreateUser called
   ☁️ Supabase configured - attempting cloud storage
   ✅ Anonymous user created in Supabase: abc-123
   ✅ Supabase connected successfully
   👤 User initialized: abc-123

2. Session Start:
   🎮 Initializing game session...
   🎮 [GameService] createGameSession called
   ☁️ Attempting to save session to Supabase
   ✅ Game session created in Supabase: session-456

3. Level Complete:
   📊 Recording level completion: {level: 1, score: 5000}
   🎮 [GameService] recordLevelResult called
   ☁️ Saving level result to Supabase
   ✅ Level result recorded in Supabase

4. Brand Swipe:
   👆 Recording swipe: {brandId: "brand-x", direction: "right"}
   👆 [SwipeService] recordSwipeAction called
   ☁️ Saving swipe to Supabase
   ✅ Swipe action recorded in Supabase
```

---

## 🎯 What to Check in Supabase

After playing one complete game session, verify:

### users table
- ✅ 1 user with your `device_id`
- ✅ `is_anonymous = true`
- ✅ `games_played >= 1`
- ✅ `total_score > 0`
- ✅ `last_active_at` is recent

### game_sessions table
- ✅ 1 session with matching `session_id`
- ✅ `user_id` matches your user
- ✅ `status = 'completed'` (if finished) or `'in_progress'`
- ✅ `levels_completed >= 1`
- ✅ `total_score > 0`

### level_results table
- ✅ 1-3 rows (one per level)
- ✅ All have matching `session_id` and `user_id`
- ✅ `level_number` is 1, 2, 3
- ✅ `score > 0` for each
- ✅ `completed = true`

### swipe_actions table (if you swiped brands)
- ✅ Multiple rows
- ✅ Mix of `direction = 'left'` and `'right'`
- ✅ `item_type = 'brand'`
- ✅ All have matching `session_id` and `user_id`

---

## 🔄 localStorage Fallback Behavior

If Supabase is unavailable, the app automatically falls back to localStorage:

**You'll see:**
```
💾 Supabase not configured - using localStorage fallback
💾 Running in offline mode (localStorage fallback)
💾 Using localStorage for user management
💾 Using localStorage for session
```

**Data is saved to:**
- `localStorage.getItem('grovara_users')`
- `localStorage.getItem('grovara_sessions')`
- `localStorage.getItem('grovara_levels')`
- `localStorage.getItem('grovara_swipe_actions')`

**To inspect:**
```javascript
// In browser console
JSON.parse(localStorage.getItem('grovara_users'))
JSON.parse(localStorage.getItem('grovara_sessions'))
```

---

## ✅ Success Criteria

Your integration is working correctly if:

1. ✅ Console shows "✅ Supabase connected successfully"
2. ✅ User is created/found on app load
3. ✅ Game session appears in `game_sessions` table
4. ✅ Level results appear in `level_results` table
5. ✅ No ❌ error logs in console
6. ✅ All Supabase operations show ☁️ cloud icon
7. ✅ Data persists after page refresh

---

## 📞 Need Help?

If you're still seeing issues:

1. **Check the full error message** - Console logs will tell you exactly what failed
2. **Verify credentials** - Invalid Supabase URL/key is most common issue
3. **Check Supabase logs** - Dashboard → Logs shows all database activity
4. **Review RLS policies** - Table Editor → Policies (should be enabled)
5. **Test migration** - Re-run `supabase_migration.sql` if tables are missing

---

## 🎉 Next Steps

Once verified:

1. **Test registration flow** - Try converting anonymous user to registered
2. **Add to leaderboard** - Complete a game and check leaderboard table
3. **Analytics queries** - Use views for insights (see SUPABASE_SCHEMA.md)
4. **Tighten RLS** - Update policies for production security
5. **Monitor usage** - Check Supabase dashboard for activity

Happy gaming! 🎮
