-- Add locked_in column to cat_name_options table
-- This allows admins to mark names as "locked in" which means they're always selected for new users

-- Add the locked_in column
ALTER TABLE cat_name_options 
ADD COLUMN locked_in BOOLEAN DEFAULT false NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_cat_name_options_locked_in ON cat_name_options(locked_in) WHERE locked_in = true;

-- Add comment
COMMENT ON COLUMN cat_name_options.locked_in IS 'When true, this name is automatically selected for all new users and cannot be deselected by regular users';
