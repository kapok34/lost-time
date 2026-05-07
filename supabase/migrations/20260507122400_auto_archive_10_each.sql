-- Enforce a hard 10-message limit per member per conversation
CREATE OR REPLACE FUNCTION public.enforce_message_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _count
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id AND sender_id = NEW.sender_id;

  IF _count >= 10 THEN
    RAISE EXCEPTION 'You have reached the 10-message limit for this conversation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_message_limit_trigger ON public.messages;
CREATE TRIGGER enforce_message_limit_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_message_limit();

-- Auto-archive conversation when both participants have sent 10 messages each
CREATE OR REPLACE FUNCTION public.auto_archive_on_message_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member_a UUID;
  _member_b UUID;
  _count_a INTEGER;
  _count_b INTEGER;
BEGIN
  SELECT member_a, member_b
  INTO _member_a, _member_b
  FROM public.conversations
  WHERE id = NEW.conversation_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO _count_a
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id AND sender_id = _member_a;

  SELECT COUNT(*) INTO _count_b
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id AND sender_id = _member_b;

  IF _count_a >= 10 AND _count_b >= 10 THEN
    UPDATE public.conversations
    SET status = 'archived', archived_at = now()
    WHERE id = NEW.conversation_id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_archive_on_message_limit_trigger ON public.messages;
CREATE TRIGGER auto_archive_on_message_limit_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_archive_on_message_limit();
