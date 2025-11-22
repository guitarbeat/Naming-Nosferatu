-- Migration: Modernize Supabase Backend with 2024/2025 Best Practices (Simplified)
-- This migration consolidates improvements for performance, security, and maintainability

-- ===== PERFORMANCE OPTIMIZATIONS =====

-- 1. Add partial indexes for common query patterns
-- Index for active cat names only (most queries filter by is_active = true)
CREATE INDEX IF NOT EXISTS idx_cat_name_options_active 
ON cat_name_options (name, avg_rating) 
WHERE is_active = true;

-- Index for user ratings with non-null ratings (most queries filter out nulls)
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_with_rating 
ON cat_name_ratings (user_name, rating, name_id) 
WHERE rating IS NOT NULL;

-- Index for hidden names (common filter)
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_hidden 
ON cat_name_ratings (user_name, name_id) 
WHERE is_hidden = true;

-- 2. Composite indexes for multi-column queries
-- For leaderboard queries (rating + wins + losses)
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_leaderboard 
ON cat_name_ratings (name_id, rating DESC, wins DESC, losses ASC) 
WHERE rating IS NOT NULL;

-- For user tournament data queries
CREATE INDEX IF NOT EXISTS idx_cat_app_users_tournament_recent 
ON cat_app_users (user_name, updated_at DESC) 
WHERE tournament_data IS NOT NULL;

-- ===== SECURITY IMPROVEMENTS =====

-- 3. Add proper check constraints
-- Ensure user_role is valid
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_user_role_valid'
  ) THEN
    ALTER TABLE cat_app_users 
    ADD CONSTRAINT check_user_role_valid 
    CHECK (user_role IN ('user', 'admin', 'moderator'));
  END IF;
END $$;

-- Ensure rating is within valid range (ELO system)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_rating_range'
  ) THEN
    ALTER TABLE cat_name_ratings 
    ADD CONSTRAINT check_rating_range 
    CHECK (rating IS NULL OR (rating >= 1000 AND rating <= 2000));
  END IF;
END $$;

-- Ensure wins/losses are non-negative
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_wins_non_negative'
  ) THEN
    ALTER TABLE cat_name_ratings 
    ADD CONSTRAINT check_wins_non_negative 
    CHECK (wins IS NULL OR wins >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_losses_non_negative'
  ) THEN
    ALTER TABLE cat_name_ratings 
    ADD CONSTRAINT check_losses_non_negative 
    CHECK (losses IS NULL OR losses >= 0);
  END IF;
END $$;

-- Ensure tournament data is valid JSON
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_tournament_data_json'
  ) THEN
    ALTER TABLE cat_app_users 
    ADD CONSTRAINT check_tournament_data_json 
    CHECK (tournament_data IS NULL OR jsonb_typeof(tournament_data) = 'array');
  END IF;
END $$;

-- Ensure preferences is valid JSON
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_preferences_json'
  ) THEN
    ALTER TABLE cat_app_users 
    ADD CONSTRAINT check_preferences_json 
    CHECK (preferences IS NULL OR jsonb_typeof(preferences) = 'object');
  END IF;
END $$;

-- ===== BUSINESS LOGIC FUNCTIONS =====

-- 4. Create modern PostgreSQL functions for business logic

