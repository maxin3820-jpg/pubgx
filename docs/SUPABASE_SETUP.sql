-- ============================================
-- PUBG Mobile Survey - Supabase Database Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Project: PUBG Mobile Player Survey
-- ============================================

-- 1. Create app_role enum type
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL CHECK (char_length(player_name) >= 2 AND char_length(player_name) <= 60),
  ign_id TEXT CHECK (ign_id IS NULL OR char_length(ign_id) <= 40),
  favorite_map TEXT NOT NULL,
  favorite_weapon TEXT NOT NULL,
  preferred_mode TEXT NOT NULL,
  rank_tier TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 0 CHECK (hours_per_week >= 0 AND hours_per_week <= 120),
  feedback TEXT CHECK (feedback IS NULL OR char_length(feedback) <= 600),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at 
  ON survey_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_favorite_map 
  ON survey_responses(favorite_map);

CREATE INDEX IF NOT EXISTS idx_survey_responses_favorite_weapon 
  ON survey_responses(favorite_weapon);

CREATE INDEX IF NOT EXISTS idx_survey_responses_rank_tier 
  ON survey_responses(rank_tier);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);

-- 5. Create function to check user roles
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

-- 6. Create function to get response statistics
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
    'responses_with_feedback', COUNT(*) FILTER (WHERE feedback IS NOT NULL AND feedback != ''),
    'latest_submission', MAX(created_at),
    'top_map', (
      SELECT favorite_map 
      FROM survey_responses 
      GROUP BY favorite_map 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'top_weapon', (
      SELECT favorite_weapon 
      FROM survey_responses 
      GROUP BY favorite_weapon 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    )
  )
  INTO result
  FROM survey_responses;
  
  RETURN result;
END;
$$;

-- ============================================
-- OPTIONAL: Row Level Security (RLS)
-- ============================================
-- Uncomment these if you want to add authentication

-- Enable RLS on tables
-- ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert survey responses (public submissions)
-- CREATE POLICY "allow_public_survey_insert"
--   ON survey_responses
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (true);

-- Policy: Allow anyone to read survey responses (for admin dashboard)
-- You should restrict this to authenticated admins in production
-- CREATE POLICY "allow_public_survey_read"
--   ON survey_responses
--   FOR SELECT
--   TO anon, authenticated
--   USING (true);

-- Policy: Only admins can update/delete responses
-- CREATE POLICY "allow_admin_survey_modify"
--   ON survey_responses
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );

-- Policy: Only admins can manage user roles
-- CREATE POLICY "allow_admin_roles_manage"
--   ON user_roles
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- Uncomment to insert sample survey responses

-- INSERT INTO survey_responses (player_name, ign_id, favorite_map, favorite_weapon, preferred_mode, rank_tier, hours_per_week, feedback)
-- VALUES
--   ('Ghost', '512340987', 'Erangel', 'M416', 'Squad', 'Crown', 15, 'Love the new update!'),
--   ('Shadow', '612345678', 'Miramar', 'AWM', 'Classic Solo', 'Ace', 25, 'Great game overall'),
--   ('Viper', '712345679', 'Sanhok', 'Groza', 'Duo', 'Diamond', 10, 'Need better matchmaking'),
--   ('Reaper', '812345680', 'Vikendi', 'AKM', 'TDM', 'Platinum', 20, 'Awesome graphics!'),
--   ('Phoenix', '912345681', 'Livik', 'M24', 'Arena Training', 'Gold', 8, NULL);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify everything is working

-- Check tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Count survey responses
-- SELECT COUNT(*) FROM survey_responses;

-- Get statistics
-- SELECT get_survey_statistics();

-- View all responses
-- SELECT * FROM survey_responses ORDER BY created_at DESC LIMIT 10;

-- ============================================
-- Success!
-- ============================================
-- Your database is now set up and ready to use.
-- 
-- Next steps:
-- 1. Copy your Supabase credentials to .env file
-- 2. Test local development with: npm run dev
-- 3. Deploy to Netlify
-- 
-- For detailed instructions, see DEPLOYMENT.md
-- ============================================
