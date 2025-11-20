-- QUICK FIX: Allow users to suggest names
-- Run this SQL directly in Supabase Studio SQL Editor to fix the RLS policy issue immediately
-- This allows anyone (including anonymous users) to INSERT new names

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can suggest names" ON cat_name_options;
DROP POLICY IF EXISTS "Admins can manage names" ON cat_name_options;

-- Create new policy that allows public INSERTs
CREATE POLICY "Users can suggest names" ON cat_name_options
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure UPDATE and DELETE remain admin-only
DROP POLICY IF EXISTS "Admins can update names" ON cat_name_options;
CREATE POLICY "Admins can update names" ON cat_name_options
  FOR UPDATE
  TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete names" ON cat_name_options;
CREATE POLICY "Admins can delete names" ON cat_name_options
  FOR DELETE
  TO public
  USING (public.is_admin());

COMMENT ON POLICY "Users can suggest names" ON cat_name_options IS 
  'Allows any user (including anonymous) to suggest new cat names by inserting into the table';
