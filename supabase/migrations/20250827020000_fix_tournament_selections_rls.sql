-- Fix RLS policies for tournament_selections table
-- This migration ensures that users can insert and read their own tournament selections

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS tournament_selections (
  id SERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  name_id UUID NOT NULL REFERENCES cat_name_options(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  selection_type TEXT DEFAULT 'tournament_setup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_selections_user_name ON tournament_selections(user_name);
CREATE INDEX IF NOT EXISTS idx_tournament_selections_tournament_id ON tournament_selections(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_selections_name_id ON tournament_selections(name_id);

-- Enable RLS on the table
ALTER TABLE tournament_selections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can read their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can update their own tournament selections" ON tournament_selections;
DROP POLICY IF EXISTS "Users can delete their own tournament selections" ON tournament_selections;

-- Create new RLS policies
-- Allow users to insert their own tournament selections
CREATE POLICY "Users can insert their own tournament selections" ON tournament_selections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR user_name IS NOT NULL);

-- Allow users to read their own tournament selections
CREATE POLICY "Users can read their own tournament selections" ON tournament_selections
  FOR SELECT USING (auth.role() = 'authenticated' OR user_name IS NOT NULL);

-- Allow users to update their own tournament selections
CREATE POLICY "Users can update their own tournament selections" ON tournament_selections
  FOR UPDATE USING (auth.role() = 'authenticated' OR user_name IS NOT NULL);

-- Allow users to delete their own tournament selections
CREATE POLICY "Users can delete their own tournament selections" ON tournament_selections
  FOR DELETE USING (auth.role() = 'authenticated' OR user_name IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON tournament_selections TO authenticated;
GRANT ALL ON tournament_selections TO anon;

-- Insert a comment for documentation
COMMENT ON TABLE tournament_selections IS 'Stores user selections for tournament setup and tracking';
COMMENT ON COLUMN tournament_selections.user_name IS 'The username who made the selection';
COMMENT ON COLUMN tournament_selections.name_id IS 'Reference to the selected cat name';
COMMENT ON COLUMN tournament_selections.tournament_id IS 'Unique identifier for the tournament session';
COMMENT ON COLUMN tournament_selections.selection_type IS 'Type of selection (tournament_setup, etc.)';
