-- Function to get leaderboard stats in a single call
-- Optimized to avoid fetching all ratings and calculating average client-side
CREATE OR REPLACE FUNCTION get_leaderboard_stats(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    name_id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    avg_rating NUMERIC,
    total_ratings INTEGER,
    wins INTEGER,
    losses INTEGER,
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
        n.description,
        n.categories[1] as category,
        COALESCE(ROUND(AVG(r.rating)), n.avg_rating, 1500) as avg_rating,
        COUNT(r.name_id)::INTEGER as total_ratings,
        COALESCE(SUM(r.wins), 0)::INTEGER as wins,
        COALESCE(SUM(r.losses), 0)::INTEGER as losses,
        n.created_at
    FROM
        cat_name_options n
    LEFT JOIN
        cat_name_ratings r ON n.id = r.name_id
    WHERE
        n.is_active = true
        AND n.is_hidden = false
    GROUP BY
        n.id
    HAVING
        COUNT(r.name_id) > 0 OR COALESCE(ROUND(AVG(r.rating)), n.avg_rating, 1500) > 1500
    ORDER BY
        avg_rating DESC
    LIMIT
        p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_stats(INTEGER) TO authenticated, anon;
