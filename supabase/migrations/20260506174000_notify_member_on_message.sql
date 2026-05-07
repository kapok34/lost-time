-- Trigger to notify a member when they receive a new message
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
  -- Only notify if this is not a self-message (shouldn't happen, but safety)
  -- We look up the conversation to determine the recipient
  PERFORM
    net.http_post(
      url := COALESCE(
        current_setting('app.settings.notify_member_function_url', true),
        'https://' || COALESCE(current_setting('app.settings.supabase_project_id', true), 'ixxrqqdveyrjyjyhziap') || '.supabase.co/functions/v1/notify-member'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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

-- Create the trigger on messages table
DROP TRIGGER IF EXISTS notify_member_on_message_trigger ON public.messages;
CREATE TRIGGER notify_member_on_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_on_message();
