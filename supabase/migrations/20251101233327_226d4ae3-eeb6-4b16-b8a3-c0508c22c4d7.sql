-- Migration: Remove materialized view from public API access
-- This addresses the security warning about exposing materialized views via the API

-- Check if leaderboard_stats materialized view exists and drop it from API schema
DO $$
BEGIN
  -- If leaderboard_stats exists as a materialized view, we'll exclude it from the API
  -- by not exposing it in the PostgREST schema
  IF EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE schemaname = 'public' 
    AND matviewname = 'leaderboard_stats'
  ) THEN
    -- Revoke access from anon and authenticated roles
    REVOKE ALL ON public.leaderboard_stats FROM anon;
    REVOKE ALL ON public.leaderboard_stats FROM authenticated;
    
    -- Add comment explaining why it's not exposed
    COMMENT ON MATERIALIZED VIEW public.leaderboard_stats IS 
      'Internal materialized view for performance. Not exposed via API for security. Use regular views or tables for API access.';
  END IF;
END $$;