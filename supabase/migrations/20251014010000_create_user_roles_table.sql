-- Migration: Create separate user_roles table for secure role management
-- This fixes the privilege escalation vulnerability by separating roles from user data

-- 1. Create enum for roles
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('user', 'moderator', 'admin');

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_name, role)
);

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_name ON public.user_roles(user_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 4. Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Migrate existing role data from cat_app_users to user_roles
INSERT INTO public.user_roles (user_name, role)
SELECT 
  user_name,
  CASE 
    WHEN user_role = 'admin' THEN 'admin'::app_role
    WHEN user_role = 'moderator' THEN 'moderator'::app_role
    ELSE 'user'::app_role
  END as role
FROM cat_app_users
WHERE user_role IS NOT NULL
ON CONFLICT (user_name, role) DO NOTHING;

-- 6. Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_name TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_name = _user_name
      AND role = _role
  )
$$;

-- 7. Create helper function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_name TEXT)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_name = _user_name
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 3
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 1
    END DESC
  LIMIT 1
$$;

-- 8. RLS Policies for user_roles table
-- Users can only view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT 
  USING (user_name = current_setting('request.jwt.claims', true)::json->>'user_name');

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL
  USING (public.has_role(current_setting('request.jwt.claims', true)::json->>'user_name', 'admin'));

-- 9. Grant permissions
GRANT SELECT ON public.user_roles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(TEXT) TO authenticated, anon;

-- 10. Add comments for documentation
COMMENT ON TABLE public.user_roles IS 'Stores user roles separately from user data to prevent privilege escalation';
COMMENT ON COLUMN public.user_roles.user_name IS 'Username associated with the role';
COMMENT ON COLUMN public.user_roles.role IS 'Role assigned to the user (user, moderator, admin)';
COMMENT ON FUNCTION public.has_role(TEXT, app_role) IS 'Security definer function to check if user has a specific role';
COMMENT ON FUNCTION public.get_user_role(TEXT) IS 'Security definer function to get user''s highest role';
