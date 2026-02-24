-- Add missing columns to cat_name_options table to match shared/schema.ts and support routes
-- status: 'candidate', 'approved', 'rejected'
-- provenance: JSONB to store origin/history
-- is_deleted: Soft delete flag
-- deleted_at: Timestamp for soft delete

ALTER TABLE cat_name_options
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'candidate',
ADD COLUMN IF NOT EXISTS provenance JSONB,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for status and is_deleted as they are likely used for filtering
CREATE INDEX IF NOT EXISTS idx_cat_name_options_status ON cat_name_options(status);
CREATE INDEX IF NOT EXISTS idx_cat_name_options_is_deleted ON cat_name_options(is_deleted);
