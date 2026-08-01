-- ============================================
-- PUBG Mobile Survey - Supabase Database Setup (UPDATED)
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Project: PUBG Mobile Player Survey
-- Version: 2.0 (with pubg_level and enhanced features)
-- ============================================

-- 1. Create app_role enum type
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create surveys table (main responses table)
CREATE TABLE IF NOT EXISTS surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Player Information
  player_name TEXT NOT NULL CHECK (char_length(player_name) >= 2 AND char_length(player_name) <= 60),
  ign_id TEXT CHECK (ign_id IS NULL OR char_length(ign_id) <= 40),
  pubg_level INTEGER CHECK (pubg_level IS NULL OR (pubg_level >= 1 AND pubg_level <= 9999)),
  
  -- Game Preferences
  favorite_map TEXT NOT NULL,
  favorite_weapon TEXT NOT NULL,
  preferred_mode TEXT NOT NULL,
  rank_tier TEXT NOT NULL,
  
  -- Engagement
  hours_per_week INTEGER NOT NULL DEFAULT 0 CHECK (hours_per_week >= 0 AND hours_per_week <= 120),
  feedback TEXT CHECK (feedback IS NULL OR char_length(feedback) <= 600),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional tracking fields (controlled by admin panel)
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  browser_info JSONB,
  
  -- Survey metadata
  survey_version TEXT DEFAULT '1.0',
  submission_source TEXT DEFAULT 'web'
);

-- 3. Create site_config table (for storing admin panel settings)
CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- 4. Create survey_analytics table (for tracking)
CREATE TABLE IF NOT EXISTS survey_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'view', 'start', 'complete', 'abandon'
  event_data JSONB,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ============================================
-- INDEXES for performance
-- ============================================

