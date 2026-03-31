-- Migration: Bind save_user_ratings to JWT identity when authenticated
-- When auth.uid() IS NOT NULL (authenticated caller), the username is derived
-- from the JWT user_metadata rather than the client-supplied p_user_name.
-- This prevents an authenticated user from writing ratings under another
-- user's name and influencing global win/loss counters.
-- Anonymous callers (anon role) still use the client-supplied p_user_name
-- since there is no server-side identity for unauthenticated participants.

CREATE OR REPLACE FUNCTION public.save_user_ratings(
  p_user_name TEXT,
  p_ratings   JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_name TEXT;
  v_entry     JSONB;
  v_name_id   UUID;
  v_rating    NUMERIC;
  v_wins      INTEGER;
  v_losses    INTEGER;
  v_count     INTEGER := 0;
BEGIN
  -- Bind to caller identity when authenticated (prevents spoofing)
  IF auth.uid() IS NOT NULL THEN
    v_user_name := COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'user_name',
      split_part(auth.email(), '@', 1),
      TRIM(p_user_name)
    );
  ELSE
    v_user_name := TRIM(p_user_name);
  END IF;

  IF COALESCE(v_user_name, '') = '' THEN
    RAISE EXCEPTION 'User name is required';
  END IF;

  IF p_ratings IS NULL OR jsonb_array_length(p_ratings) = 0 THEN
    RETURN json_build_object('success', true, 'count', 0);
  END IF;

  IF jsonb_array_length(p_ratings) > 200 THEN
    RAISE EXCEPTION 'Too many ratings in one call (max 200)';
  END IF;

  INSERT INTO cat_app_users (user_name)
  VALUES (v_user_name)
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
    VALUES (v_user_name, v_name_id, v_rating, v_wins, v_losses)
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

GRANT EXECUTE ON FUNCTION public.save_user_ratings(TEXT, JSONB) TO authenticated, anon;
