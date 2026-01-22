-- ============================================================================
-- NAMING NOSFERATU - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This migration represents the complete database schema for the Cat Name
-- Tournament application. It includes all tables, functions, policies, and
-- indexes required for the application to function.
--
-- Last updated: 2025-11-29
-- Schema verified: 2025-01-07
-- NOTE: This migration has been updated to match the actual database schema.
-- Key changes documented:
-- - cat_app_users: Removed user_role and tournament_data columns
-- - cat_name_options: Removed user_name, popularity_score, total_tournaments, updated_at columns
-- - cat_name_ratings: Changed from id-based PK to composite PK (user_name, name_id)
-- - user_roles: Added user_id column for auth.users support
-- ============================================================================

-- ============================================================================
-- SECTION 1: TYPES
-- ============================================================================

-- Role enum for user permissions
CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin');

-- ============================================================================
-- SECTION 2: TABLES
-- ============================================================================

-- User accounts table
-- NOTE: user_role and tournament_data columns were removed - roles are now in user_roles table
CREATE TABLE IF NOT EXISTS cat_app_users (
  user_name TEXT PRIMARY KEY,
  preferences JSONB DEFAULT '{"sound_enabled": true, "theme_preference": "dark", "preferred_categories": [], "rating_display_preference": "elo", "tournament_size_preference": 8}' CHECK (preferences IS NULL OR jsonb_typeof(preferences) = 'object'),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE cat_app_users IS 'Username-based auth. Users self-identify via username.';
COMMENT ON COLUMN cat_app_users.preferences IS 'User preferences (theme, sound, etc.)';

-- User roles table (separate from user data for security)
-- NOTE: Supports both user_name (for cat_app_users) and user_id (for auth.users)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- For auth.users reference (nullable)
  user_name TEXT, -- For cat_app_users reference (nullable)
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role),
  UNIQUE (user_name, role)
);

COMMENT ON TABLE user_roles IS 'Stores user roles separately from user data to prevent privilege escalation';

-- Cat name options table
-- NOTE: user_name, popularity_score, total_tournaments, and updated_at columns were removed
CREATE TABLE IF NOT EXISTS cat_name_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT DEFAULT '',
  avg_rating NUMERIC DEFAULT 1500,
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Cat name ratings table
-- NOTE: Uses composite primary key (user_name, name_id) instead of id column
CREATE TABLE IF NOT EXISTS cat_name_ratings (
  user_name TEXT NOT NULL,
  name_id UUID NOT NULL REFERENCES cat_name_options(id) ON DELETE CASCADE,
  rating NUMERIC DEFAULT 1500 CHECK (rating IS NULL OR (rating >= 800 AND rating <= 2400)),
  wins INTEGER DEFAULT 0 CHECK (wins IS NULL OR wins >= 0),
  losses INTEGER DEFAULT 0 CHECK (losses IS NULL OR losses >= 0),
  is_hidden BOOLEAN DEFAULT false,
  rating_history JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_name, name_id)
);

COMMENT ON TABLE cat_name_ratings IS 'User ratings for cat names';

