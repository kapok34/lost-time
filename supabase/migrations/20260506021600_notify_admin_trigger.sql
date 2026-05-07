-- Trigger to notify admin when a new application is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_on_apply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id TEXT;
  _function_url TEXT;
BEGIN
  -- Only notify for pending profiles (applications)
  IF NEW.status = 'pending' THEN
    -- Read project ID from config or fall back to env
    _project_id := COALESCE(
      current_setting('app.settings.supabase_project_id', true),
      'ixxrqqdveyrjyjyhziap'
    );
    _function_url := 'https://' || _project_id || '.supabase.co/functions/v1/notify-admin';

    PERFORM
      net.http_post(
        url := _function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'id', NEW.id,
          'display_name', NEW.display_name,
          'location', NEW.location,
          'language', NEW.language,
          'created_at', NEW.created_at
        )
      );
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS notify_admin_on_apply_trigger ON public.profiles;
CREATE TRIGGER notify_admin_on_apply_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_apply();

-- Grant execute on net extension (if using supabase net extension)
-- Note: the 'net' schema comes from the pg_net extension, which may need to be enabled first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'net') THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin;
  END IF;
END $$;
