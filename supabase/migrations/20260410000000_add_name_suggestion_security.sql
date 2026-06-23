CREATE TABLE IF NOT EXISTS public.cat_rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  event_count INT DEFAULT 1,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_type, identifier)
);

-- Rate limiting for add_cat_name
-- Ensures descriptions are stripped of basic HTML tags and rate limiting is applied

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_event_type TEXT,
  p_identifier TEXT,
  p_max_events INT DEFAULT 5,
  p_window_minutes INT DEFAULT 60,
  p_block_minutes INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_count INT;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Insert or update the rate limit record
  INSERT INTO public.cat_rate_limit_events (event_type, identifier, event_count, first_seen, last_seen, blocked_until)
  VALUES (p_event_type, p_identifier, 1, NOW(), NOW(), NULL)
  ON CONFLICT (event_type, identifier) DO UPDATE
  SET
    event_count = CASE
      WHEN public.cat_rate_limit_events.last_seen < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN 1
      ELSE public.cat_rate_limit_events.event_count + 1
    END,
    first_seen = CASE
      WHEN public.cat_rate_limit_events.last_seen < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN NOW()
      ELSE public.cat_rate_limit_events.first_seen
    END,
    last_seen = NOW(),
    blocked_until = CASE
      WHEN (CASE
              WHEN public.cat_rate_limit_events.last_seen < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN 1
              ELSE public.cat_rate_limit_events.event_count + 1
            END) >= p_max_events
      THEN NOW() + (p_block_minutes || ' minutes')::INTERVAL
      ELSE public.cat_rate_limit_events.blocked_until
    END
  RETURNING event_count, blocked_until INTO v_event_count, v_blocked_until;

  -- Check if blocked
  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INT, INT, INT) TO authenticated, anon;


CREATE OR REPLACE FUNCTION public.add_cat_name(p_name text, p_description text DEFAULT ''::text)
 RETURNS TABLE(id uuid, name text, description text, avg_rating numeric, is_hidden boolean, is_active boolean, locked_in boolean, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_client_ip text;
  v_user_id text;
  v_identifier text;
  v_stripped_description text;
BEGIN
  -- Get identifier for rate limiting (IP address or user ID)
  -- Supabase stores claims in current_setting('request.jwt.claims', true)
  BEGIN
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  BEGIN
    v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_client_ip := 'unknown';
  END;

  v_identifier := COALESCE(v_user_id, v_client_ip, 'unknown');

  -- Check rate limit (max 5 suggestions per hour)
  IF NOT public.check_rate_limit('add_cat_name', v_identifier, 5, 60, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  IF LENGTH(TRIM(p_name)) < 1 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;
  IF LENGTH(TRIM(p_name)) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or fewer';
  END IF;
  IF TRIM(p_name) !~ '^[a-zA-Z\s\-'']+$' THEN
    RAISE EXCEPTION 'Name can only contain letters, spaces, hyphens, and apostrophes';
  END IF;

  -- Strip basic HTML tags from description (defense in depth)
  v_stripped_description := regexp_replace(COALESCE(p_description, ''), '<[^>]*>', '', 'g');

  IF LENGTH(TRIM(v_stripped_description)) > 500 THEN
    RAISE EXCEPTION 'Description must be 500 characters or fewer';
  END IF;

  RETURN QUERY
  INSERT INTO cat_names (name, description, status)
  VALUES (TRIM(p_name), TRIM(v_stripped_description), 'candidate')
  RETURNING cat_names.id, cat_names.name, cat_names.description, cat_names.avg_rating, cat_names.is_hidden, cat_names.is_active, cat_names.locked_in, cat_names.status::text, cat_names.created_at;
END;
$function$;


-- Enable RLS to prevent public access to rate limit events table
ALTER TABLE public.cat_rate_limit_events ENABLE ROW LEVEL SECURITY;
