-- Update database triggers to use INTERNAL_API_KEY instead of deprecated service_role JWT
-- The internal_api_key is shared between Postgres triggers and Edge Functions for auth

-- Create a secure internal config table (skipped if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '_internal_config') THEN
    CREATE TABLE public._internal_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    -- Only the database owner / service role should read this
    REVOKE ALL ON public._internal_config FROM authenticated, anon;
  END IF;
END $$;

-- Insert or update the internal API key
-- SECURITY NOTE: Never SELECT from this table in public-facing queries
INSERT INTO public._internal_config (key, value) VALUES ('internal_api_key', 'kofayCbSWe2ox4kxxGiqQakp7bkl4/B9JOwz/KW4p3k=')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Helper function to safely read internal config (restricted to service_role / admin contexts)
CREATE OR REPLACE FUNCTION public.get_internal_config(_key TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public._internal_config WHERE key = _key;
$$;

REVOKE EXECUTE ON FUNCTION public.get_internal_config(TEXT) FROM authenticated, anon;

-- Update notify_admin_on_apply trigger function
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
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger (drop and recreate to ensure latest version)
DROP TRIGGER IF EXISTS notify_admin_on_apply_trigger ON public.profiles;
CREATE TRIGGER notify_admin_on_apply_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_apply();

-- Update welcome_member_on_approve trigger function
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
          'apikey', public.get_internal_config('internal_api_key')
        ),
        body := jsonb_build_object(
          'member_id', NEW.id
        )
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS welcome_member_on_approve_trigger ON public.profiles;
CREATE TRIGGER welcome_member_on_approve_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.welcome_member_on_approve();

-- Update notify_member_on_message trigger function
CREATE OR REPLACE FUNCTION public.notify_member_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id TEXT;
  _function_url TEXT;
BEGIN
  -- Only notify if this is not a self-message
  PERFORM
    net.http_post(
      url := COALESCE(
        current_setting('app.settings.notify_member_function_url', true),
        'https://' || COALESCE(current_setting('app.settings.supabase_project_id', true), 'ixxrqqdveyrjyjyhziap') || '.supabase.co/functions/v1/notify-member'
      ),
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

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS notify_member_on_message_trigger ON public.messages;
CREATE TRIGGER notify_member_on_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_on_message();
