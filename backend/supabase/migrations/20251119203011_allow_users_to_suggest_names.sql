-- Migration: Allow regular users to suggest names
-- This allows any user (including anonymous) to INSERT new names, while keeping UPDATE/DELETE admin-only

-- Drop the existing "Admins can manage names" policy that blocks all operations
DROP POLICY IF EXISTS "Admins can manage names" ON cat_name_options;

-- New policy: Allow anyone to INSERT names (for public suggestions)
-- Since this is a public suggestion feature, we allow INSERTs without requiring authentication
CREATE POLICY "Users can suggest names" ON cat_name_options
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Only admins can UPDATE names
CREATE POLICY "Admins can update names" ON cat_name_options
  FOR UPDATE
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy: Only admins can DELETE names
CREATE POLICY "Admins can delete names" ON cat_name_options
  FOR DELETE
  TO public
  USING (public.is_admin());

COMMENT ON POLICY "Users can suggest names" ON cat_name_options IS 
  'Allows any user (including anonymous) to suggest new cat names by inserting into the table';
