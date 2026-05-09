-- Make notification triggers resilient: don't crash transactions if pg_net extension
-- is missing or HTTP call fails.

-- 1. notify_admin_on_apply (fires on profile insert)
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
  IF NEW.status = 'pending' THEN
    _project_id := COALESCE(
      current_setting('app.settings.supabase_project_id', true),
      'ixxrqqdveyrjyjyhziap'
    );
    _function_url := 'https://' || _project_id || '.supabase.co/functions/v1/notify-admin';

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
            'display_name', NEW.display_name,
            'location', NEW.location,
            'language', NEW.language,
            'created_at', NEW.created_at
          )
        );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_admin_on_apply failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. welcome_member_on_approve (fires on profile status -> approved)
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
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    _project_id := COALESCE(
      current_setting('app.settings.supabase_project_id', true),
      'ixxrqqdveyrjyjyhziap'
    );
    _function_url := 'https://' || _project_id || '.supabase.co/functions/v1/welcome-member';

    BEGIN
      PERFORM
        net.http_post(
          url := _function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', public.get_internal_config('internal_api_key')
          ),
          body := jsonb_build_object(
            'member_id', NEW.id
          )
        );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'welcome_member_on_approve failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. notify_member_on_message (fires on message insert)
CREATE OR REPLACE FUNCTION public.notify_member_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url TEXT;
BEGIN
  _url := COALESCE(
    current_setting('app.settings.notify_member_function_url', true),
    'https://' || COALESCE(current_setting('app.settings.supabase_project_id', true), 'ixxrqqdveyrjyjyhziap') || '.supabase.co/functions/v1/notify-member'
  );

  BEGIN
    PERFORM
      net.http_post(
        url := _url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', public.get_internal_config('internal_api_key')
        ),
        body := jsonb_build_object(
          'message_id', NEW.id,
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'body', NEW.body
        )
      );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_member_on_message failed for message %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
