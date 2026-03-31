-- Migration: Supabase-only backend RPCs
-- Fixes get_site_stats and get_leaderboard_stats to use renamed tables,
-- and adds new RPCs needed after removing the Express server.

-- ============================================================================
-- FIX get_site_stats (now uses cat_names and user_cat_name_ratings)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_names int;
  hidden_names int;
  total_users int;
  total_ratings int;
  total_selections bigint;
  avg_rating numeric;
BEGIN
  SELECT count(*) INTO total_names FROM cat_names WHERE is_active = true AND is_deleted = false;
  SELECT count(*) INTO hidden_names FROM cat_names WHERE is_hidden = true AND is_deleted = false;
  SELECT count(DISTINCT user_name) INTO total_users FROM user_cat_name_ratings;
  SELECT count(*), COALESCE(AVG(rating), 1500)
    INTO total_ratings, avg_rating
    FROM user_cat_name_ratings;
  SELECT COALESCE(SUM(COALESCE(global_wins, 0) + COALESCE(global_losses, 0)), 0)
    INTO total_selections
    FROM cat_names WHERE is_deleted = false;

  RETURN json_build_object(
    'totalNames',      total_names,
    'hiddenNames',     hidden_names,
    'activeNames',     total_names - hidden_names,
    'totalUsers',      total_users,
    'totalRatings',    total_ratings,
    'totalSelections', total_selections,
    'avgRating',       ROUND(avg_rating)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_stats() TO authenticated, anon;

-- ============================================================================
-- FIX get_leaderboard_stats (now uses cat_names and user_cat_name_ratings)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats(limit_count int DEFAULT 50)
RETURNS TABLE (
  name_id    uuid,
  name       text,
  description text,
  category   text,
  avg_rating numeric,
  total_ratings bigint,
  wins       bigint,
  losses     bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cn.id                                                                       AS name_id,
    cn.name,
    cn.description,
    cn.categories[1]                                                            AS category,
    COALESCE(ROUND(AVG(r.rating)::numeric, 0), cn.avg_rating, 1500)::numeric   AS avg_rating,
    COUNT(r.name_id)                                                            AS total_ratings,
    COALESCE(MAX(cn.global_wins), 0)::bigint                                    AS wins,
    COALESCE(MAX(cn.global_losses), 0)::bigint                                  AS losses,
    cn.created_at
  FROM cat_names cn
  LEFT JOIN user_cat_name_ratings r ON cn.id = r.name_id
  WHERE cn.is_active = true
    AND cn.is_hidden = false
    AND cn.is_deleted = false
  GROUP BY
    cn.id, cn.name, cn.description, cn.categories,
    cn.avg_rating, cn.created_at, cn.global_wins, cn.global_losses
  ORDER BY avg_rating DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_stats(int) TO authenticated, anon;

-- ============================================================================
-- ADD add_cat_name (public — anyone may submit a name candidate)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_cat_name(
  p_name        TEXT,
  p_description TEXT DEFAULT ''
)
RETURNS TABLE (
  id          uuid,
  name        text,
  description text,
  avg_rating  numeric,
  is_hidden   boolean,
  is_active   boolean,
  locked_in   boolean,
  status      text,
  created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LENGTH(TRIM(p_name)) < 1 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;
  IF LENGTH(TRIM(p_name)) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or fewer';
  END IF;
  IF TRIM(p_name) !~ '^[a-zA-Z\s\-'']+$' THEN
    RAISE EXCEPTION 'Name can only contain letters, spaces, hyphens, and apostrophes';
  END IF;
  IF LENGTH(COALESCE(p_description, '')) > 500 THEN
    RAISE EXCEPTION 'Description must be 500 characters or fewer';
  END IF;

  RETURN QUERY
  INSERT INTO cat_names (name, description, status)
  VALUES (TRIM(p_name), TRIM(COALESCE(p_description, '')), 'candidate')
  RETURNING id, name, description, avg_rating, is_hidden, is_active, locked_in, status, created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_cat_name(TEXT, TEXT) TO authenticated, anon;

-- ============================================================================
-- ADD soft_delete_cat_name (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.soft_delete_cat_name(
  p_name_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete names';
  END IF;

  UPDATE cat_names
     SET is_deleted = true,
         deleted_at = now()
   WHERE id = p_name_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Name not found: %', p_name_id;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_cat_name(UUID) TO authenticated;

-- ============================================================================
-- ADD batch_update_name_visibility (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.batch_update_name_visibility(
  p_name_ids  UUID[],
  p_is_hidden BOOLEAN
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can batch update name visibility';
  END IF;

  IF COALESCE(array_length(p_name_ids, 1), 0) = 0 THEN
    RETURN true;
  END IF;

  UPDATE cat_names
     SET is_hidden = p_is_hidden
   WHERE id = ANY(p_name_ids);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.batch_update_name_visibility(UUID[], BOOLEAN) TO authenticated;

-- ============================================================================
-- ADD get_user_ratings (raw per-name ratings for a user)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_ratings(
  p_user_name TEXT
)
RETURNS TABLE (
  name_id uuid,
  rating  numeric,
  wins    integer,
  losses  integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TRIM(p_user_name) = '' THEN
    RAISE EXCEPTION 'User name is required';
  END IF;

  RETURN QUERY
  SELECT r.name_id, r.rating, r.wins, r.losses
    FROM user_cat_name_ratings r
   WHERE r.user_name = TRIM(p_user_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_ratings(TEXT) TO authenticated, anon;

-- ============================================================================
-- ADD get_user_stats (aggregated stats for a user)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_stats(
  p_user_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_ratings  bigint;
  total_wins     bigint;
  total_losses   bigint;
BEGIN
  SELECT
    count(*),
    COALESCE(SUM(wins), 0),
    COALESCE(SUM(losses), 0)
  INTO total_ratings, total_wins, total_losses
  FROM user_cat_name_ratings
  WHERE user_name = TRIM(p_user_name);

  RETURN json_build_object(
    'totalRatings',    total_ratings,
    'totalWins',       total_wins,
    'totalLosses',     total_losses,
    'totalSelections', total_wins + total_losses,
    'winRate',         CASE
                         WHEN (total_wins + total_losses) > 0
                         THEN ROUND((total_wins::numeric / (total_wins + total_losses)) * 100, 1)
                         ELSE 0
                       END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats(TEXT) TO authenticated, anon;

-- ============================================================================
-- ADD save_user_ratings (bulk-save end-of-tournament ratings for a user)
-- p_ratings must be a JSON array of objects:
--   [{"nameId":"<uuid>","rating":<number>,"wins":<int>,"losses":<int>}, ...]
-- ============================================================================
CREATE OR REPLACE FUNCTION public.save_user_ratings(
  p_user_name TEXT,
  p_ratings   JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry   JSONB;
  v_name_id UUID;
  v_rating  NUMERIC;
  v_wins    INTEGER;
  v_losses  INTEGER;
  v_count   INTEGER := 0;
BEGIN
  IF TRIM(p_user_name) = '' THEN
    RAISE EXCEPTION 'User name is required';
  END IF;

  IF p_ratings IS NULL OR jsonb_array_length(p_ratings) = 0 THEN
    RETURN json_build_object('success', true, 'count', 0);
  END IF;

  IF jsonb_array_length(p_ratings) > 200 THEN
    RAISE EXCEPTION 'Too many ratings in one call (max 200)';
  END IF;

  INSERT INTO cat_app_users (user_name)
  VALUES (TRIM(p_user_name))
  ON CONFLICT (user_name) DO NOTHING;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_ratings)
  LOOP
    v_name_id := (v_entry->>'nameId')::UUID;
    v_rating  := COALESCE((v_entry->>'rating')::NUMERIC, 1500);
    v_wins    := COALESCE((v_entry->>'wins')::INTEGER, 0);
    v_losses  := COALESCE((v_entry->>'losses')::INTEGER, 0);

    IF v_rating < 800 OR v_rating > 2400 THEN
      RAISE EXCEPTION 'Rating % is out of range [800, 2400]', v_rating;
    END IF;

    INSERT INTO user_cat_name_ratings (user_name, name_id, rating, wins, losses)
    VALUES (TRIM(p_user_name), v_name_id, v_rating, v_wins, v_losses)
    ON CONFLICT (user_name, name_id) DO UPDATE SET
      rating     = EXCLUDED.rating,
      wins       = COALESCE(user_cat_name_ratings.wins, 0) + EXCLUDED.wins,
      losses     = COALESCE(user_cat_name_ratings.losses, 0) + EXCLUDED.losses,
      updated_at = now();

    IF v_wins > 0 OR v_losses > 0 THEN
      UPDATE cat_names
         SET global_wins   = COALESCE(global_wins, 0) + v_wins,
             global_losses = COALESCE(global_losses, 0) + v_losses
       WHERE id = v_name_id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_user_ratings(TEXT, JSONB) TO authenticated;
