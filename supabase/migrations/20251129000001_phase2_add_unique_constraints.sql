-- Migration: Phase 2 - Add Unique Constraints
-- Part of Supabase Backend Optimization
-- This migration adds unique constraints to prevent duplicate data

-- ===== BACKUP REMINDER =====
-- Before running this migration, create a backup:
-- ./scripts/create_backup.sh phase2_before

-- ===== CHECK FOR DUPLICATES FIRST =====

-- Check for duplicate ratings (user_name, name_id combinations)
DO $
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_name, name_id, COUNT(*) as cnt
    FROM cat_name_ratings
    GROUP BY user_name, name_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % duplicate (user_name, name_id) combinations', duplicate_count;
    RAISE NOTICE 'These will need to be resolved before adding unique constraint';
    
    -- Show the duplicates
    RAISE NOTICE 'Duplicate records:';
    FOR rec IN 
      SELECT user_name, name_id, COUNT(*) as cnt
      FROM cat_name_ratings
      GROUP BY user_name, name_id
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 10
    LOOP
      RAISE NOTICE '  user: %, name_id: %, count: %', rec.user_name, rec.name_id, rec.cnt;
    END LOOP;
  ELSE
    RAISE NOTICE 'No duplicates found. Safe to add unique constraint.';
  END IF;
END $;

-- ===== CLEAN UP DUPLICATES (IF ANY) =====

-- Strategy: Keep the most recent rating for each (user_name, name_id) pair
-- Delete older duplicates

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_name, name_id 
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) as rn
  FROM cat_name_ratings
)
DELETE FROM cat_name_ratings
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Log how many were deleted
DO $
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % duplicate rating records', deleted_count;
  END IF;
END $;

-- ===== ADD UNIQUE CONSTRAINT =====

-- Add unique constraint on (user_name, name_id)
-- This ensures each user can only have one rating per name
ALTER TABLE cat_name_ratings
ADD CONSTRAINT unique_user_name_name_id 
UNIQUE (user_name, name_id);

-- Add comment
COMMENT ON CONSTRAINT unique_user_name_name_id ON cat_name_ratings IS 
  'Ensures each user can only have one rating per cat name';

-- ===== VERIFICATION =====

-- Verify constraint was added
DO $
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_name_name_id'
      AND conrelid = 'cat_name_ratings'::regclass
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '✓ Unique constraint added successfully';
  ELSE
    RAISE EXCEPTION 'Failed to add unique constraint';
  END IF;
END $;

-- Verify no duplicates remain
DO $
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_name, name_id, COUNT(*) as cnt
    FROM cat_name_ratings
    GROUP BY user_name, name_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicates still exist after cleanup!';
  ELSE
    RAISE NOTICE '✓ No duplicates found';
  END IF;
END $;

-- ===== STATISTICS =====

DO $
DECLARE
  total_ratings INTEGER;
  unique_combinations INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ratings FROM cat_name_ratings;
  SELECT COUNT(DISTINCT (user_name, name_id)) INTO unique_combinations FROM cat_name_ratings;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 2: Unique Constraint Added';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total ratings: %', total_ratings;
  RAISE NOTICE 'Unique combinations: %', unique_combinations;
  RAISE NOTICE 'Constraint: unique_user_name_name_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test constraint with application';
END $;
