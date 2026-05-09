-- Trigger to notify members when an existing member adds a new questionnaire language

CREATE OR REPLACE FUNCTION public.notify_new_language_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id TEXT;
  _function_url TEXT;
  _new_langs TEXT[];
BEGIN
  -- Only trigger for approved members when questionnaire_languages changes and grows
  IF NEW.status = 'approved' AND OLD.questionnaire_languages IS DISTINCT FROM NEW.questionnaire_languages THEN
    -- Compute newly added languages (present in NEW but not in OLD)
    SELECT array_agg(lang) INTO _new_langs
    FROM unnest(NEW.questionnaire_languages) AS lang
    WHERE lang NOT IN (SELECT unnest(COALESCE(OLD.questionnaire_languages, ARRAY[]::TEXT[])));

    IF _new_langs IS NOT NULL AND array_length(_new_langs, 1) > 0 THEN
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
              'new_languages', _new_langs
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify_new_language_on_update failed for user %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS notify_new_language_on_update_trigger ON public.profiles;
CREATE TRIGGER notify_new_language_on_update_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_language_on_update();
