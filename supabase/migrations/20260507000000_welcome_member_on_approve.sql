-- Trigger to welcome a member when their application is approved
CREATE OR REPLACE FUNCTION public.welcome_member_on_approve()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id TEXT;
  _function_url TEXT;
BEGIN
  -- Only trigger when status transitions to approved
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    _project_id := COALESCE(
      current_setting('app.settings.supabase_project_id', true),
      'ixxrqqdveyrjyjyhziap'
    );
    _function_url := 'https://' || _project_id || '.supabase.co/functions/v1/welcome-member';

    PERFORM
      net.http_post(
        url := _function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'member_id', NEW.id
        )
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS welcome_member_on_approve_trigger ON public.profiles;
CREATE TRIGGER welcome_member_on_approve_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.welcome_member_on_approve();
