BEGIN;

ALTER TABLE IF EXISTS public.cat_name_options
  RENAME TO cat_names;

ALTER TABLE IF EXISTS public.cat_name_ratings
  RENAME TO user_cat_name_ratings;

ALTER TABLE IF EXISTS public.cat_names
  ADD COLUMN IF NOT EXISTS global_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS global_losses integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cat_names'
      AND column_name = 'avg_rating'
  ) THEN
    UPDATE public.cat_names AS n
    SET
      global_wins = COALESCE(stats.wins, 0),
      global_losses = COALESCE(stats.losses, 0),
      avg_rating = COALESCE(stats.avg_rating, n.avg_rating, 1500)
    FROM (
      SELECT
        r.name_id,
        COALESCE(SUM(r.wins), 0)::integer AS wins,
        COALESCE(SUM(r.losses), 0)::integer AS losses,
        ROUND(COALESCE(AVG(r.rating), 1500))::numeric AS avg_rating
      FROM public.user_cat_name_ratings AS r
      GROUP BY r.name_id
    ) AS stats
    WHERE n.id = stats.name_id;
  ELSE
    UPDATE public.cat_names AS n
    SET
      global_wins = COALESCE(stats.wins, 0),
      global_losses = COALESCE(stats.losses, 0)
    FROM (
      SELECT
        r.name_id,
        COALESCE(SUM(r.wins), 0)::integer AS wins,
        COALESCE(SUM(r.losses), 0)::integer AS losses
      FROM public.user_cat_name_ratings AS r
      GROUP BY r.name_id
    ) AS stats
    WHERE n.id = stats.name_id;
  END IF;
END $$;

DROP INDEX IF EXISTS public.cat_name_ratings_name_id_idx;
CREATE INDEX IF NOT EXISTS user_cat_name_ratings_name_id_idx
  ON public.user_cat_name_ratings (name_id);

CREATE INDEX IF NOT EXISTS cat_names_global_rank_idx
  ON public.cat_names (avg_rating DESC, global_wins DESC)
  WHERE is_active = true AND is_hidden = false AND is_deleted = false;

DROP TABLE IF EXISTS public.cat_tournament_selections;

CREATE OR REPLACE FUNCTION public.toggle_name_visibility(
  p_name_id UUID,
  p_hide BOOLEAN,
  p_user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can toggle name visibility';
  END IF;

  UPDATE public.cat_names
  SET is_hidden = p_hide
  WHERE id = p_name_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Name not found: %', p_name_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_name_locked_in(
  p_name_id UUID,
  p_locked_in BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_current_locked_in BOOLEAN;
BEGIN
  v_user_name := get_current_user_name();

  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required to toggle locked_in status';
  END IF;

  SELECT locked_in INTO v_current_locked_in
  FROM public.cat_names
  WHERE id = p_name_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Name not found';
  END IF;

  IF v_current_locked_in IS DISTINCT FROM p_locked_in THEN
    UPDATE public.cat_names
    SET locked_in = p_locked_in
    WHERE id = p_name_id;

    INSERT INTO public.cat_audit_log (
      table_name,
      operation,
      old_values,
      new_values,
      user_name
    ) VALUES (
      'cat_names',
      CASE WHEN p_locked_in THEN 'LOCK_IN' ELSE 'UNLOCK_IN' END,
      jsonb_build_object('locked_in', v_current_locked_in),
      jsonb_build_object('locked_in', p_locked_in),
      v_user_name
    );
  END IF;

  RETURN p_locked_in;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  total_names int;
  hidden_names int;
  total_users int;
  total_ratings int;
  total_selections int;
  avg_rating numeric;
BEGIN
  SELECT count(*) INTO total_names
  FROM public.cat_names
  WHERE is_deleted = false;

  SELECT count(*) INTO hidden_names
  FROM public.cat_names
  WHERE is_deleted = false AND is_hidden = true;

  SELECT count(*) INTO total_users FROM public.cat_app_users;

  SELECT count(*), COALESCE(AVG(rating), 1500)
  INTO total_ratings, avg_rating
  FROM public.user_cat_name_ratings;

  SELECT COALESCE(SUM(global_wins + global_losses), 0)
  INTO total_selections
  FROM public.cat_names
  WHERE is_deleted = false;

  RETURN json_build_object(
    'totalNames', total_names,
    'hiddenNames', hidden_names,
    'activeNames', total_names - hidden_names,
    'totalUsers', total_users,
    'totalRatings', total_ratings,
    'totalSelections', total_selections,
    'avgRating', ROUND(avg_rating)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_selections(limit_count int)
RETURNS TABLE (
  name_id uuid,
  name text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id AS name_id, name, (COALESCE(global_wins, 0) + COALESCE(global_losses, 0))::bigint AS count
  FROM public.cat_names
  WHERE is_deleted = false
  ORDER BY count DESC, avg_rating DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_popularity_scores(
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
  WITH rating_stats AS (
    SELECT
      cnr.name_id,
      COUNT(*) as rating_count,
      SUM(COALESCE(cnr.rating, 1500)) as total_rating
    FROM public.user_cat_name_ratings cnr
    WHERE v_target_user IS NULL OR cnr.user_name = v_target_user
    GROUP BY cnr.name_id
  )
  SELECT
    n.id as name_id,
    n.name,
    n.description,
    n.categories[1] as category,
    (COALESCE(n.global_wins, 0) + COALESCE(n.global_losses, 0))::bigint as times_selected,
    CASE
      WHEN COALESCE(r.rating_count, 0) > 0 THEN ROUND(r.total_rating / r.rating_count)
      ELSE COALESCE(n.avg_rating, 1500)
    END as avg_rating,
    ROUND(
      (COALESCE(n.global_wins, 0) + COALESCE(n.global_losses, 0)) * 2 +
      COALESCE(n.global_wins, 0) * 1.5 +
      (
        CASE
          WHEN COALESCE(r.rating_count, 0) > 0 THEN ROUND(r.total_rating / r.rating_count)
          ELSE COALESCE(n.avg_rating, 1500)
        END - 1500
      ) * 0.5
    ) as popularity_score,
    n.created_at
  FROM public.cat_names n
  LEFT JOIN rating_stats r ON n.id = r.name_id
  WHERE n.is_active = true AND n.is_hidden = false AND n.is_deleted = false
  ORDER BY popularity_score DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_stats(p_limit INTEGER DEFAULT 50)
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
    n.id AS name_id,
    n.name,
    n.description,
    n.categories[1] AS category,
    COALESCE(ROUND(AVG(r.rating)), n.avg_rating, 1500) AS avg_rating,
    COUNT(r.name_id)::INTEGER AS total_ratings,
    COALESCE(n.global_wins, 0)::INTEGER AS wins,
    COALESCE(n.global_losses, 0)::INTEGER AS losses,
    n.created_at
  FROM public.cat_names n
  LEFT JOIN public.user_cat_name_ratings r ON n.id = r.name_id
  WHERE n.is_active = true AND n.is_hidden = false AND n.is_deleted = false
  GROUP BY n.id, n.name, n.description, n.categories, n.avg_rating, n.global_wins, n.global_losses, n.created_at
  ORDER BY avg_rating DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_stats(INTEGER) TO authenticated, anon;

COMMIT;
