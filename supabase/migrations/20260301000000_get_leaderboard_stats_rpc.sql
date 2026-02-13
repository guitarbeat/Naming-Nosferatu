-- Function to get leaderboard statistics efficiently
-- Avoids fetching all ratings to the client
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cno.id as name_id,
    cno.name,
    cno.description,
    cno.categories[1] as category,
    -- Calculate average rating from cat_name_ratings, or fallback to cat_name_options.avg_rating
    COALESCE(ROUND(AVG(cnr.rating)), cno.avg_rating, 1500) as avg_rating,
    COUNT(cnr.name_id) as total_ratings,
    COALESCE(SUM(cnr.wins), 0) as wins,
    COALESCE(SUM(cnr.losses), 0) as losses,
    cno.created_at
  FROM cat_name_options cno
  LEFT JOIN cat_name_ratings cnr ON cno.id = cnr.name_id
  WHERE cno.is_active = true AND cno.is_hidden = false
  GROUP BY cno.id, cno.name, cno.description, cno.avg_rating, cno.categories, cno.created_at
  -- Filter like the JS version: at least one rating OR avg_rating > 1500
  HAVING COUNT(cnr.name_id) > 0 OR COALESCE(ROUND(AVG(cnr.rating)), cno.avg_rating, 1500) > 1500
  ORDER BY avg_rating DESC
  LIMIT limit_count;
END;
$$;
