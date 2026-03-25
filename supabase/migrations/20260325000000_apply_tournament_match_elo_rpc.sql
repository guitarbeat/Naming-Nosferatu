-- Apply a single tournament match result in the database and return updated ratings.
-- This keeps Elo math on the server so the client only submits the matchup and winner.

CREATE OR REPLACE FUNCTION public.apply_tournament_match_elo(
	p_user_name TEXT,
	p_left_name_ids UUID[],
	p_right_name_ids UUID[],
	p_winner_side TEXT
)
RETURNS TABLE (
	name_id UUID,
	rating INTEGER,
	wins INTEGER,
	losses INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_all_name_ids UUID[];
	v_left_average NUMERIC;
	v_right_average NUMERIC;
	v_left_expected NUMERIC;
	v_right_expected NUMERIC;
	v_left_actual NUMERIC;
	v_right_actual NUMERIC;
	v_left_delta NUMERIC;
	v_right_delta NUMERIC;
BEGIN
	IF COALESCE(NULLIF(BTRIM(p_user_name), ''), '') = '' THEN
		RAISE EXCEPTION 'User name is required';
	END IF;

	IF COALESCE(array_length(p_left_name_ids, 1), 0) = 0 THEN
		RAISE EXCEPTION 'Left side must include at least one participant';
	END IF;

	IF COALESCE(array_length(p_right_name_ids, 1), 0) = 0 THEN
		RAISE EXCEPTION 'Right side must include at least one participant';
	END IF;

	IF p_winner_side NOT IN ('left', 'right', 'tie') THEN
		RAISE EXCEPTION 'Winner side must be left, right, or tie';
	END IF;

	v_all_name_ids := p_left_name_ids || p_right_name_ids;

	INSERT INTO public.user_cat_name_ratings (user_name, name_id, rating, wins, losses)
	SELECT p_user_name, participant_id, 1500, 0, 0
	FROM unnest(v_all_name_ids) AS participant_id
	ON CONFLICT (user_name, name_id) DO NOTHING;

	SELECT AVG(COALESCE(rating, 1500))
	INTO v_left_average
	FROM public.user_cat_name_ratings
	WHERE user_name = p_user_name
		AND name_id = ANY(p_left_name_ids);

	SELECT AVG(COALESCE(rating, 1500))
	INTO v_right_average
	FROM public.user_cat_name_ratings
	WHERE user_name = p_user_name
		AND name_id = ANY(p_right_name_ids);

	v_left_expected := 1 / (1 + POWER(10, (v_right_average - v_left_average) / 400.0));
	v_right_expected := 1 / (1 + POWER(10, (v_left_average - v_right_average) / 400.0));

	IF p_winner_side = 'left' THEN
		v_left_actual := 1;
		v_right_actual := 0;
	ELSIF p_winner_side = 'right' THEN
		v_left_actual := 0;
		v_right_actual := 1;
	ELSE
		v_left_actual := 0.5;
		v_right_actual := 0.5;
	END IF;

	-- Keep the server-side calculation aligned with the current tournament engine:
	-- k-factor 40 with the "new player" multiplier of 2 applied for tournament matches.
	v_left_delta := ROUND(80 * (v_left_actual - v_left_expected));
	v_right_delta := ROUND(80 * (v_right_actual - v_right_expected));

	UPDATE public.user_cat_name_ratings
	SET
		rating = LEAST(2400, GREATEST(800, ROUND(COALESCE(rating, 1500) + v_left_delta))),
		wins = COALESCE(wins, 0) + CASE WHEN v_left_actual = 1 THEN 1 ELSE 0 END,
		losses = COALESCE(losses, 0) + CASE WHEN v_left_actual = 0 THEN 1 ELSE 0 END,
		updated_at = now()
	WHERE user_name = p_user_name
		AND name_id = ANY(p_left_name_ids);

	UPDATE public.user_cat_name_ratings
	SET
		rating = LEAST(2400, GREATEST(800, ROUND(COALESCE(rating, 1500) + v_right_delta))),
		wins = COALESCE(wins, 0) + CASE WHEN v_right_actual = 1 THEN 1 ELSE 0 END,
		losses = COALESCE(losses, 0) + CASE WHEN v_right_actual = 0 THEN 1 ELSE 0 END,
		updated_at = now()
	WHERE user_name = p_user_name
		AND name_id = ANY(p_right_name_ids);

	UPDATE public.cat_names
	SET
		global_wins = COALESCE(global_wins, 0) + CASE WHEN v_left_actual = 1 THEN 1 ELSE 0 END,
		global_losses = COALESCE(global_losses, 0) + CASE WHEN v_left_actual = 0 THEN 1 ELSE 0 END
	WHERE id = ANY(p_left_name_ids);

	UPDATE public.cat_names
	SET
		global_wins = COALESCE(global_wins, 0) + CASE WHEN v_right_actual = 1 THEN 1 ELSE 0 END,
		global_losses = COALESCE(global_losses, 0) + CASE WHEN v_right_actual = 0 THEN 1 ELSE 0 END
	WHERE id = ANY(p_right_name_ids);

	UPDATE public.cat_names n
	SET avg_rating = COALESCE(stats.avg_rating, n.avg_rating, 1500)
	FROM (
		SELECT name_id, ROUND(AVG(COALESCE(rating, 1500)))::numeric AS avg_rating
		FROM public.user_cat_name_ratings
		WHERE name_id = ANY(v_all_name_ids)
		GROUP BY name_id
	) AS stats
	WHERE n.id = stats.name_id;

	RETURN QUERY
	SELECT
		r.name_id,
		ROUND(COALESCE(r.rating, 1500))::INTEGER AS rating,
		COALESCE(r.wins, 0)::INTEGER AS wins,
		COALESCE(r.losses, 0)::INTEGER AS losses
	FROM public.user_cat_name_ratings r
	WHERE r.user_name = p_user_name
		AND r.name_id = ANY(v_all_name_ids)
	ORDER BY array_position(v_all_name_ids, r.name_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_tournament_match_elo(TEXT, UUID[], UUID[], TEXT) TO authenticated;

COMMENT ON FUNCTION public.apply_tournament_match_elo(TEXT, UUID[], UUID[], TEXT)
IS 'Applies one tournament match result and returns updated per-name ratings for the user.';
