-- Migration: Add preferences and tournament_data columns to cat_app_users table
-- This migration adds the missing columns that the application expects

-- Add preferences column as JSONB with default value
ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "preferred_categories": [],
  "tournament_size_preference": 8,
  "rating_display_preference": "elo",
  "sound_enabled": true,
  "theme_preference": "dark"
}'::jsonb;

-- Add tournament_data column as JSONB with default value
ALTER TABLE cat_app_users 
ADD COLUMN IF NOT EXISTS tournament_data JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column purpose
COMMENT ON COLUMN cat_app_users.preferences IS 'User preferences including theme, sound, tournament settings, and categories';
COMMENT ON COLUMN cat_app_users.tournament_data IS 'User tournament history and data stored as JSONB array';

-- Create index on preferences for better query performance
CREATE INDEX IF NOT EXISTS idx_cat_app_users_preferences ON cat_app_users USING GIN (preferences);

-- Create index on tournament_data for better query performance  
CREATE INDEX IF NOT EXISTS idx_cat_app_users_tournament_data ON cat_app_users USING GIN (tournament_data);
