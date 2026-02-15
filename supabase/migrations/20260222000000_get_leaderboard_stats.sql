-- Create a function to get leaderboard stats server-side
CREATE OR REPLACE FUNCTION get_leaderboard_stats(limit_count int DEFAULT 50)
RETURNS TABLE (
  name_id uuid,
  name text,
  description text,
  category text,
  avg_rating numeric,
  total_ratings bigint,
  wins bigint,
  losses bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH rating_stats AS (
    SELECT
      cnr.name_id,
      COUNT(*) as count,
      SUM(COALESCE(cnr.rating, 1500)) as total_rating,
      SUM(COALESCE(cnr.wins, 0)) as total_wins,
      SUM(COALESCE(cnr.losses, 0)) as total_losses
    FROM cat_name_ratings cnr
    GROUP BY cnr.name_id
  )
  SELECT
    n.id,
    n.name,
    n.description,
    n.categories[1],
    CASE
      WHEN rs.count > 0 THEN ROUND(rs.total_rating / rs.count)
      ELSE COALESCE(n.avg_rating, 1500)
    END as avg_rating,
    COALESCE(rs.count, 0),
    COALESCE(rs.total_wins, 0),
    COALESCE(rs.total_losses, 0),
    n.created_at
  FROM cat_name_options n
  LEFT JOIN rating_stats rs ON n.id = rs.name_id
  WHERE n.is_active = true AND n.is_hidden = false
  ORDER BY avg_rating DESC
  LIMIT limit_count;
END;
$$;
