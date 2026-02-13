-- Function to get site-wide statistics in a single call
-- Optimized to avoid fetching all ratings and calculating average client-side
CREATE OR REPLACE FUNCTION get_site_stats()
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
  -- 1. Total Names (Active)
  SELECT count(*) INTO total_names FROM cat_name_options WHERE is_active = true;

  -- 2. Hidden Names
  SELECT count(*) INTO hidden_names FROM cat_name_options WHERE is_hidden = true;

  -- 3. Total Users
  SELECT count(*) INTO total_users FROM cat_app_users;

  -- 4. Total Ratings & Average Rating
  -- COALESCE handles case with 0 ratings to return default 1500
  SELECT count(*), COALESCE(AVG(rating), 1500)
  INTO total_ratings, avg_rating
  FROM cat_name_ratings;

  -- 5. Total Selections
  SELECT count(*) INTO total_selections FROM cat_tournament_selections;

  -- Return as JSON object matching the JS interface
  RETURN json_build_object(
    'totalNames', total_names,
    'hiddenNames', hidden_names,
    'activeNames', total_names - hidden_names, -- replicating JS logic
    'totalUsers', total_users,
    'totalRatings', total_ratings,
    'totalSelections', total_selections,
    'avgRating', ROUND(avg_rating)
  );
END;
$$;
