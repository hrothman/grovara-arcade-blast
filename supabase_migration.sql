-- Grovara Arcade Blast - Supabase Database Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. USERS TABLE
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  user_type TEXT CHECK (user_type IN ('buyer', 'brand')),
  is_anonymous BOOLEAN DEFAULT TRUE,
  total_score INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_best_score ON users(best_score DESC);
CREATE INDEX idx_users_is_anonymous ON users(is_anonymous);

-- =============================================================================
-- 2. GAME SESSIONS TABLE
-- =============================================================================
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  booth_source TEXT,
  campaign TEXT,
  device_type TEXT,
  user_type TEXT CHECK (user_type IN ('buyer', 'brand')),
  total_score INTEGER DEFAULT 0,
  final_score INTEGER,
  lives_remaining INTEGER DEFAULT 3,
  levels_completed INTEGER DEFAULT 0,
  total_enemies_killed INTEGER DEFAULT 0,
  total_products_placed INTEGER DEFAULT 0,
  total_ultra_rares INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for game_sessions table
CREATE INDEX idx_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON game_sessions(session_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_started_at ON game_sessions(started_at DESC);
CREATE INDEX idx_sessions_booth_campaign ON game_sessions(booth_source, campaign);

-- =============================================================================
-- 3. LEVEL RESULTS TABLE
-- =============================================================================
CREATE TABLE level_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL CHECK (level_number > 0),
  score INTEGER DEFAULT 0,
  enemies_killed INTEGER DEFAULT 0,
  products_on_shelf INTEGER DEFAULT 0,
  ultra_rare_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, level_number)
);

-- Indexes for level_results table
CREATE INDEX idx_level_results_session_id ON level_results(session_id);
CREATE INDEX idx_level_results_user_id ON level_results(user_id);
CREATE INDEX idx_level_results_level_number ON level_results(level_number);
CREATE INDEX idx_level_results_score ON level_results(score DESC);
CREATE INDEX idx_level_results_completed ON level_results(completed);

-- =============================================================================
-- 4. SWIPE ACTIONS TABLE
-- =============================================================================
CREATE TABLE swipe_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT,
  item_type TEXT CHECK (item_type IN ('brand', 'buyer')),
  direction TEXT CHECK (direction IN ('left', 'right')) NOT NULL,
  swipe_position INTEGER,
  level_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for swipe_actions table
CREATE INDEX idx_swipe_actions_session_id ON swipe_actions(session_id);
CREATE INDEX idx_swipe_actions_user_id ON swipe_actions(user_id);
CREATE INDEX idx_swipe_actions_item_id ON swipe_actions(item_id);
CREATE INDEX idx_swipe_actions_direction ON swipe_actions(direction);
CREATE INDEX idx_swipe_actions_created_at ON swipe_actions(created_at DESC);

-- =============================================================================
-- 5. USER MATCHES TABLE
-- =============================================================================
CREATE TABLE user_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT,
  item_type TEXT CHECK (item_type IN ('brand', 'buyer')),
  match_count INTEGER DEFAULT 1,
  first_matched_at TIMESTAMPTZ DEFAULT NOW(),
  last_matched_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, item_id)
);

-- Indexes for user_matches table
CREATE INDEX idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX idx_user_matches_item_id ON user_matches(item_id);
CREATE INDEX idx_user_matches_item_type ON user_matches(item_type);

-- =============================================================================
-- 6. LEADERBOARD ENTRIES TABLE
-- =============================================================================
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER,
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  is_fake BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, score, achieved_at)
);

-- Indexes for leaderboard_entries table
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(rank);
CREATE INDEX idx_leaderboard_username ON leaderboard_entries(username);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for game_sessions table
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session duration on completion
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate duration
CREATE TRIGGER auto_calculate_duration BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION calculate_session_duration();

-- Function to update leaderboard rank
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate ranks for all entries
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, achieved_at ASC) as new_rank
        FROM leaderboard_entries
    )
    UPDATE leaderboard_entries le
    SET rank = ranked.new_rank
    FROM ranked
    WHERE le.id = ranked.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update ranks on insert/update
