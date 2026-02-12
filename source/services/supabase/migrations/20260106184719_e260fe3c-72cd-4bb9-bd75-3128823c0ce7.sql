-- Fix privilege escalation in create_user_account function
-- 1. Revoke access from anonymous users (only authenticated users can create accounts)
REVOKE EXECUTE ON FUNCTION public.create_user_account(TEXT, JSONB, TEXT) FROM anon;

-- 2. Ensure Aaron is bootstrapped as admin to prevent first-user race condition
INSERT INTO public.user_roles (user_name, role)
VALUES ('Aaron', 'admin')
ON CONFLICT DO NOTHING;

-- Also ensure lowercase version exists
INSERT INTO public.user_roles (user_name, role)
VALUES ('aaron', 'admin')
ON CONFLICT DO NOTHING;