-- Tournament selections table
CREATE TABLE IF NOT EXISTS tournament_selections (
  id SERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  name_id UUID NOT NULL REFERENCES cat_name_options(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  selection_type TEXT DEFAULT 'tournament_setup',
  selected_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE tournament_selections IS 'Tournament participation history';

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE audit_log IS 'Audit trail for tracking important database changes';


-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- cat_app_users indexes
CREATE INDEX IF NOT EXISTS idx_cat_app_users_preferences ON cat_app_users USING gin(preferences);

-- user_roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_name ON user_roles(user_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- cat_name_options indexes
CREATE INDEX IF NOT EXISTS idx_cat_name_options_name ON cat_name_options(name);
CREATE INDEX IF NOT EXISTS idx_cat_name_options_active ON cat_name_options(name, avg_rating) WHERE is_active = true;

-- cat_name_ratings indexes
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_user_name ON cat_name_ratings(user_name);
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_name_id ON cat_name_ratings(name_id);
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_hidden ON cat_name_ratings(user_name, name_id) WHERE is_hidden = true;
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_leaderboard ON cat_name_ratings(name_id, rating DESC, wins DESC, losses) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cat_name_ratings_with_rating ON cat_name_ratings(user_name, rating, name_id) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ratings_leaderboard ON cat_name_ratings(name_id, rating DESC NULLS LAST) INCLUDE (wins, losses, user_name);
CREATE INDEX IF NOT EXISTS idx_ratings_user_stats ON cat_name_ratings(user_name, rating DESC) INCLUDE (wins, losses, is_hidden, updated_at);

-- tournament_selections indexes
CREATE INDEX IF NOT EXISTS idx_tournament_selections_user_name ON tournament_selections(user_name);
CREATE INDEX IF NOT EXISTS idx_tournament_selections_name_id ON tournament_selections(name_id);
CREATE INDEX IF NOT EXISTS idx_tournament_selections_tournament_id ON tournament_selections(tournament_id);

-- site_settings indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- audit_log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON audit_log(table_name, operation, created_at DESC);

-- ============================================================================
-- SECTION 4: HELPER FUNCTIONS
-- ============================================================================

-- Get current user name from session context
CREATE OR REPLACE FUNCTION get_current_user_name()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    current_setting('app.user_name', true),
    current_setting('request.jwt.claims', true)::json->>'user_name'
  )
$$;

-- Set user context for RLS policies
CREATE OR REPLACE FUNCTION set_user_context(user_name_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('app.user_name', user_name_param, false);
END;
$$;

GRANT EXECUTE ON FUNCTION set_user_context(TEXT) TO authenticated, anon;

-- Check if user has specific role (app_role version)
CREATE OR REPLACE FUNCTION has_role(_user_name TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_name = _user_name 
      AND role = _role
  );
$$;

-- Check if user has specific role (text version for client compatibility)
CREATE OR REPLACE FUNCTION has_role(_user_name TEXT, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_name = _user_name 
      AND role = _role::app_role
  );
$$;

GRANT EXECUTE ON FUNCTION has_role(TEXT, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION has_role(TEXT, TEXT) TO authenticated, anon;

-- Get user's highest role
CREATE OR REPLACE FUNCTION get_user_role(_user_name TEXT)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM user_roles
  WHERE user_name = _user_name
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_role(TEXT) TO authenticated, anon;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_name TEXT;
BEGIN
  current_user_name := COALESCE(
    current_setting('app.user_name', true),
    current_setting('request.jwt.claims', true)::json->>'user_name',
    NULL
  );
  
  IF current_user_name IS NOT NULL THEN
    RETURN has_role(current_user_name, 'admin');
  END IF;
  
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;



-- ============================================================================
-- SECTION 5: APPLICATION FUNCTIONS
-- ============================================================================

-- Create user account
-- NOTE: Updated to match actual implementation (user_role handled separately in user_roles table)
CREATE OR REPLACE FUNCTION create_user_account(
  p_user_name TEXT,
  p_preferences JSONB DEFAULT '{"sound_enabled": true, "theme_preference": "dark"}',
  p_user_role TEXT DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user in cat_app_users table
  INSERT INTO public.cat_app_users (user_name, preferences)
  VALUES (p_user_name, p_preferences)
  ON CONFLICT (user_name) DO UPDATE
    SET preferences = COALESCE(EXCLUDED.preferences, cat_app_users.preferences);
    
  -- Only allow admin role assignment if caller is already an admin
  IF p_user_role IS NOT NULL THEN
    -- SECURITY FIX: Prevent privilege escalation by checking if caller is admin
    IF p_user_role != 'user' AND NOT is_admin() THEN
      RAISE EXCEPTION 'Only admins can create privileged accounts';
    END IF;
    
    INSERT INTO public.user_roles (user_name, role)
    VALUES (p_user_name, p_user_role::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_account(TEXT, JSONB, TEXT) TO authenticated, anon;

-- Calculate ELO rating change
CREATE OR REPLACE FUNCTION calculate_elo_change(
  current_rating INTEGER,
  opponent_rating INTEGER,
  result REAL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  k_factor INTEGER := 32;
  expected REAL;
  change INTEGER;
BEGIN
  expected := 1.0 / (1.0 + POWER(10, (opponent_rating - current_rating) / 400.0));
  change := ROUND(k_factor * (result - expected));
  RETURN change;
END;
$$;

-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_name TEXT)
RETURNS TABLE(
  total_ratings INTEGER,
  avg_rating NUMERIC,
  total_wins INTEGER,
  total_losses INTEGER,
  win_rate NUMERIC,
  hidden_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_ratings,
    ROUND(AVG(rating), 0) as avg_rating,
    SUM(wins)::INTEGER as total_wins,
    SUM(losses)::INTEGER as total_losses,
    CASE 
      WHEN SUM(wins) + SUM(losses) > 0 
      THEN ROUND(SUM(wins)::NUMERIC / (SUM(wins) + SUM(losses)) * 100, 1)
      ELSE 0
    END as win_rate,
    COUNT(*) FILTER (WHERE is_hidden = true)::INTEGER as hidden_count
  FROM cat_name_ratings
  WHERE user_name = p_user_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated, anon;

-- Get top names by category
-- NOTE: Updated to use p_category and p_limit parameter names (matching actual implementation)
-- Returns TABLE with uuid id (not TEXT)
CREATE OR REPLACE FUNCTION get_top_names_by_category(
  p_category TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  avg_rating NUMERIC,
  total_ratings INTEGER,
  category TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cno.id,
    cno.name,
    cno.description,
    cno.avg_rating,
    COUNT(cnr.name_id)::INTEGER as total_ratings,
    p_category as category
  FROM cat_name_options cno
  LEFT JOIN cat_name_ratings cnr ON cno.id = cnr.name_id
  WHERE cno.is_active = true
    AND cno.is_hidden = false
    AND p_category = ANY(cno.categories)
  GROUP BY cno.id, cno.name, cno.description, cno.avg_rating
  ORDER BY cno.avg_rating DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_top_names_by_category(TEXT, INTEGER) TO authenticated, anon;


-- Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_stats;
END;
$$;

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, old_values, user_name)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), get_current_user_name());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, old_values, new_values, user_name)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), get_current_user_name());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, new_values, user_name)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), get_current_user_name());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Prevent role modification trigger
-- NOTE: user_role column was removed from cat_app_users, so this trigger is no longer needed
-- Role modifications are handled via the user_roles table with proper RLS policies
-- Function kept for documentation but trigger not created

-- Toggle name visibility (admin only)
-- NOTE: Updated to use is_admin() function instead of checking user_role column
-- Returns boolean indicating success
CREATE OR REPLACE FUNCTION toggle_name_visibility(
  p_name_id UUID,
  p_hide BOOLEAN,
  p_user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin using is_admin() function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can toggle name visibility';
  END IF;
  
  -- Update the is_hidden flag on cat_name_options
  UPDATE cat_name_options
  SET is_hidden = p_hide
  WHERE id = p_name_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Name not found: %', p_name_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION toggle_name_visibility(UUID, BOOLEAN, TEXT) IS 'Toggle visibility of a name (admin only). Sets is_hidden on cat_name_options.';

-- Site settings timestamp trigger
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS audit_cat_app_users_trigger ON cat_app_users;
CREATE TRIGGER audit_cat_app_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cat_app_users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- NOTE: prevent_role_modification_trigger removed - user_role column no longer exists
-- Role modifications are handled via user_roles table with proper RLS policies

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_site_settings_timestamp();
