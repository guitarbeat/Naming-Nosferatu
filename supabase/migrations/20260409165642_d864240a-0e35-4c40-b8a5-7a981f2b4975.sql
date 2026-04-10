CREATE OR REPLACE FUNCTION public.add_cat_name(p_name text, p_description text DEFAULT ''::text)
 RETURNS TABLE(id uuid, name text, description text, avg_rating numeric, is_hidden boolean, is_active boolean, locked_in boolean, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  RETURNING cat_names.id, cat_names.name, cat_names.description, cat_names.avg_rating, cat_names.is_hidden, cat_names.is_active, cat_names.locked_in, cat_names.status::text, cat_names.created_at;
END;
$function$;