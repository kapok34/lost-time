-- Add ended_by to conversations to track who manually ended a conversation (NULL = auto-ended)
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS ended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update archive_conversation to set ended_by = caller
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
  SET status = 'archived', archived_at = now(), ended_by = _me
  WHERE id = _conv_id AND status = 'active';
END;
$$;

-- Update start_conversation to enforce restart rules
CREATE OR REPLACE FUNCTION public.start_conversation(_other_user UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _conv_id UUID;
  _a UUID;
  _b UUID;
  _prev public.conversations%ROWTYPE;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _me = _other_user THEN
    RAISE EXCEPTION 'Cannot message yourself';
  END IF;
  IF NOT public.is_approved(_me) THEN
    RAISE EXCEPTION 'You must be an approved member';
  END IF;
  IF NOT public.is_approved(_other_user) THEN
    RAISE EXCEPTION 'The other member is not available';
  END IF;
  IF public.has_active_conversation(_me) THEN
    RAISE EXCEPTION 'You already have an active conversation. End it first.';
  END IF;
  IF public.has_active_conversation(_other_user) THEN
    RAISE EXCEPTION 'That member already has an active conversation';
  END IF;

  -- Look for the most recent conversation between the pair (active or archived)
  SELECT *
  INTO _prev
  FROM public.conversations
  WHERE (member_a = _me AND member_b = _other_user)
     OR (member_a = _other_user AND member_b = _me)
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF _prev.status = 'active' THEN
      RETURN _prev.id;
    END IF;

    -- Archived: enforce restart rules
    IF _prev.ended_by IS NULL THEN
      RAISE EXCEPTION 'This correspondence has ended and cannot be restarted';
    END IF;

    IF _prev.ended_by <> _me THEN
      RAISE EXCEPTION 'Only the member who ended this correspondence can restart it';
    END IF;

    IF _prev.archived_at >= now() - interval '34 days' THEN
      RAISE EXCEPTION 'You must wait 34 days before restarting this correspondence';
    END IF;

    -- Revive the archived conversation (keeps message history)
    UPDATE public.conversations
    SET status = 'active', archived_at = NULL, ended_by = NULL
    WHERE id = _prev.id;

    RETURN _prev.id;
  END IF;

  -- Order so pair is canonical
  IF _me < _other_user THEN
    _a := _me; _b := _other_user;
  ELSE
    _a := _other_user; _b := _me;
  END IF;

  INSERT INTO public.conversations (member_a, member_b, status)
  VALUES (_a, _b, 'active')
  RETURNING id INTO _conv_id;

  RETURN _conv_id;
END;
$$;
