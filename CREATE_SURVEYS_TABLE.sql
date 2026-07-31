-- ============================================
-- CREATE SURVEYS TABLE - Run this first!
-- ============================================
-- This creates the surveys table if it doesn't exist
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create app_role enum type (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- 2. Create surveys table
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
  
  -- Optional tracking fields
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  browser_info JSONB,
  
  -- Survey metadata
  survey_version TEXT DEFAULT '1.0',
  submission_source TEXT DEFAULT 'web'
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_player_name ON surveys(player_name);
CREATE INDEX IF NOT EXISTS idx_surveys_favorite_map ON surveys(favorite_map);
CREATE INDEX IF NOT EXISTS idx_surveys_favorite_weapon ON surveys(favorite_weapon);
CREATE INDEX IF NOT EXISTS idx_surveys_rank_tier ON surveys(rank_tier);
CREATE INDEX IF NOT EXISTS idx_surveys_preferred_mode ON surveys(preferred_mode);
CREATE INDEX IF NOT EXISTS idx_surveys_pubg_level ON surveys(pubg_level) WHERE pubg_level IS NOT NULL;

-- 4. Enable Row Level Security
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "allow_public_survey_insert" ON surveys;
DROP POLICY IF EXISTS "allow_public_survey_read" ON surveys;
DROP POLICY IF EXISTS "allow_admin_survey_modify" ON surveys;
DROP POLICY IF EXISTS "allow_admin_survey_delete" ON surveys;

-- 6. Create RLS policies
-- Allow anyone to insert survey responses (public submissions)
CREATE POLICY "allow_public_survey_insert"
  ON surveys
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read survey responses (for public dashboard)
CREATE POLICY "allow_public_survey_read"
  ON surveys
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can update responses
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

-- Only admins can delete responses
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

-- ============================================
-- VERIFY TABLE WAS CREATED
-- ============================================
-- Run this to verify:
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'surveys'
ORDER BY ordinal_position;

-- Count existing rows:
SELECT COUNT(*) as total_surveys FROM surveys;

-- ============================================
-- SUCCESS!
-- ============================================
-- ✅ Table 'surveys' created
-- ✅ Indexes created for fast queries
-- ✅ RLS policies created for security
-- ✅ Ready to accept survey submissions!
--
-- Next steps:
-- 1. Refresh your app: npm run dev
-- 2. Submit a test survey
-- 3. Check admin panel for data
-- ============================================
