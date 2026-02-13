-- Add function to calculate popularity scores in the database
CREATE OR REPLACE FUNCTION get_popularity_scores(
  p_limit INT DEFAULT 20,
  p_user_filter TEXT DEFAULT 'all',
  p_current_user_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  name_id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  times_selected BIGINT,
  avg_rating NUMERIC,
  popularity_score NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_user TEXT;
BEGIN
  IF p_user_filter = 'current' THEN
    v_target_user := p_current_user_name;
  ELSIF p_user_filter != 'all' THEN
    v_target_user := p_user_filter;
  ELSE
    v_target_user := NULL;
  END IF;

  RETURN QUERY
  WITH selection_stats AS (
    SELECT
      cts.name_id,
      COUNT(*) as count
    FROM cat_tournament_selections cts
    WHERE v_target_user IS NULL OR cts.user_name = v_target_user
    GROUP BY cts.name_id
  ),
  rating_stats AS (
    SELECT
      cnr.name_id,
      COUNT(*) as count,
      SUM(COALESCE(cnr.rating, 1500)) as total_rating,
      SUM(COALESCE(cnr.wins, 0)) as wins,
      SUM(COALESCE(cnr.losses, 0)) as losses
    FROM cat_name_ratings cnr
    WHERE v_target_user IS NULL OR cnr.user_name = v_target_user
    GROUP BY cnr.name_id
  )
  SELECT
    n.id as name_id,
    n.name,
    n.description,
    n.categories[1] as category,
    COALESCE(s.count, 0) as times_selected,
    CASE WHEN COALESCE(r.count, 0) > 0 THEN ROUND(r.total_rating / r.count) ELSE 1500 END as avg_rating,
    ROUND(
      COALESCE(s.count, 0) * 2 +
      COALESCE(r.wins, 0) * 1.5 +
      (CASE WHEN COALESCE(r.count, 0) > 0 THEN ROUND(r.total_rating / r.count) ELSE 1500 END - 1500) * 0.5
    ) as popularity_score,
    n.created_at
  FROM cat_name_options n
  LEFT JOIN selection_stats s ON n.id = s.name_id
  LEFT JOIN rating_stats r ON n.id = r.name_id
  WHERE n.is_active = true AND n.is_hidden = false
  ORDER BY popularity_score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_popularity_scores(INT, TEXT, TEXT) TO authenticated, anon;
