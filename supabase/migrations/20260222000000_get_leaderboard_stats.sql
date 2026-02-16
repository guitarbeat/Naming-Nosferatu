-- Migration: 20260222000000_get_leaderboard_stats.sql
-- Description: Creates a function to get leaderboard stats with aggregated ratings and wins.

CREATE OR REPLACE FUNCTION get_leaderboard_stats(p_limit INT DEFAULT 50)
RETURNS TABLE (
  name_id UUID,
  name TEXT,
  avg_rating NUMERIC,
  wins BIGINT,
  losses BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id as name_id,
    n.name,
    COALESCE(
      ROUND(AVG(r.rating) FILTER (WHERE r.rating IS NOT NULL)),
      n.avg_rating,
      1500
    ) as avg_rating,
    COALESCE(SUM(r.wins), 0) as wins,
    COALESCE(SUM(r.losses), 0) as losses,
    n.created_at
  FROM cat_name_options n
  LEFT JOIN cat_name_ratings r ON n.id = r.name_id
  WHERE n.is_active = true AND n.is_hidden = false
  GROUP BY n.id, n.name, n.avg_rating, n.created_at
  ORDER BY avg_rating DESC
  LIMIT p_limit;
END;
$$;
