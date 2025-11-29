-- Migration: Phase 2 - Add Check Constraints
-- Part of Supabase Backend Optimization
-- This migration adds check constraints for data validation

-- ===== BACKUP REMINDER =====
-- Before running: ./scripts/create_backup.sh phase2_check_constraints

-- ===== ADD CHECK CONSTRAINTS =====

-- 1. Cat Name Options: Name length constraint
ALTER TABLE cat_name_options
ADD CONSTRAINT check_name_length 
CHECK (length(name) >= 1 AND length(name) <= 100);

COMMENT ON CONSTRAINT check_name_length ON cat_name_options IS 
  'Ensures cat name is between 1 and 100 characters';

-- 2. Cat Name Ratings: Rating range constraint
-- ELO ratings typically range from 1000-2000
ALTER TABLE cat_name_ratings
ADD CONSTRAINT check_rating_range 
CHECK (rating IS NULL OR (rating >= 1000 AND rating <= 2000));

COMMENT ON CONSTRAINT check_rating_range ON cat_name_ratings IS 
  'Ensures rating is within valid ELO range (1000-2000) or NULL';

-- 3. Cat Name Ratings: Non-negative wins
ALTER TABLE cat_name_ratings
ADD CONSTRAINT check_wins_non_negative 
CHECK (wins IS NULL OR wins >= 0);

COMMENT ON CONSTRAINT check_wins_non_negative ON cat_name_ratings IS 
  'Ensures wins count is non-negative or NULL';

-- 4. Cat Name Ratings: Non-negative losses
ALTER TABLE cat_name_ratings
ADD CONSTRAINT check_losses_non_negative 
CHECK (losses IS NULL OR losses >= 0);

COMMENT ON CONSTRAINT check_losses_non_negative ON cat_name_ratings IS 
  'Ensures losses count is non-negative or NULL';

-- ===== VALIDATE EXISTING DATA =====

-- Check for any existing data that violates constraints
DO $
DECLARE
  invalid_names INTEGER;
  invalid_ratings INTEGER;
  invalid_wins INTEGER;
  invalid_losses INTEGER;
BEGIN
  -- Check name lengths
  SELECT COUNT(*) INTO invalid_names
  FROM cat_name_options
  WHERE length(name) < 1 OR length(name) > 100;

  -- Check rating ranges
  SELECT COUNT(*) INTO invalid_ratings
  FROM cat_name_ratings
  WHERE rating IS NOT NULL AND (rating < 1000 OR rating > 2000);

  -- Check negative wins
  SELECT COUNT(*) INTO invalid_wins
  FROM cat_name_ratings
  WHERE wins IS NOT NULL AND wins < 0;

  -- Check negative losses
  SELECT COUNT(*) INTO invalid_losses
  FROM cat_name_ratings
  WHERE losses IS NOT NULL AND losses < 0;

  -- Report findings
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Data Validation Results';
  RAISE NOTICE '========================================';
  
  IF invalid_names > 0 THEN
    RAISE WARNING 'Found % names with invalid length', invalid_names;
  ELSE
    RAISE NOTICE '✓ All names have valid length';
  END IF;

  IF invalid_ratings > 0 THEN
    RAISE WARNING 'Found % ratings outside valid range', invalid_ratings;
  ELSE
    RAISE NOTICE '✓ All ratings within valid range';
  END IF;

  IF invalid_wins > 0 THEN
    RAISE WARNING 'Found % records with negative wins', invalid_wins;
  ELSE
    RAISE NOTICE '✓ All wins are non-negative';
  END IF;

  IF invalid_losses > 0 THEN
    RAISE WARNING 'Found % records with negative losses', invalid_losses;
  ELSE
    RAISE NOTICE '✓ All losses are non-negative';
  END IF;

  -- Fail if any invalid data found
  IF invalid_names > 0 OR invalid_ratings > 0 OR invalid_wins > 0 OR invalid_losses > 0 THEN
    RAISE EXCEPTION 'Invalid data found. Fix data before adding constraints.';
  END IF;
END $;

-- ===== VERIFICATION =====

-- Verify all constraints were added
DO $
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname IN (
    'check_name_length',
    'check_rating_range',
    'check_wins_non_negative',
    'check_losses_non_negative'
  );

  IF constraint_count = 4 THEN
    RAISE NOTICE '✓ All 4 check constraints added successfully';
  ELSE
    RAISE EXCEPTION 'Expected 4 constraints, found %', constraint_count;
  END IF;
END $;

-- ===== STATISTICS =====

DO $
DECLARE
  total_names INTEGER;
  total_ratings INTEGER;
  avg_rating NUMERIC;
  avg_wins NUMERIC;
  avg_losses NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_names FROM cat_name_options;
  SELECT COUNT(*) INTO total_ratings FROM cat_name_ratings;
  SELECT AVG(rating) INTO avg_rating FROM cat_name_ratings WHERE rating IS NOT NULL;
  SELECT AVG(wins) INTO avg_wins FROM cat_name_ratings WHERE wins IS NOT NULL;
  SELECT AVG(losses) INTO avg_losses FROM cat_name_ratings WHERE losses IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 2: Check Constraints Added';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total names: %', total_names;
  RAISE NOTICE 'Total ratings: %', total_ratings;
  RAISE NOTICE 'Average rating: %', ROUND(avg_rating, 2);
  RAISE NOTICE 'Average wins: %', ROUND(avg_wins, 2);
  RAISE NOTICE 'Average losses: %', ROUND(avg_losses, 2);
  RAISE NOTICE '';
  RAISE NOTICE 'Constraints added:';
  RAISE NOTICE '  - check_name_length (1-100 chars)';
  RAISE NOTICE '  - check_rating_range (1000-2000)';
  RAISE NOTICE '  - check_wins_non_negative';
  RAISE NOTICE '  - check_losses_non_negative';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test constraints with application';
END $;
