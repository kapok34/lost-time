-- Add inactivity exception to archive_conversation.
-- If the caller sent the most recent message and it is older than 7 days,
-- the conversation can be ended even if the other participant has not sent a message.

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
  _member_a UUID;
  _member_b UUID;
  _both_have_sent BOOLEAN;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_conversation_participant(_conv_id, _me) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  -- Get conversation members
  SELECT member_a, member_b
  INTO _member_a, _member_b
  FROM public.conversations
  WHERE id = _conv_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found or not active';
  END IF;

  -- Get most recent message
  SELECT sender_id, created_at
  INTO _last_sender, _last_created
  FROM public.messages
  WHERE conversation_id = _conv_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Inactivity exception: caller sent the last message > 34 hours ago
  IF _last_sender = _me AND _last_created < now() - interval '34 hours' THEN
    UPDATE public.conversations
    SET status = 'archived', archived_at = now()
    WHERE id = _conv_id AND status = 'active';
    RETURN;
  END IF;

  -- Normal rules: both must have sent, and caller must be the most recent sender
  _both_have_sent := EXISTS (
    SELECT 1 FROM public.messages
    WHERE conversation_id = _conv_id AND sender_id = _member_a
  ) AND EXISTS (
    SELECT 1 FROM public.messages
    WHERE conversation_id = _conv_id AND sender_id = _member_b
  );

  IF NOT _both_have_sent THEN
    RAISE EXCEPTION 'Both participants must have sent at least one message';
  END IF;

  IF _last_sender IS NULL OR _last_sender <> _me THEN
    RAISE EXCEPTION 'Only the sender of the most recent message can end the conversation';
  END IF;

  UPDATE public.conversations
  SET status = 'archived', archived_at = now()
  WHERE id = _conv_id AND status = 'active';
END;
$$;
