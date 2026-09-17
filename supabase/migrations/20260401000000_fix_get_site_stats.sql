-- Function: get_site_stats
-- FIX get_site_stats (now uses cat_names, user_cat_name_ratings, and cat_app_users)
CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS TABLE (
  total_users INT,
  total_cats INT,
  total_ratings INT
) AS $$
BEGIN
  RETURN QUERY SELECT
    (SELECT count(*)::INT FROM public.cat_app_users),
    (SELECT count(*)::INT FROM public.cat_names),
    (SELECT count(*)::INT FROM public.user_cat_name_ratings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
