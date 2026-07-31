-- ============================================
-- QUICK FIX for get_survey_statistics() function
-- ============================================
-- Run this single SQL statement to fix the ROUND/FILTER error
-- This replaces only the broken function
-- ============================================

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
    'avg_hours_per_week', ROUND(AVG(hours_per_week)::numeric, 1),
    'avg_pubg_level', ROUND((AVG(pubg_level) FILTER (WHERE pubg_level IS NOT NULL))::numeric, 1),
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

-- ============================================
-- TEST IT
-- ============================================
-- After running above, test with:
-- SELECT get_survey_statistics();
-- 
-- Should return JSON with all statistics
-- ============================================

-- ✅ FIXED!
-- The issue was: ROUND(AVG(pubg_level), 1) FILTER (...)
-- FILTER can only be applied to aggregate functions, not ROUND
-- 
-- Solution: Move FILTER inside: ROUND((AVG(...) FILTER (...))::numeric, 1)
-- ============================================
