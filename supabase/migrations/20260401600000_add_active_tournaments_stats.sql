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
  active_tournaments int;
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

  SELECT count(DISTINCT tournament_id) INTO active_tournaments
    FROM tournament_selections;

  RETURN json_build_object(
    'totalNames',      total_names,
    'hiddenNames',     hidden_names,
    'activeNames',     total_names - hidden_names,
    'totalUsers',      total_users,
    'totalRatings',    total_ratings,
    'totalSelections', total_selections,
    'avgRating',       ROUND(avg_rating),
    'activeTournaments', active_tournaments
  );
END;
$$;
