-- Add an admin-only user activity summary for the admin dashboard users view.

CREATE OR REPLACE FUNCTION get_admin_user_activity(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
	user_id UUID,
	user_name TEXT,
	role_label TEXT,
	created_at TIMESTAMPTZ,
	total_ratings INTEGER,
	total_selections INTEGER,
	total_wins INTEGER,
	total_losses INTEGER,
	last_rating_at TIMESTAMPTZ,
	last_selection_at TIMESTAMPTZ,
	last_active_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_limit INTEGER;
BEGIN
	IF NOT is_admin() THEN
		RAISE EXCEPTION 'Admin access required to read user activity';
	END IF;

	v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);

	RETURN QUERY
	WITH rating_stats AS (
		SELECT
			cnr.user_id,
			COUNT(*)::INTEGER AS total_ratings,
			COALESCE(SUM(cnr.wins), 0)::INTEGER AS total_wins,
			COALESCE(SUM(cnr.losses), 0)::INTEGER AS total_losses,
			MAX(cnr.updated_at) AS last_rating_at
		FROM cat_name_ratings AS cnr
		GROUP BY cnr.user_id
	),
	selection_stats AS (
		SELECT
			cts.user_id,
			COUNT(*)::INTEGER AS total_selections,
			MAX(cts.selected_at) AS last_selection_at
		FROM cat_tournament_selections AS cts
		GROUP BY cts.user_id
	)
	SELECT
		users.user_id,
		users.user_name,
		COALESCE(role_summary.roles, 'user') AS role_label,
		users.created_at,
		COALESCE(rating_stats.total_ratings, 0) AS total_ratings,
		COALESCE(selection_stats.total_selections, 0) AS total_selections,
		COALESCE(rating_stats.total_wins, 0) AS total_wins,
		COALESCE(rating_stats.total_losses, 0) AS total_losses,
		rating_stats.last_rating_at,
		selection_stats.last_selection_at,
		GREATEST(
			COALESCE(rating_stats.last_rating_at, TIMESTAMPTZ 'epoch'),
			COALESCE(selection_stats.last_selection_at, TIMESTAMPTZ 'epoch'),
			COALESCE(users.updated_at, users.created_at, TIMESTAMPTZ 'epoch')
		) AS last_active_at
	FROM cat_app_users AS users
	LEFT JOIN rating_stats ON rating_stats.user_id = users.user_id
	LEFT JOIN selection_stats ON selection_stats.user_id = users.user_id
	LEFT JOIN LATERAL (
		SELECT string_agg(DISTINCT roles.role::TEXT, ', ' ORDER BY roles.role::TEXT) AS roles
		FROM cat_user_roles AS roles
		WHERE roles.user_id = users.user_id
			OR (roles.user_id IS NULL AND roles.user_name = users.user_name)
	) AS role_summary ON TRUE
	WHERE users.is_deleted = false
	ORDER BY
		last_active_at DESC,
		COALESCE(selection_stats.total_selections, 0) DESC,
		COALESCE(rating_stats.total_ratings, 0) DESC,
		users.user_name ASC
	LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_user_activity(INTEGER) TO authenticated;
