-- Migration: Add RLS policies to cat_name_ratings and cat_name_options tables
-- This ensures users can only access their own rating data

-- 1. Enable RLS on cat_name_ratings if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cat_name_ratings') THEN
    -- Enable RLS
    ALTER TABLE cat_name_ratings ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can view own ratings" ON cat_name_ratings;
    DROP POLICY IF EXISTS "Users can insert own ratings" ON cat_name_ratings;
    DROP POLICY IF EXISTS "Users can update own ratings" ON cat_name_ratings;
    DROP POLICY IF EXISTS "Users can delete own ratings" ON cat_name_ratings;
    
    -- Users can only access their own ratings
    CREATE POLICY "Users can view own ratings" ON cat_name_ratings
      FOR SELECT 
      USING (user_name = public.get_current_user_name());
    
    CREATE POLICY "Users can insert own ratings" ON cat_name_ratings
      FOR INSERT 
      WITH CHECK (user_name = public.get_current_user_name());
    
    CREATE POLICY "Users can update own ratings" ON cat_name_ratings
      FOR UPDATE 
      USING (user_name = public.get_current_user_name())
      WITH CHECK (user_name = public.get_current_user_name());
    
    CREATE POLICY "Users can delete own ratings" ON cat_name_ratings
      FOR DELETE 
      USING (user_name = public.get_current_user_name());
    
    -- Admins can view all ratings (for analytics)
    CREATE POLICY "Admins can view all ratings" ON cat_name_ratings
      FOR SELECT
      USING (public.has_role(public.get_current_user_name(), 'admin'));
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON cat_name_ratings TO authenticated, anon;
    
    -- Add comments
    COMMENT ON POLICY "Users can view own ratings" ON cat_name_ratings IS 'Users can only view their own rating data';
  END IF;
END $$;

-- 2. Enable RLS on cat_name_options if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cat_name_options') THEN
    -- Enable RLS
    ALTER TABLE cat_name_options ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can view all names" ON cat_name_options;
    DROP POLICY IF EXISTS "Users can view own names" ON cat_name_options;
    DROP POLICY IF EXISTS "Users can insert own names" ON cat_name_options;
    DROP POLICY IF EXISTS "Users can update own names" ON cat_name_options;
    DROP POLICY IF EXISTS "Users can delete own names" ON cat_name_options;
    
    -- All users can view non-hidden names (for tournament selection)
    CREATE POLICY "Users can view non-hidden names" ON cat_name_options
      FOR SELECT 
      USING (
        is_hidden = false 
        OR user_name = public.get_current_user_name()
        OR public.has_role(public.get_current_user_name(), 'admin')
      );
    
    -- Users can only insert names for themselves
    CREATE POLICY "Users can insert own names" ON cat_name_options
      FOR INSERT 
      WITH CHECK (
        user_name = public.get_current_user_name() 
        OR user_name IS NULL
      );
    
    -- Users can only update their own names
    CREATE POLICY "Users can update own names" ON cat_name_options
      FOR UPDATE 
      USING (
        user_name = public.get_current_user_name() 
        OR public.has_role(public.get_current_user_name(), 'admin')
      )
      WITH CHECK (
        user_name = public.get_current_user_name() 
        OR user_name IS NULL
        OR public.has_role(public.get_current_user_name(), 'admin')
      );
    
    -- Users can only delete their own names
    CREATE POLICY "Users can delete own names" ON cat_name_options
      FOR DELETE 
      USING (
        user_name = public.get_current_user_name() 
        OR public.has_role(public.get_current_user_name(), 'admin')
      );
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON cat_name_options TO authenticated, anon;
    
    -- Add comments
    COMMENT ON POLICY "Users can view non-hidden names" ON cat_name_options IS 'Users can view all non-hidden names or their own hidden names';
  END IF;
END $$;

-- 3. Fix tournament_selections RLS to be properly user-isolated
DROP POLICY IF EXISTS "Users can insert their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can read their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can update their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can delete their own tournament selections" ON tournament_selections;

-- Create proper user-isolated policies
CREATE POLICY "Users can view own tournament selections" ON tournament_selections
  FOR SELECT 
  USING (user_name = public.get_current_user_name());

CREATE POLICY "Users can insert own tournament selections" ON tournament_selections
  FOR INSERT 
  WITH CHECK (user_name = public.get_current_user_name());

CREATE POLICY "Users can update own tournament selections" ON tournament_selections
  FOR UPDATE 
  USING (user_name = public.get_current_user_name())
  WITH CHECK (user_name = public.get_current_user_name());

CREATE POLICY "Users can delete own tournament selections" ON tournament_selections
  FOR DELETE 
  USING (user_name = public.get_current_user_name());

-- Admins can view all tournament selections
CREATE POLICY "Admins can view all tournament selections" ON tournament_selections
  FOR SELECT
  USING (public.has_role(public.get_current_user_name(), 'admin'));

-- Add comments
COMMENT ON POLICY "Users can view own tournament selections" ON tournament_selections IS 'Users can only view their own tournament selections';
