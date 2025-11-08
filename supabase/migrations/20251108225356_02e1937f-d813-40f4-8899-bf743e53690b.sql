-- Create site_settings table for storing site-wide configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read all settings
CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT
  TO public
  USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grant permissions
GRANT SELECT ON site_settings TO public;
GRANT INSERT, UPDATE, DELETE ON site_settings TO public;

-- Insert default cat name entry
INSERT INTO public.site_settings (key, value, updated_by)
VALUES (
  'cat_chosen_name',
  jsonb_build_object(
    'first_name', '',
    'middle_names', '[]'::jsonb,
    'last_name', '',
    'greeting_text', 'Hello! My name is',
    'display_name', '',
    'is_set', false,
    'show_banner', true
  ),
  'aaron'
) ON CONFLICT (key) DO NOTHING;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_timestamp();