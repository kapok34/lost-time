-- Fix notify_new_member_on_approve trigger to use correct internal API key auth
-- and add resilience with exception handling (matching other notification triggers)

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

    BEGIN
      PERFORM
        net.http_post(
          url := _function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', public.get_internal_config('internal_api_key')
          ),
          body := jsonb_build_object(
            'id', NEW.id,
            'member_number', NEW.member_number,
            'questionnaire_languages', NEW.questionnaire_languages
          )
        );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_new_member_on_approve failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it binds to the updated function
DROP TRIGGER IF EXISTS notify_new_member_on_approve_trigger ON public.profiles;
CREATE TRIGGER notify_new_member_on_approve_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_member_on_approve();
