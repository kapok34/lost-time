-- Update archive_conversation to enforce new end rules:
-- 1. Both participants must have sent at least one message.
-- 2. Only the sender of the most recent message may end the conversation.

CREATE OR REPLACE FUNCTION public.archive_conversation(_conv_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _last_sender UUID;
  _member_a UUID;
  _member_b UUID;
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

  -- Verify both participants have sent at least one message
  IF NOT EXISTS (
    SELECT 1 FROM public.messages
    WHERE conversation_id = _conv_id AND sender_id = _member_a
  ) THEN
    RAISE EXCEPTION 'Both participants must have sent at least one message';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.messages
    WHERE conversation_id = _conv_id AND sender_id = _member_b
  ) THEN
    RAISE EXCEPTION 'Both participants must have sent at least one message';
  END IF;

  -- Most recent message sender must be the caller
  SELECT sender_id INTO _last_sender
  FROM public.messages
  WHERE conversation_id = _conv_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF _last_sender IS NULL OR _last_sender <> _me THEN
    RAISE EXCEPTION 'Only the sender of the most recent message can end the conversation';
  END IF;

  UPDATE public.conversations
  SET status = 'archived', archived_at = now()
  WHERE id = _conv_id AND status = 'active';
END;
$$;
