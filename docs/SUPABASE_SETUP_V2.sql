-- ============================================
-- PUBG Mobile Survey - Complete Database Setup V2
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Updated: July 31, 2026
-- Version: 2.0 - Enhanced with all new features
-- ============================================

-- ════════════════════════════════════════════
-- 1. DROP EXISTING TABLES (if re-running)
-- ════════════════════════════════════════════
-- Uncomment these lines if you need to reset

-- DROP TABLE IF EXISTS survey_responses CASCADE;
-- DROP TABLE IF EXISTS user_roles CASCADE;
-- DROP TABLE IF EXISTS site_config CASCADE;
-- DROP TABLE IF EXISTS survey_analytics CASCADE;
-- DROP TYPE IF EXISTS app_role CASCADE;

-- ════════════════════════════════════════════
-- 2. CREATE TYPES
-- ════════════════════════════════════════════

CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- ════════════════════════════════════════════
-- 3. SURVEY RESPONSES TABLE (Enhanced)
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS survey_responses (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Survey Fields (from form)
  player_name TEXT NOT NULL CHECK (char_length(player_name) >= 2 AND char_length(player_name) <= 60),
  ign_id TEXT CHECK (ign_id IS NULL OR char_length(ign_id) <= 40),
  pubg_level INTEGER CHECK (pubg_level IS NULL OR (pubg_level >= 1 AND pubg_level <= 9999)),
  favorite_map TEXT NOT NULL,
  favorite_weapon TEXT NOT NULL,
  preferred_mode TEXT NOT NULL,
  rank_tier TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 0 CHECK (hours_per_week >= 0 AND hours_per_week <= 120),
  feedback TEXT CHECK (feedback IS NULL OR char_length(feedback) <= 600),
  
  -- Metadata (tracking)
  ip_address INET,
  user_agent TEXT,
  browser_info JSONB,
  geolocation JSONB,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_complete BOOLEAN DEFAULT true,
  is_test BOOLEAN DEFAULT false,
  is_anonymized BOOLEAN DEFAULT false
);

-- ════════════════════════════════════════════
-- 4. SITE CONFIGURATION TABLE
-- ════════════════════════════════════════════
-- Stores admin panel configuration

CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 5. SURVEY ANALYTICS TABLE
-- ════════════════════════════════════════════
-- Track events and analytics

CREATE TABLE IF NOT EXISTS survey_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'started', 'completed', 'abandoned', 'error'
  event_data JSONB,
  session_id TEXT,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ════════════════════════════════════════════
-- 6. USER ROLES TABLE
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(user_id, role)
);

-- ════════════════════════════════════════════
-- 7. INDEXES FOR PERFORMANCE
-- ════════════════════════════════════════════

-- Survey Responses Indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at 
  ON survey_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at 
  ON survey_responses(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_favorite_map 
  ON survey_responses(favorite_map);

CREATE INDEX IF NOT EXISTS idx_survey_responses_favorite_weapon 
  ON survey_responses(favorite_weapon);

CREATE INDEX IF NOT EXISTS idx_survey_responses_rank_tier 
  ON survey_responses(rank_tier);

CREATE INDEX IF NOT EXISTS idx_survey_responses_preferred_mode 
  ON survey_responses(preferred_mode);

CREATE INDEX IF NOT EXISTS idx_survey_responses_pubg_level 
  ON survey_responses(pubg_level);

CREATE INDEX IF NOT EXISTS idx_survey_responses_is_complete 
  ON survey_responses(is_complete);

CREATE INDEX IF NOT EXISTS idx_survey_responses_ip_address 
  ON survey_responses(ip_address);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
  ON survey_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
  ON survey_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_session_id 
  ON survey_analytics(session_id);

-- User Roles Index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);

-- Site Config Index
CREATE INDEX IF NOT EXISTS idx_site_config_key 
  ON site_config(config_key);

-- ════════════════════════════════════════════
-- 8. FUNCTIONS
-- ════════════════════════════════════════════

-- Function: Check user roles
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

