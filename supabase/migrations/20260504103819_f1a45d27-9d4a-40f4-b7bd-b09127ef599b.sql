
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Restrict sensitive helpers to authenticated users only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_conversation(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.start_conversation(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.archive_conversation(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_conversation(uuid) TO authenticated;
