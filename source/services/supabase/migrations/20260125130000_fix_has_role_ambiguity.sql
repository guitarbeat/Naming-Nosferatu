-- Disambiguate has_role function
-- Drop both versions to ensure a clean state
DROP FUNCTION IF EXISTS public.has_role(TEXT, public.app_role);
DROP FUNCTION IF EXISTS public.has_role(TEXT, TEXT);

-- Create a single version that handles TEXT input
CREATE OR REPLACE FUNCTION public.has_role(_user_name TEXT, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_name = _user_name 
      AND role = _role::public.app_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(TEXT, TEXT) TO authenticated, anon;