CREATE TRIGGER update_ranks_on_change AFTER INSERT OR UPDATE ON leaderboard_entries
    FOR EACH STATEMENT EXECUTE FUNCTION update_leaderboard_ranks();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (true);  -- Can be restricted based on auth

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);  -- Can be restricted based on auth

-- RLS Policies for game_sessions table
CREATE POLICY "Users can insert game sessions" ON game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view game sessions" ON game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can update own sessions" ON game_sessions
    FOR UPDATE USING (true);

-- RLS Policies for level_results table
CREATE POLICY "Users can insert level results" ON level_results
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view level results" ON level_results
    FOR SELECT USING (true);

-- RLS Policies for swipe_actions table
CREATE POLICY "Users can insert swipe actions" ON swipe_actions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view swipe actions" ON swipe_actions
    FOR SELECT USING (true);

-- RLS Policies for user_matches table
CREATE POLICY "Users can insert matches" ON user_matches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view matches" ON user_matches
    FOR SELECT USING (true);

CREATE POLICY "Users can update matches" ON user_matches
    FOR UPDATE USING (true);

-- RLS Policies for leaderboard_entries table (public read)
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_entries
    FOR SELECT USING (true);

CREATE POLICY "System can insert leaderboard entries" ON leaderboard_entries
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Insert some fake leaderboard entries for initial display
INSERT INTO users (device_id, username, is_anonymous, best_score) VALUES
  ('fake_device_01', 'ArcadeKing', false, 15000),
  ('fake_device_02', 'BrandMaster', false, 14500),
  ('fake_device_03', 'SwipeQueen', false, 14200),
  ('fake_device_04', 'B2BNinja', false, 13800),
  ('fake_device_05', 'ScoreChaser', false, 13500);

INSERT INTO leaderboard_entries (user_id, username, score, is_fake, achieved_at) 
SELECT 
  id,
  username,
  best_score,
  true,
  NOW() - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY best_score DESC))
FROM users
WHERE username IN ('ArcadeKing', 'BrandMaster', 'SwipeQueen', 'B2BNinja', 'ScoreChaser');

-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- View for active users
CREATE VIEW active_users AS
SELECT 
  id,
  username,
  email,
  user_type,
  is_anonymous,
  best_score,
  games_played,
  last_active_at
FROM users
WHERE last_active_at > NOW() - INTERVAL '7 days'
ORDER BY last_active_at DESC;

-- View for popular brands/buyers
CREATE VIEW popular_items AS
SELECT 
  item_id,
  item_name,
  item_type,
  COUNT(*) as match_count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_matches
GROUP BY item_id, item_name, item_type
ORDER BY match_count DESC;

-- View for session stats
CREATE VIEW session_statistics AS
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_sessions,
  ROUND(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0), 2) as completion_rate,
  AVG(final_score) FILTER (WHERE status = 'completed') as avg_final_score,
  AVG(duration_seconds) FILTER (WHERE status = 'completed') as avg_duration_seconds
FROM game_sessions;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'Stores both anonymous and registered users with device fingerprinting';
COMMENT ON TABLE game_sessions IS 'Tracks individual game play sessions from start to finish';
COMMENT ON TABLE level_results IS 'Detailed performance metrics for each level (enemies killed, products placed, ultra-rares collected)';
COMMENT ON TABLE swipe_actions IS 'Records all user swipes on brands/buyers for lead generation';
COMMENT ON TABLE user_matches IS 'Deduplicated view of user interests (right swipes only)';
COMMENT ON TABLE leaderboard_entries IS 'Materialized leaderboard for fast queries';

COMMENT ON COLUMN users.device_id IS 'Unique browser/device fingerprint for anonymous user tracking';
COMMENT ON COLUMN users.is_anonymous IS 'True until user registers with email/username';
COMMENT ON COLUMN game_sessions.session_id IS 'Frontend-generated session identifier';
COMMENT ON COLUMN swipe_actions.direction IS 'left = not interested, right = interested/matched';