-- Function: Get comprehensive survey statistics
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
    'complete_responses', COUNT(*) FILTER (WHERE is_complete = true),
    'test_responses', COUNT(*) FILTER (WHERE is_test = true),
    'avg_hours_per_week', ROUND(AVG(hours_per_week), 1),
    'avg_pubg_level', ROUND(AVG(pubg_level), 1),
    'responses_with_feedback', COUNT(*) FILTER (WHERE feedback IS NOT NULL AND feedback != ''),
    'responses_with_ign', COUNT(*) FILTER (WHERE ign_id IS NOT NULL AND ign_id != ''),
    'latest_submission', MAX(submitted_at),
    'oldest_submission', MIN(submitted_at),
    'top_map', (
      SELECT favorite_map 
      FROM survey_responses 
      WHERE is_complete = true AND is_test = false
      GROUP BY favorite_map 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'top_weapon', (
      SELECT favorite_weapon 
      FROM survey_responses 
      WHERE is_complete = true AND is_test = false
      GROUP BY favorite_weapon 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'top_mode', (
      SELECT preferred_mode 
      FROM survey_responses 
      WHERE is_complete = true AND is_test = false
      GROUP BY preferred_mode 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'top_rank', (
      SELECT rank_tier 
      FROM survey_responses 
      WHERE is_complete = true AND is_test = false
      GROUP BY rank_tier 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    )
  )
  INTO result
  FROM survey_responses
  WHERE is_complete = true AND is_test = false;
  
  RETURN result;
END;
$$;

-- Function: Get daily response counts
CREATE OR REPLACE FUNCTION get_daily_response_counts(days_back INTEGER DEFAULT 30)
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
    DATE(submitted_at) as date,
    COUNT(*) as count
  FROM survey_responses
  WHERE 
    is_complete = true 
    AND is_test = false
    AND submitted_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(submitted_at)
  ORDER BY date DESC;
END;
$$;

-- Function: Get top responses by category
CREATE OR REPLACE FUNCTION get_top_by_category(category TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  value TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT %I::TEXT as value, COUNT(*) as count
    FROM survey_responses
    WHERE is_complete = true AND is_test = false
    GROUP BY %I
    ORDER BY count DESC
    LIMIT $1
  ', category, category)
  USING limit_count;
END;
$$;

-- Function: Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════
-- 9. TRIGGERS
-- ════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON site_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ════════════════════════════════════════════
-- 10. ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert survey responses (public submissions)
CREATE POLICY "allow_public_survey_insert"
  ON survey_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow anyone to read survey responses (for dashboard)
CREATE POLICY "allow_public_survey_read"
  ON survey_responses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only admins can update/delete responses
CREATE POLICY "allow_admin_survey_modify"
  ON survey_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "allow_admin_survey_delete"
  ON survey_responses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can manage user roles
CREATE POLICY "allow_admin_roles_all"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can read/write site config
CREATE POLICY "allow_admin_config_all"
  ON site_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Anyone can insert analytics
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

-- ════════════════════════════════════════════
-- 11. INITIAL DATA
-- ════════════════════════════════════════════

-- Insert default site config
INSERT INTO site_config (config_key, config_value)
VALUES 
  ('admin_password', '"Doodle"'::jsonb),
  ('primary_color', '"#e8b23a"'::jsonb),
  ('survey_enabled', 'true'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- ════════════════════════════════════════════
-- 12. SAMPLE DATA (Optional - for testing)
-- ════════════════════════════════════════════
-- Uncomment to insert sample responses

/*
INSERT INTO survey_responses (
  player_name, ign_id, pubg_level, favorite_map, favorite_weapon, 
  preferred_mode, rank_tier, hours_per_week, feedback, is_test
)
VALUES
  ('Ghost', '512340987', 75, 'Erangel', 'M416', 'Squad', 'Crown', 15, 'Love the new update!', false),
  ('Shadow', '612345678', 92, 'Miramar', 'AWM', 'Classic Solo', 'Ace', 25, 'Great game overall', false),
  ('Viper', '712345679', 58, 'Sanhok', 'Groza', 'Duo', 'Diamond', 10, 'Need better matchmaking', false),
  ('Reaper', '812345680', 103, 'Vikendi', 'AKM', 'TDM', 'Platinum', 20, 'Awesome graphics!', false),
  ('Phoenix', '912345681', 45, 'Livik', 'M24', 'Arena Training', 'Gold', 8, NULL, false),
  ('Titan', '123456789', 120, 'Karakin', 'Vector', 'Payload', 'Conqueror', 40, 'Best BR game!', false),
  ('Blade', '234567890', 67, 'Erangel', 'UMP45', 'Squad', 'Crown', 18, NULL, false),
  ('Storm', '345678901', 88, 'Miramar', 'DP-28', 'Duo', 'Ace', 30, 'Amazing gameplay', false),
  ('Thunder', '456789012', 54, 'Sanhok', 'M416', 'Classic Solo', 'Platinum', 12, 'Good but laggy sometimes', false),
  ('Falcon', '567890123', 99, 'Vikendi', 'Groza', 'TDM', 'Diamond', 22, 'Needs more maps', false);
*/

-- ════════════════════════════════════════════
-- 13. VERIFICATION QUERIES
-- ════════════════════════════════════════════
-- Run these to verify everything is working

-- Check all tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check all functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;

-- Count survey responses
-- SELECT COUNT(*) as total_responses FROM survey_responses;

-- Get comprehensive statistics
-- SELECT get_survey_statistics();

-- Get daily counts for last 7 days
-- SELECT * FROM get_daily_response_counts(7);

-- Get top maps
-- SELECT * FROM get_top_by_category('favorite_map', 5);

-- View latest 10 responses
-- SELECT 
--   player_name, ign_id, pubg_level, favorite_map, 
--   rank_tier, hours_per_week, created_at 
-- FROM survey_responses 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- ════════════════════════════════════════════
-- 14. MAINTENANCE QUERIES
-- ════════════════════════════════════════════

-- Delete old test responses
-- DELETE FROM survey_responses WHERE is_test = true;

-- Anonymize old responses (GDPR compliance)
-- UPDATE survey_responses 
-- SET 
--   player_name = 'Anonymous',
--   ign_id = NULL,
--   ip_address = NULL,
--   user_agent = NULL,
--   browser_info = NULL,
--   geolocation = NULL,
--   is_anonymized = true
-- WHERE submitted_at < NOW() - INTERVAL '90 days'
--   AND is_anonymized = false;

-- Clean old analytics events
-- DELETE FROM survey_analytics 
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- ════════════════════════════════════════════
-- SUCCESS! Database Setup Complete
-- ════════════════════════════════════════════
--
-- Your database now includes:
-- ✅ Survey responses table (with all new fields)
-- ✅ Site configuration table
-- ✅ Analytics tracking table
-- ✅ User roles and permissions
-- ✅ Comprehensive indexes for performance
-- ✅ Helper functions for statistics
-- ✅ Row Level Security (RLS) policies
-- ✅ Auto-updating timestamps
-- ✅ Sample data (commented out)
--
-- Next steps:
-- 1. Copy your Supabase credentials to .env:
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
-- For help: See DEPLOYMENT.md
-- ════════════════════════════════════════════
