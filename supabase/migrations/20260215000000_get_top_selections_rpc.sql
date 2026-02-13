-- Migration: 20260215000000_get_top_selections_rpc
-- Description: Creates a function to get top selected names with count aggregation.

CREATE OR REPLACE FUNCTION get_top_selections(limit_count int)
RETURNS TABLE (
  name_id uuid,
  name text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT name_id, name, COUNT(*) as count
  FROM cat_tournament_selections
  GROUP BY name_id, name
  ORDER BY count DESC
  LIMIT limit_count;
$$;