-- Survey indexes
CREATE INDEX IF NOT EXISTS idx_surveys_created_at 
  ON surveys(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_surveys_player_name 
  ON surveys(player_name);

CREATE INDEX IF NOT EXISTS idx_surveys_favorite_map 
  ON surveys(favorite_map);

CREATE INDEX IF NOT EXISTS idx_surveys_favorite_weapon 
  ON surveys(favorite_weapon);

CREATE INDEX IF NOT EXISTS idx_surveys_rank_tier 
  ON surveys(rank_tier);

CREATE INDEX IF NOT EXISTS idx_surveys_preferred_mode 
  ON surveys(preferred_mode);

CREATE INDEX IF NOT EXISTS idx_surveys_pubg_level 
  ON surveys(pubg_level) WHERE pubg_level IS NOT NULL;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
  ON survey_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
  ON survey_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_session 
  ON survey_analytics(session_id);

-- Config indexes
CREATE INDEX IF NOT EXISTS idx_config_key 
  ON site_config(config_key);

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for surveys table
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for site_config table
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON site_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check user roles
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Function to get survey statistics
CREATE OR REPLACE FUNCTION get_survey_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_responses', COUNT(*),
    'avg_hours_per_week', ROUND(AVG(hours_per_week), 1),
    'avg_pubg_level', ROUND(AVG(pubg_level), 1) FILTER (WHERE pubg_level IS NOT NULL),
    'responses_with_feedback', COUNT(*) FILTER (WHERE feedback IS NOT NULL AND feedback != ''),
    'responses_with_level', COUNT(*) FILTER (WHERE pubg_level IS NOT NULL),
    'latest_submission', MAX(created_at),
    'earliest_submission', MIN(created_at),
    'top_map', (
      SELECT favorite_map 
      FROM surveys 
      GROUP BY favorite_map 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'top_weapon', (
      SELECT favorite_weapon 
      FROM surveys 
      GROUP BY favorite_weapon 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'top_rank', (
      SELECT rank_tier 
      FROM surveys 
      GROUP BY rank_tier 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'highest_level', MAX(pubg_level),
    'most_active_player', (
      SELECT player_name
      FROM surveys
      ORDER BY hours_per_week DESC
      LIMIT 1
    )
  )
  INTO result
  FROM surveys;
  
  RETURN result;
END;
$$;

-- Function to get daily response counts
CREATE OR REPLACE FUNCTION get_daily_responses(days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as count
  FROM surveys
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

-- Function to get top players by hours
CREATE OR REPLACE FUNCTION get_top_players_by_hours(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  player_name TEXT,
  ign_id TEXT,
  pubg_level INTEGER,
  hours_per_week INTEGER,
  rank_tier TEXT,
  favorite_map TEXT,
  favorite_weapon TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.player_name,
    s.ign_id,
    s.pubg_level,
    s.hours_per_week,
    s.rank_tier,
    s.favorite_map,
    s.favorite_weapon
  FROM surveys s
  ORDER BY s.hours_per_week DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert survey responses (public submissions)
CREATE POLICY "allow_public_survey_insert"
  ON surveys
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow anyone to read survey responses (for public dashboard)
-- IMPORTANT: In production, you should restrict this to authenticated users only
CREATE POLICY "allow_public_survey_read"
  ON surveys
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only admins can update/delete responses
CREATE POLICY "allow_admin_survey_modify"
  ON surveys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "allow_admin_survey_delete"
  ON surveys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can manage site config
CREATE POLICY "allow_admin_config_read"
  ON site_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "allow_admin_config_modify"
  ON site_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Allow inserting analytics (for tracking)
CREATE POLICY "allow_public_analytics_insert"
  ON survey_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only admins can read analytics
CREATE POLICY "allow_admin_analytics_read"
  ON survey_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can manage user roles
CREATE POLICY "allow_admin_roles_manage"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample survey responses

/*
INSERT INTO surveys (player_name, ign_id, pubg_level, favorite_map, favorite_weapon, preferred_mode, rank_tier, hours_per_week, feedback)
VALUES
  ('Ghost', '512340987', 75, 'Erangel', 'M416', 'Squad', 'Crown', 15, 'Love the new update!'),
  ('Shadow', '612345678', 82, 'Miramar', 'AWM', 'Classic Solo', 'Ace', 25, 'Great game overall'),
  ('Viper', '712345679', 45, 'Sanhok', 'Groza', 'Duo', 'Diamond', 10, 'Need better matchmaking'),
  ('Reaper', '812345680', 91, 'Vikendi', 'AKM', 'TDM', 'Platinum', 20, 'Awesome graphics!'),
  ('Phoenix', '912345681', 67, 'Livik', 'M24', 'Arena Training', 'Gold', 8, NULL),
  ('Titan', '123456789', 100, 'Erangel', 'Groza', 'Squad', 'Conqueror', 50, 'Best battle royale!'),
  ('Storm', '223456789', 55, 'Miramar', 'M416', 'Duo', 'Crown', 18, 'Needs new maps'),
  ('Blaze', '323456789', 88, 'Sanhok', 'Vector', 'Classic Solo', 'Ace', 30, 'Love the fast pace'),
  ('Thunder', '423456789', 72, 'Vikendi', 'UMP45', 'Squad', 'Diamond', 22, NULL),
  ('Lightning', '523456789', 95, 'Karakin', 'AWM', 'TDM', 'Conqueror', 45, 'Amazing sniper spots');
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is working

-- Check tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Count survey responses
-- SELECT COUNT(*) FROM surveys;

-- Get statistics
-- SELECT get_survey_statistics();

-- View all responses
-- SELECT * FROM surveys ORDER BY created_at DESC LIMIT 10;

-- Get daily response counts for last 30 days
-- SELECT * FROM get_daily_responses(30);

-- Get top 10 players by hours played
-- SELECT * FROM get_top_players_by_hours(10);

-- Check pubg_level data
-- SELECT 
--   COUNT(*) as total_with_level,
--   AVG(pubg_level) as avg_level,
--   MIN(pubg_level) as min_level,
--   MAX(pubg_level) as max_level
-- FROM surveys
-- WHERE pubg_level IS NOT NULL;

-- ============================================
-- MIGRATION FROM OLD SCHEMA
-- ============================================
-- If you have existing data in survey_responses table, run this:

/*
-- Rename old table (backup)
ALTER TABLE IF EXISTS survey_responses RENAME TO survey_responses_backup;

-- Create new surveys table (already done above)
-- Then migrate data:
INSERT INTO surveys (
  player_name, ign_id, pubg_level, favorite_map, favorite_weapon, 
  preferred_mode, rank_tier, hours_per_week, feedback, created_at
)
SELECT 
  player_name, ign_id, 
  NULL as pubg_level, -- old table doesn't have this
  favorite_map, favorite_weapon, preferred_mode, 
  rank_tier, hours_per_week, feedback, created_at
FROM survey_responses_backup;

-- Verify migration
SELECT COUNT(*) FROM surveys;
SELECT COUNT(*) FROM survey_responses_backup;

-- Drop backup after verifying (optional)
-- DROP TABLE survey_responses_backup;
*/

-- ============================================
-- SUCCESS!
-- ============================================
-- Your database is now set up with:
-- ✅ surveys table (with pubg_level field)
-- ✅ site_config table (for admin settings)
-- ✅ survey_analytics table (for tracking)
-- ✅ user_roles table (for authentication)
-- ✅ Optimized indexes
-- ✅ Helpful functions
-- ✅ Row Level Security policies
-- 
-- Next steps:
-- 1. Copy your Supabase URL and anon key to .env file:
--    VITE_SUPABASE_URL=https://xxxxx.supabase.co
--    VITE_SUPABASE_ANON_KEY=eyJxxx...
-- 
-- 2. Uncomment the TODO blocks in:
--    - src/routes/index.tsx (line ~300)
--    - src/lib/admin.functions.ts (line ~10)
-- 
-- 3. Test locally: npm run dev
-- 4. Deploy to Netlify
-- 
-- For detailed instructions, see DEPLOYMENT.md
-- ============================================
