-- Migration: Add server-side input validation constraints
-- This prevents malicious users from bypassing client-side validation

-- 1. Add validation constraints to cat_app_users
ALTER TABLE cat_app_users 
  DROP CONSTRAINT IF EXISTS cat_app_users_user_name_length;

ALTER TABLE cat_app_users 
  ADD CONSTRAINT cat_app_users_user_name_length 
  CHECK (LENGTH(user_name) >= 2 AND LENGTH(user_name) <= 50);

ALTER TABLE cat_app_users 
  DROP CONSTRAINT IF EXISTS cat_app_users_user_name_format;

ALTER TABLE cat_app_users 
  ADD CONSTRAINT cat_app_users_user_name_format 
  CHECK (user_name ~ '^[a-zA-Z0-9 _-]+$');

-- 2. Add validation constraints to tournament_selections
ALTER TABLE tournament_selections 
  DROP CONSTRAINT IF EXISTS tournament_selections_name_length;

ALTER TABLE tournament_selections 
  ADD CONSTRAINT tournament_selections_name_length 
  CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100);

ALTER TABLE tournament_selections 
  DROP CONSTRAINT IF EXISTS tournament_selections_user_name_length;

ALTER TABLE tournament_selections 
  ADD CONSTRAINT tournament_selections_user_name_length 
  CHECK (LENGTH(user_name) >= 2 AND LENGTH(user_name) <= 50);

ALTER TABLE tournament_selections 
  DROP CONSTRAINT IF EXISTS tournament_selections_tournament_id_format;

ALTER TABLE tournament_selections 
  ADD CONSTRAINT tournament_selections_tournament_id_format 
  CHECK (LENGTH(tournament_id) >= 1 AND LENGTH(tournament_id) <= 100);

-- 3. Add validation constraints to user_roles
ALTER TABLE user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_name_length;

ALTER TABLE user_roles 
  ADD CONSTRAINT user_roles_user_name_length 
  CHECK (LENGTH(user_name) >= 2 AND LENGTH(user_name) <= 50);

-- 4. Add validation for cat_name_options if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cat_name_options') THEN
    -- Add constraints to cat_name_options
    ALTER TABLE cat_name_options 
      DROP CONSTRAINT IF EXISTS cat_name_options_name_length;
    
    ALTER TABLE cat_name_options 
      ADD CONSTRAINT cat_name_options_name_length 
      CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100);
    
    ALTER TABLE cat_name_options 
      DROP CONSTRAINT IF EXISTS cat_name_options_user_name_length;
    
    ALTER TABLE cat_name_options 
      ADD CONSTRAINT cat_name_options_user_name_length 
      CHECK (user_name IS NULL OR (LENGTH(user_name) >= 2 AND LENGTH(user_name) <= 50));
  END IF;
END $$;

-- 5. Add validation for cat_name_ratings if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cat_name_ratings') THEN
    -- Add constraints to cat_name_ratings
    ALTER TABLE cat_name_ratings 
      DROP CONSTRAINT IF EXISTS cat_name_ratings_user_name_length;
    
    ALTER TABLE cat_name_ratings 
      ADD CONSTRAINT cat_name_ratings_user_name_length 
      CHECK (LENGTH(user_name) >= 2 AND LENGTH(user_name) <= 50);
    
    ALTER TABLE cat_name_ratings 
      DROP CONSTRAINT IF EXISTS cat_name_ratings_rating_range;
    
    ALTER TABLE cat_name_ratings 
      ADD CONSTRAINT cat_name_ratings_rating_range 
      CHECK (rating >= 0 AND rating <= 5000);
    
    ALTER TABLE cat_name_ratings 
      DROP CONSTRAINT IF EXISTS cat_name_ratings_wins_losses_positive;
    
    ALTER TABLE cat_name_ratings 
      ADD CONSTRAINT cat_name_ratings_wins_losses_positive 
      CHECK (wins >= 0 AND losses >= 0);
  END IF;
END $$;

-- 6. Create function to validate JSON preferences
CREATE OR REPLACE FUNCTION public.validate_preferences(prefs JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check that preferences contains valid keys
  IF prefs ? 'tournament_size_preference' THEN
    IF NOT ((prefs->>'tournament_size_preference')::int IN (2, 4, 8, 16, 32, 64)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF prefs ? 'rating_display_preference' THEN
    IF NOT ((prefs->>'rating_display_preference') IN ('elo', 'wins', 'percentage')) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 7. Add preferences validation to cat_app_users
ALTER TABLE cat_app_users 
  DROP CONSTRAINT IF EXISTS cat_app_users_preferences_valid;

ALTER TABLE cat_app_users 
  ADD CONSTRAINT cat_app_users_preferences_valid 
  CHECK (public.validate_preferences(preferences));

-- 8. Add comments
COMMENT ON CONSTRAINT cat_app_users_user_name_length ON cat_app_users IS 'Ensures username is between 2 and 50 characters';
COMMENT ON CONSTRAINT cat_app_users_user_name_format ON cat_app_users IS 'Ensures username only contains alphanumeric characters, spaces, hyphens, and underscores';
COMMENT ON FUNCTION public.validate_preferences(JSONB) IS 'Validates user preferences JSON structure and values';
