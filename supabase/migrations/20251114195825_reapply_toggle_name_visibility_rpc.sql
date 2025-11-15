-- Migration: Add is_hidden column to cat_name_options for global admin-hidden names
-- This allows admins to hide names globally for all users

-- Add is_hidden column to cat_name_options if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cat_name_options') THEN
    -- Add is_hidden column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'cat_name_options'
      AND column_name = 'is_hidden'
    ) THEN
      ALTER TABLE cat_name_options
      ADD COLUMN is_hidden BOOLEAN DEFAULT false NOT NULL;

      -- Add index for faster filtering
      CREATE INDEX IF NOT EXISTS idx_cat_name_options_is_hidden
      ON cat_name_options (is_hidden)
      WHERE is_hidden = true;

      -- Add comment
      COMMENT ON COLUMN cat_name_options.is_hidden IS
        'Admin-controlled global visibility flag. When true, name is hidden from all users including tournaments';
    END IF;
  END IF;
END $$;

-- Update RLS policies to respect the global is_hidden flag
DROP POLICY IF EXISTS "Users can view non-hidden names" ON cat_name_options;
DROP POLICY IF EXISTS "Public can read all names" ON cat_name_options;

-- New policy: Only show names that are not globally hidden
CREATE POLICY "Public can read visible names" ON cat_name_options
  FOR SELECT
  TO public
  USING (is_hidden = false OR is_hidden IS NULL);

-- Only admins can insert/update/delete names
DROP POLICY IF EXISTS "Admins can manage names" ON cat_name_options;
CREATE POLICY "Admins can manage names" ON cat_name_options
  FOR ALL
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin-only function to hide/unhide names globally
CREATE OR REPLACE FUNCTION public.toggle_name_visibility(p_name_id UUID, p_hide BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can use this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can hide names globally';
  END IF;

  -- Update the is_hidden flag
  UPDATE cat_name_options
  SET is_hidden = p_hide
  WHERE id = p_name_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.toggle_name_visibility(UUID, BOOLEAN) IS
  'Admin function to hide/unhide names globally for all users';