-- Function to calculate ELO rating change
CREATE OR REPLACE FUNCTION calculate_elo_change(
  current_rating INTEGER,
  opponent_rating INTEGER,
  result REAL -- 1.0 for win, 0.0 for loss, 0.5 for draw
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  expected_score REAL;
  k_factor INTEGER := 32;
  rating_change INTEGER;
BEGIN
  -- Calculate expected score using ELO formula
  expected_score := 1.0 / (1.0 + POWER(10.0, (opponent_rating - current_rating) / 400.0));
  
  -- Calculate rating change
  rating_change := ROUND(k_factor * (result - expected_score));
  
  -- Ensure rating stays within bounds
  RETURN GREATEST(-50, LEAST(50, rating_change));
END;
$$;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_name TEXT)
RETURNS TABLE (
  total_ratings INTEGER,
  avg_rating NUMERIC,
  total_wins INTEGER,
  total_losses INTEGER,
  win_rate NUMERIC,
  hidden_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_ratings,
    ROUND(AVG(rating), 2) as avg_rating,
    COALESCE(SUM(wins), 0)::INTEGER as total_wins,
    COALESCE(SUM(losses), 0)::INTEGER as total_losses,
    CASE 
      WHEN COALESCE(SUM(wins), 0) + COALESCE(SUM(losses), 0) = 0 THEN 0
      ELSE ROUND(COALESCE(SUM(wins), 0)::NUMERIC / (COALESCE(SUM(wins), 0) + COALESCE(SUM(losses), 0)) * 100, 2)
    END as win_rate,
    COUNT(*) FILTER (WHERE is_hidden = true)::INTEGER as hidden_count
  FROM cat_name_ratings 
  WHERE user_name = p_user_name;
END;
$$;

-- Function to get top names by category
CREATE OR REPLACE FUNCTION get_top_names_by_category(
  p_category TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  avg_rating NUMERIC,
  total_ratings INTEGER,
  category TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cno.id,
    cno.name,
    cno.description,
    ROUND(cno.avg_rating, 2) as avg_rating,
    COUNT(cnr.name_id)::INTEGER as total_ratings,
    p_category as category
  FROM cat_name_options cno
  LEFT JOIN cat_name_ratings cnr ON cno.id = cnr.name_id AND cnr.rating IS NOT NULL
  WHERE cno.is_active = true 
    AND (cno.categories IS NULL OR p_category = ANY(cno.categories))
  GROUP BY cno.id, cno.name, cno.description, cno.avg_rating
  ORDER BY cno.avg_rating DESC NULLS LAST, total_ratings DESC
  LIMIT p_limit;
END;
$$;

-- ===== MATERIALIZED VIEWS =====

-- 5. Create materialized views for expensive aggregations

-- View for leaderboard data
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_stats AS
SELECT 
  cnr.name_id,
  cno.name,
  cno.description,
  ROUND(AVG(cnr.rating), 2) as avg_rating,
  COUNT(cnr.rating) as total_ratings,
  SUM(cnr.wins) as total_wins,
  SUM(cnr.losses) as total_losses,
  ROUND(
    CASE 
      WHEN SUM(cnr.wins) + SUM(cnr.losses) = 0 THEN 0
      ELSE SUM(cnr.wins)::NUMERIC / (SUM(cnr.wins) + SUM(cnr.losses)) * 100
    END, 2
  ) as win_rate,
  MAX(cnr.updated_at) as last_updated
FROM cat_name_ratings cnr
JOIN cat_name_options cno ON cnr.name_id = cno.id
WHERE cnr.rating IS NOT NULL 
  AND cno.is_active = true
GROUP BY cnr.name_id, cno.name, cno.description
HAVING COUNT(cnr.rating) >= 3 -- Only include names with at least 3 ratings
ORDER BY avg_rating DESC, total_ratings DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_rating 
ON leaderboard_stats (avg_rating DESC, total_ratings DESC);

-- ===== RLS POLICY IMPROVEMENTS =====

-- 6. Modernize RLS policies with better security patterns

-- Drop old policies that use auth.uid() (not compatible with username-based auth)
DROP POLICY IF EXISTS "Admins can view all gaming data" ON cat_app_users;

-- Create username-based admin policy
CREATE POLICY "Admins can view all data" ON cat_app_users
  FOR SELECT TO public
  USING (check_user_role_by_name(current_setting('request.jwt.claims', true)::json->>'user_name', 'admin'));

-- Add policy for users to view their own data
CREATE POLICY "Users can view own data" ON cat_app_users
  FOR SELECT TO public
  USING (user_name = current_setting('request.jwt.claims', true)::json->>'user_name');

-- Add policy for users to update their own data
CREATE POLICY "Users can update own data" ON cat_app_users
  FOR UPDATE TO public
  USING (user_name = current_setting('request.jwt.claims', true)::json->>'user_name')
  WITH CHECK (user_name = current_setting('request.jwt.claims', true)::json->>'user_name');

-- ===== AUDIT TRAIL =====

-- 7. Add audit trail for important changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation 
ON audit_log (table_name, operation, created_at DESC);

-- Function to log changes
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, old_values, new_values, user_name)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    current_setting('request.jwt.claims', true)::json->>'user_name'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers to important tables
DROP TRIGGER IF EXISTS audit_cat_app_users_trigger ON cat_app_users;
CREATE TRIGGER audit_cat_app_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cat_app_users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ===== REFRESH FUNCTIONS =====

-- 8. Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_stats;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_elo_change(INTEGER, INTEGER, REAL) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_names_by_category(TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_materialized_views() TO authenticated, anon;

-- Grant permissions on materialized views
GRANT SELECT ON leaderboard_stats TO authenticated, anon;

-- ===== COMMENTS FOR DOCUMENTATION =====

COMMENT ON FUNCTION calculate_elo_change(INTEGER, INTEGER, REAL) IS 'Calculate ELO rating change based on current rating, opponent rating, and match result';
COMMENT ON FUNCTION get_user_stats(TEXT) IS 'Get comprehensive statistics for a user including ratings, wins, losses, and win rate';
COMMENT ON FUNCTION get_top_names_by_category(TEXT, INTEGER) IS 'Get top names filtered by category with rating statistics';
COMMENT ON FUNCTION refresh_materialized_views() IS 'Refresh all materialized views for up-to-date statistics';
COMMENT ON MATERIALIZED VIEW leaderboard_stats IS 'Pre-computed leaderboard data for better performance';
COMMENT ON TABLE audit_log IS 'Audit trail for tracking important database changes';
