-- Add notify_new_members column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_new_members BOOLEAN DEFAULT true;

-- Trigger to notify members when a new member is approved with matching questionnaire language
CREATE OR REPLACE FUNCTION public.notify_new_member_on_approve()
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
    _function_url := 'https://' || _project_id || '.supabase.co/functions/v1/notify-new-member';

    PERFORM
      net.http_post(
        url := _function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'id', NEW.id,
          'member_number', NEW.member_number,
          'questionnaire_languages', NEW.questionnaire_languages
        )
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS notify_new_member_on_approve_trigger ON public.profiles;
CREATE TRIGGER notify_new_member_on_approve_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_member_on_approve();
