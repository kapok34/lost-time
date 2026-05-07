-- Simplify end-conversation to a single rule:
-- The last message sender can end the conversation only after 34 hours have passed.

CREATE OR REPLACE FUNCTION public.archive_conversation(_conv_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _last_sender UUID;
  _last_created TIMESTAMPTZ;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_conversation_participant(_conv_id, _me) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  -- Get most recent message
  SELECT sender_id, created_at
  INTO _last_sender, _last_created
  FROM public.messages
  WHERE conversation_id = _conv_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF _last_sender IS NULL OR _last_sender <> _me THEN
    RAISE EXCEPTION 'Only the sender of the most recent message can end the conversation';
  END IF;

  IF _last_created >= now() - interval '34 hours' THEN
    RAISE EXCEPTION 'You can only end the conversation 34 hours after your last message';
  END IF;

  UPDATE public.conversations
  SET status = 'archived', archived_at = now()
  WHERE id = _conv_id AND status = 'active';
END;
$$;
